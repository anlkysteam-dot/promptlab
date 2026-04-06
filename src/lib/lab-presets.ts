import type { AiTargetId } from "@/lib/targets";

/** Görsel/video çerçeve oranı — model diline göre talimat üretilir. */
export type LabFormat = "" | "16:9" | "9:16" | "1:1";

/** Hızlı “mod” — hedef modelle uyumlu ek anahtar kelime / sözdizimi ipuçları. */
export type LabFlavor = "none" | "midjourney" | "sora" | "stable_diffusion";

function aspectMj(format: LabFormat): string {
  switch (format) {
    case "16:9":
      return "16:9";
    case "9:16":
      return "9:16";
    case "1:1":
      return "1:1";
    default:
      return "";
  }
}

function formatInstruction(format: LabFormat, target: AiTargetId): string {
  if (!format) return "";
  const mj = aspectMj(format);

  if (target === "midjourney") {
    return `Aspect ratio: include Midjourney parameter --ar ${mj} in the final prompt (exact syntax).`;
  }

  if (["runway", "veo", "sora", "kling", "pika"].includes(target)) {
    const label =
      format === "16:9"
        ? "16:9 landscape (widescreen)"
        : format === "9:16"
          ? "9:16 vertical (shorts / reels / TikTok)"
          : "1:1 square";
    return `Video framing: ${label}. State aspect ratio and composition explicitly for the video model.`;
  }

  if (["dalle", "stable_diffusion"].includes(target)) {
    const label =
      format === "16:9"
        ? "16:9 widescreen"
        : format === "9:16"
          ? "9:16 portrait"
          : "1:1 square";
    return `Image framing: ${label}. Include explicit aspect ratio / resolution hints appropriate for the image model (e.g. SDXL width×height or square crop).`;
  }

  return `Output aspect / framing: ${format}. Mention it clearly in the prompt.`;
}

function flavorInstruction(flavor: LabFlavor): string {
  switch (flavor) {
    case "midjourney":
      return "Style: Midjourney-optimized — comma-separated visual tokens, strong style/mood words, optional --stylize / --v if helpful; avoid chatty prose.";
    case "sora":
      return "Style: Sora-like video — physically coherent motion, clear temporal beats, camera continuity, realistic lighting.";
    case "stable_diffusion":
      return "Style: Stable Diffusion / SDXL — detailed tags, weight emphasis where useful, negative prompt section if applicable, realistic or stylized keywords as needed.";
    default:
      return "";
  }
}

/**
 * LLM kullanıcı isteğine eklenen Lab blok metni (İngilizce talimat).
 */
export function buildLabPresetBlock(input: {
  format: LabFormat;
  negativePrompt: string;
  flavor: LabFlavor;
  target: AiTargetId;
}): string {
  const parts: string[] = [];
  const fmt = formatInstruction(input.format, input.target);
  if (fmt) parts.push(fmt);

  const neg = input.negativePrompt.replace(/\s+/g, " ").trim().slice(0, 600);
  if (neg) {
    parts.push(
      `Negative constraints (must NOT appear in the generated media / output): ${neg}. Integrate as an explicit negative prompt or “avoid” list as appropriate for the target tool.`,
    );
  }

  const fl = flavorInstruction(input.flavor);
  if (fl) parts.push(fl);

  if (!parts.length) return "";
  return ["[LAB_PRESETS]", ...parts].join("\n");
}
