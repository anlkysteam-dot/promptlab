"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo-mark";
import { ProfileUsageChart } from "@/components/profile-usage-chart";
import { RecentGenerationsPanel } from "@/components/recent-generations-panel";
import { ThemePreferenceSelect } from "@/components/theme-preference-select";
import { FREE_DAILY_CREDIT_BUDGET } from "@/lib/constants";
import { formatLedgerMetaLine } from "@/lib/credit-ledger-meta";

type UiLocale = "tr" | "en";

type PaymentProvider = "paddle" | "stripe";

type UsageState = {
  premium: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  creditBalance: number;
} | null;

type HistoryItem = {
  id: string;
  at: string;
  intent: string;
  target: string;
  prompt: string;
  isFavorite?: boolean;
  shareToFeed?: boolean;
  topic: string;
  tone: string;
  audience: string;
};

type CreditLedgerRow = {
  id: string;
  kind: string;
  delta: number;
  summary: string | null;
  meta: string | null;
  createdAt: string;
};

function maskId(id: string | null | undefined): string | null {
  if (!id) return null;
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildMarkdownExport(items: HistoryItem[], locale: UiLocale): string {
  const isEn = locale === "en";
  const lines: string[] = [
    isEn ? "# PromptLab export" : "# PromptLab dışa aktarma",
    "",
    isEn ? `Exported: ${new Date().toISOString()}` : `Tarih: ${new Date().toISOString()}`,
    "",
  ];
  items.forEach((entry, i) => {
    lines.push(`## ${i + 1}. ${(entry.intent || (isEn ? "(empty)" : "(boş)")).slice(0, 80)}`, "");
    lines.push(`- **${isEn ? "date" : "tarih"}:** ${entry.at}`);
    lines.push(`- **${isEn ? "target" : "hedef"}:** ${entry.target}`);
    lines.push(`- **${isEn ? "favorite" : "favori"}:** ${entry.isFavorite ? (isEn ? "yes" : "evet") : isEn ? "no" : "hayır"}`);
    lines.push(`- **${isEn ? "Discover" : "Keşfet"}:** ${entry.shareToFeed ? (isEn ? "yes" : "evet") : isEn ? "no" : "hayır"}`);
    lines.push("", "```", entry.prompt, "```", "");
  });
  return lines.join("\n");
}

export function ProfileClient({
  locale,
  email,
  isPremium,
  premiumUntilIso,
  paymentProvider,
  hasStripeCustomer,
  hasPaddleCustomer,
  stripeCustomerId,
  paddleCustomerId,
  stripeSubscriptionId,
  paddleSubscriptionId,
}: {
  locale: UiLocale;
  email: string | null;
  isPremium: boolean;
  premiumUntilIso: string | null;
  paymentProvider: PaymentProvider | null;
  hasStripeCustomer: boolean;
  hasPaddleCustomer: boolean;
  stripeCustomerId: string | null;
  paddleCustomerId: string | null;
  stripeSubscriptionId: string | null;
  paddleSubscriptionId: string | null;
}) {
  const isEn = locale === "en";
  const tx = (tr: string, en: string) => (isEn ? en : tr);
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const homePath = locale === "en" ? "/en" : "/tr";
  const [usage, setUsage] = useState<UsageState>(null);
  const [usageSeries, setUsageSeries] = useState<Array<{ day: string; count: number }> | null>(null);
  const [creditLedger, setCreditLedger] = useState<CreditLedgerRow[] | null>(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalErr, setPortalErr] = useState<string | null>(null);

  const premiumUntil = premiumUntilIso ? new Date(premiumUntilIso) : null;
  const daysLeft =
    isPremium && premiumUntil && premiumUntil.getTime() > Date.now()
      ? Math.max(0, Math.ceil((premiumUntil.getTime() - Date.now()) / 86400000))
      : null;

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/usage", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as UsageState & { anonymous?: boolean };
        if (!cancelled) {
          setUsage({
            premium: Boolean(j.premium),
            used: typeof j.used === "number" ? j.used : 0,
            limit: typeof j.limit === "number" ? j.limit : j.limit === null ? null : FREE_DAILY_CREDIT_BUDGET,
            remaining: typeof j.remaining === "number" ? j.remaining : j.remaining === null ? null : 0,
            creditBalance: typeof j.creditBalance === "number" ? j.creditBalance : 0,
          });
        }
      } catch {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/credits/ledger", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { items?: CreditLedgerRow[] };
        if (!cancelled) setCreditLedger(Array.isArray(j.items) ? j.items : []);
      } catch {
        if (!cancelled) setCreditLedger([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/usage/history", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { days?: Array<{ day: string; count: number }> };
        if (!cancelled) setUsageSeries(Array.isArray(j.days) ? j.days : []);
      } catch {
        if (!cancelled) setUsageSeries([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  async function handleExportJson() {
    setExportBusy(true);
    try {
      const r = await fetch("/api/history?limit=500", { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { items?: HistoryItem[] };
      const items = Array.isArray(j.items) ? j.items : [];
      const payload = { exportedAt: new Date().toISOString(), itemCount: items.length, items };
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(JSON.stringify(payload, null, 2), `promptlab-export-${stamp}.json`, "application/json");
    } finally {
      setExportBusy(false);
    }
  }

  async function handleExportMarkdown() {
    setExportBusy(true);
    try {
      const r = await fetch("/api/history?limit=500", { cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { items?: HistoryItem[] };
      const items = Array.isArray(j.items) ? j.items : [];
      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(buildMarkdownExport(items, locale), `promptlab-export-${stamp}.md`, "text/markdown;charset=utf-8");
    } finally {
      setExportBusy(false);
    }
  }

  async function goPaddlePortal() {
    setPortalErr(null);
    setPortalLoading(true);
    try {
      const r = await fetch("/api/paddle/portal", { method: "POST" });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) {
        setPortalErr(j.error ?? tx("Portal açılamadı.", "Could not open portal."));
        return;
      }
      if (j.url) window.location.href = j.url;
      else setPortalErr(tx("Bağlantı alınamadı.", "No link returned."));
    } catch {
      setPortalErr(tx("Ağ hatası.", "Network error."));
    } finally {
      setPortalLoading(false);
    }
  }

  async function goStripePortal() {
    setPortalErr(null);
    setPortalLoading(true);
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) {
        setPortalErr(j.error ?? tx("Portal açılamadı.", "Could not open portal."));
        return;
      }
      if (j.url) window.location.href = j.url;
      else setPortalErr(tx("Bağlantı alınamadı.", "No link returned."));
    } catch {
      setPortalErr(tx("Ağ hatası.", "Network error."));
    } finally {
      setPortalLoading(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-[var(--muted)]">
        {tx("Yükleniyor…", "Loading…")}
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const showPaddlePortal = isPremium && paymentProvider === "paddle" && hasPaddleCustomer;
  const showStripePortal = isPremium && paymentProvider === "stripe" && hasStripeCustomer;

  const providerLabel =
    paymentProvider === "paddle"
      ? "Paddle"
      : paymentProvider === "stripe"
        ? "Stripe"
        : tx("Yapılandırılmamış", "Not configured");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <LogoMark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
            <h1 className="text-2xl font-semibold text-[var(--text)]">{tx("Profilim", "My profile")}</h1>
          </div>
          <p className="text-sm text-[var(--muted)]">{email ?? user.primaryEmailAddress?.emailAddress ?? "—"}</p>
        </div>
        <Link href={homePath} className="text-sm text-[var(--accent)] hover:underline sm:self-start">
          ← {tx("Lab’a dön", "Back to Lab")}
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="flex flex-col gap-8">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text)]">{tx("Üretim geçmişini dışa aktar", "Export generation history")}</h2>
            <p className="mt-2 text-xs text-[var(--muted)]">
              {tx(
                "Sunucuda saklanan son kayıtlar (en fazla 500) JSON veya Markdown olarak indirilir.",
                "Up to 500 server-stored records as JSON or Markdown.",
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={exportBusy}
                onClick={() => void handleExportJson()}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover-surface)] disabled:opacity-40"
              >
                {exportBusy ? "…" : "JSON"}
              </button>
              <button
                type="button"
                disabled={exportBusy}
                onClick={() => void handleExportMarkdown()}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover-surface)] disabled:opacity-40"
              >
                {exportBusy ? "…" : "Markdown"}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text)]">{tx("Kullanım", "Usage")}</h2>
            <div className="mt-2">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {tx("Bugün", "Today")}
              </p>
              {usage == null ? (
                <p className="mt-2 text-sm text-[var(--muted)]">…</p>
              ) : usage.premium ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {tx(
                    "Premium: günlük kredi limiti uygulanmaz (üretim ağırlığı Normal/Advanced ile değişir; bilgi amaçlı gösterilir).",
                    "Premium: no daily credit cap (per-run weight varies by Normal/Advanced; shown for transparency).",
                  )}
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    <span className="font-medium text-[var(--text)]">
                      {usage.used} / {usage.limit ?? FREE_DAILY_CREDIT_BUDGET}
                    </span>{" "}
                    {tx("kredi (bugün, İstanbul günü)", "credits today (Istanbul day)")}.{" "}
                    {tx("Kalan:", "Remaining:")}{" "}
                    <span className="font-medium text-[var(--text)]">{usage.remaining ?? 0}</span>
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {tx("Satın alınan bonus kredi:", "Purchased bonus credits:")}{" "}
                    <span className="font-medium text-[var(--text)]">{usage.creditBalance}</span>
                  </p>
                  <p className="mt-2">
                    <Link
                      href={isEn ? "/en/credits" : "/tr/kredi"}
                      className="text-sm font-medium text-[var(--accent)] underline hover:no-underline"
                    >
                      {tx("Kredi satın al", "Buy credits")}
                    </Link>
                  </p>
                </>
              )}
            </div>
            <div className="mt-4 border-t border-[var(--border)] pt-4">
              {usageSeries == null ? (
                <p className="text-sm text-[var(--muted)]">…</p>
              ) : usageSeries.length === 0 ? null : (
                <ProfileUsageChart days={usageSeries} locale={locale} />
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text)]">{tx("Kredi hareketleri", "Credit activity")}</h2>
            <p className="mt-2 text-xs text-[var(--muted)]">
              {tx(
                "Satın alma ve üretimde kullanılan kredilerin kaydı (son kayıtlar).",
                "Log of purchases and credits spent on generations (recent entries).",
              )}
            </p>
            {creditLedger === null ? (
              <p className="mt-3 text-sm text-[var(--muted)]">…</p>
            ) : creditLedger.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                {tx("Henüz kayıt yok.", "No entries yet.")}
              </p>
            ) : (
              <ul className="mt-3 max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-1">
                {creditLedger.map((row) => {
                  const at = new Date(row.createdAt);
                  const kindLabel =
                    row.kind === "generation"
                      ? tx("Üretim", "Generation")
                      : row.kind === "purchase" || row.kind.startsWith("purchase")
                        ? tx("Satın alma", "Purchase")
                        : row.kind;
                  const deltaStr = row.delta > 0 ? `+${row.delta}` : String(row.delta);
                  const metaLine = formatLedgerMetaLine(row.meta, locale);
                  return (
                    <li
                      key={row.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-xs text-[var(--muted)]">
                          {at.toLocaleString(isEn ? "en-US" : "tr-TR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                        <span
                          className={`tabular-nums font-semibold ${
                            row.delta >= 0 ? "text-[var(--success-fg)]" : "text-[var(--err-fg)]"
                          }`}
                        >
                          {deltaStr}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[var(--text)]">{kindLabel}</p>
                      {row.summary ? (
                        <p className="mt-0.5 text-xs text-[var(--muted)]">{row.summary}</p>
                      ) : null}
                      {metaLine ? (
                        <p className="mt-1 text-xs leading-snug text-[var(--text)]">{metaLine}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text)]">{tx("Abonelik ve ödeme", "Subscription & billing")}</h2>
            <dl className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{tx("Ödeme altyapısı", "Payment provider")}</dt>
                <dd className="text-[var(--text)]">{providerLabel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{tx("Stripe müşteri", "Stripe customer")}</dt>
                <dd className="font-mono text-xs text-[var(--text)]">
                  {maskId(stripeCustomerId) ?? (hasStripeCustomer ? "…" : "—")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{tx("Stripe abonelik", "Stripe subscription")}</dt>
                <dd className="font-mono text-xs text-[var(--text)]">{maskId(stripeSubscriptionId) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{tx("Paddle müşteri", "Paddle customer")}</dt>
                <dd className="font-mono text-xs text-[var(--text)]">
                  {maskId(paddleCustomerId) ?? (hasPaddleCustomer ? "…" : "—")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{tx("Paddle abonelik", "Paddle subscription")}</dt>
                <dd className="font-mono text-xs text-[var(--text)]">{maskId(paddleSubscriptionId) ?? "—"}</dd>
              </div>
            </dl>

            {isPremium && daysLeft != null ? (
              <p className="mt-3 text-sm text-[var(--muted)]">
                {tx("Kalan süre:", "Time remaining:")}{" "}
                <span className="font-medium text-[var(--text)]">
                  {daysLeft} {tx("gün", "days")}
                </span>
                {premiumUntil ? (
                  <span className="ml-1 text-[var(--muted)]">
                    ({premiumUntil.toLocaleDateString(isEn ? "en-US" : "tr-TR")})
                  </span>
                ) : null}
              </p>
            ) : isPremium ? (
              <p className="mt-3 text-sm text-[var(--muted)]">{tx("Premium aktif.", "Premium is active.")}</p>
            ) : (
              <p className="mt-3 text-sm text-[var(--muted)]">
                {tx("Premium üyeliğin yok.", "You are not on Premium.")}{" "}
                <Link href="/pricing" className="text-[var(--accent)] hover:underline">
                  {tx("Paketleri gör", "View plans")}
                </Link>
              </p>
            )}

            {portalErr ? (
              <p className="mt-2 rounded-lg border border-[var(--err-border)] bg-[var(--err-bg)] px-3 py-2 text-sm text-[var(--err-fg)]">
                {portalErr}
              </p>
            ) : null}

            {showPaddlePortal ? (
              <button
                type="button"
                onClick={() => void goPaddlePortal()}
                disabled={portalLoading}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover-surface)] disabled:opacity-40 sm:w-auto"
              >
                {portalLoading
                  ? tx("Açılıyor…", "Opening…")
                  : tx("Aboneliği yönet (Paddle)", "Manage subscription (Paddle)")}
              </button>
            ) : null}
            {showStripePortal ? (
              <button
                type="button"
                onClick={() => void goStripePortal()}
                disabled={portalLoading}
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover-surface)] disabled:opacity-40 sm:w-auto"
              >
                {portalLoading
                  ? tx("Açılıyor…", "Opening…")
                  : tx("Aboneliği yönet (fatura / iptal)", "Manage subscription (billing / cancel)")}
              </button>
            ) : null}
            {isPremium && paymentProvider && !showPaddlePortal && !showStripePortal ? (
              <p className="mt-2 text-xs text-[var(--muted)]">
                {tx(
                  "Ödeme müşteri kaydı bulunamadı; fatura veya iptal için destekle iletişime geçebilirsin.",
                  "No billing customer on file—contact support for invoices or cancellation.",
                )}
              </p>
            ) : null}
          </section>

          <RecentGenerationsPanel locale={locale} labPath={homePath} defaultOpen />
        </div>

        <aside className="lg:sticky lg:top-6">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text)]">{tx("Ayarlar", "Settings")}</h2>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{tx("Tema", "Theme")}</p>
                <div className="mt-2 max-w-xs">
                  <ThemePreferenceSelect locale={locale} />
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{tx("Linkler", "Links")}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
                  <Link href="/discover" className="text-[var(--accent)] hover:underline">
                    {tx("Keşfet", "Discover")}
                  </Link>
                  <Link
                    href={locale === "en" ? "/en/how-it-works" : "/tr/nasil-calisir"}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {tx("Nasıl çalışır", "How it works")}
                  </Link>
                  <Link href="/pricing" className="hover:text-[var(--text)] hover:underline">
                    {tx("Fiyatlandırma", "Pricing")}
                  </Link>
                  <Link href={locale === "en" ? "/tr/profil" : "/en/profile"} className="hover:text-[var(--text)] hover:underline">
                    {locale === "en" ? "TR" : "EN"}
                  </Link>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{tx("Çıkış", "Sign out")}</p>
                <button
                  type="button"
                  onClick={() => signOut({ redirectUrl: homePath })}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[var(--err-border)] bg-[var(--err-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--err-fg)] hover:opacity-95"
                >
                  {tx("Çıkış yap", "Sign out")}
                </button>
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-xs text-[var(--muted)]">
                  {tx("Lab’da kısayollar için", "For shortcuts on the Lab press")}{" "}
                  <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]">?</kbd>
                  .
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
