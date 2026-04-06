import { AI_TARGETS } from "@/lib/targets";

export type ParsedLedgerMeta = {
  creditCost?: number;
  fromDaily?: number;
  fromBonus?: number;
  target?: string;
};

export function parseLedgerMetaJson(raw: string | null | undefined): ParsedLedgerMeta | null {
  if (raw == null || raw === "") return null;
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const r = o as Record<string, unknown>;
    const creditCost = typeof r.creditCost === "number" ? r.creditCost : undefined;
    const fromDaily = typeof r.fromDaily === "number" ? r.fromDaily : undefined;
    const fromBonus = typeof r.fromBonus === "number" ? r.fromBonus : undefined;
    const target = typeof r.target === "string" ? r.target : undefined;
    if (creditCost == null && fromDaily == null && fromBonus == null && target == null) return null;
    return { creditCost, fromDaily, fromBonus, target };
  } catch {
    return null;
  }
}

function targetDisplayLabel(targetId: string, locale: "tr" | "en"): string {
  const row = AI_TARGETS.find((t) => t.id === targetId);
  if (row) return row.label;
  return targetId;
}

/** Profil / API cevabında meta stringini tek satır insan diline çevirir. */
export function formatLedgerMetaLine(meta: string | null | undefined, locale: "tr" | "en"): string | null {
  const parsed = parseLedgerMetaJson(meta ?? null);
  if (!parsed) return null;
  const isEn = locale === "en";
  const parts: string[] = [];
  if (parsed.target) {
    parts.push(
      isEn
        ? `Target: ${targetDisplayLabel(parsed.target, locale)}`
        : `Hedef: ${targetDisplayLabel(parsed.target, locale)}`,
    );
  }
  if (parsed.creditCost != null || parsed.fromDaily != null || parsed.fromBonus != null) {
    const cost = parsed.creditCost;
    const d = parsed.fromDaily ?? 0;
    const b = parsed.fromBonus ?? 0;
    if (cost != null) {
      parts.push(
        isEn
          ? `${cost} cr. (daily ${d}, purchased ${b})`
          : `${cost} kr. (günlük ${d}, bonus ${b})`,
      );
    } else {
      parts.push(isEn ? `daily ${d}, purchased ${b}` : `günlük ${d}, bonus ${b}`);
    }
  }
  return parts.length ? parts.join(" — ") : null;
}
