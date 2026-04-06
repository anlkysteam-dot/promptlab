"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { FREE_DAILY_CREDIT_BUDGET } from "@/lib/constants";
import type { CreditPackResolved } from "@/lib/credit-packs";

type PaymentProvider = "paddle" | "stripe";

type Props = {
  locale: "tr" | "en";
  paymentProvider: PaymentProvider | null;
  packs: CreditPackResolved[];
  success?: boolean;
  canceled?: boolean;
  /** pricing sayfasında gömülü kullanım: alt bağlantıları kısalt */
  variant?: "page" | "embed";
};

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: "sandbox" | "production") => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: { open: (opts: Record<string, unknown>) => void };
    };
  }
}

function loadPaddleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Paddle) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Paddle script yüklenemedi."));
    document.head.appendChild(s);
  });
}

export function CreditPurchaseClient({
  locale,
  paymentProvider,
  packs,
  success,
  canceled,
  variant = "page",
}: Props) {
  const isEn = locale === "en";
  const tx = (tr: string, en: string) => (isEn ? en : tr);
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const embed = variant === "embed";

  const homeHref = isEn ? "/en" : "/tr";
  const creditPath = isEn ? "/en/credits" : "/tr/kredi";

  const openPaddleCheckoutClient = useCallback(
    async (transactionId: string) => {
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
      if (!token) {
        setErr("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN eksik.");
        return;
      }
      const envRaw = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT?.trim().toLowerCase();
      const paddleEnv: "sandbox" | "production" = envRaw === "production" ? "production" : "sandbox";

      await loadPaddleScript();
      const P = window.Paddle;
      if (!P) {
        setErr("Paddle yüklenemedi.");
        return;
      }

      const origin = window.location.origin;
      P.Environment.set(paddleEnv);
      P.Initialize({ token });
      P.Checkout.open({
        transactionId,
        settings: {
          displayMode: "overlay",
          theme: "dark",
          successUrl: `${origin}${creditPath}?success=1`,
        },
      });
    },
    [creditPath],
  );

  async function buyStripe(packId: string) {
    setErr(null);
    setLoading(packId);
    try {
      const r = await fetch("/api/stripe/checkout-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, locale }),
      });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) {
        setErr(j.error ?? tx("Ödeme başlatılamadı.", "Could not start checkout."));
        return;
      }
      if (j.url) window.location.href = j.url;
      else setErr(tx("Bağlantı alınamadı.", "No checkout URL."));
    } catch {
      setErr(tx("Ağ hatası.", "Network error."));
    } finally {
      setLoading(null);
    }
  }

  async function buyPaddle(packId: string) {
    setErr(null);
    setLoading(packId);
    try {
      const r = await fetch("/api/paddle/checkout-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const j = (await r.json()) as { transactionId?: string; error?: string };
      if (!r.ok) {
        setErr(j.error ?? tx("Ödeme başlatılamadı.", "Could not start checkout."));
        return;
      }
      if (j.transactionId) await openPaddleCheckoutClient(j.transactionId);
      else setErr(tx("Geçersiz yanıt.", "Invalid response."));
    } catch {
      setErr(tx("Ağ hatası.", "Network error."));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {success ? (
        <p className="rounded-lg border border-[var(--success-border)] bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--success-fg)]">
          {tx(
            "Ödeme tamamlandıysa krediler hesabına eklendi (birkaç saniye sürebilir).",
            "If payment succeeded, credits were added to your account (may take a few seconds).",
          )}
        </p>
      ) : null}
      {canceled ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
          {tx("Ödeme iptal edildi.", "Checkout was canceled.")}
        </p>
      ) : null}

      {err ? (
        <p className="rounded-lg border border-[var(--err-border)] bg-[var(--err-bg)] px-3 py-2 text-sm text-[var(--err-fg)]">
          {err}
        </p>
      ) : null}

      {!paymentProvider || packs.length === 0 ? (
        <p className="rounded-lg border border-[var(--warn-border)] bg-[var(--warn-bg)] px-4 py-3 text-sm text-[var(--warn-fg)]">
          {tx(
            "Kredi paketi ödemesi henüz yapılandırılmamış. Sunucuda STRIPE_PRICE_ID_CREDITS_* / PADDLE_PRICE_ID_CREDITS_* değişkenlerini tanımlayın.",
            "Credit packs are not configured yet. Set STRIPE_PRICE_ID_CREDITS_* or PADDLE_PRICE_ID_CREDITS_* in the server environment.",
          )}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {packs.map((pack) => (
            <li
              key={pack.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
            >
              <div className="px-5 pb-4 pt-5 text-center">
                <p className="text-lg font-semibold tracking-tight text-[var(--text)]">
                  {isEn ? pack.labelEn : pack.labelTr}
                </p>
                <div className="mt-3 flex flex-col items-center gap-1">
                  <span className="text-lg font-medium text-[var(--muted)] line-through decoration-[var(--muted)] decoration-2">
                    ${pack.listPriceUsd}
                  </span>
                  <span className="text-3xl font-bold tabular-nums text-[var(--accent)]">${pack.salePriceUsd}</span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">USD</span>
                </div>
                <span className="mt-2 inline-block rounded-full border border-[var(--success-border)] bg-[var(--success-bg)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--success-fg)]">
                  {tx("İndirimli", "On sale")}
                </span>

                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => void (paymentProvider === "stripe" ? buyStripe(pack.id) : buyPaddle(pack.id))}
                  className="mt-5 w-full rounded-xl bg-[var(--accent)] px-4 py-3.5 text-[15px] font-semibold text-[var(--on-accent)] shadow-sm hover:opacity-95 disabled:opacity-40"
                >
                  {loading === pack.id ? (
                    tx("Yönlendiriliyor…", "Redirecting…")
                  ) : (
                    <>
                      {tx("Satın al", "Purchase")} — ${pack.salePriceUsd} USD
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-[var(--border)] bg-[var(--bg)]/40 px-4 py-3">
                <p className="text-center text-[11px] leading-relaxed text-[var(--muted)]">
                  {tx(
                    `Günlük ${FREE_DAILY_CREDIT_BUDGET} ücretsiz kredinin ötesi (Normal 2 / Advanced 4 kredi).`,
                    `Beyond the free daily ${FREE_DAILY_CREDIT_BUDGET} credits (Normal 2 / Advanced 4 per run).`,
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!embed ? (
        <p className="text-xs text-[var(--muted)]">
          <Link href={homeHref} className="text-[var(--accent)] hover:underline">
            ← {tx("Ana sayfa", "Home")}
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href="/pricing" className="text-[var(--accent)] hover:underline">
            {tx("Premium abonelik", "Premium subscription")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
