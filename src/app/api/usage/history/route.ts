import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-user";
import { getUsageSeriesForUser } from "@/lib/usage-series";

export const runtime = "nodejs";

/** Son 7 gün günlük dönüşüm sayıları (İstanbul günü). */
export async function GET() {
  const appUser = await getAppUser();
  if (!appUser?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const days = await getUsageSeriesForUser(appUser.id, 7);
  return NextResponse.json({ days });
}
