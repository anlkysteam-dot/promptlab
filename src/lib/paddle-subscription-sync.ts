import { prisma } from "./prisma";

/** Paddle webhook / API’deki abonelik özeti (SDK sınıfına bağımlı olmadan). */
export type PaddleSubscriptionLike = {
  id: string;
  status: string;
  customerId: string;
  customData: Record<string, unknown> | null;
  currentBillingPeriod: { endsAt: string } | null;
  nextBilledAt: string | null;
};

const PREMIUM_STATUSES = new Set(["active", "trialing", "past_due"]);

function periodEnd(sub: PaddleSubscriptionLike): Date | null {
  const fromPeriod = sub.currentBillingPeriod?.endsAt;
  if (fromPeriod) return new Date(fromPeriod);
  if (sub.nextBilledAt) return new Date(sub.nextBilledAt);
  return null;
}

function userIdFromCustomData(sub: PaddleSubscriptionLike): string | null {
  const d = sub.customData;
  if (!d || typeof d !== "object") return null;
  const v = (d as Record<string, unknown>).promptlabUserId;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Paddle aboneliğini veritabanındaki kullanıcıyla eşler (custom_data veya mevcut paddle id’leri).
 */
export async function syncUserPremiumFromPaddleSubscription(
  sub: PaddleSubscriptionLike,
  explicitUserId?: string | null,
): Promise<void> {
  if (sub.status === "canceled") {
    await clearPremiumForPaddleSubscription(sub.id);
    return;
  }

  const userId = explicitUserId?.trim() || userIdFromCustomData(sub) || null;
  const premium = PREMIUM_STATUSES.has(sub.status);
  const premiumUntil = premium ? periodEnd(sub) : null;

  const data = {
    paddleCustomerId: sub.customerId,
    paddleSubscriptionId: sub.id,
    isPremium: premium,
    premiumUntil,
  };

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data,
    });
    return;
  }

  const bySub = await prisma.user.findFirst({
    where: { paddleSubscriptionId: sub.id },
  });
  if (bySub) {
    await prisma.user.update({ where: { id: bySub.id }, data });
    return;
  }

  const byCustomer = await prisma.user.findFirst({
    where: { paddleCustomerId: sub.customerId },
  });
  if (byCustomer) {
    await prisma.user.update({ where: { id: byCustomer.id }, data });
  }
}

export async function clearPremiumForPaddleSubscription(subscriptionId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { paddleSubscriptionId: subscriptionId },
    data: {
      isPremium: false,
      premiumUntil: null,
      paddleSubscriptionId: null,
    },
  });
}
