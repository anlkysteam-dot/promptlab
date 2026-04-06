import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { Prisma } from "@prisma/client";

import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";

import { buildSystemPrompt } from "@/lib/build-system-prompt";

import { FREE_DAILY_PROMPT_LIMIT } from "@/lib/constants";

import { createLlmClient, getChatModel, getGenerateMode, isMockModeAllowed } from "@/lib/llm-config";

import { llmFailureMessage } from "@/lib/llm-errors";

import { buildMockPrompt } from "@/lib/mock-prompt";

import { resolvePremiumForUser } from "@/lib/premium";
import {
  checklistInstruction,
  inferPromptTemplate,
  qualityModeInstruction,
  templateInstruction,
  type PromptQualityMode,
} from "@/lib/prompt-quality";

import { AI_TARGETS, type AiTargetId } from "@/lib/targets";

import {

  canUseFreePrompt,

  getTodayUsageCount,

  recordSuccessfulPrompt,

  subjectKeyFrom,

  type UsageSubject,

} from "@/lib/usage";



const validTargetIds = new Set<string>(AI_TARGETS.map((t) => t.id));



function jsonWithOptionalAnonCookie(

  body: object,

  status: number,

  setAnonCookie: boolean,

  anonId: string | null,

) {

  const res = NextResponse.json(body, { status });

  if (setAnonCookie && anonId) {

    res.cookies.set("anon_id", anonId, {

      httpOnly: true,

      sameSite: "lax",

      secure: process.env.NODE_ENV === "production",

      maxAge: 60 * 60 * 24 * 400,

      path: "/",

    });

  }

  return res;

}



