export const AI_TARGETS = [
  {
    id: "universal",
    label: "Akıllı optimizasyon (tüm araçlar)",
  },
  { id: "chatgpt", label: "ChatGPT (genel)" },
  { id: "claude", label: "Claude" },
  { id: "gemini", label: "Google Gemini" },
  { id: "copilot", label: "GitHub Copilot" },
  { id: "midjourney", label: "Midjourney" },
  { id: "dalle", label: "DALL·E / görsel" },
  { id: "runway", label: "Runway (video)" },
  { id: "veo", label: "Google Veo (video)" },
  { id: "sora", label: "OpenAI Sora (video)" },
  { id: "kling", label: "Kling (video)" },
  { id: "pika", label: "Pika (video)" },
  { id: "generic", label: "Diğer / genel amaçlı" },
] as const;

export type AiTargetId = (typeof AI_TARGETS)[number]["id"];
