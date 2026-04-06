import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";

const LIMIT = 80;

export async function GET() {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const rows = await prisma.creditLedgerEntry.findMany({
    where: { userId: appUser.id },
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    select: {
      id: true,
      kind: true,
      delta: true,
      summary: true,
      meta: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
