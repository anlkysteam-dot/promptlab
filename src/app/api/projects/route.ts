import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";
import { AI_TARGETS } from "@/lib/targets";

export const runtime = "nodejs";

const validTargetIds = new Set<string>(AI_TARGETS.map((t) => t.id));

export async function GET() {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const rows = await prisma.promptProject.findMany({
    where: { userId: appUser.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      target: true,
      characterProfile: true,
      styleProfile: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { scenes: true } },
    },
    take: 50,
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      target: r.target,
      characterProfile: r.characterProfile,
      styleProfile: r.styleProfile,
      sceneCount: r._count.scenes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    target?: string;
    characterProfile?: string;
    styleProfile?: string;
  };
  const title = String(body.title ?? "").trim().slice(0, 120);
  const target = String(body.target ?? "universal").trim();
  const characterProfile = String(body.characterProfile ?? "").trim().slice(0, 1200);
  const styleProfile = String(body.styleProfile ?? "").trim().slice(0, 1200);
  if (!title) {
    return NextResponse.json({ error: "Proje başlığı gerekli." }, { status: 400 });
  }
  if (!validTargetIds.has(target)) {
    return NextResponse.json({ error: "Geçerli bir hedef seçin." }, { status: 400 });
  }

  const created = await prisma.promptProject.create({
    data: {
      userId: appUser.id,
      title,
      target,
      characterProfile,
      styleProfile,
    },
    select: {
      id: true,
      title: true,
      target: true,
      characterProfile: true,
      styleProfile: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    {
      id: created.id,
      title: created.title,
      target: created.target,
      characterProfile: created.characterProfile,
      styleProfile: created.styleProfile,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
