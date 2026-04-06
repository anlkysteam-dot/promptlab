import type { AiTargetId } from "./targets";

const TARGET_LINES: Record<AiTargetId, string> = {
  universal:
    "Structure the final prompt with clear Role, Task, and Format sections in English; no vendor-specific parameters or tags; maximize portability across major chat LLMs.",
  chatgpt:
    "Structure as a ChatGPT-ready message: role, context, constraints, and desired output format (bullets or sections if helpful).",
  claude:
    "Structure for Claude: clear instructions, optional document framing, safety-aligned phrasing, explicit output shape.",
  gemini:
    "Structure for Gemini: concise task statement; note if the user may later attach images or files.",
  copilot:
    "Structure for a coding assistant: language/runtime, file or module context, acceptance criteria, style and error-handling expectations.",
  midjourney:
    "Produce a Midjourney-style prompt: vivid comma-separated visual description, style, lighting, aspect ratio hint; avoid conversational filler.",
  dalle:
    "Produce an image-model prompt: scene, subjects, style, composition, lighting; stay policy-safe.",
  runway:
    "Produce a runway-ready video prompt: scene progression, camera movement, subject continuity, and mood in concise cinematic language.",
  veo:
    "Produce a Veo-style video prompt with subject continuity, shot-level camera direction, timing hints, and atmosphere details.",
  sora:
    "Produce a Sora-oriented video prompt with clear temporal flow, scene transitions, and consistent character/environment traits.",
  kling:
    "Produce a Kling-ready cinematic prompt with character continuity, visual style constraints, and movement instructions.",
  pika:
    "Produce a Pika-ready short-video prompt including style, camera movement, pacing, and continuity details.",
  generic:
    "Produce a general-purpose prompt: goal, audience, tone, length, and structured output expectations.",
};

/**
 * Yerel / demo: gerçek LLM çağrılmaz. Çıktı İngilizce ve hedef araca göre çerçevelenir.
 */
export function buildMockPrompt(intent: string, target: AiTargetId): string {
  const escaped = intent.slice(0, 4_000).replace(/\r\n/g, "\n").trim();
  const focus = TARGET_LINES[target];
  return `[DEMO — no live LLM call; set PROMPTLAB_GENERATE_MODE=openai or groq for real output]

You are an expert assistant. Address the following user goal (text may be non-English; understand intent):
"""
${escaped}
"""

${focus}

Respond with only the final deliverable the user asked for, unless they explicitly requested explanation or steps.`;
}
