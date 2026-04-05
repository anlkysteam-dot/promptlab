"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  isLoggedIn: boolean;
  stripeReady: boolean;
  isPremium: boolean;
  hasStripeCustomer: boolean;
};

export function PricingActions({ isLoggedIn, stripeReady, isPremium, hasStripeCustomer }: Props) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function goCheckout() {
    setErr(null);
    setLoading("checkout");
    try {
      const r = await fetch("/api/stripe/checkout", { method: "POST" });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) {
        setErr(j.error ?? "Ödeme başlatılamadı.");
        return;
      }
      if (j.url) window.location.href = j.url;
      else setErr("Bağlantı alınamadı.");
    } catch {
      setErr("Ağ hatası.");
    } finally {
      setLoading(null);
    }
  }

  async function goPortal() {
    setErr(null);
    setLoading("portal");
    try {
      const r = await fetch("/api/stripe/portal", { method: "POST" });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) {
        setErr(j.error ?? "Portal açılamadı.");
        return;
      }
      if (j.url) window.location.href = j.url;
      else setErr("Bağlantı alınamadı.");
    } catch {
      setErr("Ağ hatası.");
    } finally {
      setLoading(null);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm text-[var(--muted)]">
        Premium satın almak için önce{" "}
        <Link href="/auth" className="text-[var(--accent)] hover:underline">
          hesap sayfasından giriş yap
        </Link>
        .
      </div>
    );
  }

  if (!stripeReady) {
    return (
      <p className="mt-8 rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Stripe henüz sunucuda yapılandırılmamış. `.env` içine <code className="text-[var(--text)]">STRIPE_SECRET_KEY</code> ve{" "}
        <code className="text-[var(--text)]">STRIPE_PRICE_ID_PREMIUM</code> eklenmeli.
      </p>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      {err ? <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">{err}</p> : null}

      {isPremium ? (
        <p className="text-sm text-[var(--muted)]">
          Hesabında aktif premium var. Günlük dönüşüm limiti uygulanmaz.
        </p>
      ) : null}

      {!isPremium ? (
        <button
          type="button"
          onClick={() => void goCheckout()}
          disabled={loading !== null}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:opacity-90 disabled:opacity-40"
        >
          {loading === "checkout" ? "Yönlendiriliyor…" : "Premium’a geç (Stripe)"}
        </button>
      ) : null}

      {isPremium && hasStripeCustomer ? (
        <button
          type="button"
          onClick={() => void goPortal()}
          disabled={loading !== null}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-white/5 disabled:opacity-40"
        >
          {loading === "portal" ? "Açılıyor…" : "Aboneliği yönet (fatura / iptal)"}
        </button>
      ) : null}
    </div>
  );
}
