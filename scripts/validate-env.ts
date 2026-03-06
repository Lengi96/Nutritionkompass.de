import nextEnv from "@next/env";
import { z } from "zod";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const isProduction = process.env.NODE_ENV === "production";

const baseSchema = z.object({
  DATABASE_URL: z.string().min(1).startsWith("postgresql://"),
  NEXTAUTH_SECRET: z.string().min(24, "NEXTAUTH_SECRET sollte mindestens 24 Zeichen haben."),
  NEXTAUTH_URL: z.string().url(),
  DIRECT_URL: z.string().startsWith("postgresql://").optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL_MEALPLAN_STRUCTURE: z.string().min(1).optional(),
  OPENAI_MODEL_MEALPLAN_RECIPES: z.string().min(1).optional(),
  OPENAI_MODEL_MEALPLAN_VALIDATION: z.string().min(1).optional(),
  OPENAI_MODEL_MEALPLAN_SCORING: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_ID_BASIC: z.string().min(1).optional(),
  STRIPE_PRICE_ID_PROFESSIONAL: z.string().min(1).optional(),
});

const result = baseSchema.safeParse(process.env);

if (!result.success) {
  console.error("ENV-Validierung fehlgeschlagen (Grundschema):");
  for (const issue of result.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const env = result.data;

const errors: string[] = [];
const warnings: string[] = [];

function requireInProduction(key: keyof typeof env) {
  if (isProduction && !env[key]) {
    errors.push(`${key} fehlt (Pflicht in Produktion).`);
  }
}

for (const key of [
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_BASIC",
  "STRIPE_PRICE_ID_PROFESSIONAL",
] as const) {
  requireInProduction(key);
}

if (!env.DIRECT_URL) {
  warnings.push(
    "DIRECT_URL fehlt (für Prisma-Migrationen empfohlen, aber nicht zwingend für App-Runtime)."
  );
}

if (isProduction) {
  if (!env.NEXTAUTH_URL.startsWith("https://")) {
    errors.push("NEXTAUTH_URL muss in Produktion mit https:// beginnen.");
  }
  if (!env.NEXT_PUBLIC_APP_URL?.startsWith("https://")) {
    errors.push("NEXT_PUBLIC_APP_URL muss in Produktion mit https:// beginnen.");
  }
}

if (errors.length > 0) {
  console.error("ENV-Validierung fehlgeschlagen:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("ENV-Config validiert.");
for (const warning of warnings) {
  console.warn(`Warnung: ${warning}`);
}
