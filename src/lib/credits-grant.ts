import { prisma } from "./prisma";

export type CreditGrantProvider = "stripe" | "paddle";

/**
 * Satın alınan krediyi ekler. Aynı `externalId` ile ikinci kez çağrılırsa bakiye artmaz (idempotent).
 */
export async function grantPurchasedCreditsIdempotent(
  userId: string,
  credits: number,
  provider: CreditGrantProvider,
  externalId: string,
  summary?: string,
): Promise<"granted" | "duplicate"> {
  if (!Number.isFinite(credits) || credits <= 0) return "duplicate";
  const n = Math.floor(credits);
  const externalRef = `${provider}:${externalId}`;
  const sum = summary ?? `+${n} kredi`;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.creditLedgerEntry.create({
        data: {
          userId,
          kind: "purchase",
          delta: n,
          externalRef,
          summary: sum,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { creditBalance: { increment: n } },
      });
    });
    return "granted";
  } catch (e: unknown) {
    const code = typeof e === "object" && e !== null && "code" in e ? (e as { code?: string }).code : undefined;
    if (code === "P2002") return "duplicate";
    throw e;
  }
}

/**
 * Ödeme sonrası teknik sorun vb. için yönetici tarafından manuel kredi ekler (deftere `manual_grant` yazar).
 */
export async function grantManualCredits(userId: string, credits: number, summary: string): Promise<void> {
  const n = Math.floor(credits);
  if (!Number.isFinite(n) || n <= 0) throw new Error("invalid_amount");
  const sum = summary.trim().slice(0, 500) || `Manuel +${n} kredi`;

  await prisma.$transaction(async (tx) => {
    await tx.creditLedgerEntry.create({
      data: {
        userId,
        kind: "manual_grant",
        delta: n,
        externalRef: null,
        summary: sum,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: n } },
    });
  });
}
