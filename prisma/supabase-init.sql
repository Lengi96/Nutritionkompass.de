-- ============================================================
-- mein-nutrikompass.de – Komplettes DB-Setup für Supabase SQL Editor
-- ============================================================

-- 1) Enum für Rollen
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) Organization
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- 3) User
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'STAFF',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 4) Patient
CREATE TABLE IF NOT EXISTS "Patient" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "pseudonym" TEXT NOT NULL,
  "birthYear" INTEGER NOT NULL,
  "currentWeight" DECIMAL(5,2) NOT NULL,
  "targetWeight" DECIMAL(5,2) NOT NULL,
  "allergies" TEXT[] DEFAULT '{}',
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- 5) WeightEntry
CREATE TABLE IF NOT EXISTS "WeightEntry" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "weightKg" DECIMAL(5,2) NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recordedBy" TEXT NOT NULL,
  CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- 6) MealPlan
CREATE TABLE IF NOT EXISTS "MealPlan" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "planJson" JSONB NOT NULL,
  "totalKcal" INTEGER NOT NULL,
  "promptUsed" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- 7) ShoppingList
CREATE TABLE IF NOT EXISTS "ShoppingList" (
  "id" TEXT NOT NULL,
  "mealPlanId" TEXT NOT NULL,
  "itemsJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- 8) Unique Constraints & Indices
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "ShoppingList_mealPlanId_key" ON "ShoppingList"("mealPlanId");
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Patient_organizationId_idx" ON "Patient"("organizationId");
CREATE INDEX IF NOT EXISTS "WeightEntry_patientId_idx" ON "WeightEntry"("patientId");
CREATE INDEX IF NOT EXISTS "MealPlan_patientId_idx" ON "MealPlan"("patientId");
CREATE INDEX IF NOT EXISTS "MealPlan_createdBy_idx" ON "MealPlan"("createdBy");

-- 9) Foreign Keys
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Patient" ADD CONSTRAINT "Patient_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "WeightEntry" ADD CONSTRAINT "WeightEntry_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_mealPlanId_fkey"
    FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- SEED-DATEN
-- ============================================================

-- Organisation
INSERT INTO "Organization" ("id", "name") VALUES
  ('demo-org-1', 'Jugendwohngruppe Sonnenhof')
ON CONFLICT ("id") DO NOTHING;

-- Admin-User (Passwort: Passwort123!)
-- bcrypt hash mit 12 salt rounds
INSERT INTO "User" ("id", "organizationId", "email", "passwordHash", "name", "role") VALUES
  ('admin-user-1', 'demo-org-1', 'admin@mein-nutrikompass.de',
   '$2b$12$06qJOA7CQxu2qVeNewY3iu/y8qFhB7IfD43gCxZ/U54Uq6cYT.gPS',
   'Anna Schmidt', 'ADMIN')
ON CONFLICT ("id") DO NOTHING;

-- Staff-User (Passwort: Passwort123!)
INSERT INTO "User" ("id", "organizationId", "email", "passwordHash", "name", "role") VALUES
  ('staff-user-1', 'demo-org-1', 'mitarbeiter@mein-nutrikompass.de',
   '$2b$12$06qJOA7CQxu2qVeNewY3iu/y8qFhB7IfD43gCxZ/U54Uq6cYT.gPS',
   'Max Weber', 'STAFF')
ON CONFLICT ("id") DO NOTHING;

-- Patienten
INSERT INTO "Patient" ("id", "organizationId", "pseudonym", "birthYear", "currentWeight", "targetWeight", "allergies", "notes", "createdBy") VALUES
  ('patient-1', 'demo-org-1', 'Sonnenschein', 2008, 48.50, 55.00, '{"Laktose"}', 'Bevorzugt warme Mahlzeiten. Mag gerne Nudeln und Reis.', 'admin-user-1'),
  ('patient-2', 'demo-org-1', 'Mondlicht', 2006, 52.00, 58.00, '{"Gluten","Nüsse"}', 'Vegetarische Ernährung bevorzugt.', 'admin-user-1'),
  ('patient-3', 'demo-org-1', 'Sternschnuppe', 2009, 42.00, 50.00, '{}', '', 'staff-user-1')
ON CONFLICT ("id") DO NOTHING;

-- Gewichtsverlauf Patient 1 (Sonnenschein)
INSERT INTO "WeightEntry" ("id", "patientId", "weightKg", "recordedAt", "recordedBy") VALUES
  ('we-1', 'patient-1', 45.00, NOW() - INTERVAL '60 days', 'admin-user-1'),
  ('we-2', 'patient-1', 46.20, NOW() - INTERVAL '45 days', 'admin-user-1'),
  ('we-3', 'patient-1', 47.10, NOW() - INTERVAL '30 days', 'admin-user-1'),
  ('we-4', 'patient-1', 47.80, NOW() - INTERVAL '15 days', 'admin-user-1'),
  ('we-5', 'patient-1', 48.50, NOW(), 'admin-user-1')
ON CONFLICT ("id") DO NOTHING;

-- Gewichtsverlauf Patient 2 (Mondlicht)
INSERT INTO "WeightEntry" ("id", "patientId", "weightKg", "recordedAt", "recordedBy") VALUES
  ('we-6', 'patient-2', 52.00, NOW(), 'admin-user-1')
ON CONFLICT ("id") DO NOTHING;

-- Gewichtsverlauf Patient 3 (Sternschnuppe)
INSERT INTO "WeightEntry" ("id", "patientId", "weightKg", "recordedAt", "recordedBy") VALUES
  ('we-7', 'patient-3', 42.00, NOW(), 'staff-user-1')
ON CONFLICT ("id") DO NOTHING;
