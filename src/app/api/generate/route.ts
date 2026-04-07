import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { Prisma } from "@prisma/client";

import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";

import { buildSystemPrompt } from "@/lib/build-system-prompt";

import { FREE_DAILY_CREDIT_BUDGET } from "@/lib/constants";

import { createLlmClient, getChatModel, getGenerateMode, isMockModeAllowed } from "@/lib/llm-config";

import { llmFailureMessage } from "@/lib/llm-errors";

import { buildMockPrompt } from "@/lib/mock-prompt";

import { resolvePremiumForUser } from "@/lib/premium";
import { buildContinuityContextWithProjectProfiles, buildContinuitySnapshot } from "@/lib/continuity-context";
import {
  buildLabPresetBlock,
  buildSuggestedParamsBlock,
  type LabFlavor,
  type LabFormat,
  type MidjourneyVersionId,
} from "@/lib/lab-presets";
import {
  checklistInstruction,
  inferPromptTemplate,
  mediaPresetInstruction,
  qualityModeInstruction,
  templateInstruction,
  type MediaPreset,
  type PromptQualityMode,
} from "@/lib/prompt-quality";

import { AI_TARGETS, type AiTargetId } from "@/lib/targets";

import {
  applyGenerationAfterSuccess,
  assertGenerationAllowed,
  generationCreditCost,
  getTodayUsageCount,
  subjectKeyFrom,
  type UsageSubject,
} from "@/lib/usage";



const validTargetIds = new Set<string>(AI_TARGETS.map((t) => t.id));
const MEDIA_TARGET_IDS = new Set<AiTargetId>([
  "midjourney",
  "dalle",
  "stable_diffusion",
  "runway",
  "veo",
  "sora",
  "kling",
  "pika",
]);

