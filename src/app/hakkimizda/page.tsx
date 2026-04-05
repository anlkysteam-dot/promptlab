import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkımızda — PromptLab",
  description: "PromptLab hakkında",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-[var(--text)]">Hakkımızda</h1>
      <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">
        Bu sayfa ileride doldurulacak. PromptLab, düz dille yazdığın istekleri seçtiğin yapay zeka aracına uygun, net promptlara
        dönüştürmek için geliştiriliyor.
      </p>
    </div>
  );
}
