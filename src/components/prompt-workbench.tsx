"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BeforeAfterExamples } from "@/components/before-after-examples";
import { LogoMark } from "@/components/logo-mark";
import { WorkbenchErrorCta } from "@/components/workbench-error-cta";
import { getEstimatedWeeklyPromptCount } from "@/lib/beta-stats";
import { buildIntentForApi, TONE_LABELS } from "@/lib/workbench-compose-intent";
import {
  clearRecentPrompts as clearRecentStorage,
  pushRecentPrompt,
  readRecentPrompts,
  type RecentPromptEntry,
} from "@/lib/workbench-recent";
import { getWorkbenchTargetHint } from "@/lib/workbench-target-hints";
import { getWorkbenchUsageNote } from "@/lib/workbench-usage-notes";
import { QUICK_STARTERS } from "@/lib/quick-starters";
import { AI_TARGETS, type AiTargetId } from "@/lib/targets";

const CHATGPT_URL = "https://chatgpt.com";

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 5.00005H7C5.89543 5.00005 5 5.89548 5 7.00005V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7.00005C19 5.89548 18.1046 5.00005 17 5.00005H16M8 5.00005C8 3.89548 8.89543 3.00005 10 3.00005H14C15.1046 3.00005 16 3.89548 16 5.00005V5.00005C16 6.10462 15.1046 7.00005 14 7.00005H10C8.89543 7.00005 8 6.10462 8 5.00005V5.00005Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResultSkeleton() {
  return (
    <div
      className="animate-pulse space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4"
      aria-hidden="true"
    >
      <div className="h-3 max-w-full rounded bg-zinc-700/80" style={{ width: "92%" }} />
      <div className="h-3 w-full rounded bg-zinc-700/60" />
      <div className="h-3 w-4/5 rounded bg-zinc-700/60" />
      <div className="h-3 w-full rounded bg-zinc-700/50" />
      <div className="h-3 w-3/5 rounded bg-zinc-700/50" />
    </div>
  );
}

type OutputMode = "prompt-only" | "with-tip";

