-- ============================================================
-- mein-nutrikompass.de – Stripe Subscription Migration
-- Ausführen im Supabase SQL Editor
-- ============================================================

-- 1) Neue Enums erstellen
DO $$ BEGIN
  CREATE TYPE "SubscriptionPlan" AS ENUM ('TRIAL', 'BASIC', 'PROFESSIONAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) Neue Spalten zur Organization-Tabelle hinzufügen
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- 3) Bestehende Demo-Organisation: Trial-Ende auf 14 Tage ab jetzt setzen
UPDATE "Organization"
SET "trialEndsAt" = NOW() + INTERVAL '14 days'
WHERE "trialEndsAt" IS NULL;
