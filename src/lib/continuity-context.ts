type SceneLike = {
  sceneNo: number;
  userInput: string;
  generatedPrompt: string;
};

function cleanLine(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Son sahnelerden LLM'e verilecek devamlılık bağlamını üretir.
 */
export function buildContinuityContext(scenes: SceneLike[]): string {
  return buildContinuityContextWithProjectProfiles(scenes);
}

type ContinuityProfiles = {
  characterProfile?: string | null;
  styleProfile?: string | null;
};

export function buildContinuityContextWithProjectProfiles(
  scenes: SceneLike[],
  profiles?: ContinuityProfiles,
): string {
  const character = cleanLine(String(profiles?.characterProfile ?? ""));
  const style = cleanLine(String(profiles?.styleProfile ?? ""));
  if (!scenes.length && !character && !style) return "";
  const ordered = [...scenes].sort((a, b) => a.sceneNo - b.sceneNo).slice(-6);
  const profileLines: string[] = [];
  if (character) profileLines.push(`Character profile: ${character.slice(0, 500)}`);
  if (style) profileLines.push(`Style profile: ${style.slice(0, 500)}`);
  const blocks = ordered.map((s) => {
    const user = cleanLine(s.userInput).slice(0, 260);
    const out = cleanLine(s.generatedPrompt).slice(0, 520);
    return `Scene ${s.sceneNo}\nUser intent: ${user}\nGenerated prompt summary: ${out}`;
  });
  return [
    "Continuity memory from previous scenes:",
    ...profileLines,
    ...blocks,
    "Keep character identity, wardrobe/colors, environment style, and visual tone consistent unless the user explicitly changes them.",
  ].join("\n\n");
}

/**
 * Scene satırında saklanacak kısa continuity özeti.
 */
export function buildContinuitySnapshot(currentGeneratedPrompt: string): string {
  return cleanLine(currentGeneratedPrompt).slice(0, 900);
}

function keywordsFrom(text: string): string[] {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "ve",
    "ile",
    "için",
    "icin",
    "olan",
    "gibi",
    "daha",
    "çok",
    "cok",
  ]);
  return cleanLine(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stop.has(w))
    .slice(0, 120);
}

export function scoreContinuity(params: {
  promptText: string;
  previousScenes: SceneLike[];
  characterProfile?: string | null;
  styleProfile?: string | null;
}): { score: number; reasons: string[] } {
  const promptK = new Set(keywordsFrom(params.promptText));
  const profileK = keywordsFrom(`${params.characterProfile ?? ""} ${params.styleProfile ?? ""}`);
  const sceneK = keywordsFrom(params.previousScenes.map((s) => `${s.userInput} ${s.generatedPrompt}`).join(" "));
  const profileHits = profileK.filter((k) => promptK.has(k)).length;
  const sceneHits = sceneK.filter((k) => promptK.has(k)).length;
  const profileRatio = profileK.length ? profileHits / profileK.length : 0.6;
  const sceneRatio = sceneK.length ? sceneHits / sceneK.length : 0.6;
  const raw = Math.round(Math.min(1, 0.55 * profileRatio + 0.45 * sceneRatio) * 100);
  const score = Math.max(45, raw);
  const reasons: string[] = [];
  reasons.push(`Profile token match: ${profileHits}/${Math.max(1, profileK.length)}`);
  reasons.push(`Scene memory match: ${sceneHits}/${Math.max(1, sceneK.length)}`);
  if (score >= 80) reasons.push("Strong continuity alignment");
  else if (score >= 65) reasons.push("Moderate continuity alignment");
  else reasons.push("Continuity could be tightened");
  return { score, reasons };
}
