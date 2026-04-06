import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const rows = await prisma.promptHistory.findMany({
    where: { userId: appUser.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      intent: true,
      target: true,
      prompt: true,
      isFavorite: true,
      topic: true,
      tone: true,
      audience: true,
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      intent: r.intent,
      target: r.target,
      prompt: r.prompt,
      isFavorite: r.isFavorite,
      topic: r.topic,
      tone: r.tone,
      audience: r.audience,
    })),
  });
}

export async function DELETE() {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  await prisma.promptHistory.deleteMany({ where: { userId: appUser.id } });
  return NextResponse.json({ ok: true });
}
