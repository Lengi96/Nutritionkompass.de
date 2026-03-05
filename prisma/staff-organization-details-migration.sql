-- Erweiterte Detailfelder fuer Organisation und Mitarbeiter
-- Datenschutz: alle Felder sind optional und fuer nicht-klinische Stammdaten gedacht.

ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "contactPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "addressLine" TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "country" TEXT,
  ADD COLUMN IF NOT EXISTS "profileNotes" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "jobTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "profileNotes" TEXT;
