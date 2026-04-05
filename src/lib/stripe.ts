import Stripe from "stripe";
import { getAppBaseUrl } from "@/lib/app-url";

export { getAppBaseUrl };

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY tanımlı değil.");
  }
  if (!stripe) {
    stripe = new Stripe(key, {
      typescript: true,
      apiVersion: "2025-02-24.acacia",
    });
  }
  return stripe;
}
