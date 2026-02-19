import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY ist nicht konfiguriert. Bitte in .env eintragen."
    );
  }

  stripeClient = new Stripe(key, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });

  return stripeClient;
}

// Plan-Limits für verschiedene Subscription-Pläne
export const PLAN_LIMITS = {
  TRIAL: { maxPatients: 3, maxPlansPerMonth: 10 },
  BASIC: { maxPatients: 15, maxPlansPerMonth: 50 },
  PROFESSIONAL: { maxPatients: Infinity, maxPlansPerMonth: Infinity },
} as const;

// Price-IDs aus Environment
export function getStripePriceId(plan: "BASIC" | "PROFESSIONAL"): string {
  const key =
    plan === "BASIC"
      ? process.env.STRIPE_PRICE_ID_BASIC
      : process.env.STRIPE_PRICE_ID_PROFESSIONAL;

  if (!key) {
    throw new Error(`STRIPE_PRICE_ID_${plan} ist nicht konfiguriert.`);
  }

  return key;
}
