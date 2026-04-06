/**
 * Kredi paketleri: fiyat id’leri .env ile tanımlanır; tanımsız paketler listelenmez.
 */

export type CreditPackId = "pack_s" | "pack_m";

export type CreditPackDef = {
  id: CreditPackId;
  credits: number;
  /** Gösterim: üstü çizilecek “liste” fiyatı (USD) */
  listPriceUsd: number;
  /** Gösterim: satış fiyatı (USD) — Paddle/Stripe’da bu tutara göre fiyat oluşturulmalı */
  salePriceUsd: number;
  stripePriceEnv: string;
  paddlePriceEnv: string;
  labelTr: string;
  labelEn: string;
};

/** Env anahtarları: PADDLE_PRICE_ID_CREDITS_50 / _100 ve isteğe bağlı Stripe eşleri. */
export const CREDIT_PACK_DEFINITIONS: CreditPackDef[] = [
  {
    id: "pack_s",
    credits: 50,
    listPriceUsd: 5,
    salePriceUsd: 3,
    stripePriceEnv: "STRIPE_PRICE_ID_CREDITS_50",
    paddlePriceEnv: "PADDLE_PRICE_ID_CREDITS_50",
    labelTr: "50 kredi",
    labelEn: "50 credits",
  },
  {
    id: "pack_m",
    credits: 100,
    listPriceUsd: 10,
    salePriceUsd: 5,
    stripePriceEnv: "STRIPE_PRICE_ID_CREDITS_100",
    paddlePriceEnv: "PADDLE_PRICE_ID_CREDITS_100",
    labelTr: "100 kredi",
    labelEn: "100 credits",
  },
];

function envPrice(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

export type CreditPackResolved = CreditPackDef & {
  stripePriceId?: string;
  paddlePriceId?: string;
};

export function resolveCreditPacks(): CreditPackResolved[] {
  return CREDIT_PACK_DEFINITIONS.map((p) => ({
    ...p,
    stripePriceId: envPrice(p.stripePriceEnv),
    paddlePriceId: envPrice(p.paddlePriceEnv),
  })).filter((p) => p.stripePriceId || p.paddlePriceId);
}

export function findPackById(id: string): CreditPackResolved | null {
  return resolveCreditPacks().find((p) => p.id === id) ?? null;
}

/** Kredi paketi ödemesi için Paddle veya Stripe (en az bir paket fiyatı tanımlı olmalı). */
export function getCreditCheckoutProvider(): "paddle" | "stripe" | null {
  const packs = resolveCreditPacks();
  if (!packs.length) return null;
  if (process.env.PADDLE_API_KEY?.trim() && packs.some((p) => p.paddlePriceId)) return "paddle";
  if (process.env.STRIPE_SECRET_KEY?.trim() && packs.some((p) => p.stripePriceId)) return "stripe";
  return null;
}
