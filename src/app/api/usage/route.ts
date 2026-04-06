import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppUser } from "@/lib/app-user";
import { FREE_DAILY_CREDIT_BUDGET } from "@/lib/constants";
import { resolvePremiumForUser } from "@/lib/premium";
import { prisma } from "@/lib/prisma";
import { getTodayUsageCount, subjectKeyFrom, type UsageSubject } from "@/lib/usage";

export async function GET() {
  const appUser = await getAppUser();
  const jar = await cookies();
  const anonId = jar.get("anon_id")?.value ?? null;

  if (!appUser?.id && !anonId) {
    return NextResponse.json({
      premium: false,
      used: 0,
      limit: FREE_DAILY_CREDIT_BUDGET,
      remaining: FREE_DAILY_CREDIT_BUDGET,
      creditBalance: 0,
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

  let creditBalance = 0;
  if (appUser?.id) {
    const row = await prisma.user.findUnique({
      where: { id: appUser.id },
      select: { creditBalance: true },
    });
    creditBalance = row?.creditBalance ?? 0;
  }

  return NextResponse.json({
    premium,
    used,
    limit: premium ? null : FREE_DAILY_CREDIT_BUDGET,
    remaining: premium ? null : Math.max(0, FREE_DAILY_CREDIT_BUDGET - used),
    creditBalance,
    loggedIn: Boolean(appUser?.id),
  });
}
