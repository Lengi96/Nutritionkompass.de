CREATE TABLE "AgentAuditLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "intentSummary" TEXT NOT NULL,
  "proposedActionsJson" JSONB NOT NULL,
  "committed" BOOLEAN NOT NULL DEFAULT false,
  "commitResultJson" JSONB,
  CONSTRAINT "AgentAuditLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AgentAuditLog"
ADD CONSTRAINT "AgentAuditLog_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgentAuditLog"
ADD CONSTRAINT "AgentAuditLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "AgentAuditLog_organizationId_createdAt_idx"
ON "AgentAuditLog"("organizationId", "createdAt");

CREATE INDEX "AgentAuditLog_userId_createdAt_idx"
ON "AgentAuditLog"("userId", "createdAt");

CREATE INDEX "AgentAuditLog_createdAt_idx"
ON "AgentAuditLog"("createdAt");
