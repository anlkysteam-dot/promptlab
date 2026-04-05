import type Stripe from "stripe";
import { prisma } from "./prisma";

/** Aboneliği sürdürmeye değer durumlar (Stripe status) */
const PREMIUM_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

function periodEndDate(sub: Stripe.Subscription): Date | null {
  const end = sub.current_period_end;
  if (typeof end !== "number") return null;
  return new Date(end * 1000);
}

/**
 * Kullanıcıyı abonelik durumuna göre günceller.
 * userId yoksa stripeSubscriptionId veya stripeCustomerId ile arar.
 */
export async function syncUserPremiumFromSubscription(
  sub: Stripe.Subscription,
  explicitUserId?: string | null,
): Promise<void> {
  const userId =
    explicitUserId?.trim() ||
    sub.metadata?.userId?.trim() ||
    null;

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return;

  const premium = PREMIUM_STATUSES.has(sub.status);
  const premiumUntil = premium ? periodEndDate(sub) : null;

  const data = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
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
    where: { stripeSubscriptionId: sub.id },
  });
  if (bySub) {
    await prisma.user.update({ where: { id: bySub.id }, data });
    return;
  }

  const byCustomer = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (byCustomer) {
    await prisma.user.update({ where: { id: byCustomer.id }, data });
  }
}

export async function clearPremiumForSubscription(subscriptionId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      isPremium: false,
      premiumUntil: null,
      stripeSubscriptionId: null,
    },
  });
}
