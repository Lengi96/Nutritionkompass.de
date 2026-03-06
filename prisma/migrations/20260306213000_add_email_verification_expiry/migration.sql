ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "emailVerificationTokenExpiresAt" TIMESTAMP(3);

UPDATE "User"
SET "emailVerificationTokenExpiresAt" = "createdAt" + INTERVAL '48 hours'
WHERE "emailVerificationToken" IS NOT NULL
  AND "emailVerificationTokenExpiresAt" IS NULL;
