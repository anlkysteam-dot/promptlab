"use client";

import { useEffect } from "react";

export type CreditToastPayload = {
  premium: boolean;
  creditCost: number;
  creditBalance: number | null;
  spentFromDaily: number;
  spentFromBonus: number;
  remainingDaily: number | null;
};

type Props = {
  open: boolean;
  payload: CreditToastPayload | null;
  locale: "tr" | "en";
  onDismiss: () => void;
};

export function CreditSpendToast({ open, payload, locale, onDismiss }: Props) {
  const isEn = locale === "en";
  const tx = (tr: string, en: string) => (isEn ? en : tr);

  useEffect(() => {
    if (!open || !payload) return;
    const t = window.setTimeout(() => onDismiss(), 6000);
    return () => window.clearTimeout(t);
  }, [open, payload, onDismiss]);

  if (!open || !payload) return null;

  const rem = payload.remainingDaily ?? "—";
  const bal = payload.creditBalance ?? "—";

  const body = payload.premium
    ? tx(
        `Ağırlık: ${payload.creditCost} kredi · Premium (günlük kota yok).`,
        `Weight: ${payload.creditCost} cr. · Premium (no daily cap).`,
      )
    : tx(
        `−${payload.creditCost} kredi · Günlük ${payload.spentFromDaily}+ bon. ${payload.spentFromBonus} · Kalan: ${rem} / ${bal}`,
        `−${payload.creditCost} cr. · Daily ${payload.spentFromDaily}+ bonus ${payload.spentFromBonus} · Left: ${rem} / ${bal}`,
      );

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      role="status"
      aria-live="polite"
    >
      <div className="animate-credit-toast-in pointer-events-auto w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
          {tx("Kredi özeti", "Credit summary")}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text)]">{body}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 text-xs font-medium text-[var(--muted)] underline hover:text-[var(--text)]"
        >
          {tx("Kapat", "Dismiss")}
        </button>
      </div>
    </div>
  );
}
