import { prisma } from "./prisma";
import { FREE_DAILY_PROMPT_LIMIT } from "./constants";
import { getUsageDayKey } from "./day-key";

export type UsageSubject = { kind: "user"; userId: string } | { kind: "anon"; anonId: string };

export function subjectKeyFrom(s: UsageSubject): string {
  return s.kind === "user" ? `user:${s.userId}` : `anon:${s.anonId}`;
}

export async function getTodayUsageCount(subjectKey: string): Promise<number> {
  const day = getUsageDayKey();
  const row = await prisma.usageCounter.findUnique({
    where: { subjectKey_day: { subjectKey, day } },
  });
  return row?.count ?? 0;
}

/** Ücretsiz: bugün daha dönüşüm hakkı var mı? (henüz tüketmeden) */
export async function canUseFreePrompt(subjectKey: string): Promise<{ ok: true; used: number } | { ok: false; used: number }> {
  const used = await getTodayUsageCount(subjectKey);
  if (used >= FREE_DAILY_PROMPT_LIMIT) return { ok: false, used };
  return { ok: true, used };
}

/** Başarılı üretimden sonra sayacı +1 (ücretsiz kullanıcılar için) */
export async function recordSuccessfulPrompt(subjectKey: string): Promise<number> {
  const day = getUsageDayKey();
  const row = await prisma.usageCounter.upsert({
    where: { subjectKey_day: { subjectKey, day } },
    create: { subjectKey, day, count: 1 },
    update: { count: { increment: 1 } },
  });
  return row.count;
}
