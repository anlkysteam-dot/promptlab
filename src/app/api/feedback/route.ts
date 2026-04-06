import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_MESSAGE = 12000;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const raw = body as { email?: unknown; message?: unknown };
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Geçerli bir e-posta girin." }, { status: 400 });
  }
  if (!message || message.length < 3) {
    return NextResponse.json({ error: "Mesajınızı yazın (en az birkaç karakter)." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Mesaj çok uzun." }, { status: 400 });
  }

  try {
    await prisma.feedbackSubmission.create({
      data: { email: email.toLowerCase(), message },
    });
  } catch (e) {
    console.error("feedbackSubmission.create", e);
    return NextResponse.json({ error: "Kaydedilemedi. Tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
