import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { findPackById } from "@/lib/credit-packs";
import { getAppBaseUrl, getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Ödeme için giriş yapmalısın." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz gövde." }, { status: 400 });
  }

  const packId = String((body as { packId?: string })?.packId ?? "").trim();
  const locale = (body as { locale?: string })?.locale === "en" ? "en" : "tr";

  const pack = findPackById(packId);
  if (!pack?.stripePriceId) {
    return NextResponse.json(
      { error: "Bu paket için Stripe fiyat id’si tanımlı değil (STRIPE_PRICE_ID_CREDITS_*)." },
      { status: 400 },
    );
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
  const successPath = locale === "en" ? "/en/credits?success=1" : "/tr/kredi?success=1";
  const cancelPath = locale === "en" ? "/en/credits?canceled=1" : "/tr/kredi?canceled=1";

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [{ price: pack.stripePriceId, quantity: 1 }],
    success_url: `${base}${successPath}`,
    cancel_url: `${base}${cancelPath}`,
    client_reference_id: user.id,
    metadata: {
      kind: "credit_pack",
      userId: user.id,
      credits: String(pack.credits),
      packId: pack.id,
    },
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
    return NextResponse.json({ error: "Ödeme oturumu oluşturulamadı." }, { status: 502 });
  }

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Ödeme bağlantısı alınamadı." }, { status: 502 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
