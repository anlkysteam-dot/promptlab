import type { Metadata } from "next";
import Link from "next/link";
import { CreditPurchaseClient } from "@/components/credit-purchase-client";
import { getCreditCheckoutProvider, resolveCreditPacks } from "@/lib/credit-packs";

export const metadata: Metadata = {
  title: "Kredi satın al — PromptLab",
  description: "Ek prompt kredisi satın alın",
};

export default async function TrCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const sp = await searchParams;
  const packs = resolveCreditPacks();
  const paymentProvider = getCreditCheckoutProvider();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link href="/tr" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>
      <header className="mt-6">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--accent)]">PromptLab</p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--text)]">Kredi satın al</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Günlük ücretsiz bütçeni aştığında veya ek üretim yapmak istediğinde bonus kredi kullanırsın. Premium abonelikten
          farklıdır: krediler hesabında kalır ve günlük kotayı tamamladıktan sonra harcanır.
        </p>
      </header>

      <section className="mt-8">
        <CreditPurchaseClient
          locale="tr"
          paymentProvider={paymentProvider}
          packs={packs}
          success={sp.success === "1"}
          canceled={sp.canceled === "1"}
        />
      </section>
    </div>
  );
}
