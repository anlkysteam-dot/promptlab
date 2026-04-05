import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppUser } from "@/lib/app-user";
import { FREE_DAILY_PROMPT_LIMIT } from "@/lib/constants";
import { resolvePremiumForUser } from "@/lib/premium";
import { getTodayUsageCount, subjectKeyFrom, type UsageSubject } from "@/lib/usage";

export async function GET() {
  const appUser = await getAppUser();
  const jar = await cookies();
  const anonId = jar.get("anon_id")?.value ?? null;

  if (!appUser?.id && !anonId) {
    return NextResponse.json({
      premium: false,
      used: 0,
      limit: FREE_DAILY_PROMPT_LIMIT,
      remaining: FREE_DAILY_PROMPT_LIMIT,
      anonymous: true,
    });
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

  const used = await getTodayUsageCount(subjectKey);

  return NextResponse.json({
    premium,
    used,
    limit: premium ? null : FREE_DAILY_PROMPT_LIMIT,
    remaining: premium ? null : Math.max(0, FREE_DAILY_PROMPT_LIMIT - used),
    loggedIn: Boolean(appUser?.id),
  });
}
