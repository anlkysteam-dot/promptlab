import { prisma } from "./prisma";

export async function grantPurchasedCredits(userId: string, credits: number): Promise<void> {
  if (!Number.isFinite(credits) || credits <= 0) return;
  await prisma.user.update({
    where: { id: userId },
    data: { creditBalance: { increment: Math.floor(credits) } },
  });
}
