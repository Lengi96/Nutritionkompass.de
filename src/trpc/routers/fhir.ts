import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { fhirExportInputSchema } from "@/server/security/fhir-export.validation";
import { consumeFixedWindowRateLimit } from "@/server/security/rate-limit";
import { writeFhirExportAuditLog } from "@/server/security/audit-log";
import { mapPatientToFhir } from "@/lib/fhir/mappers/patient.mapper";
import { mapWeightEntryToObservation } from "@/lib/fhir/mappers/weightObservation.mapper";
import {
  mapMealPlanToDocumentReference,
  mapShoppingListToDocumentReference,
} from "@/lib/fhir/mappers/mealPlan.mapper";
import { buildCollectionBundle } from "@/lib/fhir/bundle";
import type { FhirResource } from "@/lib/fhir/types";

const DEFAULT_EXPORT_RATE_LIMIT = 10;
const DEFAULT_EXPORT_RATE_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;

function getExportConfig() {
  return {
    adminOnly: process.env.FHIR_EXPORT_ADMIN_ONLY !== "false",
    rateLimitMax: Number(
      process.env.FHIR_EXPORT_RATE_LIMIT_MAX ?? DEFAULT_EXPORT_RATE_LIMIT
    ),
    rateLimitWindowMs: Number(
      process.env.FHIR_EXPORT_RATE_LIMIT_WINDOW_MS ??
        DEFAULT_EXPORT_RATE_WINDOW_MS
    ),
    maxPayloadBytes: Number(
      process.env.FHIR_EXPORT_MAX_PAYLOAD_BYTES ?? DEFAULT_MAX_PAYLOAD_BYTES
    ),
  };
}

function getDateFilter(dateFrom?: Date, dateTo?: Date) {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  return {
    ...(dateFrom ? { gte: dateFrom } : {}),
    ...(dateTo ? { lte: dateTo } : {}),
  };
}

export const fhirRouter = router({
  exportPatientBundle: protectedProcedure
    .input(fhirExportInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "dateFrom darf nicht nach dateTo liegen.",
        });
      }

      const config = getExportConfig();

      if (config.adminOnly && ctx.user.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "FHIR-Exporte sind nur für Administrator:innen erlaubt.",
        });
      }

      const rateLimit = consumeFixedWindowRateLimit(
        `fhir-export:${ctx.user.id}`,
        config.rateLimitMax,
        config.rateLimitWindowMs
      );
      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate-Limit erreicht. Bitte später erneut versuchen.",
        });
      }

      const patient = await ctx.prisma.patient.findUnique({
        where: { id: input.patientId },
        select: {
          id: true,
          pseudonym: true,
          organizationId: true,
        },
      });

      if (!patient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Patient nicht gefunden.",
        });
      }

      if (patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      const recordedAt = getDateFilter(input.dateFrom, input.dateTo);
      const weekStart = getDateFilter(input.dateFrom, input.dateTo);
      const resources: FhirResource[] = [
        mapPatientToFhir(patient, {
          includePseudonymName: input.includePseudonymName,
        }),
      ];
      const resourceTypes = ["Patient"];

      if (input.include.weight) {
        const weightEntries = await ctx.prisma.weightEntry.findMany({
          where: {
            patientId: patient.id,
            ...(recordedAt ? { recordedAt } : {}),
          },
          orderBy: { recordedAt: "asc" },
          select: {
            id: true,
            patientId: true,
            weightKg: true,
            recordedAt: true,
          },
        });

        resources.push(
          ...weightEntries.map((entry) =>
            mapWeightEntryToObservation({
              id: entry.id,
              patientId: entry.patientId,
              weightKg: Number(entry.weightKg),
              recordedAt: entry.recordedAt,
            })
          )
        );
        resourceTypes.push("Observation");
      }

      if (input.include.mealPlans || input.include.shoppingLists) {
        const mealPlans = await ctx.prisma.mealPlan.findMany({
          where: {
            patientId: patient.id,
            ...(weekStart ? { weekStart } : {}),
          },
          orderBy: { weekStart: "asc" },
          include: {
            shoppingList: {
              select: {
                id: true,
                createdAt: true,
                itemsJson: true,
              },
            },
          },
        });

        if (input.include.mealPlans) {
          resources.push(
            ...mealPlans.map((plan) =>
              mapMealPlanToDocumentReference({
                id: plan.id,
                patientId: plan.patientId,
                weekStart: plan.weekStart,
                planJson: plan.planJson,
              })
            )
          );
          resourceTypes.push("DocumentReference:MealPlan");
        }

        if (input.include.shoppingLists) {
          resources.push(
            ...mealPlans
              .filter((plan) => Boolean(plan.shoppingList))
              .map((plan) => {
                const shoppingList = plan.shoppingList!;
                return mapShoppingListToDocumentReference({
                  id: shoppingList.id,
                  patientId: plan.patientId,
                  createdAt: shoppingList.createdAt,
                  itemsJson: shoppingList.itemsJson,
                });
              })
          );
          resourceTypes.push("DocumentReference:ShoppingList");
        }
      }

      const bundle = buildCollectionBundle(resources);
      const payload = JSON.stringify(bundle);
      const payloadBytes = Buffer.byteLength(payload, "utf8");

      if (payloadBytes > config.maxPayloadBytes) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message:
            "Export überschreitet das erlaubte Payload-Limit. Bitte Zeitraum oder Inhalte reduzieren.",
        });
      }

      await writeFhirExportAuditLog(ctx.prisma, {
        organizationId: ctx.organizationId,
        userId: ctx.user.id,
        patientIds: [patient.id],
        resourceTypes,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        payloadBytes,
      });

      const dateSuffix = new Date().toISOString().slice(0, 10);
      return {
        bundle,
        filename: `fhir-export-${patient.id}-${dateSuffix}.json`,
      };
    }),
});
