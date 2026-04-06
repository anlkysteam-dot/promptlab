"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { MediaPreset, PromptQualityMode } from "@/lib/prompt-quality";
import { QUICK_STARTERS, type QuickStarterCategory } from "@/lib/quick-starters";
import { AI_TARGETS, type AiTargetId } from "@/lib/targets";

const CHATGPT_URL = "https://chatgpt.com";
const VIDEO_TARGETS: AiTargetId[] = ["runway", "veo", "sora", "kling", "pika"];
const IMAGE_TARGETS: AiTargetId[] = ["midjourney", "dalle"];
const MEDIA_PRESET_OPTIONS: Array<{ value: MediaPreset; label: string; kind: "video" | "image" | "all" }> = [
  { value: "none", label: "Yok (genel medya kalitesi)", kind: "all" },
  { value: "video_ad_vertical", label: "Video: Dikey reklam (9:16)", kind: "video" },
  { value: "video_cinematic_short", label: "Video: Sinematik kısa film", kind: "video" },
  { value: "video_product_demo", label: "Video: Ürün demo", kind: "video" },
  { value: "video_storyboard", label: "Video: Storyboard formatı", kind: "video" },
  { value: "image_product_packshot", label: "Görsel: Ürün packshot", kind: "image" },
  { value: "image_social_ad", label: "Görsel: Sosyal medya reklamı", kind: "image" },
  { value: "image_concept_art", label: "Görsel: Concept art", kind: "image" },
  { value: "image_logo_direction", label: "Görsel: Logo yönü", kind: "image" },
];
type StarterCategory = "all" | QuickStarterCategory;

const STARTER_CATEGORY_LABELS: Record<StarterCategory, string> = {
  all: "✨ Tümü",
  content: "📝 İçerik",
  email: "📧 E-posta",
  coding: "💻 Kod",
  presentation: "📊 Sunum",
  video: "🎬 Video",
  image: "🖼️ Görsel",
};

