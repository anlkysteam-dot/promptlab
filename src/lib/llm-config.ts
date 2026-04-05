import OpenAI from "openai";



export type GenerateMode = "openai" | "groq" | "mock";



export function getGenerateMode(): GenerateMode {

  const raw = process.env.PROMPTLAB_GENERATE_MODE?.trim().toLowerCase();

  if (raw === "groq") return "groq";

  if (raw === "mock") return "mock";

  return "openai";

}



/** Üretimde mock yalnızca bilinçli açılırsa (yanlışlıkla demo kalmasın). */

export function isMockModeAllowed(): boolean {

  if (process.env.NODE_ENV !== "production") return true;

  return process.env.PROMPTLAB_ALLOW_MOCK_IN_PRODUCTION === "true";

}



export function createLlmClient(mode: Exclude<GenerateMode, "mock">): OpenAI {

  if (mode === "groq") {

    return new OpenAI({

      apiKey: process.env.GROQ_API_KEY ?? "",

      baseURL: "https://api.groq.com/openai/v1",

    });

  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

}



export function getChatModel(mode: Exclude<GenerateMode, "mock">): string {

  if (mode === "groq") {

    return process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

  }

  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

}


