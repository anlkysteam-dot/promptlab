import { Environment, Paddle } from "@paddle/paddle-node-sdk";

let paddle: Paddle | null = null;

function paddleEnvironment(): Environment {
  const raw = process.env.PADDLE_ENVIRONMENT?.trim().toLowerCase();
  if (raw === "sandbox" || raw === "development") return Environment.sandbox;
  if (raw === "production") return Environment.production;
  const key = process.env.PADDLE_API_KEY?.trim() ?? "";
  if (key.startsWith("pdl_sdbx_apikey_") || key.includes("sandbox")) return Environment.sandbox;
  return Environment.production;
}

export function getPaddle(): Paddle {
  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("PADDLE_API_KEY tanımlı değil.");
  }
  if (!paddle) {
    paddle = new Paddle(apiKey, { environment: paddleEnvironment() });
  }
  return paddle;
}

export function isPaddleConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY?.trim() && process.env.PADDLE_PRICE_ID_PREMIUM?.trim());
}
