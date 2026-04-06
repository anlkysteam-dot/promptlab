import { prisma } from "./prisma";
import { FREE_DAILY_CREDIT_BUDGET } from "./constants";
import { getUsageDayKey } from "./day-key";
import type { PromptQualityMode } from "./prompt-quality";

export type UsageSubject = { kind: "user"; userId: string } | { kind: "anon"; anonId: string };

export function subjectKeyFrom(s: UsageSubject): string {
  return s.kind === "user" ? `user:${s.userId}` : `anon:${s.anonId}`;
}

/** Başarılı bir üretim için harcanan kredi (premium daha az “ağırlıklı” maliyet). */
export function generationCreditCost(premium: boolean, qualityMode: PromptQualityMode): number {
  const tier = premium ? 1 : 2;
  const modeMul = qualityMode === "advanced" ? 2 : 1;
  return tier * modeMul;
}

/**
 * Günlük ücretsiz bütçe + satın alınan kredi havuzu arasında maliyeti böler.
 * `usedFromDailyFree`: bugün UsageCounter’daki toplam (sadece günlük tüketim).
 */
export function splitGenerationAcrossBuckets(
  usedFromDailyFree: number,
  cost: number,
  purchasedBalance: number,
): { ok: true; fromFree: number; fromPurchased: number } | { ok: false } {
  const freeRemaining = FREE_DAILY_CREDIT_BUDGET - usedFromDailyFree;
  const fromFree = Math.min(cost, Math.max(0, freeRemaining));
  const fromPurchased = cost - fromFree;
  if (fromPurchased > purchasedBalance) return { ok: false };
  return { ok: true, fromFree, fromPurchased };
}

export async function getTodayUsageCount(subjectKey: string): Promise<number> {
  const day = getUsageDayKey();
  const row = await prisma.usageCounter.findUnique({
    where: { subjectKey_day: { subjectKey, day } },
  });
  return row?.count ?? 0;
}

/** Ücretsiz (veya anon): bu üretim için günlük bütçe + satın alınan kredi yeterli mi? */
export async function assertGenerationAllowed(
  subjectKey: string,
  cost: number,
  opts: { premium: boolean; appUserId: string | null },
): Promise<{ ok: true; used: number } | { ok: false; used: number }> {
  if (opts.premium) return { ok: true, used: 0 };

  const used = await getTodayUsageCount(subjectKey);

  if (!opts.appUserId) {
    if (used + cost > FREE_DAILY_CREDIT_BUDGET) return { ok: false, used };
    return { ok: true, used };
  }

  const user = await prisma.user.findUnique({
    where: { id: opts.appUserId },
    select: { creditBalance: true },
  });
  const balance = user?.creditBalance ?? 0;
  const split = splitGenerationAcrossBuckets(used, cost, balance);
  if (!split.ok) return { ok: false, used };
  return { ok: true, used };
}

export type GenerationSpendResult = {
  creditBalanceAfter: number | null;
  fromFree: number;
  fromPurchased: number;
};

/** Başarılı üretimden sonra günlük sayaç, bonus kredi ve defter kaydı. */
export async function applyGenerationAfterSuccess(
  subjectKey: string,
  cost: number,
  opts: { premium: boolean; appUserId: string | null; target?: string | null },
): Promise<GenerationSpendResult> {
  if (opts.premium) {
    return { creditBalanceAfter: null, fromFree: 0, fromPurchased: 0 };
  }

  const day = getUsageDayKey();

  if (!opts.appUserId) {
    await prisma.usageCounter.upsert({
      where: { subjectKey_day: { subjectKey, day } },
      create: { subjectKey, day, count: cost },
      update: { count: { increment: cost } },
    });
    return { creditBalanceAfter: null, fromFree: cost, fromPurchased: 0 };
  }

  const used = await getTodayUsageCount(subjectKey);
  const user = await prisma.user.findUnique({
    where: { id: opts.appUserId },
    select: { creditBalance: true },
  });
  const balance = user?.creditBalance ?? 0;
  const split = splitGenerationAcrossBuckets(used, cost, balance);
  if (!split.ok) {
    return { creditBalanceAfter: null, fromFree: 0, fromPurchased: 0 };
  }

  await prisma.$transaction(async (tx) => {
    if (split.fromFree > 0) {
      await tx.usageCounter.upsert({
        where: { subjectKey_day: { subjectKey, day } },
        create: { subjectKey, day, count: split.fromFree },
        update: { count: { increment: split.fromFree } },
      });
    }
    if (split.fromPurchased > 0) {
      await tx.user.update({
        where: { id: opts.appUserId! },
        data: { creditBalance: { decrement: split.fromPurchased } },
      });
    }
    await tx.creditLedgerEntry.create({
      data: {
        userId: opts.appUserId!,
        kind: "generation",
        delta: -split.fromPurchased,
        summary: "Prompt üretimi",
        meta: JSON.stringify({
          creditCost: cost,
          fromDaily: split.fromFree,
          fromBonus: split.fromPurchased,
          ...(opts.target ? { target: opts.target } : {}),
        }),
      },
    });
  });

  const u = await prisma.user.findUnique({
    where: { id: opts.appUserId },
    select: { creditBalance: true },
  });
  return {
    creditBalanceAfter: u?.creditBalance ?? 0,
    fromFree: split.fromFree,
    fromPurchased: split.fromPurchased,
  };
}
