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
