"use client";

import type { ThemePreference } from "@/contexts/theme-context";
import { useTheme } from "@/contexts/theme-context";

type UiLocale = "tr" | "en";

export function ThemePreferenceSelect({
  locale = "tr",
  className = "",
  compact = false,
}: {
  locale?: UiLocale;
  className?: string;
  /** Header / toolbar: label yok, küçük select */
  compact?: boolean;
}) {
  const isEn = locale === "en";
  const tx = (tr: string, en: string) => (isEn ? en : tr);
  const { preference, setPreference } = useTheme();

  const select = (
    <select
      value={preference}
      onChange={(e) => setPreference(e.target.value as ThemePreference)}
      aria-label={tx("Tema", "Theme")}
      className={
        compact
          ? "rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--text)]"
          : "rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)]"
      }
    >
      <option value="system">{tx("Sistem", "System")}</option>
      <option value="light">{tx("Açık", "Light")}</option>
      <option value="dark">{tx("Koyu", "Dark")}</option>
    </select>
  );

  if (compact) {
    return <span className={className}>{select}</span>;
  }

  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="text-[var(--muted)]">{tx("Tema", "Theme")}</span>
      {select}
    </label>
  );
}
