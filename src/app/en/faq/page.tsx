import type { Metadata } from "next";
import Link from "next/link";
import { FREE_DAILY_CREDIT_BUDGET } from "@/lib/constants";

export const metadata: Metadata = {
  title: "FAQ — PromptLab",
  description: "PromptLab usage, credits, and automatic-parameter policy",
};

export default function EnFaqPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <Link href="/en" className="text-sm text-[var(--accent)] hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-[var(--text)]">Frequently asked questions</h1>

      <section className="mt-8 space-y-4 text-sm leading-relaxed text-[var(--muted)]">
        <h2 className="text-base font-semibold text-[var(--text)]">Are parameters added automatically?</h2>
        <p>
          No. PromptLab does not auto-append or auto-paste vendor flags such as <strong className="text-[var(--text)]">--v</strong> or{" "}
          <strong className="text-[var(--text)]">--ar</strong> into Midjourney or other tools. Optional Lab settings only{" "}
          <em>guide</em> the model; you copy the final text and use it in your host app.
        </p>

        <h2 className="mt-8 text-base font-semibold text-[var(--text)]">How do credits work?</h2>
        <p>
          On the free plan you have a daily (Istanbul day) budget of{" "}
          <strong className="text-[var(--text)]">{FREE_DAILY_CREDIT_BUDGET}</strong> credits. Each successful generation spends{" "}
          <strong className="text-[var(--text)]">(premium ? 1 : 2) × (advanced ? 2 : 1)</strong> credits. For example: free users
          pay 2 (Normal) or 4 (Advanced); premium users pay 1 (Normal) or 2 (Advanced). Premium has no daily credit cap; the cost
          is still shown for transparency.
        </p>

        <h2 className="mt-8 text-base font-semibold text-[var(--text)]">What is “Suggested parameters”?</h2>
        <p>
          In expert mode, if you enable it, we add <em>informational</em> starter hints aligned with your target and Lab flavor.
          They are not auto-applied; you stay in control of the final paste.
        </p>

        <p className="mt-8 text-sm">
          For a full step-by-step walkthrough of the Lab, modes, credits, and Discover, see{" "}
          <Link href="/en/how-it-works" className="font-medium text-[var(--accent)] hover:underline">
            How it works
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
