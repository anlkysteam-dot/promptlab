import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl, getStripe } from "@/lib/stripe";

export async function POST() {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "Henüz bir ödeme müşteri kaydın yok. Önce abonelik satın al." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  let portalSession;
  try {
    portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppBaseUrl()}/pricing`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Portal açılamadı." }, { status: 502 });
  }

  if (!portalSession.url) {
    return NextResponse.json({ error: "Portal bağlantısı alınamadı." }, { status: 502 });
  }

  return NextResponse.json({ url: portalSession.url });
}
