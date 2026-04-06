import type { AiTargetId } from "@/lib/targets";

/** Görsel/video çerçeve oranı — model diline göre talimat üretilir. */
export type LabFormat = "" | "16:9" | "9:16" | "1:1";

/** Hızlı “mod” — hedef modelle uyumlu ek anahtar kelime / sözdizimi ipuçları. */
export type LabFlavor = "none" | "midjourney" | "sora" | "stable_diffusion";

export type MidjourneyVersionId = "6" | "6.1" | "7" | "niji6";

/** Kullanıcı açıkça seçtiğinde LLM’e Midjourney CLI satırı yazdırılır; uygulama otomatik yapıştırmaz. */
export type MidjourneyCliOptions = {
  includeVersion: boolean;
  version: MidjourneyVersionId;
  includeAr: boolean;
};

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

function formatInstruction(format: LabFormat, target: AiTargetId, midjourneyCli?: MidjourneyCliOptions): string {
  if (!format) return "";
  const mj = aspectMj(format);

  if (target === "midjourney") {
    if (midjourneyCli?.includeAr) {
      return `Aspect ratio: include Midjourney parameter --ar ${mj} in the final prompt (exact syntax).`;
    }
    return `Framing intent: compose for ${mj} (${format}) aspect using descriptive language; do not add Midjourney --ar/--v CLI tokens unless the LAB opt-in lines below explicitly require them.`;
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
      return "Style: Midjourney-optimized — comma-separated visual tokens, strong style/mood words; avoid chatty prose. Do not invent --v/--ar/--stylize unless the LAB block explicitly asks for those tokens.";
    case "sora":
      return "Style: Sora-like video — physically coherent motion, clear temporal beats, camera continuity, realistic lighting.";
    case "stable_diffusion":
      return "Style: Stable Diffusion / SDXL — detailed tags, weight emphasis where useful, negative prompt section if applicable, realistic or stylized keywords as needed.";
    default:
      return "";
  }
}

function midjourneyVersionCliLine(version: MidjourneyVersionId): string {
  if (version === "niji6") {
    return `Midjourney CLI (user opted in): append the exact Niji tokens your build supports (commonly --niji 6) at the end of the final /imagine line; verify against the current Midjourney UI.`;
  }
  return `Midjourney CLI (user opted in): append the exact suffix --v ${version} at the end of the final /imagine line (token only; no extra words).`;
}

/**
 * LLM kullanıcı isteğine eklenen Lab blok metni (İngilizce talimat).
 */
export function buildLabPresetBlock(input: {
  format: LabFormat;
  negativePrompt: string;
  flavor: LabFlavor;
  target: AiTargetId;
  midjourneyCli?: MidjourneyCliOptions;
}): string {
  const parts: string[] = [];
  const fmt = formatInstruction(input.format, input.target, input.midjourneyCli);
  if (fmt) parts.push(fmt);

  const neg = input.negativePrompt.replace(/\s+/g, " ").trim().slice(0, 600);
  if (neg) {
    parts.push(
      `Negative constraints (must NOT appear in the generated media / output): ${neg}. Integrate as an explicit negative prompt or “avoid” list as appropriate for the target tool.`,
    );
  }

  const fl = flavorInstruction(input.flavor);
  if (fl) parts.push(fl);

  const mj = input.midjourneyCli;
  if (input.target === "midjourney" && mj?.includeVersion) {
    parts.push(midjourneyVersionCliLine(mj.version));
  }

  if (!parts.length) return "";
  return ["[LAB_PRESETS]", ...parts].join("\n");
}

/**
 * Hedef + Lab lezzeti için tek satırlık “başlangıç parametresi” yönlendirmesi (yalnızca kullanıcı onaylarsa).
 * Ürün otomatik CLI eklemez; model metne bilgi amaçlı öneri koyabilir.
 */
export function buildSuggestedParamsBlock(input: {
  enabled: boolean;
  target: AiTargetId;
  flavor: LabFlavor;
  format: LabFormat;
}): string {
  if (!input.enabled) return "";

  const ar =
    input.format === "16:9"
      ? "16:9"
      : input.format === "9:16"
        ? "9:16"
        : input.format === "1:1"
          ? "1:1"
          : null;

  const hints: string[] = [];

  if (input.target === "midjourney" || input.flavor === "midjourney") {
    hints.push(
      `Midjourney: common starters include --v 6, ${ar ? `--ar ${ar}` : "--ar 16:9"}, --stylize ~100–400, --chaos 0–25; verify against your Midjourney version.`,
    );
  }
  if (input.target === "stable_diffusion" || input.flavor === "stable_diffusion") {
    hints.push(
      "SDXL / A1111 / ComfyUI: set resolution in the UI; use tag-style positives and a dedicated negative field.",
    );
  }
  if (input.target === "sora" || input.flavor === "sora") {
    hints.push(
      "Sora-like: state duration, aspect ratio, and camera in plain language; avoid flags the product does not support.",
    );
  }
  if (["runway", "veo", "kling", "pika"].includes(input.target)) {
    hints.push("Video tools: name aspect ratio, shot length, and motion; match the host app’s fields when you paste.");
  }

  if (hints.length === 0) {
    hints.push(
      "Align phrasing with your host tool’s fields; PromptLab does not auto-append vendor CLI parameters — you paste the final line yourself.",
    );
  }

  return ["[SUGGESTED_PARAMETERS]", "Optional hints only (informational; not auto-inserted by PromptLab):", ...hints.map((h) => `- ${h}`)].join(
    "\n",
  );
}
