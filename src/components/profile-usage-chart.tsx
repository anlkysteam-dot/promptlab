"use client";

type DayPoint = { day: string; count: number };

const CHART_H = 88;

export function ProfileUsageChart({ days, locale }: { days: DayPoint[]; locale: "tr" | "en" }) {
  const isEn = locale === "en";
  const tx = (tr: string, en: string) => (isEn ? en : tr);
  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div>
      <p className="text-xs text-[var(--muted)]">
        {tx("Son 7 gün — kredi kullanımı (İstanbul günü)", "Last 7 days — credit usage (Istanbul calendar day)")}
      </p>
      <div className="mt-3 flex h-[104px] items-end gap-1.5 sm:gap-2">
        {days.map((d) => {
          const barPx = max > 0 ? Math.round((d.count / max) * CHART_H) : 0;
          const label = d.day.slice(8);
          return (
            <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className="flex w-full flex-col justify-end"
                style={{ height: CHART_H }}
                title={`${d.day}: ${d.count}`}
              >
                <div
                  className="w-full min-w-[6px] rounded-t bg-[var(--accent)]/90"
                  style={{ height: Math.max(barPx, d.count > 0 ? 6 : 2) }}
                />
              </div>
              <span className="text-[10px] leading-none text-[var(--muted)] tabular-nums">{label}</span>
              <span className="text-[10px] font-medium tabular-nums text-[var(--text)]">{d.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
