import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { findPackById } from "@/lib/credit-packs";
import { getPaddle } from "@/lib/paddle";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.PADDLE_API_KEY?.trim()) {
    return NextResponse.json({ error: "PADDLE_API_KEY tanımlı değil." }, { status: 503 });
  }

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
  const pack = findPackById(packId);
  if (!pack?.paddlePriceId) {
    return NextResponse.json(
      { error: "Bu paket için Paddle fiyat id’si tanımlı değil (PADDLE_PRICE_ID_CREDITS_*)." },
      { status: 400 },
    );
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
      items: [{ priceId: pack.paddlePriceId, quantity: 1 }],
      customData: {
        promptlabUserId: user.id,
        kind: "credit_pack",
        credits: String(pack.credits),
        packId: pack.id,
      },
    });
  } catch (e) {
    console.error("Paddle credit transaction:", e);
    return NextResponse.json({ error: "Ödeme oturumu oluşturulamadı." }, { status: 502 });
  }

  return NextResponse.json({ transactionId: transaction.id });
}
