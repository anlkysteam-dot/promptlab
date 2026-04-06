"use client";

import Link from "next/link";
import { useConsent } from "@/contexts/consent-context";

export function CookieBanner() {
  const { consent, setEssential, setAnalytics } = useConsent();

  if (consent !== "pending") return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-6"
      role="dialog"
      aria-label="Çerez tercihleri"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
          Oturum ve güvenlik için zorunlu çerezler kullanılır. İstersen anonim kullanım istatistikleri için ek çerezlere izin
          verebilirsin. Ayrıntılar:{" "}
          <Link href="/gizlilik" className="text-[var(--accent)] underline hover:no-underline">
            Gizlilik / KVKK
          </Link>
          .
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={setEssential}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--hover-surface)] sm:text-sm"
          >
            Yalnızca zorunlu
          </button>
          <button
            type="button"
            onClick={setAnalytics}
            className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--on-accent)] hover:opacity-90 sm:text-sm"
          >
            Çerezleri kabul et
          </button>
        </div>
      </div>
    </div>
  );
}
