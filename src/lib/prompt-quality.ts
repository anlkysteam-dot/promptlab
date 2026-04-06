import type { AiTargetId } from "@/lib/targets";

export type PromptTemplateKind = "coding" | "social" | "email" | "presentation" | "image" | "video" | "generic";
export type PromptQualityMode = "normal" | "advanced";
export type MediaPreset =
  | "none"
  | "video_ad_vertical"
  | "video_cinematic_short"
  | "video_product_demo"
  | "video_storyboard"
  | "image_product_packshot"
  | "image_social_ad"
  | "image_concept_art"
  | "image_logo_direction";

const CODING_RE = /\b(code|kod|typescript|javascript|python|react|next\.?js|api|bug|refactor|algorithm|script)\b/i;
const SOCIAL_RE = /\b(instagram|tiktok|twitter|x post|linkedin|reel|caption|hashtag|cta)\b/i;
const EMAIL_RE = /\b(email|e-posta|mail|subject line|newsletter)\b/i;
const PRESENT_RE = /\b(slayt|sunum|presentation|deck)\b/i;
const IMAGE_RE = /\b(midjourney|dall|image|visual|logo|poster|illustration|render|photoreal)\b/i;
const VIDEO_RE = /\b(video|reklam filmi|shot|scene|storyboard|sora|runway|veo|kling|pika|cinematic|fps)\b/i;

export function inferPromptTemplate(input: string, target: AiTargetId): PromptTemplateKind {
  if (target === "midjourney" || target === "dalle" || target === "stable_diffusion") return "image";
  if (target === "runway" || target === "veo" || target === "sora" || target === "kling" || target === "pika")
    return "video";
  if (target === "copilot") return "coding";
  if (CODING_RE.test(input)) return "coding";
  if (SOCIAL_RE.test(input)) return "social";
  if (EMAIL_RE.test(input)) return "email";
  if (PRESENT_RE.test(input)) return "presentation";
  if (VIDEO_RE.test(input)) return "video";
  if (IMAGE_RE.test(input)) return "image";
  return "generic";
}

export function templateInstruction(kind: PromptTemplateKind): string {
  switch (kind) {
    case "coding":
      return "Template focus: coding prompt with explicit sections: Role, Objective, Technical Context, Constraints, Acceptance Criteria, Output Format.";
    case "social":
      return "Template focus: social content prompt with explicit sections: Role, Objective, Audience, Tone, Content Rules, CTA, Output Format.";
    case "email":
      return "Template focus: email writing prompt with explicit sections: Role, Objective, Recipient Context, Tone, Constraints, Required Email Parts (subject + body blocks), Output Format.";
    case "presentation":
      return "Template focus: presentation prompt with explicit sections: Role, Objective, Audience, Slide Structure, Narrative Flow, Constraints, Output Format.";
    case "image":
      return "Template focus: image-generation prompt with explicit sections: Subject, Scene, Composition, Style, Lighting, Camera/Framing, Negative Constraints. Include continuity lock for recurring characters/objects unless user requests a change.";
    case "video":
      return "Template focus: video-generation prompt with explicit sections: Objective, Scene/Shot Sequence, Camera Motion, Timing/Duration, Visual Style, Continuity Rules, Output Format. Include continuity lock for recurring characters/wardrobe/location unless user requests a change.";
    default:
      return "Template focus: generic high-quality task prompt with explicit sections: Role, Objective, Context, Constraints, Success Criteria, Output Format.";
  }
}

export function checklistInstruction(kind: PromptTemplateKind): string {
  const base = "Append one final line that starts with 'Quality checklist:' followed by concise comma-separated checkpoints.";
  switch (kind) {
    case "coding":
      return `${base} Include correctness, edge-cases, and runnable output.`;
    case "social":
      return `${base} Include hook clarity, audience fit, and CTA strength.`;
    case "email":
      return `${base} Include tone fit, clarity, and actionability.`;
    case "presentation":
      return `${base} Include flow, clarity, and slide brevity.`;
    case "image":
      return `${base} Include subject clarity, composition, and style consistency.`;
    case "video":
      return `${base} Include temporal flow, camera clarity, and continuity consistency.`;
    default:
      return `${base} Include clarity, constraints, and output quality.`;
  }
}

export function qualityModeInstruction(mode: PromptQualityMode): string {
  if (mode === "advanced") {
    return [
      "Quality mode: ADVANCED.",
      "Be strict: remove vague adjectives, name measurable outcomes, and prefer imperative, testable constraints.",
      "The final prompt MUST use a fixed skeleton with labeled sections (e.g. ROLE, OBJECTIVE, CONTEXT, CONSTRAINTS, OUTPUT FORMAT, NEGATIVE / AVOID).",
      "Each section should be skimmable: short lines or bullets, no long prose paragraphs.",
      "Include a brief 'Anti-patterns' or 'Do NOT' list (concrete examples of what to avoid).",
      "End with a single 'Quality checklist:' line (comma-separated) tying constraints to success.",
    ].join(" ");
  }
  return "Quality mode: NORMAL. Keep the prompt strong but concise and broadly usable.";
}

export function mediaPresetInstruction(preset: MediaPreset): string {
  switch (preset) {
    case "video_ad_vertical":
      return "Media preset: vertical ad video (9:16, short-form). Require a fast hook in first 1-2 seconds, explicit USP callout, concise audio direction (music/SFX mood), and a clear ending CTA frame.";
    case "video_cinematic_short":
      return "Media preset: cinematic short film style. Require shot progression, mood arc, lens/camera motion cues, continuity-preserving transitions, and a final end-card instruction (logo/tagline or closing frame).";
    case "video_product_demo":
      return "Media preset: product demo video. Require feature-focused shots, practical use moments, benefits on screen, explicit USP block, audio direction, and clean end card.";
    case "video_storyboard":
      return "Media preset: storyboard-ready video prompt. Require numbered shots with duration, camera action, scene objective, transition type, plus USP line and final frame direction.";
    case "image_product_packshot":
      return "Media preset: product packshot image. Require clean background, lighting setup, hero angle, detail shot cues, and ad-ready composition.";
    case "image_social_ad":
      return "Media preset: social ad image. Require thumb-stopping composition, visual hierarchy, explicit USP emphasis, campaign mood, and optional text-safe zones.";
    case "image_concept_art":
      return "Media preset: concept art image. Require worldbuilding cues, style references, material/lighting details, and cinematic framing.";
    case "image_logo_direction":
      return "Media preset: logo concept direction. Require brand personality, shape language, color constraints, and clear do/don't guidance.";
    default:
      return "Media preset: none.";
  }
}
