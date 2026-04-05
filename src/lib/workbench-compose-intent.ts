export type MagicFields = {
  topic: string;
  tone: string;
  audience: string;
};

const TONE_LABELS: Record<string, string> = {
  "": "",
  casual: "Eğlenceli / samimi",
  formal: "Resmi / öz",
  technical: "Teknik / net",
  warm: "Yumuşak / güven veren",
  sales: "Satış odaklı",
};

export function toneLabel(value: string): string {
  return TONE_LABELS[value] ?? value;
}

export function buildIntentForApi(baseIntent: string, meta: MagicFields): string {
  const t = baseIntent.trim();
  const lines: string[] = [];
  if (meta.topic.trim()) lines.push(`Konu / odak: ${meta.topic.trim()}`);
  if (meta.tone && TONE_LABELS[meta.tone]) lines.push(`İstenen ton: ${TONE_LABELS[meta.tone]}`);
  if (meta.audience.trim()) lines.push(`Hedef kitle: ${meta.audience.trim()}`);
  if (!lines.length) return t;
  return `${t}\n\n${lines.join("\n")}`;
}

export { TONE_LABELS };