function defaultMediaPresetForTarget(target: AiTargetId): MediaPreset {
  switch (target) {
    case "runway":
    case "kling":
    case "pika":
      return "video_ad_vertical";
    case "veo":
    case "sora":
      return "video_cinematic_short";
    case "midjourney":
    case "dalle":
      return "image_social_ad";
    default:
      return "none";
  }
}

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
type ProjectItem = {
  id: string;
  title: string;
  target: AiTargetId;
  characterProfile: string;
  styleProfile: string;
  sceneCount: number;
  updatedAt: string;
};
type SceneItem = {
  id: string;
  sceneNo: number;
  userInput: string;
  generatedPrompt: string;
  continuitySnapshot: string | null;
  createdAt: string;
};

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
  const [qualityMode, setQualityMode] = useState<PromptQualityMode>("normal");
  const [mediaPreset, setMediaPreset] = useState<MediaPreset>("none");
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentList, setRecentList] = useState<RecentPromptEntry[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [starterMemory, setStarterMemory] = useState<Record<string, number>>({});
  const [starterCategory, setStarterCategory] = useState<StarterCategory>("all");
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectCharacterProfile, setProjectCharacterProfile] = useState("");
  const [projectStyleProfile, setProjectStyleProfile] = useState("");
  const [projectScenes, setProjectScenes] = useState<SceneItem[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);

  const weeklyEstimate = useMemo(() => getEstimatedWeeklyPromptCount(), []);
  const effectiveTarget = useMemo<AiTargetId>(() => (expertMode ? target : "universal"), [expertMode, target]);
  const targetHint = useMemo(() => getWorkbenchTargetHint(effectiveTarget), [effectiveTarget]);
  const usageNote = useMemo(() => getWorkbenchUsageNote(effectiveTarget), [effectiveTarget]);
  const mediaKind = useMemo<"video" | "image" | null>(() => {
    if (VIDEO_TARGETS.includes(effectiveTarget)) return "video";
    if (IMAGE_TARGETS.includes(effectiveTarget)) return "image";
    return null;
  }, [effectiveTarget]);
  const mediaPresetOptions = useMemo(
    () =>
      MEDIA_PRESET_OPTIONS.filter((o) => o.kind === "all" || (mediaKind ? o.kind === mediaKind : false)),
    [mediaKind],
  );
  const starterList = useMemo(() => {
    if (starterCategory === "all") return QUICK_STARTERS;
    return QUICK_STARTERS.filter((s) => s.category === starterCategory);
  }, [starterCategory]);
  const totalStarterVariants = useMemo(
    () => QUICK_STARTERS.reduce((sum, s) => sum + s.variants.length, 0),
    [],
  );
  const categoryStarterVariants = useMemo(
    () => starterList.reduce((sum, s) => sum + s.variants.length, 0),
    [starterList],
  );
  const loadProjects = useCallback(async () => {
    if (!(isLoaded && user?.id)) {
      setProjects([]);
      setActiveProjectId("");
      setProjectScenes([]);
      return;
    }
    try {
      const r = await fetch("/api/projects", { method: "GET", cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { items?: ProjectItem[] };
      const items = Array.isArray(j.items) ? j.items : [];
      setProjects(items);
      setActiveProjectId((prev) => (prev && items.some((p) => p.id === prev) ? prev : items[0]?.id ?? ""));
    } catch {
      // no-op
    }
  }, [isLoaded, user?.id]);
  const loadProjectScenes = useCallback(async (projectId: string) => {
    if (!projectId) {
      setProjectScenes([]);
      return;
    }
    try {
      const r = await fetch(`/api/projects/${projectId}/scenes`, { method: "GET", cache: "no-store" });
      if (!r.ok) return;
      const j = (await r.json()) as { items?: SceneItem[] };
      setProjectScenes(Array.isArray(j.items) ? j.items : []);
    } catch {
      // no-op
    }
  }, []);

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
        // Sunucu geçmişi okunamazsa local fallback.
      }
    }
    setRecentList(readRecentPrompts());
  }, [isLoaded, user?.id]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    void loadProjectScenes(activeProjectId);
  }, [activeProjectId, loadProjectScenes]);

  useEffect(() => {
    if (!mediaPresetOptions.some((o) => o.value === mediaPreset)) {
      setMediaPreset("none");
    }
  }, [mediaPreset, mediaPresetOptions]);

  useEffect(() => {
    if (qualityMode !== "advanced") return;
    if (!mediaKind) return;
    if (mediaPreset !== "none") return;
    setMediaPreset(defaultMediaPresetForTarget(effectiveTarget));
  }, [qualityMode, mediaKind, mediaPreset, effectiveTarget]);

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
        body: JSON.stringify({
          intent: payload,
          target: effectiveTarget,
          topic,
          tone,
          audience,
          qualityMode,
          mediaPreset,
          projectId: activeProjectId || undefined,
        }),
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
      if (!user?.id) {
        pushRecentPrompt({
          intent,
          target: effectiveTarget,
          prompt: promptText,
          topic,
          tone,
          audience,
        });
      }
      await loadRecent();
      if (user?.id) {
        await loadProjects();
        if (activeProjectId) await loadProjectScenes(activeProjectId);
      }
    } catch {
      setError("Ağ hatası. Bağlantını kontrol et.");
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    const cleanTitle = projectTitle.trim();
    if (!cleanTitle) return;
    setProjectLoading(true);
    try {
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          target: effectiveTarget,
          characterProfile: projectCharacterProfile,
          styleProfile: projectStyleProfile,
        }),
      });
      if (!r.ok) return;
      const j = (await r.json()) as { id?: string };
      setProjectTitle("");
      setProjectCharacterProfile("");
      setProjectStyleProfile("");
      await loadProjects();
      if (j.id) {
        setActiveProjectId(j.id);
        await loadProjectScenes(j.id);
      }
    } finally {
      setProjectLoading(false);
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

  function pickStarterVariant(s: (typeof QUICK_STARTERS)[number]): string {
    const total = s.variants.length;
    if (total === 0) return "";
    const prev = starterMemory[s.id];
    if (total === 1) return s.variants[0];
    let idx = Math.floor(Math.random() * total);
    if (typeof prev === "number" && idx === prev) {
      idx = (idx + 1 + Math.floor(Math.random() * (total - 1))) % total;
    }
    setStarterMemory((m) => ({ ...m, [s.id]: idx }));
    return s.variants[idx];
  }

  function applyStarter(s: (typeof QUICK_STARTERS)[number]) {
    const variant = pickStarterVariant(s);
    if (!variant) return;
    setIntent(variant);
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

  function onTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!loading && intent.trim() && form) form.requestSubmit();
    }
  }

  const filteredRecent = useMemo(
    () => (showOnlyFavorites ? recentList.filter((x) => x.isFavorite) : recentList),
    [recentList, showOnlyFavorites],
  );
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

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
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Hızlı başlat</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Aynı butona her tıklamada o kategoriye ait farklı bir örnek gelir.
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Hazır senaryo havuzu:{" "}
            <span className="font-medium text-[var(--text)]">
              {starterCategory === "all" ? totalStarterVariants : categoryStarterVariants}
            </span>{" "}
            farklı prompt başlangıcı.
          </p>
          <div className="sticky top-2 z-20 mt-2 -mx-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 px-2 py-2 backdrop-blur">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STARTER_CATEGORY_LABELS) as StarterCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setStarterCategory(cat)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    starterCategory === cat
                      ? "border-[var(--brand-lab)] bg-[var(--brand-lab-dim)] text-[var(--brand-lab)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {STARTER_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {starterList.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => applyStarter(s)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:border-[var(--brand-lab)] hover:bg-[var(--brand-lab-dim)] sm:text-sm"
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => applyStarter(starterList[Math.floor(Math.random() * starterList.length)] ?? QUICK_STARTERS[0])}
              className="rounded-full border border-dashed border-[var(--accent)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--brand-lab-dim)] sm:text-sm"
            >
              Bana rastgele örnek ver
            </button>
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

          {isLoaded && user?.id ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Sahne projesi</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Yeni proje adı (örn. Kırmızı paltolu karakter)"
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
                <button
                  type="button"
                  onClick={() => void createProject()}
                  disabled={projectLoading || !projectTitle.trim()}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] hover:bg-white/5 disabled:opacity-40"
                >
                  {projectLoading ? "Oluşturuluyor…" : "Yeni proje"}
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor="project-character-profile" className="mb-1 block text-xs text-[var(--muted)]">
                    Karakter bilgisi (opsiyonel)
                  </label>
                  <textarea
                    id="project-character-profile"
                    rows={3}
                    value={projectCharacterProfile}
                    onChange={(e) => setProjectCharacterProfile(e.target.value)}
                    placeholder="Örn: 35 yaş erkek, kırmızı palto, kısa sakal, sakin yüz ifadesi"
                    className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </div>
                <div>
                  <label htmlFor="project-style-profile" className="mb-1 block text-xs text-[var(--muted)]">
                    Stil bilgisi (opsiyonel)
                  </label>
                  <textarea
                    id="project-style-profile"
                    rows={3}
                    value={projectStyleProfile}
                    onChange={(e) => setProjectStyleProfile(e.target.value)}
                    placeholder="Örn: sinematik, soft ışık, doğal renk paleti, elde kamera hissi"
                    className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label htmlFor="active-project" className="mb-1 block text-xs text-[var(--muted)]">
                  Aktif proje (devamlılık hafızası)
                </label>
                <select
                  id="active-project"
                  value={activeProjectId}
                  onChange={(e) => setActiveProjectId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  <option value="">Proje seçmeden üret (tek seferlik)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} · {p.sceneCount} sahne
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

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
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Prompt kalite modu</p>
            <div className="mt-2 inline-flex rounded-lg border border-[var(--border)] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setQualityMode("normal")}
                className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                  qualityMode === "normal"
                    ? "bg-[var(--accent)] text-zinc-900"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setQualityMode("advanced")}
                className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                  qualityMode === "advanced"
                    ? "bg-[var(--accent)] text-zinc-900"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                Advanced
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
              {qualityMode === "advanced"
                ? "Daha sıkı kısıtlar ve net çıktı beklentisiyle daha güçlü prompt üretir."
                : "Hızlı ve dengeli bir kalite seviyesi sunar."}
            </p>
            {mediaKind && qualityMode === "normal" ? (
              <p className="mt-2 text-xs text-[var(--muted)]">
                Video/görsel için preset seçenekleri <span className="text-[var(--text)]">Advanced</span> modda açılır.
              </p>
            ) : null}
          </div>

          {mediaKind && qualityMode === "advanced" ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {mediaKind === "video" ? "Video şablonu" : "Görsel şablonu"}
              </p>
              <label htmlFor="media-preset" className="mt-2 mb-1 block text-xs text-[var(--muted)]">
                Kalite odak preset seç
              </label>
              <select
                id="media-preset"
                value={mediaPreset}
                onChange={(e) => setMediaPreset(e.target.value as MediaPreset)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {mediaPresetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[var(--muted)]">
                Bu seçim, video/görsel promptunda shot, kompozisyon, ritim ve kalite kurallarını otomatik sıkılaştırır.
              </p>
            </div>
          ) : null}

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

        {isLoaded && user?.id && activeProject ? (
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                Sahne akışı · {activeProject.title}
              </h3>
              <span className="text-xs text-[var(--muted)]">{projectScenes.length} sahne</span>
            </div>
            {projectScenes.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                Bu projede henüz sahne yok. İlk üretimden sonra devamlılık hafızası otomatik başlar.
              </p>
            ) : (
              <ol className="space-y-2">
                {projectScenes.slice(-6).map((scene) => (
                  <li key={scene.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs">
                    <p className="font-medium text-[var(--text)]">Sahne {scene.sceneNo}</p>
                    <p className="mt-1 line-clamp-2 text-[var(--muted)]">{scene.userInput}</p>
                  </li>
                ))}
              </ol>
            )}
            {(activeProject.characterProfile || activeProject.styleProfile) && (
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs">
                <p className="font-medium text-[var(--text)]">Proje continuity profili</p>
                {activeProject.characterProfile ? (
                  <p className="mt-1 text-[var(--muted)]">Karakter: {activeProject.characterProfile}</p>
                ) : null}
                {activeProject.styleProfile ? (
                  <p className="mt-1 text-[var(--muted)]">Stil: {activeProject.styleProfile}</p>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        <details
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
          open={recentOpen}
          onToggle={(e) => setRecentOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-[var(--text)] [&::-webkit-details-marker]:hidden">
            <span>
              Son üretimler{" "}
              <span className="font-normal text-[var(--muted)]">
                {isLoaded && user?.id ? "(hesabınla senkron)" : "(yalnızca bu cihaz)"}
              </span>
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
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[var(--muted)]">
              {isLoaded && user?.id ? "Favorilere ekleyip hızlıca yeniden kullanabilirsin." : "Yerel geçmiş bu tarayıcıda tutulur."}
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
                {showOnlyFavorites ? "Tüm kayıtlar" : "Sadece favoriler"}
              </button>
            ) : null}
          </div>
          {filteredRecent.length === 0 ? (
            <p className="mt-3 text-xs text-[var(--muted)]">Henüz kayıtlı üretim yok. Başarılı bir oluşturmadan sonra burada listelenir.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {filteredRecent.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => applyRecent(entry)}
                      className="min-w-0 flex-1 text-left text-[var(--text)] transition hover:text-white"
                    >
                      <span className="block font-medium text-[var(--text)] line-clamp-1">{entry.intent || "(boş)"}</span>
                      <span className="mt-0.5 block text-[var(--muted)]">
                        {AI_TARGETS.find((t) => t.id === entry.target)?.label ?? entry.target} ·{" "}
                        {new Date(entry.at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </button>
                    {isLoaded && user?.id ? (
                      <button
                        type="button"
                        onClick={() => void toggleFavorite(entry.id)}
                        className={`rounded-md border px-2 py-1 text-[11px] ${
                          entry.isFavorite
                            ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
                            : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                        }`}
                        aria-label={entry.isFavorite ? "Favoriden çıkar" : "Favoriye ekle"}
                        title={entry.isFavorite ? "Favoriden çıkar" : "Favoriye ekle"}
                      >
                        {entry.isFavorite ? "Yildizli" : "Yildiz"}
                      </button>
                    ) : null}
                  </div>
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
