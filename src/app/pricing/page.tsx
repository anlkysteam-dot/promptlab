import Link from "next/link";
import { getAppUser } from "@/lib/app-user";
import { PricingActions } from "@/components/pricing-actions";
import { PricingBanners } from "@/components/pricing-banners";
import { prisma } from "@/lib/prisma";
import { isPaddleConfigured } from "@/lib/paddle";

export default async function PricingPage() {
  const appUser = await getAppUser();
  const user =
    appUser?.id != null
      ? await prisma.user.findUnique({
          where: { id: appUser.id },
          select: {
            isPremium: true,
            stripeCustomerId: true,
            paddleCustomerId: true,
          },
        })
      : null;

  const paddleReady = isPaddleConfigured();
  const stripeReady = Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_ID_PREMIUM?.trim(),
  );

  const paymentProvider = paddleReady ? "paddle" : stripeReady ? "stripe" : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>

      <PricingBanners />

      <header className="mt-6">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--accent)]">PromptLab Premium</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text)] md:text-4xl">
          İçerik üretiminde sınırı kaldır
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
          Premium ile günlük limit kalkar, tek panelden sınırsız profesyonel prompt üretebilirsin. Abonelik ve ödeme
          yönetimi {paymentProvider === "paddle" ? "Paddle" : paymentProvider === "stripe" ? "Stripe" : "ödeme altyapısı"}
          {" "}üzerinden güvenli şekilde yürütülür.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/70 p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text)]">Premium Plan</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Sınırsız üretim ve kesintisiz kullanım</p>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            En popüler
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-sm font-medium text-[var(--text)]">Sınırsız günlük kullanım</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              Ücretsiz paketteki günlük dönüşüm sınırı kaldırılır.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-sm font-medium text-[var(--text)]">Tek tıkla yönetim</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              Abonelik durumunu ve ödeme bilgilerini panelden kolayca yönetirsin.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-sm font-medium text-[var(--text)]">Anında aktive olur</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              Ödeme tamamlanınca premium hesabına otomatik yansır.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-black/10 p-4">
            <p className="text-sm font-medium text-[var(--text)]">Güvenli ödeme altyapısı</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
              Ödemeler Paddle / Stripe üzerinden, güvenli ve standartlara uygun yürütülür.
            </p>
          </div>
        </div>

        <PricingActions
          isLoggedIn={Boolean(appUser?.id)}
          paymentProvider={paymentProvider}
          isPremium={Boolean(user?.isPremium)}
          hasStripeCustomer={Boolean(user?.stripeCustomerId)}
          hasPaddleCustomer={Boolean(user?.paddleCustomerId)}
        />
      </section>

    </div>
  );
}
