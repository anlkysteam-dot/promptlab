import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile-client";
import { getAppUser } from "@/lib/app-user";
import { isPaddleConfigured } from "@/lib/paddle";
import { prisma } from "@/lib/prisma";

export default async function EnProfilePage() {
  const appUser = await getAppUser();
  if (!appUser) redirect("/auth");

  const paddleReady = isPaddleConfigured();
  const stripeReady = Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_ID_PREMIUM?.trim(),
  );
  const paymentProvider = paddleReady ? "paddle" : stripeReady ? "stripe" : null;

  const row = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: {
      isPremium: true,
      premiumUntil: true,
      email: true,
      stripeCustomerId: true,
      paddleCustomerId: true,
      stripeSubscriptionId: true,
      paddleSubscriptionId: true,
    },
  });

  return (
    <ProfileClient
      locale="en"
      email={row?.email ?? appUser.email}
      isPremium={Boolean(row?.isPremium)}
      premiumUntilIso={row?.premiumUntil?.toISOString() ?? null}
      paymentProvider={paymentProvider}
      hasStripeCustomer={Boolean(row?.stripeCustomerId)}
      hasPaddleCustomer={Boolean(row?.paddleCustomerId)}
      stripeCustomerId={row?.stripeCustomerId ?? null}
      paddleCustomerId={row?.paddleCustomerId ?? null}
      stripeSubscriptionId={row?.stripeSubscriptionId ?? null}
      paddleSubscriptionId={row?.paddleSubscriptionId ?? null}
    />
  );
}
