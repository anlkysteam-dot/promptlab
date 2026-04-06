import { prisma } from "@/lib/prisma";
import { getUsageDayKey } from "@/lib/day-key";

const MS_DAY = 86400000;

/** Son `days` gün için İstanbul takvim günü başına kullanım sayısı (UsageCounter). */
export async function getUsageSeriesForUser(userId: string, days: number): Promise<Array<{ day: string; count: number }>> {
  const subjectKey = `user:${userId}`;
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * MS_DAY);
    keys.push(getUsageDayKey(d));
  }
  const rows = await prisma.usageCounter.findMany({
    where: { subjectKey, day: { in: keys } },
  });
  const map = new Map(rows.map((r) => [r.day, r.count]));
  return keys.map((day) => ({ day, count: map.get(day) ?? 0 }));
}
