import type { Metadata } from "next";
import Link from "next/link";
import { CreditPurchaseClient } from "@/components/credit-purchase-client";
import { getCreditCheckoutProvider, resolveCreditPacks } from "@/lib/credit-packs";

export const metadata: Metadata = {
  title: "Buy credits — PromptLab",
  description: "Purchase extra prompt credits",
};

export default async function EnCreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const sp = await searchParams;
  const packs = resolveCreditPacks();
  const paymentProvider = getCreditCheckoutProvider();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <Link href="/en" className="text-sm text-[var(--accent)] hover:underline">
        ← Home
      </Link>
      <header className="mt-6">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--accent)]">PromptLab</p>
        <h1 className="mt-3 text-2xl font-semibold text-[var(--text)]">Buy credits</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Bonus credits apply after you use your free daily budget. They are separate from Premium: purchased credits stay
          on your account and are spent when your daily allowance does not cover a generation.
        </p>
      </header>

      <section className="mt-8">
        <CreditPurchaseClient
          locale="en"
          paymentProvider={paymentProvider}
          packs={packs}
          success={sp.success === "1"}
          canceled={sp.canceled === "1"}
        />
      </section>
    </div>
  );
}
