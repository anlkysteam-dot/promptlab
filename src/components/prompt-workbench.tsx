"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BeforeAfterExamples } from "@/components/before-after-examples";
import { LogoMark } from "@/components/logo-mark";
import { WorkbenchErrorCta } from "@/components/workbench-error-cta";
import { getEstimatedWeeklyPromptCount } from "@/lib/beta-stats";
import { buildIntentForApi, TONE_LABELS } from "@/lib/workbench-compose-intent";
import { consumeRestoreEntry, pushRecentPrompt, readRecentPrompts, type RecentPromptEntry } from "@/lib/workbench-recent";
import { getWorkbenchTargetHint } from "@/lib/workbench-target-hints";
import { getWorkbenchUsageNote } from "@/lib/workbench-usage-notes";
import type { MediaPreset, PromptQualityMode } from "@/lib/prompt-quality";
import { QUICK_STARTERS, type QuickStarterCategory } from "@/lib/quick-starters";
import { AI_TARGETS, type AiTargetId } from "@/lib/targets";
import type { LabFlavor, LabFormat, MidjourneyVersionId } from "@/lib/lab-presets";
import { generationCreditCost } from "@/lib/usage";
import { FREE_DAILY_CREDIT_BUDGET } from "@/lib/constants";
import { WorkbenchOnboarding } from "@/components/workbench-onboarding";
import { WorkbenchShortcutsModal } from "@/components/workbench-shortcuts";
import { CreditSpendToast, type CreditToastPayload } from "@/components/credit-spend-toast";

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

