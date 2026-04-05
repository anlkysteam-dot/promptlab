import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hizmet şartları — PromptLab",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
        ← Ana sayfa
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-[var(--text)]">Hizmet şartları</h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
        Bu metin ileride güncellenecektir. PromptLab&apos;ı kullanarak hizmetten yararlanmayı ve geçerli mevzuata uymayı kabul
        etmiş sayılırsın.
      </p>
    </div>
  );
}
