import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/admin-auth";
import { grantManualCredits } from "@/lib/credits-grant";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/password";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const raw = body as { email?: unknown; amount?: unknown; note?: unknown };
  const email = typeof raw.email === "string" ? normalizeEmail(raw.email) : "";
  const amount = typeof raw.amount === "number" ? raw.amount : Number(raw.amount);
  const note = typeof raw.note === "string" ? raw.note.trim() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Geçerli e-posta girin." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 1 || amount > 500_000) {
    return NextResponse.json({ error: "Miktar 1–500000 arası olmalı." }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, email: true, creditBalance: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Bu e-posta ile kayıtlı kullanıcı yok." }, { status: 404 });
  }

  try {
    await grantManualCredits(user.id, amount, note ? `Manuel +${Math.floor(amount)}: ${note}` : `Manuel +${Math.floor(amount)} kredi`);
  } catch (e) {
    console.error("grantManualCredits", e);
    return NextResponse.json({ error: "İşlem başarısız." }, { status: 500 });
  }

  const after = await prisma.user.findUnique({
    where: { id: user.id },
    select: { creditBalance: true },
  });

  return NextResponse.json({
    ok: true,
    userId: user.id,
    creditBalanceAfter: after?.creditBalance ?? null,
  });
}
