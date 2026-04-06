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
import type { LabFlavor, LabFormat } from "@/lib/lab-presets";
import { WorkbenchOnboarding } from "@/components/workbench-onboarding";

const CHATGPT_URL = "https://chatgpt.com";
const VIDEO_TARGETS: AiTargetId[] = ["runway", "veo", "sora", "kling", "pika"];
const IMAGE_TARGETS: AiTargetId[] = ["midjourney", "dalle", "stable_diffusion"];
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
const MEDIA_PRESET_LABELS_EN: Record<MediaPreset, string> = {
  none: "None (general media quality)",
  video_ad_vertical: "Video: Vertical ad (9:16)",
  video_cinematic_short: "Video: Cinematic short film",
  video_product_demo: "Video: Product demo",
  video_storyboard: "Video: Storyboard format",
  image_product_packshot: "Image: Product packshot",
  image_social_ad: "Image: Social media ad",
  image_concept_art: "Image: Concept art",
  image_logo_direction: "Image: Logo direction",
};
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
const STARTER_CATEGORY_LABELS_EN: Record<StarterCategory, string> = {
  all: "✨ All",
  content: "📝 Content",
  email: "📧 Email",
  coding: "💻 Code",
  presentation: "📊 Presentation",
  video: "🎬 Video",
  image: "🖼️ Image",
};
const QUICK_STARTER_LABELS_EN: Record<string, string> = {
  "ig-content": "Instagram content",
  "blog-article": "Blog post",
  "youtube-script": "YouTube script",
  "linkedin-post": "LinkedIn post",
  "x-thread": "X thread",
  "email-general": "Email",
  "code-general": "Code",
  "presentation-general": "Presentation",
  "video-ad": "Video ad",
  "video-cinematic": "Cinematic video",
  "image-social-ad": "Image ad",
  "image-concept": "Concept art",
};
const PROJECT_STYLE_PRESETS = [
  "Yok / serbest",
  "Sinematik",
  "Anime",
  "Realistik",
  "Belgesel",
  "Yağlı boya",
  "Cyberpunk neon",
  "Minimal flat",
] as const;
const PROJECT_STYLE_PRESETS_EN = [
  "None / free",
  "Cinematic",
  "Anime",
  "Realistic",
  "Documentary",
  "Oil painting",
  "Cyberpunk neon",
  "Minimal flat",
] as const;

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
type OutputLanguage = "tr" | "en";
type UiLocale = "tr" | "en";
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

const UI_TEXT: Record<
  UiLocale,
  {
    login: string;
    pricing: string;
    about: string;
    promptQuestion: string;
    quickStart: string;
    projectSection: string;
    createProject: string;
    creating: string;
    activeProject: string;
    noProject: string;
    projectFlow: string;
    scene: string;
    edit: string;
    regenerate: string;
    outputLanguage: string;
  }
> = {
  tr: {
    login: "Giriş / Kayıt",
    pricing: "Premium",
    about: "Hakkımızda",
    promptQuestion: "Ne yapmak istiyorsun?",
    quickStart: "Hızlı başlat",
    projectSection: "Sahne projesi",
    createProject: "Yeni proje",
    creating: "Oluşturuluyor…",
    activeProject: "Aktif proje (devamlılık hafızası)",
    noProject: "Proje seçmeden üret (tek seferlik)",
    projectFlow: "Sahne akışı",
    scene: "Sahne",
    edit: "Düzenle",
    regenerate: "Yeniden üret",
    outputLanguage: "ChatGPT yanıt dili",
  },
  en: {
    login: "Sign in / Register",
    pricing: "Pricing",
    about: "About",
    promptQuestion: "What do you want to create?",
    quickStart: "Quick start",
    projectSection: "Scene project",
    createProject: "New project",
    creating: "Creating…",
    activeProject: "Active project (continuity memory)",
    noProject: "Generate without project (one-off)",
    projectFlow: "Scene timeline",
    scene: "Scene",
    edit: "Edit",
    regenerate: "Regenerate",
    outputLanguage: "ChatGPT response language",
  },
};

