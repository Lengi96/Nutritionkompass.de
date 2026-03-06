import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure } from "../init";
import {
  agentCommitInputSchema,
  agentPreviewInputSchema,
} from "@/lib/agent/schemas";
import type { AgentPatientRef, AgentProposedAction } from "@/lib/agent/types";

function requireCommitPermission(role: "ADMIN" | "STAFF"): void {
  const adminOnly = process.env.AGENT_COMMIT_ADMIN_ONLY !== "false";
  if (adminOnly && role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Agent-Commit ist nur für Administrator:innen erlaubt.",
    });
  }
}

async function resolvePatientIdByReference(
  tx: Prisma.TransactionClient,
  organizationId: string,
  patientRef: AgentPatientRef
): Promise<string> {
  if (patientRef.by === "id") {
    const patient = await tx.patient.findFirst({
      where: {
        id: patientRef.value,
        organizationId,
      },
      select: { id: true },
    });
    if (!patient) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Patient nicht gefunden oder nicht in Ihrer Organisation.",
      });
    }
    return patient.id;
  }

  const candidates = await tx.patient.findMany({
    where: {
      organizationId,
      pseudonym: {
        equals: patientRef.value,
        mode: "insensitive",
      },
      isActive: true,
    },
    select: { id: true },
    take: 2,
  });

  if (candidates.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Kein Patient mit Pseudonym "${patientRef.value}" gefunden.`,
    });
  }

  if (candidates.length > 1) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Pseudonym "${patientRef.value}" ist nicht eindeutig.`,
    });
  }

  return candidates[0].id;
}

function actionToIntentChunk(action: AgentProposedAction): string {
  switch (action.type) {
    case "PATIENT_CREATE":
      return `PATIENT_CREATE(${action.data.pseudonym})`;
    case "WEIGHT_ADD":
      return `WEIGHT_ADD(${action.data.patient.by}:${action.data.patient.value})`;
    case "MEALPLAN_DRAFT_CREATE":
      return `MEALPLAN_DRAFT_CREATE(${action.data.patient.by}:${action.data.patient.value})`;
  }
}

export const agentRouter = router({
  preview: protectedProcedure
    .input(agentPreviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const warnings: string[] = [];
      const matches: Array<{
        actionIndex: number;
        patientRef: string;
        matchedPatientId: string | null;
      }> = [];

      for (const [index, action] of input.proposedActions.entries()) {
        if (action.type === "PATIENT_CREATE") {
          continue;
        }
        const patientRef = action.data.patient;
        if (patientRef.by === "id") {
          const patient = await ctx.prisma.patient.findFirst({
            where: {
              id: patientRef.value,
              organizationId: ctx.organizationId,
              isActive: true,
            },
            select: { id: true },
          });
          if (!patient) {
            warnings.push(`Aktion ${index + 1}: Patient-ID nicht gefunden.`);
          }
          matches.push({
            actionIndex: index,
            patientRef: `id:${patientRef.value}`,
            matchedPatientId: patient?.id ?? null,
          });
          continue;
        }

        const candidates = await ctx.prisma.patient.findMany({
          where: {
            organizationId: ctx.organizationId,
            pseudonym: {
              equals: patientRef.value,
              mode: "insensitive",
            },
            isActive: true,
          },
          select: { id: true },
          take: 3,
        });

        if (candidates.length === 0) {
          warnings.push(
            `Aktion ${index + 1}: Kein Treffer für Pseudonym "${patientRef.value}".`
          );
        } else if (candidates.length > 1) {
          warnings.push(
            `Aktion ${index + 1}: Pseudonym "${patientRef.value}" ist mehrdeutig.`
          );
        }

        matches.push({
          actionIndex: index,
          patientRef: `pseudonym:${patientRef.value}`,
          matchedPatientId: candidates.length === 1 ? candidates[0].id : null,
        });
      }

      return {
        warnings,
        matches,
      };
    }),

  commit: protectedProcedure
    .input(agentCommitInputSchema)
    .mutation(async ({ ctx, input }) => {
      requireCommitPermission(ctx.user.role);

      const createdPatientIds: string[] = [];
      const createdWeightEntryIds: string[] = [];
      const createdMealPlanIds: string[] = [];
      const txTimeoutMs = Number(process.env.AGENT_COMMIT_TX_TIMEOUT_MS ?? 20000);
      const txMaxWaitMs = Number(process.env.AGENT_COMMIT_TX_MAX_WAIT_MS ?? 5000);

      const result = await ctx.prisma.$transaction(async (tx) => {
        for (const action of input.proposedActions) {
          if (action.type === "PATIENT_CREATE") {
            const patient = await tx.patient.create({
              data: {
                organizationId: ctx.organizationId,
                pseudonym: action.data.pseudonym,
                birthYear: action.data.birthYear,
                currentWeight: action.data.currentWeight,
                targetWeight: action.data.targetWeight,
                targetDate: action.data.targetDate
                  ? new Date(`${action.data.targetDate}T00:00:00.000Z`)
                  : null,
                allergies: action.data.allergies ?? [],
                fearFoods: action.data.fearFoods ?? [],
                notes: action.data.notes ?? null,
                createdBy: ctx.user.id,
              },
              select: { id: true },
            });
            createdPatientIds.push(patient.id);

            const initialWeight = await tx.weightEntry.create({
              data: {
                patientId: patient.id,
                weightKg: action.data.currentWeight,
                recordedAt: new Date(),
                recordedBy: ctx.user.id,
              },
              select: { id: true },
            });
            createdWeightEntryIds.push(initialWeight.id);
            continue;
          }

          if (action.type === "WEIGHT_ADD") {
            const patientId = await resolvePatientIdByReference(
              tx,
              ctx.organizationId,
              action.data.patient
            );

            const entry = await tx.weightEntry.create({
              data: {
                patientId,
                weightKg: action.data.weightKg,
                recordedAt: new Date(`${action.data.date}T00:00:00.000Z`),
                recordedBy: ctx.user.id,
              },
              select: { id: true },
            });
            createdWeightEntryIds.push(entry.id);
            continue;
          }

          const patientId = await resolvePatientIdByReference(
            tx,
            ctx.organizationId,
            action.data.patient
          );

          const draft = await tx.mealPlan.create({
            data: {
              patientId,
              weekStart: new Date(`${action.data.weekStart}T00:00:00.000Z`),
              planJson: {
                draft: true,
                source: "agent",
                notes: action.data.notes ?? null,
              } as Prisma.InputJsonValue,
              totalKcal: 0,
              promptUsed: "AGENT_DRAFT_MVP",
              createdBy: ctx.user.id,
            },
            select: { id: true },
          });
          createdMealPlanIds.push(draft.id);
        }

        const summary =
          input.intentSummary ??
          input.proposedActions.map(actionToIntentChunk).join(", ");

        const commitResult = {
          createdPatientIds,
          createdWeightEntryIds,
          createdMealPlanIds,
        };

        const audit = await tx.agentAuditLog.create({
          data: {
            organizationId: ctx.organizationId,
            userId: ctx.user.id,
            intentSummary: summary,
            proposedActionsJson: input.proposedActions as unknown as Prisma.InputJsonValue,
            committed: true,
            commitResultJson: commitResult as unknown as Prisma.InputJsonValue,
          },
          select: { id: true },
        });

        return {
          summary,
          auditId: audit.id,
          ...commitResult,
        };
      }, { timeout: txTimeoutMs, maxWait: txMaxWaitMs });

      return result;
    }),
});