export async function POST(req: Request) {

  let body: unknown;

  try {

    body = await req.json();

  } catch {

    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });

  }



  const intent = String((body as { intent?: string })?.intent ?? "").trim();

  const target = (body as { target?: string })?.target as AiTargetId | undefined;
  const topic = String((body as { topic?: string })?.topic ?? "").trim().slice(0, 160);
  const tone = String((body as { tone?: string })?.tone ?? "").trim().slice(0, 80);
  const audience = String((body as { audience?: string })?.audience ?? "").trim().slice(0, 160);
  const qualityMode = ((body as { qualityMode?: string })?.qualityMode === "advanced"
    ? "advanced"
    : "normal") as PromptQualityMode;



  if (!intent || intent.length > 12_000) {

    return NextResponse.json({ error: "Metin gerekli veya çok uzun." }, { status: 400 });

  }



  if (!target || !validTargetIds.has(target)) {

    return NextResponse.json({ error: "Geçerli bir hedef seçin." }, { status: 400 });

  }



  const mode = getGenerateMode();



  if (mode === "mock") {

    if (!isMockModeAllowed()) {

      return NextResponse.json(

        {

          error:

            "Demo (mock) modu üretim ortamında kapalı. .env içinde PROMPTLAB_GENERATE_MODE=openai veya groq kullanın; mock için PROMPTLAB_ALLOW_MOCK_IN_PRODUCTION=true gerekir.",

        },

        { status: 503 },

      );

    }

  } else if (mode === "groq") {

    if (!process.env.GROQ_API_KEY?.trim()) {

      return NextResponse.json(

        {

          error:

            "Groq modu için GROQ_API_KEY tanımlı değil. console.groq.com ücretsiz anahtar alıp .env'e ekleyin veya PROMPTLAB_GENERATE_MODE=mock deneyin.",

        },

        { status: 503 },

      );

    }

  } else {

    if (!process.env.OPENAI_API_KEY?.trim()) {

      return NextResponse.json(

        {

          error:

            "Sunucuda OPENAI_API_KEY tanımlı değil. Ekleyin veya kotasız deneme için PROMPTLAB_GENERATE_MODE=groq veya mock kullanın.",

        },

        { status: 503 },

      );

    }

  }



  const appUser = await getAppUser();

  const jar = await cookies();

  let anonId = jar.get("anon_id")?.value ?? null;

  let setAnonCookie = false;



  if (!appUser?.id) {

    if (!anonId) {

      anonId = crypto.randomUUID();

      setAnonCookie = true;

    }

  }



  const subject: UsageSubject =

    appUser?.id != null

      ? { kind: "user", userId: appUser.id }

      : { kind: "anon", anonId: anonId! };



  const subjectKey = subjectKeyFrom(subject);



  let premium = false;

  if (appUser?.id) {

    premium = await resolvePremiumForUser(appUser.id, appUser.email);

  }



  const countTowardFreeLimit = mode !== "mock";



  if (!premium && countTowardFreeLimit) {

    try {

      const gate = await canUseFreePrompt(subjectKey);

      if (!gate.ok) {

        return jsonWithOptionalAnonCookie(

          {

            error: "Günlük ücretsiz limitine ulaştınız. Premium ile sınırsız kullanım (yakında ödeme ile) veya yarın tekrar deneyin.",

            used: gate.used,

            limit: FREE_DAILY_PROMPT_LIMIT,

            premium: false,

          },

          429,

          setAnonCookie,

          anonId,

        );

      }

    } catch (e) {

      console.error(e);

      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021") {

        return NextResponse.json(

          {

            error:

              "Veritabanı şeması güncel değil. Proje kökünde `npx prisma db push` çalıştırıp sunucuyu yeniden başlatın.",

          },

          { status: 503 },

        );

      }

      return NextResponse.json({ error: "Kullanım bilgisi okunamadı. Veritabanı bağlantısını kontrol edin." }, { status: 503 });

    }

  }



  let promptText: string;

  const provider: "openai" | "groq" | "mock" = mode;



  if (mode === "mock") {

    promptText = buildMockPrompt(intent, target);

  } else {

    const client = createLlmClient(mode);

    const model = getChatModel(mode);
    const templateKind = inferPromptTemplate(intent, target);
    const composedUserInput = [
      "Rewrite the following user request into a high-quality English prompt for the selected AI target.",
      "Do not translate literally; optimize for result quality.",
      qualityModeInstruction(qualityMode),
      templateInstruction(templateKind),
      checklistInstruction(templateKind),
      "",
      "[USER_REQUEST_RAW]",
      intent,
      "",
      "[USER_METADATA]",
      `target=${target}`,
      `topic=${topic || "(none)"}`,
      `tone=${tone || "(none)"}`,
      `audience=${audience || "(none)"}`,
    ].join("\n");

    try {

      const completion = await client.chat.completions.create({

        model,

        temperature: 0.4,

        messages: [

          { role: "system", content: buildSystemPrompt(target) },

          { role: "user", content: composedUserInput },

        ],

      });

      promptText = completion.choices[0]?.message?.content?.trim() ?? "";

    } catch (e) {

      console.error(e);

      const { status, error } = llmFailureMessage(e, mode);

      return jsonWithOptionalAnonCookie({ error }, status, setAnonCookie, anonId);

    }

  }



  if (!promptText) {

    return jsonWithOptionalAnonCookie({ error: "Boş yanıt alındı. Tekrar deneyin." }, 502, setAnonCookie, anonId);

  }



  if (!premium && countTowardFreeLimit) {

    try {

      await recordSuccessfulPrompt(subjectKey);

    } catch (e) {

      console.error("recordSuccessfulPrompt", e);

    }

  }



  let usedAfter: number;

  try {

    usedAfter = await getTodayUsageCount(subjectKey);

  } catch (e) {

    console.error(e);

    usedAfter = premium ? 0 : FREE_DAILY_PROMPT_LIMIT;

  }

  if (appUser?.id) {
    try {
      await prisma.promptHistory.create({
        data: {
          userId: appUser.id,
          intent,
          target,
          prompt: promptText,
          topic,
          tone,
          audience,
          provider,
        },
      });
    } catch (e) {
      // Geçmiş kaydı başarısız olsa da ana üretim yanıtını düşürmeyelim.
      console.error("promptHistory.create", e);
    }
  }



  return jsonWithOptionalAnonCookie(

    {

      prompt: promptText,

      provider,

      premium,

      used: usedAfter,

      limit: premium ? null : FREE_DAILY_PROMPT_LIMIT,

      remaining: premium ? null : Math.max(0, FREE_DAILY_PROMPT_LIMIT - usedAfter),

    },

    200,

    setAnonCookie,

    anonId,

  );

}


