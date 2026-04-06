import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { getPaddle, isPaddleConfigured } from "@/lib/paddle";

export const runtime = "nodejs";

export async function POST() {
  if (!isPaddleConfigured()) {
    return NextResponse.json(
      { error: "Paddle yapılandırılmamış (PADDLE_API_KEY, PADDLE_PRICE_ID_PREMIUM)." },
      { status: 503 },
    );
  }

  const priceId = process.env.PADDLE_PRICE_ID_PREMIUM!.trim();

  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Ödeme için giriş yapmalısın." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const paddle = getPaddle();

  let transaction;
  try {
    transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { promptlabUserId: user.id },
    });
  } catch (e) {
    console.error("Paddle transaction create:", e);
    return NextResponse.json(
      { error: "Ödeme oturumu oluşturulamadı. Paddle ürün / fiyat id’lerini kontrol et." },
      { status: 502 },
    );
  }

  let url = transaction.checkout?.url ?? null;
  if (!url) {
    try {
      const refreshed = await paddle.transactions.get(transaction.id);
      url = refreshed.checkout?.url ?? null;
    } catch (e) {
      console.error("Paddle transaction get:", e);
    }
  }

  if (url) {
    return NextResponse.json({ url });
  }

  return NextResponse.json({ transactionId: transaction.id });
}
