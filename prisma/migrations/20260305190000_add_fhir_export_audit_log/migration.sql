-- Add optional external FHIR id on patient for future third-party mappings
ALTER TABLE "Patient"
ADD COLUMN "fhirExternalId" TEXT;

-- Immutable audit log for FHIR export events
CREATE TABLE "FhirExportAuditLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "patientIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "resourceTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "dateFrom" TIMESTAMP(3),
  "dateTo" TIMESTAMP(3),
  "payloadBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FhirExportAuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FhirExportAuditLog"
ADD CONSTRAINT "FhirExportAuditLog_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FhirExportAuditLog"
ADD CONSTRAINT "FhirExportAuditLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "FhirExportAuditLog_organizationId_createdAt_idx"
ON "FhirExportAuditLog"("organizationId", "createdAt");

CREATE INDEX "FhirExportAuditLog_userId_createdAt_idx"
ON "FhirExportAuditLog"("userId", "createdAt");
