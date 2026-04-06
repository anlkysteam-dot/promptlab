import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { getPaddle, isPaddleConfigured } from "@/lib/paddle";

export const runtime = "nodejs";

export async function POST() {
  if (!isPaddleConfigured()) {
    return NextResponse.json({ error: "Paddle yapılandırılmamış." }, { status: 503 });
  }

  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: { paddleCustomerId: true, paddleSubscriptionId: true },
  });

  if (!user?.paddleCustomerId) {
    return NextResponse.json(
      { error: "Paddle müşteri kaydı yok. Önce premium satın al." },
      { status: 400 },
    );
  }

  const subscriptionIds = user.paddleSubscriptionId ? [user.paddleSubscriptionId] : [];

  const paddle = getPaddle();
  try {
    const session = await paddle.customerPortalSessions.create(user.paddleCustomerId, subscriptionIds);
    const url = session.urls.general.overview;
    if (!url) {
      return NextResponse.json({ error: "Portal adresi alınamadı." }, { status: 502 });
    }
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Paddle customer portal:", e);
    return NextResponse.json({ error: "Portal açılamadı." }, { status: 502 });
  }
}
