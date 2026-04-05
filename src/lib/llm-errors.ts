import OpenAI, { APIConnectionError, AuthenticationError, RateLimitError } from "openai";



type LlmKind = "openai" | "groq";



export function llmFailureMessage(e: unknown, kind: LlmKind): { status: number; error: string } {

  const keyHint =

    kind === "groq"

      ? ".env içindeki GROQ_API_KEY değerini kontrol edin (console.groq.com anahtarı)."

      : ".env içindeki OPENAI_API_KEY değerini kontrol edin (sk- ile başlamalı).";



  if (e instanceof AuthenticationError) {

    return {

      status: 503,

      error: `API anahtarı geçersiz veya yetkisiz ${keyHint}`,

    };

  }

  if (e instanceof RateLimitError) {

    if (kind === "openai" && e.code === "insufficient_quota") {

      return {

        status: 503,

        error:

          "OpenAI hesabında bakiye veya kota kalmadı (insufficient_quota). platform.openai.com üzerinden faturalamayı kontrol edin. Ücretsiz deneme için .env içinde PROMPTLAB_GENERATE_MODE=groq ve GROQ_API_KEY kullanabilirsiniz (anahtar: console.groq.com).",

      };

    }

    const where =

      kind === "groq"

        ? "Groq tarafında hız sınırı veya kota aşıldı. console.groq.com üzerinden limitlerinizi kontrol edin."

        : "OpenAI tarafında hız sınırı veya kota aşıldı. platform.openai.com adresinden faturalama ve kotanızı kontrol edin; gerekirse kredi ekleyip tekrar deneyin. Alternatif: PROMPTLAB_GENERATE_MODE=groq ve GROQ_API_KEY.";

    return { status: 503, error: where };

  }

  if (e instanceof APIConnectionError) {

    return {

      status: 502,

      error: "LLM sağlayıcısına bağlanılamadı. İnternet bağlantınızı kontrol edip biraz sonra tekrar deneyin.",

    };

  }

  if (e instanceof OpenAI.APIError && e.status != null) {

    return {

      status: 502,

      error: `Yapay zeka servisi yanıt vermedi (kod ${e.status}). Biraz sonra tekrar deneyin.`,

    };

  }

  return { status: 502, error: "Yapay zeka isteği başarısız oldu. Biraz sonra tekrar deneyin." };

}


