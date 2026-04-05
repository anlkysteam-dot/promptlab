import Link from "next/link";
import { getAppUser } from "@/lib/app-user";
import { PricingActions } from "@/components/pricing-actions";
import { PricingBanners } from "@/components/pricing-banners";
import { prisma } from "@/lib/prisma";

export default async function PricingPage() {
  const appUser = await getAppUser();
  const user =
    appUser?.id != null
      ? await prisma.user.findUnique({
          where: { id: appUser.id },
          select: { isPremium: true, stripeCustomerId: true },
        })
      : null;

  const stripeReady = Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_ID_PREMIUM?.trim(),
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>

      <PricingBanners />

      <h1 className="mt-6 text-3xl font-semibold text-[var(--text)]">Premium</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
        Premium ile günde 10 dönüşüm limiti kalkar; istediğin kadar İngilizce prompt üretebilirsin. Ödeme{" "}
        <strong className="font-medium text-[var(--text)]">Stripe</strong> üzerinden abonelik olarak alınır; iptal ve fatura
        için &quot;Aboneliği yönet&quot; bağlantısını kullan.
      </p>

      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
        <li>Webhook otomatik olarak hesabını <code className="rounded bg-[var(--surface)] px-1 text-[var(--text)]">premium</code>{" "}
          yapar veya abonelik bitince kaldırır.</li>
        <li>Geliştirme için hâlâ <code className="rounded bg-[var(--surface)] px-1 text-[var(--text)]">PREMIUM_EMAILS</code>{" "}
          kullanılabilir (Stripe müşteri kaydı olmadan).</li>
      </ul>

      <PricingActions
        isLoggedIn={Boolean(appUser?.id)}
        stripeReady={stripeReady}
        isPremium={Boolean(user?.isPremium)}
        hasStripeCustomer={Boolean(user?.stripeCustomerId)}
      />
    </div>
  );
}
