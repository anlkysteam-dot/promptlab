"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type PaymentProvider = "paddle" | "stripe";

type Props = {
  isLoggedIn: boolean;
  paymentProvider: PaymentProvider | null;
  isPremium: boolean;
  hasStripeCustomer: boolean;
  hasPaddleCustomer: boolean;
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

export function PricingActions({
  isLoggedIn,
  paymentProvider,
  isPremium,
  hasStripeCustomer,
  hasPaddleCustomer,
}: Props) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const openPaddleCheckoutClient = useCallback(async (transactionId: string) => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
    if (!token) {
      setErr("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN eksik; Paddle ödeme sayfası açılamıyor.");
      return;
    }
    const envRaw = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT?.trim().toLowerCase();
    const paddleEnv: "sandbox" | "production" =
      envRaw === "production" ? "production" : "sandbox";

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
        successUrl: `${origin}/pricing?paddle=1`,
      },
    });
  }, []);

  async function goPaddleCheckout() {
    setErr(null);
    setLoading("checkout");
    try {
      const r = await fetch("/api/paddle/checkout", { method: "POST" });
      const j = (await r.json()) as { url?: string; transactionId?: string; error?: string };
      if (!r.ok) {
        setErr(j.error ?? "Ödeme başlatılamadı.");
        return;
      }
      if (j.url) {
        window.location.href = j.url;
        return;
      }
      if (j.transactionId) {
        await openPaddleCheckoutClient(j.transactionId);
        return;
      }
      setErr("Paddle yanıtı geçersiz.");
    } catch {
      setErr("Ağ hatası.");
    } finally {
      setLoading(null);
    }
  }

  async function goPaddlePortal() {
    setErr(null);
    setLoading("portal");
    try {
      const r = await fetch("/api/paddle/portal", { method: "POST" });
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

  async function goStripeCheckout() {
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

  async function goStripePortal() {
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

  if (!paymentProvider) {
    return (
      <p className="mt-8 rounded-lg border border-[var(--warn-border)] bg-[var(--warn-bg)] px-4 py-3 text-sm text-[var(--warn-fg)]">
        Ödeme henüz yapılandırılmamış. Sunucuda{" "}
        <code className="text-[var(--text)]">PADDLE_API_KEY</code> +{" "}
        <code className="text-[var(--text)]">PADDLE_PRICE_ID_PREMIUM</code> (Paddle Billing) veya Stripe
        değişkenlerini ekle; ayrıntılar <code className="text-[var(--text)]">.env.example</code>.
      </p>
    );
  }

  const checkoutLabel =
    paymentProvider === "paddle" ? "Premium’a geç (Paddle)" : "Premium’a geç (Stripe)";
  const portalLabel =
    paymentProvider === "paddle" ? "Aboneliği yönet (Paddle)" : "Aboneliği yönet (fatura / iptal)";

  return (
    <div className="mt-8 flex flex-col gap-3">
      {err ? (
        <p className="rounded-lg border border-[var(--err-border)] bg-[var(--err-bg)] px-3 py-2 text-sm text-[var(--err-fg)]">{err}</p>
      ) : null}

      {isPremium ? (
        <p className="text-sm text-[var(--muted)]">
          Hesabında aktif premium var. Günlük dönüşüm limiti uygulanmaz.
        </p>
      ) : null}

      {!isPremium && paymentProvider === "paddle" ? (
        <button
          type="button"
          onClick={() => void goPaddleCheckout()}
          disabled={loading !== null}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--on-accent)] hover:opacity-90 disabled:opacity-40"
        >
          {loading === "checkout" ? "Yönlendiriliyor…" : checkoutLabel}
        </button>
      ) : null}

      {!isPremium && paymentProvider === "stripe" ? (
        <button
          type="button"
          onClick={() => void goStripeCheckout()}
          disabled={loading !== null}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--on-accent)] hover:opacity-90 disabled:opacity-40"
        >
          {loading === "checkout" ? "Yönlendiriliyor…" : checkoutLabel}
        </button>
      ) : null}

      {isPremium && paymentProvider === "paddle" && hasPaddleCustomer ? (
        <button
          type="button"
          onClick={() => void goPaddlePortal()}
          disabled={loading !== null}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover-surface)] disabled:opacity-40"
        >
          {loading === "portal" ? "Açılıyor…" : portalLabel}
        </button>
      ) : null}

      {isPremium && paymentProvider === "stripe" && hasStripeCustomer ? (
        <button
          type="button"
          onClick={() => void goStripePortal()}
          disabled={loading !== null}
          className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover-surface)] disabled:opacity-40"
        >
          {loading === "portal" ? "Açılıyor…" : portalLabel}
        </button>
      ) : null}
    </div>
  );
}
