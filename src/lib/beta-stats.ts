/**
 * Beta dönemi için tahmini sosyal kanıt sayısı.
 * Sabit bir başlangıç tarihinden itibaren her gün biraz artar (gerçek sayaç değil).
 */
const ANCHOR_MS = Date.UTC(2026, 2, 1);

export function getEstimatedWeeklyPromptCount(nowMs: number = Date.now()): number {
  const days = Math.max(0, Math.floor((nowMs - ANCHOR_MS) / 86_400_000));
  const base = 612;
  const perDay = 5 + (days % 4);
  return base + days * perDay;
}