function outputLanguageInstruction(language: "tr" | "en", target: AiTargetId): string {
  if (MEDIA_TARGET_IDS.has(target)) {
    return "For this media target, keep prompt language optimized for model performance.";
  }
  if (language === "en") {
    return "Final response language lock: English. Do not switch language unless the user explicitly asks.";
  }
  return "Final response language lock: Turkish (tr-TR). Do not switch language unless the user explicitly asks.";
}



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
  const outputLanguage = ((body as { outputLanguage?: string })?.outputLanguage === "en" ? "en" : "tr") as
    | "tr"
    | "en";
  const mediaPresetRaw = String((body as { mediaPreset?: string })?.mediaPreset ?? "none");
  const mediaPreset = (
    [
      "none",
      "video_ad_vertical",
      "video_cinematic_short",
      "video_product_demo",
      "video_storyboard",
      "image_product_packshot",
      "image_social_ad",
      "image_concept_art",
      "image_logo_direction",
    ].includes(mediaPresetRaw)
      ? mediaPresetRaw
      : "none"
  ) as MediaPreset;
  const projectId = String((body as { projectId?: string })?.projectId ?? "").trim();
  const labFormatRaw = String((body as { labFormat?: string })?.labFormat ?? "");
  const labFormat = (["", "16:9", "9:16", "1:1"].includes(labFormatRaw) ? labFormatRaw : "") as LabFormat;
  const labFlavorRaw = String((body as { labFlavor?: string })?.labFlavor ?? "none");
  const labFlavor = (
    ["none", "midjourney", "sora", "stable_diffusion"].includes(labFlavorRaw) ? labFlavorRaw : "none"
  ) as LabFlavor;
  const negativePrompt = String((body as { negativePrompt?: string })?.negativePrompt ?? "")
    .trim()
    .slice(0, 600);
  const mjVersionRaw = String((body as { mjVersion?: string })?.mjVersion ?? "6");
  const mjVersion = (
    ["6", "6.1", "7", "niji6"].includes(mjVersionRaw) ? mjVersionRaw : "6"
  ) as MidjourneyVersionId;
  const mjIncludeVersion = Boolean((body as { mjIncludeVersion?: boolean })?.mjIncludeVersion);
  const mjIncludeAr = Boolean((body as { mjIncludeAr?: boolean })?.mjIncludeAr);
  const includeSuggestedParams = Boolean((body as { includeSuggestedParams?: boolean })?.includeSuggestedParams);
  const continuityLock = Boolean((body as { continuityLock?: boolean })?.continuityLock);

  if (!intent || intent.length > 12_000) {

    return NextResponse.json({ error: "Metin gerekli veya çok uzun." }, { status: 400 });

  }



  if (!target || !validTargetIds.has(target)) {

    return NextResponse.json({ error: "Geçerli bir hedef seçin." }, { status: 400 });

  }

  const midjourneyCli =
    target === "midjourney"
      ? { includeVersion: mjIncludeVersion, version: mjVersion, includeAr: mjIncludeAr }
      : undefined;

  const labPresetBlock = buildLabPresetBlock({
    format: labFormat,
    negativePrompt,
    flavor: labFlavor,
    target,
    midjourneyCli,
  });

  const suggestedParamsBlock = buildSuggestedParamsBlock({
    enabled: includeSuggestedParams,
    target,
    flavor: labFlavor,
    format: labFormat,
  });



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
  if (projectId && !appUser?.id) {
    return NextResponse.json({ error: "Proje için giriş yapmalısın." }, { status: 401 });
  }

  let activeProject:
    | {
        id: string;
        target: string;
        characterProfile: string;
        styleProfile: string;
        scenes: Array<{ sceneNo: number; userInput: string; generatedPrompt: string }>;
      }
    | null = null;
  if (projectId && appUser?.id) {
    activeProject = await prisma.promptProject.findFirst({
      where: { id: projectId, userId: appUser.id },
      select: {
        id: true,
        target: true,
        characterProfile: true,
        styleProfile: true,
        scenes: {
          orderBy: { sceneNo: "desc" },
          take: 6,
          select: { sceneNo: true, userInput: true, generatedPrompt: true },
        },
      },
    });
    if (!activeProject) {
      return NextResponse.json({ error: "Proje bulunamadı veya erişim yok." }, { status: 404 });
    }
  }

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

  const creditCost = generationCreditCost(premium, qualityMode);

  if (!premium && countTowardFreeLimit) {

    try {

      const gate = await assertGenerationAllowed(subjectKey, creditCost, {
        premium,
        appUserId: appUser?.id ?? null,
      });

      if (!gate.ok) {

        return jsonWithOptionalAnonCookie(

          {

            error: `Kredi yetersiz (bugün ${gate.used}/${FREE_DAILY_CREDIT_BUDGET} günlük kredi kullanıldı; bu üretim ${creditCost} kredi gerektirir). Satın alınan kredi veya günlük bütçe yetmiyorsa kredi paketi alın, Premium ile günlük tavan kalkar veya yarın tekrar deneyin.`,

            used: gate.used,

            limit: FREE_DAILY_CREDIT_BUDGET,

            creditCost,

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
    const continuityContext = activeProject
      ? buildContinuityContextWithProjectProfiles(activeProject.scenes, {
          characterProfile: activeProject.characterProfile,
          styleProfile: activeProject.styleProfile,
        })
      : "";
    const composedUserInput = [
      "Rewrite the following user request into a high-quality English prompt for the selected AI target.",
      "Do not translate literally; optimize for result quality.",
      activeProject && activeProject.scenes.length > 0 && continuityLock
        ? "If this is scene 2+ in a sequence, continue from where the previous scene ended, and NEVER change core physical character traits (hair, face, clothing, body specifics)."
        : "",
      qualityModeInstruction(qualityMode),
      outputLanguageInstruction(outputLanguage, target),
      templateInstruction(templateKind),
      mediaPresetInstruction(mediaPreset),
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
      `project_id=${activeProject?.id ?? "(none)"}`,
      `project_target=${activeProject?.target ?? "(none)"}`,
      activeProject ? `project_scene_count=${activeProject.scenes.length}` : "project_scene_count=0",
      continuityContext ? "\n[CONTINUITY_CONTEXT]\n" + continuityContext : "",
      labPresetBlock ? "\n\n" + labPresetBlock : "",
      suggestedParamsBlock ? "\n\n" + suggestedParamsBlock : "",
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



  let spendResult: { creditBalanceAfter: number | null; fromFree: number; fromPurchased: number } = {
    creditBalanceAfter: null,
    fromFree: 0,
    fromPurchased: 0,
  };

  if (!premium && countTowardFreeLimit) {
    try {
      spendResult = await applyGenerationAfterSuccess(subjectKey, creditCost, {
        premium,
        appUserId: appUser?.id ?? null,
        target,
      });
    } catch (e) {
      console.error("applyGenerationAfterSuccess", e);
    }
  }

  let creditBalanceForClient: number | null = null;
  if (appUser?.id) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: appUser.id },
        select: { creditBalance: true },
      });
      creditBalanceForClient = u?.creditBalance ?? 0;
    } catch (e) {
      console.error("creditBalance lookup", e);
    }
  }



  let usedAfter: number;

  try {

    usedAfter = await getTodayUsageCount(subjectKey);

  } catch (e) {

    console.error(e);

    usedAfter = premium ? 0 : FREE_DAILY_CREDIT_BUDGET;

  }

  let historyId: string | null = null;
  if (appUser?.id) {
    try {
      const created = await prisma.promptHistory.create({
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
      historyId = created.id;
    } catch (e) {
      // Geçmiş kaydı başarısız olsa da ana üretim yanıtını düşürmeyelim.
      console.error("promptHistory.create", e);
    }
  }

  if (appUser?.id && activeProject) {
    try {
      const last = activeProject.scenes[0];
      const nextSceneNo = (last?.sceneNo ?? 0) + 1;
      await prisma.promptScene.create({
        data: {
          projectId: activeProject.id,
          sceneNo: nextSceneNo,
          userInput: intent,
          generatedPrompt: promptText,
          continuitySnapshot: buildContinuitySnapshot(promptText),
        },
      });
      await prisma.promptProject.update({
        where: { id: activeProject.id },
        data: {},
      });
    } catch (e) {
      console.error("promptScene.create", e);
    }
  }



  return jsonWithOptionalAnonCookie(

    {

      prompt: promptText,

      provider,

      premium,

      used: usedAfter,

      limit: premium ? null : FREE_DAILY_CREDIT_BUDGET,

      remaining: premium ? null : Math.max(0, FREE_DAILY_CREDIT_BUDGET - usedAfter),

      creditCost,

      creditBalance: creditBalanceForClient,

      spentFromDaily: spendResult.fromFree,

      spentFromBonus: spendResult.fromPurchased,
      historyId,

    },

    200,

    setAnonCookie,

    anonId,

  );

}


