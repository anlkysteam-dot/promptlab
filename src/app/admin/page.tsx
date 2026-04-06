import type { Metadata } from "next";
import { AdminManualCreditsForm } from "@/components/admin-manual-credits-form";
import { premiumEmailList } from "@/lib/premium";
import { prisma } from "@/lib/prisma";
import { AI_TARGETS } from "@/lib/targets";

export const metadata: Metadata = {
  title: "Admin paneli — PromptLab",
  robots: { index: false, follow: false },
};

const VIDEO_TARGETS = ["runway", "veo", "sora", "kling", "pika"] as const;
const IMAGE_TARGETS = ["midjourney", "dalle", "stable_diffusion"] as const;

function targetLabel(id: string): string {
  return AI_TARGETS.find((t) => t.id === id)?.label ?? id;
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default async function AdminDashboardPage() {
  const since30 = new Date(Date.now() - 30 * 86400000);

  const [
    totalUsers,
    totalHistories,
    byTarget,
    byProvider,
    videoCount30,
    imageCount30,
    instagramHint30,
    youtubeHint30,
    universal30,
    recentRows,
    premiumRows,
    feedbackItems,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.promptHistory.count(),
    prisma.promptHistory.groupBy({
      by: ["target"],
      _count: { _all: true },
    }),
    prisma.promptHistory.groupBy({
      by: ["provider"],
      _count: { _all: true },
    }),
    prisma.promptHistory.count({
      where: {
        createdAt: { gte: since30 },
        target: { in: [...VIDEO_TARGETS] },
      },
    }),
    prisma.promptHistory.count({
      where: {
        createdAt: { gte: since30 },
        target: { in: [...IMAGE_TARGETS] },
      },
    }),
    prisma.promptHistory.count({
      where: {
        createdAt: { gte: since30 },
        intent: { contains: "instagram", mode: "insensitive" },
      },
    }),
    prisma.promptHistory.count({
      where: {
        createdAt: { gte: since30 },
        OR: [
          { intent: { contains: "youtube", mode: "insensitive" } },
          { intent: { contains: "YouTube", mode: "insensitive" } },
        ],
      },
    }),
    prisma.promptHistory.count({
      where: { createdAt: { gte: since30 }, target: "universal" },
    }),
    prisma.promptHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        intent: true,
        target: true,
        createdAt: true,
      },
    }),
    (() => {
      const envPrem = premiumEmailList();
      return prisma.user.findMany({
        where: {
          OR: [
            { isPremium: true },
            { premiumUntil: { gt: new Date() } },
            ...(envPrem.length ? [{ email: { in: envPrem } }] : []),
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          creditBalance: true,
          isPremium: true,
          premiumUntil: true,
        },
        orderBy: { email: "asc" },
        take: 300,
      });
    })(),
    prisma.feedbackSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const targetSorted = [...byTarget].sort((a, b) => b._count._all - a._count._all);
  const providerSorted = [...byProvider].sort((a, b) => b._count._all - a._count._all);

  const denomPopular = videoCount30 + imageCount30 + instagramHint30 + universal30 || 1;

  return (
    <div>
      <h1 id="ust" className="scroll-mt-24 text-2xl font-semibold text-[var(--text)]">
        Yönetim paneli
      </h1>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Tüm özetler, premium listesi, manuel kredi ve geri bildirimler bu tek sayfada. Üstteki bağlantılarla bölümlere
        atlayabilirsiniz. Kayıtlar üretim geçmişine dayanır; kalite / Lab parametreleri şu an ayrıca saklanmıyor. Son
        üretimlerde yalnızca kısaltılmış intent + hedef gösterilir; tam prompt çıktısı listelenmez.
      </p>

      <section id="ozet" className="mt-8 scroll-mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Kayıtlı kullanıcı</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">{totalUsers}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Toplam üretim kaydı</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">{totalHistories}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Premium / test listesi</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">{premiumRows.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Son 30 gün (video hedefleri)</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">{videoCount30}</p>
        </div>
      </section>

      <section id="populer" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-[var(--text)]">Popüler yönler (son 30 gün)</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          “Instagram” = intent metninde instagram geçen üretimler (hızlı tahmin). Video = video model hedefleri.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
            <span className="text-[var(--muted)]">Video hedefleri</span>
            <p className="text-xl font-semibold text-[var(--text)]">{videoCount30}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
            <span className="text-[var(--muted)]">Görsel hedefleri</span>
            <p className="text-xl font-semibold text-[var(--text)]">{imageCount30}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
            <span className="text-[var(--muted)]">Intent’te “instagram”</span>
            <p className="text-xl font-semibold text-[var(--text)]">{instagramHint30}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
            <span className="text-[var(--muted)]">Intent’te YouTube</span>
            <p className="text-xl font-semibold text-[var(--text)]">{youtubeHint30}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Evrensel (universal) son 30 gün: <strong className="text-[var(--text)]">{universal30}</strong> — oran için
          payda yaklaşık:{" "}
          <strong className="text-[var(--text)]">
            {Math.round((videoCount30 / denomPopular) * 100)}% video
          </strong>
          ,{" "}
          <strong className="text-[var(--text)]">
            {Math.round((instagramHint30 / denomPopular) * 100)}% instagram anahtarı
          </strong>{" "}
          (birbirini dışlamaz; aynı üretim birden fazla kutuya girebilir).
        </p>
      </section>

      <section id="hedefler" className="mt-10 scroll-mt-24 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">Hedef dağılımı (tüm zamanlar)</h2>
          <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
            {targetSorted.map((row) => (
              <li
                key={row.target}
                className="flex justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
              >
                <span className="text-[var(--text)]">{targetLabel(row.target)}</span>
                <span className="tabular-nums font-medium text-[var(--muted)]">{row._count._all}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)]">LLM sağlayıcı (tüm zamanlar)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {providerSorted.map((row) => (
              <li
                key={row.provider}
                className="flex justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2"
              >
                <span className="font-mono text-[var(--text)]">{row.provider}</span>
                <span className="tabular-nums font-medium text-[var(--muted)]">{row._count._all}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="premium" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-[var(--text)]">Premium / bonus kredi (özet)</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2">E-posta</th>
                <th className="px-3 py-2">İsim</th>
                <th className="px-3 py-2">Premium</th>
                <th className="px-3 py-2">Bitiş</th>
                <th className="px-3 py-2">Bonus kredi</th>
              </tr>
            </thead>
            <tbody>
              {premiumRows.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)]/60">
                  <td className="px-3 py-2 font-mono text-xs text-[var(--text)]">{u.email ?? "—"}</td>
                  <td className="px-3 py-2 text-[var(--muted)]">{u.name ?? "—"}</td>
                  <td className="px-3 py-2">{u.isPremium ? "evet" : "—"}</td>
                  <td className="px-3 py-2 text-[var(--muted)]">
                    {u.premiumUntil ? u.premiumUntil.toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{u.creditBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {premiumRows.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Kayıt yok.</p> : null}
      </section>

      <section id="kredi" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-[var(--text)]">Manuel kredi müdahalesi</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Ödeme alındı ama webhook / teknik sorun olduysa, kayıtlı e-postaya göre bonus kredi eklenir; hareket defterine
          yazılır.
        </p>
        <AdminManualCreditsForm />
      </section>

      <section id="son-uretim" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-[var(--text)]">Son üretimler (anonim önizleme)</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Sadece kullanıcı girdisinin kısaltılmış hali + hedef. Üretilen tam prompt metni gösterilmez.
        </p>
        <ul className="mt-4 space-y-3">
          {recentRows.map((r) => (
            <li key={r.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[var(--muted)]">
                <span className="font-medium text-[var(--accent)]">{targetLabel(r.target)}</span>
                <time dateTime={r.createdAt.toISOString()}>
                  {r.createdAt.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                </time>
              </div>
              <p className="mt-2 text-[var(--text)]">{truncate(r.intent, 160)}</p>
            </li>
          ))}
        </ul>
        {recentRows.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Henüz kayıt yok.</p> : null}
      </section>

      <section id="geri-bildirim" className="mt-10 scroll-mt-24 pb-8">
        <h2 className="text-lg font-semibold text-[var(--text)]">Geri bildirimler (Hakkımızda formu)</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">{feedbackItems.length} kayıt (son 200).</p>
        {feedbackItems.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted)]">Henüz geri bildirim yok.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {feedbackItems.map((row) => (
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
      </section>
    </div>
  );
}
