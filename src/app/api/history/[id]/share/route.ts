import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Geçersiz kayıt id." }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as { shareToFeed?: boolean };
  if (typeof body.shareToFeed !== "boolean") {
    return NextResponse.json({ error: "shareToFeed (boolean) gerekli." }, { status: 400 });
  }

  const row = await prisma.promptHistory.findFirst({
    where: { id, userId: appUser.id },
    select: { id: true },
  });

  if (!row) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  const updated = await prisma.promptHistory.update({
    where: { id: row.id },
    data: { shareToFeed: body.shareToFeed },
    select: { id: true, shareToFeed: true },
  });

  return NextResponse.json({ id: updated.id, shareToFeed: updated.shareToFeed });
}
