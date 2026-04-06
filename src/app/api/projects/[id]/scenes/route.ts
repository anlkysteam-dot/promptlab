import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getOwnedProjectId(projectId: string, userId: string): Promise<string | null> {
  const row = await prisma.promptProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return row?.id ?? null;
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const projectId = await getOwnedProjectId(id, appUser.id);
  if (!projectId) {
    return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 });
  }

  const rows = await prisma.promptScene.findMany({
    where: { projectId },
    orderBy: { sceneNo: "asc" },
    select: {
      id: true,
      sceneNo: true,
      userInput: true,
      generatedPrompt: true,
      continuitySnapshot: true,
      createdAt: true,
    },
    take: 120,
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      sceneNo: r.sceneNo,
      userInput: r.userInput,
      generatedPrompt: r.generatedPrompt,
      continuitySnapshot: r.continuitySnapshot,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const projectId = await getOwnedProjectId(id, appUser.id);
  if (!projectId) {
    return NextResponse.json({ error: "Proje bulunamadı." }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    userInput?: string;
    generatedPrompt?: string;
    continuitySnapshot?: string;
  };
  const userInput = String(body.userInput ?? "").trim();
  const generatedPrompt = String(body.generatedPrompt ?? "").trim();
  if (!userInput || !generatedPrompt) {
    return NextResponse.json({ error: "userInput ve generatedPrompt zorunlu." }, { status: 400 });
  }

  const last = await prisma.promptScene.findFirst({
    where: { projectId },
    orderBy: { sceneNo: "desc" },
    select: { sceneNo: true },
  });
  const sceneNo = (last?.sceneNo ?? 0) + 1;

  const created = await prisma.promptScene.create({
    data: {
      projectId,
      sceneNo,
      userInput,
      generatedPrompt,
      continuitySnapshot: String(body.continuitySnapshot ?? "").trim() || null,
    },
    select: { id: true, sceneNo: true, createdAt: true },
  });

  return NextResponse.json(
    { id: created.id, sceneNo: created.sceneNo, createdAt: created.createdAt.toISOString() },
    { status: 201 },
  );
}