function stylePresetVisual(stylePreset: string): { icon: string; chipClass: string } {
  const key = stylePreset.toLowerCase();
  if (key.includes("cyber")) return { icon: "🟣", chipClass: "border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200" };
  if (key.includes("anime")) return { icon: "🎌", chipClass: "border-pink-400/50 bg-pink-500/15 text-pink-200" };
  if (key.includes("sinem") || key.includes("cinematic"))
    return { icon: "🎬", chipClass: "border-amber-300/45 bg-amber-500/15 text-amber-100" };
  if (key.includes("real")) return { icon: "📷", chipClass: "border-emerald-300/45 bg-emerald-500/15 text-emerald-100" };
  if (key.includes("belgesel") || key.includes("documentary"))
    return { icon: "📽️", chipClass: "border-sky-300/45 bg-sky-500/15 text-sky-100" };
  if (key.includes("yağlı") || key.includes("oil")) return { icon: "🎨", chipClass: "border-orange-300/45 bg-orange-500/15 text-orange-100" };
  return { icon: "✨", chipClass: "border-[var(--border)] bg-[var(--bg)] text-[var(--text)]" };
}

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
      <div className="h-3 max-w-full rounded bg-[var(--muted)]/40" style={{ width: "92%" }} />
      <div className="h-3 w-full rounded bg-[var(--muted)]/30" />
      <div className="h-3 w-4/5 rounded bg-[var(--muted)]/30" />
      <div className="h-3 w-full rounded bg-[var(--muted)]/25" />
      <div className="h-3 w-3/5 rounded bg-[var(--muted)]/25" />
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
type SavedCharacter = { name: string; profile: string; referenceUrl?: string };

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
  const [copiedSceneId, setCopiedSceneId] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<OutputMode>("prompt-only");
  const [qualityMode, setQualityMode] = useState<PromptQualityMode>("normal");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("tr");
  const [mediaPreset, setMediaPreset] = useState<MediaPreset>("none");
  const [starterMemory, setStarterMemory] = useState<Record<string, number>>({});
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [starterCategory, setStarterCategory] = useState<StarterCategory>("all");
  const [selectedStarterId, setSelectedStarterId] = useState<string>("");
  const [sidebarRecent, setSidebarRecent] = useState<RecentPromptEntry[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [selectedCharacterName, setSelectedCharacterName] = useState("");
  const [characterNameDraft, setCharacterNameDraft] = useState("");
  const [characterReferenceDraft, setCharacterReferenceDraft] = useState("");
  const [editingCharacterName, setEditingCharacterName] = useState("");
  const [continuityLock, setContinuityLock] = useState(true);
  const [settingsTab, setSettingsTab] = useState<"general" | "director" | "details">("general");
  const resultSectionRef = useRef<HTMLElement | null>(null);
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
  const [mjIncludeVersion, setMjIncludeVersion] = useState(false);
  const [mjIncludeAr, setMjIncludeAr] = useState(false);
  const [mjVersion, setMjVersion] = useState<MidjourneyVersionId>("6");
  const [includeSuggestedParams, setIncludeSuggestedParams] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dailyUsage, setDailyUsage] = useState<{
    premium: boolean;
    used: number;
    limit: number;
    remaining: number;
    creditBalance: number;
  } | null>(null);
  const [creditToastOpen, setCreditToastOpen] = useState(false);
  const [creditToastPayload, setCreditToastPayload] = useState<CreditToastPayload | null>(null);

  const weeklyEstimate = useMemo(() => getEstimatedWeeklyPromptCount(), []);
  const effectiveTarget = useMemo<AiTargetId>(() => (expertMode ? target : "universal"), [expertMode, target]);
  const targetHint = useMemo(() => getWorkbenchTargetHint(effectiveTarget), [effectiveTarget]);
  const usageNote = useMemo(() => getWorkbenchUsageNote(effectiveTarget), [effectiveTarget]);
  const creditCostThisRun = useMemo(
    () => generationCreditCost(dailyUsage?.premium ?? false, qualityMode),
    [dailyUsage?.premium, qualityMode],
  );
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
  const selectedStarter = useMemo(
    () => starterList.find((s) => s.id === selectedStarterId) ?? starterList[0] ?? null,
    [starterList, selectedStarterId],
  );
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

  useEffect(() => {
    const entry = consumeRestoreEntry();
    if (!entry) return;
    setIntent(entry.intent);
    setTarget(entry.target);
    setExpertMode(entry.target !== "universal");
    setTopic(entry.topic ?? "");
    setTone(entry.tone ?? "");
    setAudience(entry.audience ?? "");
    setResult(entry.prompt);
    setResultProvider("openai");
    setError(null);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShortcutsOpen(false);
        return;
      }
      const el = e.target as HTMLElement;
      const inField = el.closest("input, textarea, select, [contenteditable=true]");
      if (inField) return;
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();
        setShortcutsOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    if (starterList.length === 0) {
      setSelectedStarterId("");
      return;
    }
    if (!starterList.some((s) => s.id === selectedStarterId)) {
      setSelectedStarterId(starterList[0].id);
    }
  }, [starterList, selectedStarterId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isLoaded && user?.id) {
        try {
          const r = await fetch("/api/history?limit=5", { cache: "no-store" });
          if (!r.ok || cancelled) return;
          const j = (await r.json()) as { items?: RecentPromptEntry[] };
          if (!cancelled) setSidebarRecent(Array.isArray(j.items) ? j.items : []);
          return;
        } catch {
          // fall back to local entries
        }
      }
      if (!cancelled) setSidebarRecent(readRecentPrompts().slice(0, 5));
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id, result]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("promptlab_character_library_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedCharacter[];
      if (Array.isArray(parsed)) {
        setSavedCharacters(
          parsed.filter(
            (c) =>
              typeof c?.name === "string" &&
              c.name.trim() &&
              typeof c?.profile === "string" &&
              c.profile.trim() &&
              (c.referenceUrl == null || typeof c.referenceUrl === "string"),
          ),
        );
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("promptlab_character_library_v1", JSON.stringify(savedCharacters.slice(0, 30)));
  }, [savedCharacters]);

  useEffect(() => {
    if (qualityMode !== "advanced") return;
    if (!mediaKind) return;
    setMediaPreset((prev) => {
      if (prev !== "none") return prev;
      return defaultMediaPresetForTarget(effectiveTarget);
    });
  }, [qualityMode, mediaKind, effectiveTarget]);

  const dismissCreditToast = useCallback(() => {
    setCreditToastOpen(false);
    setCreditToastPayload(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/usage", { cache: "no-store" });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as {
          premium?: boolean;
          used?: number;
          limit?: number | null;
          remaining?: number | null;
          creditBalance?: number;
        };
        if (cancelled) return;
        setDailyUsage({
          premium: Boolean(j.premium),
          used: typeof j.used === "number" ? j.used : 0,
          limit: typeof j.limit === "number" ? j.limit : FREE_DAILY_CREDIT_BUDGET,
          remaining: typeof j.remaining === "number" ? j.remaining : 0,
          creditBalance: typeof j.creditBalance === "number" ? j.creditBalance : 0,
        });
      } catch {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (effectiveTarget !== "midjourney") {
      setMjIncludeVersion(false);
      setMjIncludeAr(false);
    }
  }, [effectiveTarget]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setResultProvider(null);
    const payload = buildIntentForApi(intent, { topic, tone, audience });
    if (!payload.trim()) return;
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      window.setTimeout(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 20);
    }
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
          mjIncludeVersion: effectiveTarget === "midjourney" ? mjIncludeVersion : false,
          mjIncludeAr: effectiveTarget === "midjourney" ? mjIncludeAr : false,
          mjVersion: effectiveTarget === "midjourney" ? mjVersion : "6",
          includeSuggestedParams: expertMode && includeSuggestedParams,
          continuityLock,
        }),
      });
      const raw = await r.text();
      let j: {
        prompt?: string;
        error?: string;
        provider?: "openai" | "groq" | "mock";
        premium?: boolean;
        creditCost?: number;
        creditBalance?: number | null;
        spentFromDaily?: number;
        spentFromBonus?: number;
        remaining?: number | null;
      } = {};
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
      if (typeof j.creditCost === "number") {
        setCreditToastPayload({
          premium: Boolean(j.premium),
          creditCost: j.creditCost,
          creditBalance: typeof j.creditBalance === "number" ? j.creditBalance : null,
          spentFromDaily: typeof j.spentFromDaily === "number" ? j.spentFromDaily : 0,
          spentFromBonus: typeof j.spentFromBonus === "number" ? j.spentFromBonus : 0,
          remainingDaily: typeof j.remaining === "number" ? j.remaining : null,
        });
        setCreditToastOpen(true);
      }
      try {
        const u = await fetch("/api/usage", { cache: "no-store" });
        if (u.ok) {
          const ju = (await u.json()) as {
            premium?: boolean;
            used?: number;
            limit?: number | null;
            remaining?: number | null;
            creditBalance?: number;
          };
          setDailyUsage({
            premium: Boolean(ju.premium),
            used: typeof ju.used === "number" ? ju.used : 0,
            limit: typeof ju.limit === "number" ? ju.limit : FREE_DAILY_CREDIT_BUDGET,
            remaining: typeof ju.remaining === "number" ? ju.remaining : 0,
            creditBalance: typeof ju.creditBalance === "number" ? ju.creditBalance : 0,
          });
        }
      } catch {
        // no-op
      }
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
    const composedCharacterProfile = [
      projectCharacterProfile.trim(),
      characterReferenceDraft.trim() ? `Ref: ${characterReferenceDraft.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
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
          characterProfile: composedCharacterProfile,
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

  function saveCharacterToLibrary() {
    const name = characterNameDraft.trim();
    const profile = projectCharacterProfile.trim();
    if (!name || !profile) return;
    const finalName = editingCharacterName || name;
    setSavedCharacters((prev) =>
      [{ name: finalName, profile, referenceUrl: characterReferenceDraft.trim() || undefined }, ...prev.filter((c) => c.name !== finalName)].slice(0, 30),
    );
    setEditingCharacterName("");
    setSelectedCharacterName(finalName);
    setCharacterNameDraft("");
    setCharacterReferenceDraft("");
  }

  function applyCharacterFromLibrary(name: string) {
    const row = savedCharacters.find((c) => c.name === name);
    if (!row) return;
    setProjectCharacterProfile(row.profile);
    setCharacterReferenceDraft(row.referenceUrl ?? "");
    setSelectedCharacterName(name);
  }

  function removeCharacterFromLibrary(name: string) {
    setSavedCharacters((prev) => prev.filter((c) => c.name !== name));
    if (selectedCharacterName === name) setSelectedCharacterName("");
    if (editingCharacterName === name) setEditingCharacterName("");
  }

  function startEditingCharacter(name: string) {
    const row = savedCharacters.find((c) => c.name === name);
    if (!row) return;
    setEditingCharacterName(name);
    setCharacterNameDraft(name);
    setProjectCharacterProfile(row.profile);
    setCharacterReferenceDraft(row.referenceUrl ?? "");
    setSelectedCharacterName(name);
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

  async function copyScenePrompt(scene: SceneItem) {
    const text = scene.generatedPrompt?.trim() || scene.userInput;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSceneId(scene.id);
      window.setTimeout(() => setCopiedSceneId((prev) => (prev === scene.id ? null : prev)), 1800);
    } catch {
      setError(tx("Sahne promptu kopyalanamadı.", "Could not copy scene prompt."));
    }
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

  function onTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!loading && intent.trim() && form) form.requestSubmit();
    }
  }

  function submitWorkbenchForm() {
    const form = document.getElementById("workbench-form") as HTMLFormElement | null;
    if (form && !loading && intent.trim()) form.requestSubmit();
  }

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );
  const showCharacterEditor =
    editingCharacterName !== "" || selectedCharacterName === "" || characterNameDraft.trim().length > 0;

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {copied ? tx("Prompt panoya kopyalandı.", "Prompt copied to clipboard.") : ""}
      </div>

      <div className="rounded-lg border border-[var(--brand-lab-dim)] bg-[var(--brand-lab-dim)] px-3 py-2 text-center text-sm text-[var(--text)]">
        <span className="font-medium text-[var(--brand-lab)]">{tx("Bu hafta", "This week")}</span>{" "}
        <span className="tabular-nums font-semibold">{weeklyEstimate.toLocaleString(isEn ? "en-US" : "tr-TR")}</span>{" "}
        {tx("prompt üretildi", "prompts generated")} — <span className="text-[var(--muted)]">{tx("beta tahmini", "beta estimate")}</span>
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen((v) => !v)}
          className="app-pressable rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]"
        >
          {mobileSidebarOpen ? tx("Menüyü kapat", "Close menu") : tx("Menü", "Menu")}
        </button>
      </div>

      <div
        className={`grid gap-6 lg:items-start ${
          sidebarCollapsed ? "lg:grid-cols-[92px_minmax(0,1fr)]" : "lg:grid-cols-[260px_minmax(0,1fr)]"
        }`}
      >
        <aside
          className={`${mobileSidebarOpen ? "block" : "hidden"} lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto`}
        >
          <div className="animate-app-panel-in rounded-xl border border-[var(--border)] bg-[var(--panel-surface)] p-4">
            <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <LogoMark className="h-7 w-7 shrink-0" />
              {!sidebarCollapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">Prompt Lab</p>
                  <p className="text-[11px] text-[var(--muted)]">{tx("Hızlı panel", "Quick panel")}</p>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setSidebarCollapsed((s) => !s)}
                className="app-pressable ml-auto hidden rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)] lg:block"
                title={sidebarCollapsed ? tx("Paneli genişlet", "Expand panel") : tx("Paneli daralt", "Collapse panel")}
                aria-label={sidebarCollapsed ? tx("Paneli genişlet", "Expand panel") : tx("Paneli daralt", "Collapse panel")}
              >
                {sidebarCollapsed ? "»" : "«"}
              </button>
            </div>
            {!sidebarCollapsed ? (
              <div id="tour-profile" className="flex flex-col gap-2">
                {!isLoaded ? (
                  <span className="text-sm text-[var(--muted)]">Oturum…</span>
                ) : user ? (
                  <>
                    {dailyUsage ? (
                      <div
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--muted)]"
                        title={tx(
                          "Bugünkü günlük kota ve satın alınan bonus kredi (İstanbul günü).",
                          "Today’s daily quota and purchased bonus credits (Istanbul day).",
                        )}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <LogoMark className="h-4 w-4 shrink-0" />
                          {dailyUsage.premium ? (
                            <>
                              <span className="rounded-full border border-[var(--accent)]/50 bg-[var(--accent-dim)] px-1.5 py-0.5 font-semibold text-[var(--accent)]">
                                Premium
                              </span>
                              <span className="tabular-nums font-semibold text-[var(--text)]">
                                {dailyUsage.creditBalance}
                              </span>
                              <span>{tx("bonus kredi", "bonus cr.")}</span>
                            </>
                          ) : (
                            <>
                              <span className="font-medium text-[var(--text)]">
                                {tx("Günlük", "Daily")} {dailyUsage.remaining}/{dailyUsage.limit}
                              </span>
                              <span className="rounded-full border border-[var(--brand-lab)]/40 bg-[var(--brand-lab-dim)] px-1.5 py-0.5 tabular-nums font-semibold text-[var(--text)]">
                                +{dailyUsage.creditBalance} {tx("bonus", "bonus")}
                              </span>
                            </>
                          )}
                        </div>
                        {!dailyUsage.premium ? (
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]/50">
                            <div
                              className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    ((dailyUsage.limit - dailyUsage.remaining) / Math.max(1, dailyUsage.limit)) * 100,
                                  ),
                                )}%`,
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <Link
                      href={isEn ? "/en/profile" : "/tr/profil"}
                      title={tx("Profilim", "My profile")}
                      className="app-pressable rounded-md border border-[var(--border)] px-3 py-2 text-center text-sm font-medium text-[var(--text)] hover:bg-[var(--hover-surface)]"
                    >
                      👤 {tx("Profilim", "My profile")}
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    title={t.login}
                    className="app-pressable rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center text-sm font-medium text-[var(--text)] hover:bg-[var(--hover-surface)]"
                  >
                    🔐 {t.login}
                  </Link>
                )}
                <Link
                  href="/pricing"
                  title={t.pricing}
                  className="app-pressable rounded-md border border-[var(--accent)] bg-[var(--accent-dim)] px-3 py-2 text-center text-sm font-semibold text-[var(--text)] hover:opacity-95"
                >
                  💎 {t.pricing}
                </Link>
              </div>
            ) : null}

            <div id="tour-quick-start" className={`mt-5 border-t border-[var(--border)] pt-4 ${sidebarCollapsed ? "hidden lg:hidden" : ""}`}>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{t.quickStart}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {tx("Hazır senaryo havuzu:", "Starter pool:")}{" "}
                <span className="font-medium text-[var(--text)]">
                  {starterCategory === "all" ? totalStarterVariants : categoryStarterVariants}
                </span>
              </p>
              <div className="mt-2 space-y-2">
                <label htmlFor="starter-category-select" className="text-[11px] text-[var(--muted)]">
                  {tx("Kategori", "Category")}
                </label>
                <select
                  id="starter-category-select"
                  value={starterCategory}
                  onChange={(e) => setStarterCategory(e.target.value as StarterCategory)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-xs text-[var(--text)]"
                >
                  {(Object.keys(STARTER_CATEGORY_LABELS) as StarterCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {isEn ? STARTER_CATEGORY_LABELS_EN[cat] : STARTER_CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>

                <label htmlFor="starter-item-select" className="text-[11px] text-[var(--muted)]">
                  {tx("Örnek", "Preset")}
                </label>
                <select
                  id="starter-item-select"
                  value={selectedStarter?.id ?? ""}
                  onChange={(e) => setSelectedStarterId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-xs text-[var(--text)]"
                >
                  {starterList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {isEn ? QUICK_STARTER_LABELS_EN[s.id] ?? s.label : s.label}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedStarter) applyStarter(selectedStarter);
                    }}
                    className="app-pressable rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-xs font-medium text-[var(--text)] hover:border-[var(--brand-lab)]"
                  >
                    {tx("Uygula", "Apply")}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyStarter(starterList[Math.floor(Math.random() * starterList.length)] ?? QUICK_STARTERS[0])}
                    className="app-pressable rounded-lg border border-dashed border-[var(--accent)] px-2.5 py-2 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--brand-lab-dim)]"
                  >
                    🎲 {tx("Rastgele", "Random")}
                  </button>
                </div>
              </div>
            </div>

            {!sidebarCollapsed ? (
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  {tx("Son üretimler", "Recent history")}
                </p>
                {sidebarRecent.length === 0 ? (
                  <div className="mt-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-xs text-[var(--muted)]">
                    <p>{tx("Henüz bir üretim yok.", "No generations yet.")}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setIntent(
                          tx(
                            "Markam için 3 farklı Instagram post fikri ve açıklama metni üret.",
                            "Generate 3 Instagram post ideas with captions for my brand.",
                          ),
                        )
                      }
                      className="mt-2 text-[var(--accent)] underline underline-offset-2"
                    >
                      {tx("İlk üretimini başlat", "Start your first generation")}
                    </button>
                  </div>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {sidebarRecent.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setIntent(row.intent ?? "");
                            if (row.target) {
                              setTarget(row.target);
                              setExpertMode(row.target !== "universal");
                            }
                            setTopic(row.topic ?? "");
                            setTone(row.tone ?? "");
                            setAudience(row.audience ?? "");
                            setResult(row.prompt ?? null);
                            setError(null);
                          }}
                          className="app-pressable w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-2.5 py-2 text-left text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
                          title={row.intent}
                        >
                          <span className="line-clamp-1">{row.intent || tx("(boş)", "(empty)")}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            <div className={`mt-5 border-t border-[var(--border)] pt-4 ${sidebarCollapsed ? "hidden lg:hidden" : ""}`}>
              <details className="group">
                <summary className="app-pressable flex cursor-pointer list-none items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-medium text-[var(--text)] hover:bg-[var(--hover-surface)]">
                  <span>••• {tx("Diğer bağlantılar", "More links")}</span>
                  <span className="text-[var(--muted)] transition-transform duration-200 group-open:rotate-180">⌄</span>
                </summary>
                <div className="animate-panel-pop-in mt-2 grid gap-1.5 text-xs">
                  <Link href="/hakkimizda" className="app-pressable rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]">
                    {tx("Hakkımızda", "About")}
                  </Link>
                  <Link
                    href={locale === "en" ? "/en/how-it-works" : "/tr/nasil-calisir"}
                    className="app-pressable rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                  >
                    {tx("Nasıl çalışır", "How it works")}
                  </Link>
                  <Link
                    href={locale === "en" ? "/en/faq" : "/tr/sss"}
                    className="app-pressable rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                  >
                    {tx("SSS", "FAQ")}
                  </Link>
                  <Link
                    href={locale === "en" ? "/en/credits" : "/tr/kredi"}
                    className="app-pressable rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                  >
                    {tx("Kredi al", "Buy credits")}
                  </Link>
                  <Link href="/gizlilik" className="app-pressable rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]">
                    Gizlilik / KVKK
                  </Link>
                  <Link
                    href="/hizmet-sartlari"
                    className="app-pressable rounded-md px-2 py-1.5 text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                  >
                    {tx("Hizmet şartları", "Terms of service")}
                  </Link>
                </div>
              </details>
            </div>

            {sidebarCollapsed ? (
              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <div className="grid gap-2">
                  {user ? (
                    <Link
                      href={isEn ? "/en/profile" : "/tr/profil"}
                      title={tx("Profilim", "My profile")}
                      className="app-pressable rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-center text-sm text-[var(--text)]"
                    >
                      👤
                    </Link>
                  ) : (
                    <Link
                      href="/auth"
                      title={t.login}
                      className="app-pressable rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-center text-sm text-[var(--text)]"
                    >
                      🔐
                    </Link>
                  )}
                  <Link
                    href="/pricing"
                    title={t.pricing}
                    className="app-pressable rounded-md border border-[var(--accent)] bg-[var(--accent-dim)] px-2 py-2 text-center text-sm text-[var(--text)]"
                  >
                    💎
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(false)}
                    title={tx("Hızlı başlatı göster", "Show quick start")}
                    className="app-pressable rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-center text-sm text-[var(--text)]"
                  >
                    ⚡
                  </button>
                  <details className="group">
                    <summary
                      title={tx("Diğer bağlantılar", "More links")}
                      className="app-pressable flex list-none cursor-pointer items-center justify-center rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm text-[var(--text)]"
                    >
                      •••
                    </summary>
                    <div className="animate-panel-pop-in mt-2 grid gap-1 rounded-md border border-[var(--border)] bg-[var(--bg)] p-1 text-xs">
                      <Link href="/hakkimizda" className="app-pressable rounded px-2 py-1 text-[var(--muted)] hover:text-[var(--text)]">
                        {tx("Hk", "Ab")}
                      </Link>
                      <Link
                        href={locale === "en" ? "/en/how-it-works" : "/tr/nasil-calisir"}
                        className="app-pressable rounded px-2 py-1 text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        {tx("Nc", "HiW")}
                      </Link>
                      <Link
                        href={locale === "en" ? "/en/faq" : "/tr/sss"}
                        className="app-pressable rounded px-2 py-1 text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        SSS
                      </Link>
                      <Link
                        href={locale === "en" ? "/en/credits" : "/tr/kredi"}
                        className="app-pressable rounded px-2 py-1 text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        {tx("Kr", "Cr")}
                      </Link>
                    </div>
                  </details>
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <LogoMark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
              <h1 className="flex flex-wrap items-baseline gap-2 text-3xl tracking-tight sm:text-4xl">
                <span className="font-normal text-[var(--text)]">Prompt</span>
                <span className="font-bold text-[var(--brand-lab)]">Lab</span>
                <span
                  className="rounded-full border border-[var(--warn-border)] bg-[var(--warn-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--warn-fg)]"
                  title={tx("Erken erişim — geri bildirimine değer veriyoruz", "Early access — your feedback matters")}
                >
                  Beta
                </span>
              </h1>
            </div>
            <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
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
          </header>

          <main className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-6">

        {isLoaded && user?.id && showSceneProjectUI ? (
          <section className="grid gap-3 lg:col-start-1 lg:row-start-1 lg:grid-cols-[260px_1fr] lg:self-start">
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
          <div className="relative">
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
            className="min-h-[120px] w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 pr-10 text-[15px] leading-relaxed text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            {intent.trim() ? (
              <button
                type="button"
                onClick={() => setIntent("")}
                className="app-pressable absolute right-2 top-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs text-[var(--muted)] hover:text-[var(--text)]"
                title={tx("Metni temizle", "Clear input")}
                aria-label={tx("Metni temizle", "Clear input")}
              >
                ✕
              </button>
            ) : null}
          </div>
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

          <button
            type="submit"
            disabled={loading || !intent.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? t.creating : tx("Profesyonel prompt oluştur", "Generate professional prompt")}
          </button>

          <details className="group rounded-lg border border-[var(--border)] bg-[var(--bg)]/30 p-4" open={false}>
            <summary className="cursor-pointer list-none text-sm font-medium text-[var(--text)]">
              {tx("Ayarlar (tıklayıp aç)", "Settings (click to expand)")}
            </summary>
            <div className="mt-4 space-y-4">
              <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setSettingsTab("general")}
                  className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                    settingsTab === "general"
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {tx("Genel ayarlar", "General")}
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("director")}
                  className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                    settingsTab === "director"
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {tx("Karakter & Sahne", "Character & Scene")}
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab("details")}
                  className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                    settingsTab === "details"
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "text-[var(--muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {tx("Detaylar", "Details")}
                </button>
              </div>

          {settingsTab === "general" && expertMode && mediaKind ? (
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
              {effectiveTarget === "midjourney" ? (
                <div className="mt-3 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-3">
                  <p className="text-xs font-medium text-[var(--muted)]">
                    {tx("Midjourney CLI (isteğe bağlı)", "Midjourney CLI (optional)")}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {tx(
                      "Açıksa modelden tam token (--v, --ar) istenir; PromptLab otomatik yapıştırmaz.",
                      "When enabled, the model is asked to emit exact tokens; PromptLab does not auto-paste into Midjourney.",
                    )}
                  </p>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text)]">
                    <input
                      type="checkbox"
                      checked={mjIncludeVersion}
                      onChange={(e) => setMjIncludeVersion(e.target.checked)}
                      className="rounded border-[var(--border)]"
                    />
                    {tx("--v ekle", "Append --v")}
                  </label>
                  {mjIncludeVersion ? (
                    <select
                      value={mjVersion}
                      onChange={(e) => setMjVersion(e.target.value as MidjourneyVersionId)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                    >
                      <option value="6">--v 6</option>
                      <option value="6.1">--v 6.1</option>
                      <option value="7">--v 7</option>
                      <option value="niji6">--niji 6</option>
                    </select>
                  ) : null}
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text)]">
                    <input
                      type="checkbox"
                      checked={mjIncludeAr}
                      onChange={(e) => setMjIncludeAr(e.target.checked)}
                      className="rounded border-[var(--border)]"
                    />
                    {tx(
                      "--ar ekle (Lab en-boy seçimini kullanır; önce 16:9 vb. seç)",
                      "Include --ar (uses Lab aspect; pick 16:9 etc. above)",
                    )}
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          {settingsTab === "general" && expertMode ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-4">
              <label className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={includeSuggestedParams}
                  onChange={(e) => setIncludeSuggestedParams(e.target.checked)}
                  className="mt-0.5 rounded border-[var(--border)]"
                />
                <span>
                  <span className="font-medium text-[var(--text)]">
                    {tx("Önerilen parametreler satırı", "Suggested parameters line")}
                  </span>
                  {tx(
                    " — hedef ve Lab ile uyumlu başlangıç CLI / alan ipuçları (yönlendirme; otomatik yapıştırılmaz).",
                    " — target-aware starter hints (guidance only; nothing auto-pasted).",
                  )}
                </span>
              </label>
            </div>
          ) : null}

          {settingsTab === "director" && isLoaded && user?.id && showSceneProjectUI ? (
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
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] hover:bg-[var(--hover-surface)] disabled:opacity-40"
                >
                  {projectLoading ? t.creating : t.createProject}
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <label htmlFor="project-character-library" className="mb-1 block text-xs text-[var(--muted)]">
                    {tx("Karakterlerim", "My characters")}
                  </label>
                  <div className="mb-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select
                      id="project-character-library"
                      value={selectedCharacterName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSelectedCharacterName(name);
                        if (name) applyCharacterFromLibrary(name);
                      }}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                    >
                      <option value="">{tx("Kütüphaneden seç", "Pick from library")}</option>
                      {savedCharacters.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={characterNameDraft}
                      onChange={(e) => setCharacterNameDraft(e.target.value)}
                      placeholder={tx("İsim", "Name")}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)]"
                    />
                  </div>
                  {!showCharacterEditor ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCharacterName(selectedCharacterName);
                        setCharacterNameDraft(selectedCharacterName || tx("Yeni karakter", "New character"));
                      }}
                      className="rounded-md border border-dashed border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] hover:text-[var(--text)]"
                    >
                      {selectedCharacterName ? tx("✎ Karakteri düzenle", "✎ Edit character") : tx("+ Yeni karakter oluştur", "+ Create new character")}
                    </button>
                  ) : (
                    <>
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
                      <input
                        type="url"
                        value={characterReferenceDraft}
                        onChange={(e) => setCharacterReferenceDraft(e.target.value)}
                        placeholder={tx("Görsel referans linki (opsiyonel)", "Reference image link (optional)")}
                        className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)]"
                      />
                      <button
                        type="button"
                        onClick={saveCharacterToLibrary}
                        className="mt-2 rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text)] hover:bg-[var(--hover-surface)]"
                      >
                        {editingCharacterName
                          ? tx("Karakteri güncelle", "Update character")
                          : tx("Karakteri kaydet", "Save character")}
                      </button>
                    </>
                  )}
                  {savedCharacters.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {savedCharacters.slice(0, 6).map((c) => (
                        <li
                          key={c.name}
                          className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => applyCharacterFromLibrary(c.name)}
                              className="line-clamp-1 text-left font-medium text-[var(--text)] hover:text-[var(--accent)]"
                              title={c.profile}
                            >
                              {c.name}
                            </button>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => startEditingCharacter(c.name)}
                                className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--muted)] hover:text-[var(--text)]"
                              >
                                {tx("Düz", "Edit")}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCharacterFromLibrary(c.name)}
                                className="rounded border border-[var(--err-border)] px-1.5 py-0.5 text-[10px] text-[var(--err-fg)]"
                              >
                                {tx("Sil", "Del")}
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
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
                  <div
                    className={`mb-2 rounded-lg border px-3 py-2 text-xs ${stylePresetVisual(String(projectStylePreset)).chipClass}`}
                  >
                    <span className="font-medium">
                      {stylePresetVisual(String(projectStylePreset)).icon} {tx("Stil kartı:", "Style card:")}
                    </span>{" "}
                    <span className="font-semibold">{projectStylePreset}</span>
                  </div>
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
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={continuityLock}
                    onChange={(e) => setContinuityLock(e.target.checked)}
                    className="rounded border-[var(--border)]"
                  />
                  <span>
                    {tx(
                      "Devamlılık kilidi (karakter fiziksel özelliklerini sabit tut)",
                      "Continuity lock (keep core physical character traits fixed)",
                    )}
                  </span>
                </label>
              </div>
            </div>
          ) : null}
          {settingsTab === "director" && !(isLoaded && user?.id && showSceneProjectUI) ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)]/40 px-3 py-2 text-xs text-[var(--muted)]">
              {tx("Bu sekme video hedefi + giriş ile aktif olur.", "This tab is available with video target + sign in.")}
            </div>
          ) : null}

          {settingsTab === "general" ? <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-[var(--text)]">{tx("Hedef / optimizasyon", "Target / optimization")}</span>
            {!expertMode ? (
              <div className="rounded-lg border border-[var(--brand-lab)]/35 bg-[var(--brand-lab-dim)]/40 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--text)]">{tx("Akıllı optimizasyon (varsayılan)", "Smart optimization (default)")}</p>
                  <details className="group">
                    <summary className="cursor-pointer list-none rounded-full border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--muted)] hover:text-[var(--text)]">
                      i
                    </summary>
                    <div className="animate-panel-pop-in mt-2 max-w-md rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2 text-xs leading-relaxed text-[var(--muted)]">
                      {targetHint}
                    </div>
                  </details>
                </div>
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
                <details className="group">
                  <summary className="cursor-pointer list-none text-xs text-[var(--muted)] hover:text-[var(--text)]">
                    {tx("Hedef hakkında kısa bilgi", "Quick target hint")} ?
                  </summary>
                  <p className="animate-panel-pop-in mt-1 text-xs leading-relaxed text-[var(--muted)]">{targetHint}</p>
                </details>
              </>
            )}
          </div> : null}

          {settingsTab === "general" ? <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{tx("Prompt kalite modu", "Prompt quality mode")}</p>
            <div className="mt-2 inline-flex rounded-lg border border-[var(--border)] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setQualityMode("normal")}
                className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                  qualityMode === "normal"
                    ? "bg-[var(--accent)] text-[var(--on-accent)]"
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
                    ? "bg-[var(--accent)] text-[var(--on-accent)]"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {"Advanced"}
              </button>
            </div>
            <details className="group mt-2">
              <summary className="cursor-pointer list-none text-xs text-[var(--muted)] hover:text-[var(--text)]">
                {tx("Kalite modu açıklaması", "Quality mode hint")} ?
              </summary>
              <p className="animate-panel-pop-in mt-1 text-xs leading-relaxed text-[var(--muted)]">
                {qualityMode === "advanced"
                  ? tx(
                      "Daha sıkı kısıtlar, bölümlendirilmiş çıktı ve net kurallarla daha okunaklı prompt üretir.",
                      "Produces more readable prompts with stricter constraints, sections, and explicit rules.",
                    )
                  : tx("Hızlı ve dengeli bir kalite seviyesi sunar.", "Provides a fast and balanced quality level.")}
              </p>
            </details>
            <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
              {dailyUsage?.premium
                ? tx(
                    `Premium: bu üretim ${creditCostThisRun} kredi ağırlığında (günlük limit yok).`,
                    `Premium: this run weighs ${creditCostThisRun} credits (no daily cap).`,
                  )
                : tx(
                    `Ücretsiz: bu üretim ${creditCostThisRun} kredi harcar (günlük bütçe ${FREE_DAILY_CREDIT_BUDGET} kredi).`,
                    `Free: this run uses ${creditCostThisRun} credits (daily budget ${FREE_DAILY_CREDIT_BUDGET} credits).`,
                  )}
              {dailyUsage && !dailyUsage.premium ? (
                <>
                  {" "}
                  {tx("Kalan:", "Remaining:")}{" "}
                  <span className="font-medium text-[var(--text)]">{dailyUsage.remaining}</span>
                  {dailyUsage.creditBalance > 0 ? (
                    <>
                      {" "}
                      · {tx("Bonus:", "Bonus:")}{" "}
                      <span className="font-medium text-[var(--text)]">{dailyUsage.creditBalance}</span>
                    </>
                  ) : null}
                </>
              ) : null}
            </p>
            {user?.id && !dailyUsage?.premium ? (
              <p className="mt-1 text-xs">
                <Link
                  href={isEn ? "/en/credits" : "/tr/kredi"}
                  className="text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2 hover:decoration-[var(--accent)]"
                >
                  {tx("Kredi satın al", "Buy credits")}
                </Link>
              </p>
            ) : null}
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
          </div> : null}

          {settingsTab === "general" && mediaKind && qualityMode === "advanced" ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-5">
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

          {settingsTab === "details" ? <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/40 p-5">
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
          </div> : null}
            </div>
          </details>

          {error ? (
            <div className="rounded-lg border border-[var(--warn-border)] bg-[var(--warn-bg)] px-3 py-2 text-sm text-[var(--warn-fg)]">
              <p>{error}</p>
              <WorkbenchErrorCta message={error} locale={locale} />
            </div>
          ) : null}

          <button
            id="tour-submit"
            type="submit"
            disabled={loading || !intent.trim()}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </form>

        {isLoaded && user?.id && showSceneProjectUI && activeProject ? (
          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 lg:col-start-1">
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
              <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
                {projectScenes.slice(-6).map((scene) => (
                  <article
                    key={scene.id}
                    className="w-[220px] shrink-0 snap-start rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs"
                  >
                    <p className="font-medium text-[var(--text)]">
                      {t.scene} {scene.sceneNo}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[var(--muted)]">{scene.userInput}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => editScene(scene)}
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--muted)] hover:bg-[var(--hover-surface)] hover:text-[var(--text)]"
                      >
                        {t.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => regenerateScene(scene)}
                        className="rounded-md border border-[var(--brand-lab)]/45 bg-[var(--brand-lab-dim)]/20 px-2 py-1 text-[11px] text-[var(--brand-lab)] hover:bg-[var(--brand-lab-dim)]/35"
                      >
                        {t.regenerate}
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyScenePrompt(scene)}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)]"
                        title={tx("Sahne promptunu kopyala", "Copy scene prompt")}
                        aria-label={tx("Sahne promptunu kopyala", "Copy scene prompt")}
                      >
                        <ClipboardIcon className="h-3.5 w-3.5" />
                        {copiedSceneId === scene.id ? tx("Kopyalandı", "Copied") : tx("Kopyala", "Copy")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {projectScenes.length > 0 ? (
              <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--muted)]">
                <p className="font-medium text-[var(--text)]">{tx("Senaryo akışı", "Story flow")}</p>
                <p className="mt-1 line-clamp-3">
                  {projectScenes
                    .slice(-6)
                    .map((s) => `${s.sceneNo}. ${s.userInput}`)
                    .join(" → ")}
                </p>
              </div>
            ) : null}
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

        <section
          ref={resultSectionRef}
          className="flex min-h-[280px] flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:min-h-[320px] sm:p-6 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-start lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:shadow-2xl"
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
                        ? "bg-[var(--accent)] text-[var(--on-accent)]"
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
                        ? "bg-[var(--accent)] text-[var(--on-accent)]"
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
                <p className="rounded-lg border border-[var(--warn-border)] bg-[var(--warn-bg)] px-3 py-2 text-xs text-[var(--warn-fg)]">
                  <span className="font-semibold">{tx("Demo modu:", "Demo mode:")}</span>{" "}
                  {tx("Canlı yapay zeka çağrılmadı", "No live AI call was made")} (
                  <code className="rounded bg-[var(--code-bg)] px-1">PROMPTLAB_GENERATE_MODE=mock</code>).{" "}
                  {tx("Gerçek çıktı için .env içinde", "For real outputs, set")}{" "}
                  <code className="rounded bg-[var(--code-bg)] px-1">openai</code> {tx("veya", "or")}{" "}
                  <code className="rounded bg-[var(--code-bg)] px-1">groq</code> {tx("kullanın.", "in .env.")}
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  >
                    <span aria-hidden="true">✦</span>
                    {isEn ? QUICK_STARTER_LABELS_EN[s.id] ?? s.label : s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="lg:col-span-2">
          <BeforeAfterExamples locale={locale} />
        </div>
      </main>

      <footer className="mt-auto border-t border-[var(--border)] pt-8 text-center">
        <p className="text-sm text-[var(--muted)]">
          <Link href="/hakkimizda" className="text-[var(--text)] hover:underline">
            {t.about}
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link
            href={locale === "en" ? "/en/how-it-works" : "/tr/nasil-calisir"}
            className="text-[var(--text)] hover:underline"
          >
            {tx("Nasıl çalışır", "How it works")}
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href={locale === "en" ? "/en/faq" : "/tr/sss"} className="text-[var(--text)] hover:underline">
            {tx("SSS", "FAQ")}
          </Link>
          <span className="mx-2 text-[var(--border)]">·</span>
          <Link href={locale === "en" ? "/en/credits" : "/tr/kredi"} className="text-[var(--text)] hover:underline">
            {tx("Kredi al", "Buy credits")}
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
          <Link href="/discover" className="text-[var(--muted)] hover:text-[var(--text)] hover:underline">
            {tx("Keşfet", "Discover")}
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
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 p-2.5 backdrop-blur lg:inset-x-auto lg:right-6 lg:bottom-4 lg:w-[420px] lg:max-w-[calc(100vw-2rem)] lg:rounded-xl lg:border">
        <div className="flex items-center justify-between gap-2">
          <p className="hidden text-xs text-[var(--muted)] sm:block">
            {tx("Bu çalıştırma maliyeti:", "Cost this run:")}{" "}
            <span className="font-semibold text-[var(--text)]">{creditCostThisRun}</span>{" "}
            {tx("kredi", "credits")}
          </p>
          <button
            type="button"
            onClick={submitWorkbenchForm}
            disabled={loading || !intent.trim()}
            className="app-pressable inline-flex w-full items-center justify-center rounded-lg bg-[var(--accent)] px-3.5 py-2.5 text-sm font-semibold text-[var(--on-accent)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {loading ? t.creating : tx("Profesyonel prompt oluştur", "Generate professional prompt")}
          </button>
        </div>
      </div>
        </div>
      </div>
      <WorkbenchShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} locale={locale} />
      <WorkbenchOnboarding locale={locale} />
      <CreditSpendToast
        open={creditToastOpen}
        payload={creditToastPayload}
        locale={locale}
        onDismiss={dismissCreditToast}
      />
    </div>
  );
}
