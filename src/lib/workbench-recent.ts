import type { AiTargetId } from "@/lib/targets";

const STORAGE_KEY = "promptlab_recent_prompts_v1";
const MAX = 10;

export type RecentPromptEntry = {
  id: string;
  at: string;
  intent: string;
  target: AiTargetId;
  prompt: string;
  isFavorite?: boolean;
  shareToFeed?: boolean;
  topic: string;
  tone: string;
  audience: string;
  settingsSnapshot?: WorkbenchSettingsSnapshot;
};

export type WorkbenchSettingsSnapshot = {
  qualityMode?: "normal" | "advanced";
  outputLanguage?: "tr" | "en";
  mediaPreset?: string;
  labFormat?: "" | "16:9" | "9:16" | "1:1";
  labFlavor?: "none" | "midjourney" | "sora" | "stable_diffusion";
  negativePrompt?: string;
  mjIncludeVersion?: boolean;
  mjIncludeAr?: boolean;
  mjVersion?: "6" | "6.1" | "7" | "niji6";
  includeSuggestedParams?: boolean;
  continuityLock?: boolean;
  expertMode?: boolean;
  selectedCharacterName?: string;
  projectCharacterProfile?: string;
  projectStyleProfile?: string;
  projectStylePreset?: string;
  characterReferenceDraft?: string;
};

function safeParse(raw: string | null): RecentPromptEntry[] {
  if (!raw) return [];
  try {
    const j = JSON.parse(raw) as unknown;
    if (!Array.isArray(j)) return [];
    return j.filter(
      (x): x is RecentPromptEntry =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as RecentPromptEntry).id === "string" &&
        typeof (x as RecentPromptEntry).prompt === "string" &&
        typeof (x as RecentPromptEntry).intent === "string",
    );
  } catch {
    return [];
  }
}

export function readRecentPrompts(): RecentPromptEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function pushRecentPrompt(entry: Omit<RecentPromptEntry, "id" | "at">): void {
  if (typeof window === "undefined") return;
  const row: RecentPromptEntry = {
    ...entry,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  };
  const prev = readRecentPrompts();
  const next = [row, ...prev.filter((p) => p.prompt !== row.prompt || p.intent !== row.intent)].slice(0, MAX);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearRecentPrompts(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** One-shot handoff when opening Lab from profile (recent list). */
export const RESTORE_ENTRY_KEY = "promptlab_restore_entry_v1";
const SETTINGS_KEY = "promptlab_recent_settings_by_history_v1";

export function storeRestoreEntry(entry: RecentPromptEntry): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(RESTORE_ENTRY_KEY, JSON.stringify(entry));
  } catch {
    // no-op
  }
}

export function consumeRestoreEntry(): RecentPromptEntry | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RESTORE_ENTRY_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(RESTORE_ENTRY_KEY);
  try {
    const entry = JSON.parse(raw) as RecentPromptEntry;
    if (typeof entry?.intent !== "string" || typeof entry?.prompt !== "string") return null;
    return entry;
  } catch {
    return null;
  }
}

function readSettingsMap(): Record<string, WorkbenchSettingsSnapshot> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return {};
  try {
    const j = JSON.parse(raw) as unknown;
    if (!j || typeof j !== "object" || Array.isArray(j)) return {};
    return j as Record<string, WorkbenchSettingsSnapshot>;
  } catch {
    return {};
  }
}

function writeSettingsMap(map: Record<string, WorkbenchSettingsSnapshot>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(map));
}

export function storeRecentSettings(historyId: string, settings: WorkbenchSettingsSnapshot): void {
  if (typeof window === "undefined") return;
  const id = historyId.trim();
  if (!id) return;
  const prev = readSettingsMap();
  const next: Record<string, WorkbenchSettingsSnapshot> = { [id]: settings };
  for (const [k, v] of Object.entries(prev)) {
    if (k !== id && Object.keys(next).length < 120) next[k] = v;
  }
  writeSettingsMap(next);
}

export function readRecentSettings(historyId: string): WorkbenchSettingsSnapshot | null {
  if (typeof window === "undefined") return null;
  const id = historyId.trim();
  if (!id) return null;
  const map = readSettingsMap();
  return map[id] ?? null;
}
