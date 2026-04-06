import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Keşfet vitrinı: kullanıcıların izin verdiği promptlar (public, anonim). */
export async function GET() {
  const rows = await prisma.promptHistory.findMany({
    where: { shareToFeed: true },
    orderBy: { createdAt: "desc" },
    take: 48,
    select: {
      id: true,
      intent: true,
      prompt: true,
      target: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      intent: r.intent.slice(0, 200),
      prompt: r.prompt.slice(0, 1200),
      target: r.target,
      at: r.createdAt.toISOString(),
    })),
  });
}
