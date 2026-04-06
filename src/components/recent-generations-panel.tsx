"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AI_TARGETS } from "@/lib/targets";
import {
  clearRecentPrompts as clearRecentStorage,
  readRecentPrompts,
  storeRestoreEntry,
  type RecentPromptEntry,
} from "@/lib/workbench-recent";

type UiLocale = "tr" | "en";

export function RecentGenerationsPanel({
  locale = "tr",
  labPath,
  defaultOpen = true,
}: {
  locale?: UiLocale;
  /** Path to Prompt Lab (e.g. /tr or /en) — used when applying an entry */
  labPath: string;
  defaultOpen?: boolean;
}) {
  const isEn = locale === "en";
  const tx = (tr: string, en: string) => (isEn ? en : tr);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [recentOpen, setRecentOpen] = useState(defaultOpen);
  const [recentList, setRecentList] = useState<RecentPromptEntry[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const loadRecent = useCallback(async () => {
    if (isLoaded && user?.id) {
      try {
        const r = await fetch("/api/history", { method: "GET", cache: "no-store" });
        if (r.ok) {
          const j = (await r.json()) as { items?: RecentPromptEntry[] };
          setRecentList(Array.isArray(j.items) ? j.items : []);
          return;
        }
      } catch {
        // fall through to local
      }
    }
    setRecentList(readRecentPrompts());
  }, [isLoaded, user?.id]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  function applyRecent(entry: RecentPromptEntry) {
    storeRestoreEntry(entry);
    router.push(labPath);
  }

  async function handleClearRecent() {
    if (isLoaded && user?.id) {
      try {
        await fetch("/api/history", { method: "DELETE" });
      } catch {
        // no-op
      }
      setRecentList([]);
      return;
    }
    clearRecentStorage();
    setRecentList([]);
  }

  async function toggleFavorite(entryId: string) {
    if (!(isLoaded && user?.id)) return;
    try {
      const r = await fetch(`/api/history/${entryId}/favorite`, { method: "PATCH" });
      if (!r.ok) return;
      const j = (await r.json()) as { id?: string; isFavorite?: boolean };
      if (!j.id || typeof j.isFavorite !== "boolean") return;
      setRecentList((prev) =>
        prev.map((item) => (item.id === j.id ? { ...item, isFavorite: j.isFavorite } : item)),
      );
    } catch {
      // no-op
    }
  }

  async function toggleShareToFeed(entryId: string) {
    if (!(isLoaded && user?.id)) return;
    const entry = recentList.find((e) => e.id === entryId);
    if (!entry) return;
    const next = !entry.shareToFeed;
    try {
      const r = await fetch(`/api/history/${entryId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareToFeed: next }),
      });
      if (!r.ok) return;
      const j = (await r.json()) as { id?: string; shareToFeed?: boolean };
      if (!j.id || typeof j.shareToFeed !== "boolean") return;
      setRecentList((prev) =>
        prev.map((item) => (item.id === j.id ? { ...item, shareToFeed: j.shareToFeed } : item)),
      );
    } catch {
      // no-op
    }
  }

  const filteredRecent = useMemo(
    () => (showOnlyFavorites ? recentList.filter((x) => x.isFavorite) : recentList),
    [recentList, showOnlyFavorites],
  );

  return (
    <details
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
      open={recentOpen}
      onToggle={(e) => setRecentOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-[var(--text)] [&::-webkit-details-marker]:hidden">
        <span>
          {tx("Son üretimler", "Recent generations")}{" "}
          <span className="font-normal text-[var(--muted)]">
            {isLoaded && user?.id ? tx("(hesabınla senkron)", "(synced with your account)") : tx("(yalnızca bu cihaz)", "(this device only)")}
          </span>
        </span>
        {recentList.length > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleClearRecent();
            }}
            className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-normal text-[var(--muted)] hover:border-[var(--err-border)] hover:text-[var(--err-fg)]"
          >
            {tx("Listeyi temizle", "Clear list")}
          </button>
        ) : null}
      </summary>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-[var(--muted)]">
          {isLoaded && user?.id
            ? tx("Favorilere ekleyip hızlıca yeniden kullanabilirsin.", "Add to favorites and reuse quickly.")
            : tx("Yerel geçmiş bu tarayıcıda tutulur.", "Local history is stored in this browser.")}
        </p>
        {isLoaded && user?.id ? (
          <button
            type="button"
            onClick={() => setShowOnlyFavorites((v) => !v)}
            className={`rounded-md border px-2 py-1 text-xs ${
              showOnlyFavorites
                ? "border-[var(--brand-lab)] bg-[var(--brand-lab-dim)] text-[var(--brand-lab)]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {showOnlyFavorites ? tx("Tüm kayıtlar", "All records") : tx("Sadece favoriler", "Only favorites")}
          </button>
        ) : null}
      </div>
      {filteredRecent.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          {tx("Henüz kayıtlı üretim yok. Başarılı bir oluşturmadan sonra burada listelenir.", "No saved generations yet. Successful outputs appear here.")}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {filteredRecent.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => applyRecent(entry)}
                  className="min-w-0 flex-1 text-left text-[var(--text)] transition hover:text-[var(--brand-lab)]"
                >
                  <span className="block font-medium text-[var(--text)] line-clamp-1">{entry.intent || tx("(boş)", "(empty)")}</span>
                  <span className="mt-0.5 block text-[var(--muted)]">
                    {AI_TARGETS.find((t) => t.id === entry.target)?.label ?? entry.target} ·{" "}
                    {new Date(entry.at).toLocaleString(isEn ? "en-US" : "tr-TR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </button>
                {isLoaded && user?.id ? (
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => void toggleFavorite(entry.id)}
                      className={`rounded-md border px-2 py-1 text-[11px] ${
                        entry.isFavorite
                              ? "border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn-fg)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                      aria-label={entry.isFavorite ? tx("Favoriden çıkar", "Remove favorite") : tx("Favoriye ekle", "Add favorite")}
                      title={entry.isFavorite ? tx("Favoriden çıkar", "Remove favorite") : tx("Favoriye ekle", "Add favorite")}
                    >
                      {entry.isFavorite ? tx("Yildizli", "Starred") : tx("Yildiz", "Star")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleShareToFeed(entry.id)}
                      className={`rounded-md border px-2 py-1 text-[11px] ${
                        entry.shareToFeed
                              ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success-fg)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                      title={tx("Keşfet vitrininde göster", "Show on Discover feed")}
                    >
                      {entry.shareToFeed ? tx("Vitrinde", "In feed") : tx("Vitrin", "Share")}
                    </button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