export function PromptWorkbench() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [intent, setIntent] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [target, setTarget] = useState<AiTargetId>("universal");
  const [expertMode, setExpertMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [resultProvider, setResultProvider] = useState<"openai" | "groq" | "mock" | null>(null);
  const [copied, setCopied] = useState(false);
  const [outputMode, setOutputMode] = useState<OutputMode>("prompt-only");
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentList, setRecentList] = useState<RecentPromptEntry[]>([]);

  const weeklyEstimate = useMemo(() => getEstimatedWeeklyPromptCount(), []);
  const effectiveTarget = useMemo<AiTargetId>(() => (expertMode ? target : "universal"), [expertMode, target]);
  const targetHint = useMemo(() => getWorkbenchTargetHint(effectiveTarget), [effectiveTarget]);
  const usageNote = useMemo(() => getWorkbenchUsageNote(effectiveTarget), [effectiveTarget]);

  useEffect(() => {
    setRecentList(readRecentPrompts());
  }, [result]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setResultProvider(null);
    const payload = buildIntentForApi(intent, { topic, tone, audience });
    if (!payload.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: payload, target: effectiveTarget }),
      });
      const raw = await r.text();
      let j: { prompt?: string; error?: string; provider?: "openai" | "groq" | "mock" } = {};
      if (raw) {
        try {
          j = JSON.parse(raw) as typeof j;
        } catch {
          setError(`Sunucu yanıtı işlenemedi (HTTP ${r.status}). Sayfayı yenileyip tekrar deneyin.`);
          return;
        }
      }
      if (!r.ok) {
        setError(j.error ?? "Bir hata oluştu.");
        return;
      }
      const promptText = j.prompt ?? "";
      setResult(promptText);
      setResultProvider(j.provider ?? "openai");
      pushRecentPrompt({
        intent,
        target: effectiveTarget,
        prompt: promptText,
        topic,
        tone,
        audience,
      });
      setRecentList(readRecentPrompts());
    } catch {
      setError("Ağ hatası. Bağlantını kontrol et.");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function openInChatGPT() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    window.open(CHATGPT_URL, "_blank", "noopener,noreferrer");
  }

  function applyStarter(s: (typeof QUICK_STARTERS)[number]) {
    setIntent(s.text);
    setTarget(s.target);
    setExpertMode(s.target !== "universal");
    setTopic("");
    setTone("");
    setAudience("");
    setError(null);
  }

  function applyRecent(entry: RecentPromptEntry) {
    setIntent(entry.intent);
    setTarget(entry.target);
    setExpertMode(entry.target !== "universal");
    setTopic(entry.topic ?? "");
    setTone(entry.tone ?? "");
    setAudience(entry.audience ?? "");
    setResult(entry.prompt);
    setResultProvider("openai");
    setError(null);
    setRecentOpen(true);
  }

  function handleClearRecent() {
    clearRecentStorage();
    setRecentList([]);
  }

  function onTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!loading && intent.trim() && form) form.requestSubmit();
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copied ? "Prompt panoya kopyalandı." : ""}
      </div>

      <div className="rounded-lg border border-[var(--brand-lab-dim)] bg-[var(--brand-lab-dim)] px-3 py-2 text-center text-sm text-[var(--text)]">
        <span className="font-medium text-[var(--brand-lab)]">Bu hafta</span>{" "}
        <span className="tabular-nums font-semibold">{weeklyEstimate.toLocaleString("tr-TR")}</span> prompt üretildi —{" "}
        <span className="text-[var(--muted)]">beta tahmini</span>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <LogoMark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
            <h1 className="flex flex-wrap items-baseline gap-2 text-3xl tracking-tight sm:text-4xl">
              <span className="font-normal text-white">Prompt</span>
              <span className="font-bold text-[var(--brand-lab)]">Lab</span>
              <span
                className="rounded-full border border-amber-400/50 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-200"
                title="Erken erişim — geri bildirimine değer veriyoruz"
              >
                Beta
              </span>
            </h1>
          </div>
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            Ne istediğini kendi cümlelerinle yaz; varsayılan olarak{" "}
            <strong className="font-medium text-[var(--text)]">akıllı optimizasyon</strong> (evrensel, Role–Task–Format)
            ile çalışırız. İstersen uzman modda Midjourney, Copilot veya belirli bir sohbet modeli için ince ayarlı çıktı
            alırsın.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          {!isLoaded ? (
            <span className="text-sm text-[var(--muted)]">Oturum…</span>
          ) : user ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-sm text-[var(--muted)]">
                {user.primaryEmailAddress?.emailAddress ?? user.username ?? user.firstName ?? "Hesap"}
              </span>
              <button
                type="button"
                onClick={() => signOut({ redirectUrl: "/" })}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-white/5"
              >
                Çıkış
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center text-sm font-medium text-[var(--text)] hover:bg-white/5 sm:text-right"
            >
              Giriş / Kayıt
            </Link>
          )}
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm">
            <Link href="/pricing" className="text-[var(--accent)] hover:underline">
              Premium
            </Link>
            <Link href="/hakkimizda" className="text-[var(--muted)] hover:text-[var(--text)] hover:underline">
              Hakkımızda
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Popüler — hızlı başlat</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_STARTERS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => applyStarter(s)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--brand-lab)] hover:bg-[var(--brand-lab-dim)] sm:text-sm"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <form
          id="workbench-form"
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
        >
          <label className="text-sm font-medium text-[var(--text)]" htmlFor="workbench-intent">
            Ne yapmak istiyorsun?
          </label>
          <textarea
            id="workbench-intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={onTextareaKeyDown}
            rows={5}
            required
            placeholder="Örn: E-ticaret sitem için anneler günü kampanyasına 3 Instagram gönderi metni…"
            className="min-h-[120px] resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <p className="text-xs text-[var(--muted)]">
            İpucu: <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]">Ctrl</kbd>
            +
            <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]">Enter</kbd>{" "}
            ile hızlıca oluşturabilirsin (Mac:{" "}
            <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]">⌘</kbd>
            +
            <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]">Enter</kbd>
            ).
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[var(--text)]">Hedef / optimizasyon</span>
            {!expertMode ? (
              <div className="rounded-lg border border-[var(--brand-lab)]/35 bg-[var(--brand-lab-dim)]/40 px-4 py-3">
                <p className="text-sm font-medium text-[var(--text)]">Akıllı optimizasyon (varsayılan)</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{targetHint}</p>
                <button
                  type="button"
                  onClick={() => setExpertMode(true)}
                  className="mt-3 text-left text-xs font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/50 underline-offset-2 hover:decoration-[var(--accent)]"
                >
                  Uzman mod: özel hedef seç (ChatGPT, Midjourney, Copilot…)
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="target" className="text-sm text-[var(--muted)]">
                    Araç / model odaklı çıktı
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setExpertMode(false);
                      setTarget("universal");
                    }}
                    className="text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    Basit moda dön
                  </button>
                </div>
                <select
                  id="target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value as AiTargetId)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  {AI_TARGETS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-relaxed text-[var(--muted)]">{targetHint}</p>
              </>
            )}
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">İstersen netleştir</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Konu, ton ve kitle; isteğe bağlı — sunucuya gönderilen metne eklenir.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label htmlFor="magic-topic" className="mb-1 block text-xs text-[var(--muted)]">
                  Konu / odak
                </label>
                <input
                  id="magic-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Örn: yaz kahvesi lansmanı"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label htmlFor="magic-tone" className="mb-1 block text-xs text-[var(--muted)]">
                  Ton
                </label>
                <select
                  id="magic-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Ton seç (isteğe bağlı)</option>
                  {(Object.keys(TONE_LABELS) as Array<keyof typeof TONE_LABELS>).filter((k) => k !== "").map((k) => (
                    <option key={k} value={k}>
                      {TONE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="magic-audience" className="mb-1 block text-xs text-[var(--muted)]">
                  Hedef kitle
                </label>
                <input
                  id="magic-audience"
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Örn: 25–40 yaş şehirli"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Formu tek tıkla doldur</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_STARTERS.map((s) => (
                <button
                  key={`form-${s.label}`}
                  type="button"
                  onClick={() => applyStarter(s)}
                  className="rounded-md border border-dashed border-[var(--border)] bg-transparent px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)] sm:text-sm"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              <p>{error}</p>
              <WorkbenchErrorCta message={error} />
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !intent.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Oluşturuluyor…" : "Profesyonel prompt oluştur"}
          </button>
        </form>

        <details
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          open={recentOpen}
          onToggle={(e) => setRecentOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-[var(--text)] [&::-webkit-details-marker]:hidden">
            <span>
              Son üretimler <span className="font-normal text-[var(--muted)]">(yalnızca bu cihaz)</span>
            </span>
            {recentList.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClearRecent();
                }}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-normal text-[var(--muted)] hover:border-red-500/40 hover:text-red-200"
              >
                Listeyi temizle
              </button>
            ) : null}
          </summary>
          {recentList.length === 0 ? (
            <p className="mt-3 text-xs text-[var(--muted)]">Henüz kayıtlı üretim yok. Başarılı bir oluşturmadan sonra burada listelenir.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentList.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => applyRecent(entry)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left text-xs text-[var(--text)] transition hover:border-[var(--brand-lab)]/50"
                  >
                    <span className="block font-medium text-[var(--text)] line-clamp-1">{entry.intent || "(boş)"}</span>
                    <span className="mt-0.5 block text-[var(--muted)]">
                      {AI_TARGETS.find((t) => t.id === entry.target)?.label ?? entry.target} ·{" "}
                      {new Date(entry.at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </details>

        <section
          className="flex min-h-[280px] flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:min-h-[320px] sm:p-6"
          aria-busy={loading}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">Sonuç önizlemesi</h2>
            {result && !loading ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-lg border border-[var(--border)] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setOutputMode("prompt-only")}
                    className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                      outputMode === "prompt-only"
                        ? "bg-[var(--accent)] text-zinc-900"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    Sadece prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => setOutputMode("with-tip")}
                    className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                      outputMode === "with-tip"
                        ? "bg-[var(--accent)] text-zinc-900"
                        : "text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    + kullanım ipucu
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void copyResult()}
                  aria-label={copied ? "Kopyalandı" : "Promptu panoya kopyala"}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent-dim)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm hover:opacity-95"
                >
                  <ClipboardIcon className="shrink-0 opacity-90" />
                  {copied ? "Kopyalandı!" : "Kopyala"}
                </button>
                <button
                  type="button"
                  onClick={() => void openInChatGPT()}
                  className="rounded-md border border-[var(--brand-lab)]/50 bg-[var(--brand-lab-dim)] px-3 py-2 text-sm font-medium text-[var(--brand-lab)] hover:opacity-90"
                >
                  ChatGPT&apos;de aç
                </button>
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-xs text-[var(--muted)]">Profesyonel prompt hazırlanıyor…</p>
              <ResultSkeleton />
            </div>
          ) : result ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              {resultProvider === "mock" ? (
                <p className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  <span className="font-semibold">Demo modu:</span> Canlı yapay zeka çağrılmadı (
                  <code className="rounded bg-black/30 px-1">PROMPTLAB_GENERATE_MODE=mock</code>
                  ). Gerçek çıktı için .env içinde <code className="rounded bg-black/30 px-1">openai</code> veya{" "}
                  <code className="rounded bg-black/30 px-1">groq</code> kullanın.
                </p>
              ) : null}
              <pre
                className="max-h-[min(50vh,420px)] min-h-0 flex-1 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm leading-relaxed text-[var(--text)]"
                style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
              >
                {result}
              </pre>
              {outputMode === "with-tip" ? (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/80 p-4 text-sm leading-relaxed text-[var(--muted)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-lab)]">Kullanım ipucu</p>
                  <p className="mt-2 text-[var(--text)]">{usageNote}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)]/50 px-4 py-10 text-center">
              <p className="text-sm text-[var(--muted)]">Henüz sonuç yok.</p>
              <p className="mt-2 max-w-sm text-xs text-[var(--muted)]">
                İstersen aşağıdaki örneklerden birine tıkla veya kendi cümlelerini yaz;{" "}
                <strong className="text-[var(--text)]">Profesyonel prompt oluştur</strong>
                &apos;a bas — metin burada belirir.
              </p>
              <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
                {QUICK_STARTERS.slice(0, 3).map((s) => (
                  <button
                    key={`empty-${s.label}`}
                    type="button"
                    onClick={() => applyStarter(s)}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--brand-lab-dim)]"
                  >
                    Örnek: {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <BeforeAfterExamples />
      </main>

      <footer className="mt-auto border-t border-[var(--border)] pt-8 text-center">
        <p className="text-sm text-[var(--muted)]">
          <Link href="/hakkimizda" className="text-[var(--text)] hover:underline">
            Hakkımızda
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href="/gizlilik" className="text-[var(--text)] hover:underline">
            Gizlilik / KVKK
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href="/hizmet-sartlari" className="text-[var(--text)] hover:underline">
            Hizmet şartları
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href="/pricing" className="text-[var(--accent)] hover:underline">
            Premium
          </Link>
        </p>
        <p className="mt-4 text-xs text-[var(--muted)]">
          © 2026 PromptLab. Tüm hakları saklıdır.
          <span className="mx-1.5 text-[var(--border)]">·</span>
          Ayrıntı için{" "}
          <Link href="/gizlilik" className="text-[var(--text)] underline hover:text-[var(--brand-lab)]">
            gizlilik sayfası
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