export function PromptWorkbench({ locale = "tr" }: { locale?: UiLocale }) {
  const t = UI_TEXT[locale];
  const isEn = locale === "en";
  const tx = (tr: string, en: string) => (isEn ? en : tr);
  const stylePresets = isEn ? PROJECT_STYLE_PRESETS_EN : PROJECT_STYLE_PRESETS;
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
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("tr");
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
  const [projectStylePreset, setProjectStylePreset] = useState<
    (typeof PROJECT_STYLE_PRESETS)[number] | (typeof PROJECT_STYLE_PRESETS_EN)[number]
  >(locale === "en" ? "None / free" : "Yok / serbest");
  const [projectScenes, setProjectScenes] = useState<SceneItem[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [labFormat, setLabFormat] = useState<LabFormat>("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [labFlavor, setLabFlavor] = useState<LabFlavor>("none");

  const weeklyEstimate = useMemo(() => getEstimatedWeeklyPromptCount(), []);
  const effectiveTarget = useMemo<AiTargetId>(() => (expertMode ? target : "universal"), [expertMode, target]);
  const targetHint = useMemo(() => getWorkbenchTargetHint(effectiveTarget), [effectiveTarget]);
  const usageNote = useMemo(() => getWorkbenchUsageNote(effectiveTarget), [effectiveTarget]);
  const mediaKind = useMemo<"video" | "image" | null>(() => {
    if (VIDEO_TARGETS.includes(effectiveTarget)) return "video";
    if (IMAGE_TARGETS.includes(effectiveTarget)) return "image";
    return null;
  }, [effectiveTarget]);
  const showSceneProjectUI = useMemo(() => expertMode && VIDEO_TARGETS.includes(target), [expertMode, target]);
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
          outputLanguage,
          mediaPreset,
          projectId: showSceneProjectUI ? activeProjectId || undefined : undefined,
          labFormat,
          negativePrompt,
          labFlavor,
        }),
      });
      const raw = await r.text();
      let j: { prompt?: string; error?: string; provider?: "openai" | "groq" | "mock" } = {};
      if (raw) {
        try {
          j = JSON.parse(raw) as typeof j;
        } catch {
          setError(
            tx(
              `Sunucu yanıtı işlenemedi (HTTP ${r.status}). Sayfayı yenileyip tekrar deneyin.`,
              `Could not parse server response (HTTP ${r.status}). Refresh and try again.`,
            ),
          );
          return;
        }
      }
      if (!r.ok) {
        setError(j.error ?? tx("Bir hata oluştu.", "Something went wrong."));
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
      setError(tx("Ağ hatası. Bağlantını kontrol et.", "Network error. Check your connection."));
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    const cleanTitle = projectTitle.trim();
    if (!cleanTitle) return;
    const composedStyleProfile =
      projectStylePreset && !["Yok / serbest", "None / free"].includes(projectStylePreset)
        ? [projectStylePreset, projectStyleProfile.trim()].filter(Boolean).join(" | ")
        : projectStyleProfile.trim();
    setProjectLoading(true);
    try {
      const r = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          target: effectiveTarget,
          characterProfile: projectCharacterProfile,
          styleProfile: composedStyleProfile,
        }),
      });
      if (!r.ok) return;
      const j = (await r.json()) as { id?: string };
      setProjectTitle("");
      setProjectCharacterProfile("");
      setProjectStyleProfile("");
      setProjectStylePreset(isEn ? "None / free" : "Yok / serbest");
      await loadProjects();
      if (j.id) {
        setActiveProjectId(j.id);
        await loadProjectScenes(j.id);
      }
    } finally {
      setProjectLoading(false);
    }
  }

  function editScene(scene: SceneItem) {
    setIntent(scene.userInput);
  }

  function regenerateScene(scene: SceneItem) {
    setIntent(scene.userInput);
    window.setTimeout(() => {
      const form = document.getElementById("workbench-form") as HTMLFormElement | null;
      if (form && !loading) form.requestSubmit();
    }, 0);
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
        {copied ? tx("Prompt panoya kopyalandı.", "Prompt copied to clipboard.") : ""}
      </div>

      <div className="rounded-lg border border-[var(--brand-lab-dim)] bg-[var(--brand-lab-dim)] px-3 py-2 text-center text-sm text-[var(--text)]">
        <span className="font-medium text-[var(--brand-lab)]">{tx("Bu hafta", "This week")}</span>{" "}
        <span className="tabular-nums font-semibold">{weeklyEstimate.toLocaleString(isEn ? "en-US" : "tr-TR")}</span>{" "}
        {tx("prompt üretildi", "prompts generated")} — <span className="text-[var(--muted)]">{tx("beta tahmini", "beta estimate")}</span>
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
                title={tx("Erken erişim — geri bildirimine değer veriyoruz", "Early access — your feedback matters")}
              >
                Beta
              </span>
            </h1>
          </div>
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            {tx(
              "Ne istediğini kendi cümlelerinle yaz; varsayılan olarak ",
              "Describe your goal in your own words; by default we use ",
            )}
            <strong className="font-medium text-[var(--text)]">{tx("akıllı optimizasyon", "smart optimization")}</strong>{" "}
            {tx(
              "(evrensel, Role–Task–Format) ile çalışırız. İstersen uzman modda Midjourney, Copilot veya belirli bir sohbet modeli için ince ayarlı çıktı alırsın.",
              "(universal, Role–Task–Format). Switch to expert mode for Midjourney, Copilot, or a specific chat model for finer control.",
            )}
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
                {tx("Çıkış", "Sign out")}
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center text-sm font-medium text-[var(--text)] hover:bg-white/5 sm:text-right"
            >
              {t.login}
            </Link>
          )}
          <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm">
            <Link href="/pricing" className="text-[var(--accent)] hover:underline">
              {t.pricing}
            </Link>
            <Link href="/hakkimizda" className="text-[var(--muted)] hover:text-[var(--text)] hover:underline">
              {t.about}
            </Link>
            <Link href="/tr" className="text-[var(--muted)] hover:text-[var(--text)] hover:underline">
              TR
            </Link>
            <Link href="/en" className="text-[var(--muted)] hover:text-[var(--text)] hover:underline">
              EN
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-8">
        <div id="tour-quick-start">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{t.quickStart}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {tx("Aynı butona her tıklamada o kategoriye ait farklı bir örnek gelir.", "Each click returns a different sample from that category.")}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {tx("Hazır senaryo havuzu:", "Starter pool:")}{" "}
            <span className="font-medium text-[var(--text)]">
              {starterCategory === "all" ? totalStarterVariants : categoryStarterVariants}
            </span>{" "}
            {tx("farklı prompt başlangıcı.", "different prompt starters.")}
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
                  {isEn ? STARTER_CATEGORY_LABELS_EN[cat] : STARTER_CATEGORY_LABELS[cat]}
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
                {isEn ? QUICK_STARTER_LABELS_EN[s.id] ?? s.label : s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => applyStarter(starterList[Math.floor(Math.random() * starterList.length)] ?? QUICK_STARTERS[0])}
              className="rounded-full border border-dashed border-[var(--accent)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--brand-lab-dim)] sm:text-sm"
            >
              {tx("Bana rastgele örnek ver", "Give me a random example")}
            </button>
          </div>
        </div>

        {isLoaded && user?.id && showSceneProjectUI ? (
          <section className="grid gap-3 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 lg:sticky lg:top-24 lg:h-fit">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{tx("Proje menüsü", "Project sidebar")}</p>
              <div className="mt-2 space-y-2">
                {projects.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">{tx("Video projesi oluşturduğunda burada listelenecek.", "Your video projects will appear here.")}</p>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveProjectId(p.id)}
                      className={`w-full rounded-lg border px-2 py-2 text-left text-xs ${
                        activeProjectId === p.id
                          ? "border-[var(--brand-lab)] bg-[var(--brand-lab-dim)] text-[var(--text)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      <p className="font-medium">{p.title}</p>
                      <p className="mt-0.5 opacity-80">
                        {p.sceneCount} {tx("sahne", "scenes")}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </aside>
            <div className="rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)]">
              {tx("Proje seçtiğinde sahne üretimleri aynı karakter ve stile bağlı kalır.", "When a project is selected, scene generation keeps the same character and style continuity.")}
            </div>
          </section>
        ) : null}

        <form
          id="workbench-form"
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
        >
          <label className="text-sm font-medium text-[var(--text)]" htmlFor="workbench-intent">
            {t.promptQuestion}
          </label>
          <textarea
            id="workbench-intent"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={onTextareaKeyDown}
            rows={5}
            required
            placeholder={tx(
              "Örn: E-ticaret sitem için anneler günü kampanyasına 3 Instagram gönderi metni…",
              "e.g. Write 3 Instagram post drafts for a Mother's Day campaign for my e-commerce brand...",
            )}
            className="min-h-[120px] resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <p className="text-xs text-[var(--muted)]">
            {tx("İpucu:", "Tip:")} <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]">Ctrl</kbd>
            +
            <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]">Enter</kbd>{" "}
            {tx("ile hızlıca oluşturabilirsin (Mac:", "to generate quickly (Mac:")}{" "}
            <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]">⌘</kbd>
            +
            <kbd className="rounded border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text)]">Enter</kbd>
            {")"}
          </p>

          {expertMode && mediaKind ? (
            <div className="rounded-lg border border-[var(--brand-lab)]/35 bg-[var(--brand-lab-dim)]/25 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Lab</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {tx("Format ve negatif prompt; hedef model ile uyumlu üretim için.", "Format, negative prompt, and model flavor for media targets.")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["", "16:9", "9:16", "1:1"] as const).map((f) => (
                  <button
                    key={f || "auto"}
                    type="button"
                    onClick={() => setLabFormat(f)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      labFormat === f
                        ? "border-[var(--brand-lab)] bg-[var(--brand-lab-dim)] text-[var(--brand-lab)]"
                        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {f === "" ? tx("Serbest", "Auto") : f}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-[var(--muted)]">{tx("Model modu", "Model mode")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpertMode(true);
                    setTarget("midjourney");
                    setLabFlavor("midjourney");
                  }}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)] hover:border-[var(--brand-lab)]"
                >
                  Midjourney
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpertMode(true);
                    setTarget("sora");
                    setLabFlavor("sora");
                  }}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)] hover:border-[var(--brand-lab)]"
                >
                  Sora
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpertMode(true);
                    setTarget("stable_diffusion");
                    setLabFlavor("stable_diffusion");
                  }}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)] hover:border-[var(--brand-lab)]"
                >
                  Stable Diffusion
                </button>
                <button
                  type="button"
                  onClick={() => setLabFlavor("none")}
                  className="rounded-full border border-dashed border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]"
                >
                  {tx("Modu sıfırla", "Reset mode")}
                </button>
              </div>
              <label htmlFor="workbench-negative" className="mt-3 mb-1 block text-xs text-[var(--muted)]">
                {tx("Negatif prompt (istemiyorum)", "Negative prompt (avoid)")}
              </label>
              <textarea
                id="workbench-negative"
                rows={2}
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder={tx(
                  "Örn: bulanık, düşük kalite, fazla parmak, watermark",
                  "e.g. blurry, low quality, extra fingers, watermark",
                )}
                className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
            </div>
          ) : null}

          {isLoaded && user?.id && showSceneProjectUI ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{t.projectSection}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder={tx("Yeni proje adı (örn. Kırmızı paltolu karakter)", "New project name (e.g. Man in red coat)")}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
                <button
                  type="button"
                  onClick={() => void createProject()}
                  disabled={projectLoading || !projectTitle.trim()}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] hover:bg-white/5 disabled:opacity-40"
                >
                  {projectLoading ? t.creating : t.createProject}
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor="project-character-profile" className="mb-1 block text-xs text-[var(--muted)]">
                    {tx("Karakter bilgisi (opsiyonel)", "Character profile (optional)")}
                  </label>
                  <textarea
                    id="project-character-profile"
                    rows={3}
                    value={projectCharacterProfile}
                    onChange={(e) => setProjectCharacterProfile(e.target.value)}
                    placeholder={tx(
                      "Örn: 35 yaş erkek, kırmızı palto, kısa sakal, sakin yüz ifadesi",
                      "e.g. Male, 35, red coat, short beard, calm facial expression",
                    )}
                    className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </div>
                <div>
                  <label htmlFor="project-style-preset" className="mb-1 block text-xs text-[var(--muted)]">
                    {tx("Global stil kilidi", "Global style lock")}
                  </label>
                  <select
                    id="project-style-preset"
                    value={projectStylePreset}
                    onChange={(e) =>
                      setProjectStylePreset(
                        e.target.value as (typeof PROJECT_STYLE_PRESETS)[number] | (typeof PROJECT_STYLE_PRESETS_EN)[number],
                      )
                    }
                    className="mb-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  >
                    {stylePresets.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                  <label htmlFor="project-style-profile" className="mb-1 block text-xs text-[var(--muted)]">
                    {tx("Stil bilgisi (opsiyonel)", "Style profile (optional)")}
                  </label>
                  <textarea
                    id="project-style-profile"
                    rows={3}
                    value={projectStyleProfile}
                    onChange={(e) => setProjectStyleProfile(e.target.value)}
                    placeholder={tx(
                      "Örn: sinematik, soft ışık, doğal renk paleti, elde kamera hissi",
                      "e.g. cinematic, soft light, natural color palette, handheld camera feel",
                    )}
                    className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label htmlFor="active-project" className="mb-1 block text-xs text-[var(--muted)]">
                  {t.activeProject}
                </label>
                <select
                  id="active-project"
                  value={activeProjectId}
                  onChange={(e) => setActiveProjectId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  <option value="">{t.noProject}</option>
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
            <span className="text-sm font-medium text-[var(--text)]">{tx("Hedef / optimizasyon", "Target / optimization")}</span>
            {!expertMode ? (
              <div className="rounded-lg border border-[var(--brand-lab)]/35 bg-[var(--brand-lab-dim)]/40 px-4 py-3">
                <p className="text-sm font-medium text-[var(--text)]">{tx("Akıllı optimizasyon (varsayılan)", "Smart optimization (default)")}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{targetHint}</p>
                <button
                  type="button"
                  onClick={() => setExpertMode(true)}
                  className="mt-3 text-left text-xs font-semibold text-[var(--accent)] underline decoration-[var(--accent)]/50 underline-offset-2 hover:decoration-[var(--accent)]"
                >
                  {tx("Uzman mod: özel hedef seç (ChatGPT, Midjourney, Copilot…)", "Expert mode: pick a specific target (ChatGPT, Midjourney, Copilot...)")}
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="target" className="text-sm text-[var(--muted)]">
                    {tx("Araç / model odaklı çıktı", "Tool / model-specific output")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setExpertMode(false);
                      setTarget("universal");
                    }}
                    className="text-xs font-medium text-[var(--accent)] hover:underline"
                  >
                    {tx("Basit moda dön", "Back to simple mode")}
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
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{tx("Prompt kalite modu", "Prompt quality mode")}</p>
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
                {tx("Normal", "Normal")}
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
                {"Advanced"}
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
              {qualityMode === "advanced"
                ? tx(
                    "Daha sıkı kısıtlar ve net çıktı beklentisiyle daha güçlü prompt üretir.",
                    "Generates stronger prompts with stricter constraints and clearer output expectations.",
                  )
                : tx("Hızlı ve dengeli bir kalite seviyesi sunar.", "Provides a fast and balanced quality level.")}
            </p>
            {mediaKind && qualityMode === "normal" ? (
              <p className="mt-2 text-xs text-[var(--muted)]">
                {tx("Video/görsel için preset seçenekleri", "Preset options for video/image")}{" "}
                <span className="text-[var(--text)]">Advanced</span> {tx("modda açılır.", "mode only.")}
              </p>
            ) : null}
            {!mediaKind ? (
              <div className="mt-3">
                <label htmlFor="output-language" className="mb-1 block text-xs text-[var(--muted)]">
                  {t.outputLanguage}
                </label>
                <select
                  id="output-language"
                  value={outputLanguage}
                  onChange={(e) => setOutputLanguage(e.target.value as OutputLanguage)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  <option value="tr">{tx("Turkce (onerilen)", "Turkish (recommended)")}</option>
                  <option value="en">English</option>
                </select>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {tx(
                    "Prompt Ingilizce optimize edilir, ancak model yanitini secilen dilde verir.",
                    "Prompt is optimized in English, but the model responds in the selected language.",
                  )}
                </p>
              </div>
            ) : null}
          </div>

          {mediaKind && qualityMode === "advanced" ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                {mediaKind === "video" ? tx("Video şablonu", "Video template") : tx("Görsel şablonu", "Image template")}
              </p>
              <label htmlFor="media-preset" className="mt-2 mb-1 block text-xs text-[var(--muted)]">
                {tx("Kalite odak preset seç", "Select quality-focused preset")}
              </label>
              <select
                id="media-preset"
                value={mediaPreset}
                onChange={(e) => setMediaPreset(e.target.value as MediaPreset)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {mediaPresetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isEn ? MEDIA_PRESET_LABELS_EN[opt.value] : opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {tx(
                  "Bu seçim, video/görsel promptunda shot, kompozisyon, ritim ve kalite kurallarını otomatik sıkılaştırır.",
                  "This option automatically tightens shot, composition, pacing, and quality rules in media prompts.",
                )}
              </p>
            </div>
          ) : null}

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{tx("İstersen netleştir", "Optional refinements")}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {tx("Konu, ton ve kitle; isteğe bağlı — sunucuya gönderilen metne eklenir.", "Topic, tone, and audience are optional and appended to the request.")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label htmlFor="magic-topic" className="mb-1 block text-xs text-[var(--muted)]">
                  {tx("Konu / odak", "Topic / focus")}
                </label>
                <input
                  id="magic-topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={tx("Örn: yaz kahvesi lansmanı", "e.g. summer coffee launch")}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label htmlFor="magic-tone" className="mb-1 block text-xs text-[var(--muted)]">
                  {tx("Ton", "Tone")}
                </label>
                <select
                  id="magic-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">{tx("Ton seç (isteğe bağlı)", "Select tone (optional)")}</option>
                  {(Object.keys(TONE_LABELS) as Array<keyof typeof TONE_LABELS>).filter((k) => k !== "").map((k) => (
                    <option key={k} value={k}>
                      {TONE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="magic-audience" className="mb-1 block text-xs text-[var(--muted)]">
                  {tx("Hedef kitle", "Audience")}
                </label>
                <input
                  id="magic-audience"
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder={tx("Örn: 25–40 yaş şehirli", "e.g. urban audience aged 25-40")}
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
            id="tour-submit"
            type="submit"
            disabled={loading || !intent.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? t.creating : tx("Profesyonel prompt oluştur", "Generate professional prompt")}
          </button>
        </form>

        {isLoaded && user?.id && showSceneProjectUI && activeProject ? (
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[var(--text)]">
                {t.projectFlow} · {activeProject.title}
              </h3>
              <span className="text-xs text-[var(--muted)]">
                {projectScenes.length} {tx("sahne", "scenes")}
              </span>
            </div>
            {projectScenes.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                {tx("Bu projede henüz sahne yok. İlk üretimden sonra devamlılık hafızası otomatik başlar.", "No scenes yet in this project. Continuity memory starts automatically after the first generation.")}
              </p>
            ) : (
              <ol className="space-y-2">
                {projectScenes.slice(-6).map((scene) => (
                  <li key={scene.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs">
                    <p className="font-medium text-[var(--text)]">
                      {t.scene} {scene.sceneNo}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[var(--muted)]">{scene.userInput}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => editScene(scene)}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text)] hover:bg-white/5"
                      >
                        {t.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerateScene(scene)}
                        className="rounded-md border border-[var(--brand-lab)] px-2 py-1 text-[11px] text-[var(--brand-lab)] hover:bg-[var(--brand-lab-dim)]"
                      >
                        {t.regenerate}
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {(activeProject.characterProfile || activeProject.styleProfile) && (
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs">
                <p className="font-medium text-[var(--text)]">{tx("Proje continuity profili", "Project continuity profile")}</p>
                {activeProject.characterProfile ? (
                  <p className="mt-1 text-[var(--muted)]">{tx("Karakter", "Character")}: {activeProject.characterProfile}</p>
                ) : null}
                {activeProject.styleProfile ? (
                  <p className="mt-1 text-[var(--muted)]">{tx("Stil", "Style")}: {activeProject.styleProfile}</p>
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
                  handleClearRecent();
                }}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-xs font-normal text-[var(--muted)] hover:border-red-500/40 hover:text-red-200"
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
                      className="min-w-0 flex-1 text-left text-[var(--text)] transition hover:text-white"
                    >
                      <span className="block font-medium text-[var(--text)] line-clamp-1">{entry.intent || tx("(boş)", "(empty)")}</span>
                      <span className="mt-0.5 block text-[var(--muted)]">
                        {AI_TARGETS.find((t) => t.id === entry.target)?.label ?? entry.target} ·{" "}
                        {new Date(entry.at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </button>
                    {isLoaded && user?.id ? (
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => void toggleFavorite(entry.id)}
                          className={`rounded-md border px-2 py-1 text-[11px] ${
                            entry.isFavorite
                              ? "border-amber-400/50 bg-amber-400/10 text-amber-200"
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
                              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
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

        <section
          className="flex min-h-[280px] flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:min-h-[320px] sm:p-6"
          aria-busy={loading}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--text)]">{tx("Sonuç önizlemesi", "Result preview")}</h2>
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
                    {tx("Sadece prompt", "Prompt only")}
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
                    {tx("+ kullanım ipucu", "+ usage tip")}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void copyResult()}
                  aria-label={copied ? tx("Kopyalandı", "Copied") : tx("Promptu panoya kopyala", "Copy prompt")}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--accent)] bg-[var(--accent-dim)] px-4 py-2 text-sm font-semibold text-[var(--text)] shadow-sm hover:opacity-95"
                >
                  <ClipboardIcon className="shrink-0 opacity-90" />
                  {copied ? tx("Kopyalandı!", "Copied!") : tx("Kopyala", "Copy")}
                </button>
                <button
                  type="button"
                  onClick={() => void openInChatGPT()}
                  className="rounded-md border border-[var(--brand-lab)]/50 bg-[var(--brand-lab-dim)] px-3 py-2 text-sm font-medium text-[var(--brand-lab)] hover:opacity-90"
                >
                  {tx("ChatGPT'de aç", "Open in ChatGPT")}
                </button>
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-xs text-[var(--muted)]">{tx("Profesyonel prompt hazırlanıyor…", "Preparing professional prompt...")}</p>
              <ResultSkeleton />
            </div>
          ) : result ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              {resultProvider === "mock" ? (
                <p className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  <span className="font-semibold">{tx("Demo modu:", "Demo mode:")}</span>{" "}
                  {tx("Canlı yapay zeka çağrılmadı", "No live AI call was made")} (
                  <code className="rounded bg-black/30 px-1">PROMPTLAB_GENERATE_MODE=mock</code>).{" "}
                  {tx("Gerçek çıktı için .env içinde", "For real outputs, set")}{" "}
                  <code className="rounded bg-black/30 px-1">openai</code> {tx("veya", "or")}{" "}
                  <code className="rounded bg-black/30 px-1">groq</code> {tx("kullanın.", "in .env.")}
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
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-lab)]">{tx("Kullanım ipucu", "Usage tip")}</p>
                  <p className="mt-2 text-[var(--text)]">{usageNote}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)]/50 px-4 py-10 text-center">
              <p className="text-sm text-[var(--muted)]">{tx("Henüz sonuç yok.", "No result yet.")}</p>
              <p className="mt-2 max-w-sm text-xs text-[var(--muted)]">
                {tx("İstersen aşağıdaki örneklerden birine tıkla veya kendi cümlelerini yaz;", "Click a sample below or write your own request;")}{" "}
                <strong className="text-[var(--text)]">{tx("Profesyonel prompt oluştur", "Generate professional prompt")}</strong>{" "}
                {tx("butonuna bas — metin burada belirir.", "and the result will appear here.")}
              </p>
              <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
                {QUICK_STARTERS.slice(0, 3).map((s) => (
                  <button
                    key={`empty-${s.label}`}
                    type="button"
                    onClick={() => applyStarter(s)}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] hover:bg-[var(--brand-lab-dim)]"
                  >
                    {tx("Sample:", "Sample:")} {isEn ? QUICK_STARTER_LABELS_EN[s.id] ?? s.label : s.label}
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
            {t.about}
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href="/gizlilik" className="text-[var(--text)] hover:underline">
            Gizlilik / KVKK
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href="/hizmet-sartlari" className="text-[var(--text)] hover:underline">
            {tx("Hizmet şartları", "Terms of service")}
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href="/pricing" className="text-[var(--accent)] hover:underline">
            {t.pricing}
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href="/discover" className="text-[var(--muted)] hover:text-[var(--text)] hover:underline">
            Keşfet
          </Link>
        </p>
        <p className="mt-4 text-xs text-[var(--muted)]">
          {tx("© 2026 PromptLab. Tüm hakları saklıdır.", "© 2026 PromptLab. All rights reserved.")}
          <span className="mx-1.5 text-[var(--border)]">·</span>
          {tx("Ayrıntı için", "For details, see")}{" "}
          <Link href="/gizlilik" className="text-[var(--text)] underline hover:text-[var(--brand-lab)]">
            {tx("gizlilik sayfası", "privacy page")}
          </Link>
          .
        </p>
      </footer>
      <WorkbenchOnboarding />
    </div>
  );
}
