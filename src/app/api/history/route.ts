import { type NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_HISTORY = 500;

export async function GET(req: NextRequest) {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("limit");
  const parsed = raw != null ? Number.parseInt(raw, 10) : 20;
  const take = Number.isFinite(parsed) ? Math.min(MAX_HISTORY, Math.max(1, parsed)) : 20;

  const rows = await prisma.promptHistory.findMany({
    where: { userId: appUser.id },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      createdAt: true,
      intent: true,
      target: true,
      prompt: true,
      isFavorite: true,
      shareToFeed: true,
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
      shareToFeed: r.shareToFeed,
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
