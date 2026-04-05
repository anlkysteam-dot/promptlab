import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, getStripe } from "@/lib/stripe";

export async function POST() {
  const priceId = process.env.STRIPE_PRICE_ID_PREMIUM?.trim();
  if (!priceId) {
    return NextResponse.json(
      { error: "Sunucuda STRIPE_PRICE_ID_PREMIUM tanımlı değil." },
      { status: 503 },
    );
  }

  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Ödeme için giriş yapmalısın." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: { id: true, email: true, stripeCustomerId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const base = getAppBaseUrl();
  const stripe = getStripe();

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/pricing?success=1`,
    cancel_url: `${base}/pricing?canceled=1`,
    client_reference_id: user.id,
    subscription_data: {
      metadata: { userId: user.id },
    },
    metadata: { userId: user.id },
    allow_promotion_codes: true,
  };

  if (user.stripeCustomerId) {
    params.customer = user.stripeCustomerId;
  } else if (user.email) {
    params.customer_email = user.email;
  }

  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.create(params);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Ödeme oturumu oluşturulamadı. Ayarlarını kontrol et." }, { status: 502 });
  }

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Ödeme bağlantısı alınamadı." }, { status: 502 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
