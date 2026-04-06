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
    <div className="mx-auto max-w-xl px-4 py-16">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>

      <PricingBanners />

      <h1 className="mt-6 text-3xl font-semibold text-[var(--text)]">Premium</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
        Premium ile günde 10 dönüşüm limiti kalkar; istediğin kadar İngilizce prompt üretebilirsin. Ödeme{" "}
        <strong className="font-medium text-[var(--text)]">Paddle</strong> (uluslararası, vergi / MoR) veya yapılandırdıysan{" "}
        <strong className="font-medium text-[var(--text)]">Stripe</strong> üzerinden abonelik olarak alınır.
      </p>

      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
        <li>
          Paddle / Stripe webhook’ları hesabını otomatik <code className="rounded bg-[var(--surface)] px-1 text-[var(--text)]">premium</code>{" "}
          yapar veya abonelik bitince kaldırır.
        </li>
        <li>
          Geliştirme için <code className="rounded bg-[var(--surface)] px-1 text-[var(--text)]">PREMIUM_EMAILS</code> kullanılabilir.
        </li>
      </ul>

      <PricingActions
        isLoggedIn={Boolean(appUser?.id)}
        paymentProvider={paymentProvider}
        isPremium={Boolean(user?.isPremium)}
        hasStripeCustomer={Boolean(user?.stripeCustomerId)}
        hasPaddleCustomer={Boolean(user?.paddleCustomerId)}
      />
    </div>
  );
}
