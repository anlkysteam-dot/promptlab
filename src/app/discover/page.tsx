import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Keşfet — PromptLab",
  description: "Topluluğun paylaştığı örnek promptlar. SEO için vitrin sayfası.",
};

export default async function DiscoverPage() {
  const items = await prisma.promptHistory.findMany({
    where: { shareToFeed: true },
    orderBy: { createdAt: "desc" },
    take: 48,
    select: {
      id: true,
      intent: true,
      prompt: true,
      target: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Community</p>
        <h1 className="mt-1 text-2xl font-semibold text-[var(--text)]">Keşfet</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Kullanıcıların vitrine açmayı seçtiği prompt örnekleri. Kendi üretimini paylaşmak için giriş yapıp geçmişten
          &quot;Vitrinde göster&quot; kullanabilirsin.
        </p>
        <Link href="/tr" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">
          ← Ana sayfa
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Henüz vitrinde prompt yok. İlk paylaşımı sen yapabilirsin.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((row) => (
            <li key={row.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-xs text-[var(--muted)]">
                {row.target} · {new Date(row.createdAt).toLocaleString("tr-TR", { dateStyle: "short" })}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text)] line-clamp-2">{row.intent}</p>
              <pre
                className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--muted)]"
                style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
              >
                {row.prompt}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
