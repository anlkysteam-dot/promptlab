import { prisma } from "./prisma";

function premiumEmailList(): string[] {
  const raw = process.env.PREMIUM_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function resolvePremiumForUser(userId: string, email: string | null | undefined): Promise<boolean> {
  if (email && premiumEmailList().includes(email.toLowerCase())) {
    return true;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumUntil: true },
  });

  if (!user) return false;
  if (!user.isPremium) return false;
  if (user.premiumUntil && user.premiumUntil <= new Date()) return false;
  return true;
}
