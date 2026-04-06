import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Geri bildirimler — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminFeedbackPage() {
  const items = await prisma.feedbackSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Geri bildirimler</h1>
        <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
          ← Ana sayfa
        </Link>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {items.length} kayıt (son 200).
      </p>

      {items.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">Henüz geri bildirim yok.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[var(--muted)]">
                <span className="font-mono text-[var(--text)]">{row.email}</span>
                <time dateTime={row.createdAt.toISOString()}>
                  {row.createdAt.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[var(--text)]">{row.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
