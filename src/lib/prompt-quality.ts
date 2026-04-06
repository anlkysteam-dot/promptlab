import type { AiTargetId } from "@/lib/targets";

export type PromptTemplateKind = "coding" | "social" | "email" | "presentation" | "image" | "generic";
export type PromptQualityMode = "normal" | "advanced";

const CODING_RE = /\b(code|kod|typescript|javascript|python|react|next\.?js|api|bug|refactor|algorithm|script)\b/i;
const SOCIAL_RE = /\b(instagram|tiktok|twitter|x post|linkedin|reel|caption|hashtag|cta)\b/i;
const EMAIL_RE = /\b(email|e-posta|mail|subject line|newsletter)\b/i;
const PRESENT_RE = /\b(slayt|sunum|presentation|deck)\b/i;
const IMAGE_RE = /\b(midjourney|dall|image|visual|logo|poster|illustration|render|photoreal)\b/i;

export function inferPromptTemplate(input: string, target: AiTargetId): PromptTemplateKind {
  if (target === "midjourney" || target === "dalle") return "image";
  if (target === "copilot") return "coding";
  if (CODING_RE.test(input)) return "coding";
  if (SOCIAL_RE.test(input)) return "social";
  if (EMAIL_RE.test(input)) return "email";
  if (PRESENT_RE.test(input)) return "presentation";
  if (IMAGE_RE.test(input)) return "image";
  return "generic";
}

export function templateInstruction(kind: PromptTemplateKind): string {
  switch (kind) {
    case "coding":
      return "Template focus: coding prompt with language/stack context, acceptance criteria, edge cases, and expected output format.";
    case "social":
      return "Template focus: social content prompt with hook, value bullets, voice/tone, CTA, and optional variant count.";
    case "email":
      return "Template focus: email writing prompt with objective, recipient context, tone, length limit, and subject line guidance.";
    case "presentation":
      return "Template focus: presentation prompt with slide structure, narrative flow, and concise per-slide bullet limits.";
    case "image":
      return "Template focus: image-generation prompt with subject, composition, style, lighting, camera/framing cues, and negative constraints when useful.";
    default:
      return "Template focus: generic high-quality task prompt with clear role, objective, constraints, and output format.";
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
    default:
      return `${base} Include clarity, constraints, and output quality.`;
  }
}

export function qualityModeInstruction(mode: PromptQualityMode): string {
  if (mode === "advanced") {
    return "Quality mode: ADVANCED. Be strict and demanding: sharpen constraints, remove ambiguity, and optimize for expert-level output quality.";
  }
  return "Quality mode: NORMAL. Keep the prompt strong but concise and broadly usable.";
}
