import type { PrismaClient } from "@prisma/client";

interface FhirExportAuditPayload {
  organizationId: string;
  userId: string;
  patientIds: string[];
  resourceTypes: string[];
  dateFrom?: Date;
  dateTo?: Date;
  payloadBytes: number;
}

export async function writeFhirExportAuditLog(
  prisma: PrismaClient,
  payload: FhirExportAuditPayload
): Promise<void> {
  await prisma.fhirExportAuditLog.create({
    data: {
      organizationId: payload.organizationId,
      userId: payload.userId,
      patientIds: payload.patientIds,
      resourceTypes: payload.resourceTypes,
      dateFrom: payload.dateFrom,
      dateTo: payload.dateTo,
      payloadBytes: payload.payloadBytes,
    },
  });
}
