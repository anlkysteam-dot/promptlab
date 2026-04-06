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
