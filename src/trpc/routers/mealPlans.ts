import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure } from "../init";
import { generateMealPlan } from "@/lib/openai/nutritionPrompt";
import { PLAN_LIMITS } from "@/lib/stripe";

const MEAL_TYPE_VALUES = [
  "Frühstück",
  "Mittagessen",
  "Abendessen",
  "Snack",
] as const;

// Sicherheitshinweis: Rate Limiting â€“ Max 10 Generierungen pro User pro Stunde
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return;
  }

  if (entry.count >= 10) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message:
        "Sie haben das Limit von 10 Plan-Generierungen pro Stunde erreicht. Bitte versuchen Sie es spÃ¤ter erneut.",
    });
  }

  entry.count++;
}

// Progress-Tracking pro User
interface ProgressState {
  message: string;
  dayIndex: number;
  totalDays: number;
  timestamp: number;
}

const progressMap = new Map<string, ProgressState>();

function setProgress(
  userId: string,
  message: string,
  dayIndex: number,
  totalDays: number
): void {
  progressMap.set(userId, {
    message,
    dayIndex,
    totalDays,
    timestamp: Date.now(),
  });
}

function getProgress(userId: string): ProgressState | null {
  const progress = progressMap.get(userId);
  // Alte Progress-States (Ã¤lter als 5 Minuten) entfernen
  if (progress && Date.now() - progress.timestamp > 5 * 60 * 1000) {
    progressMap.delete(userId);
    return null;
  }
  return progress || null;
}

export const mealPlansRouter = router({
  // ErnÃ¤hrungsplan mit KI generieren
  generate: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        weekStart: z.string().transform((val) => new Date(val)),
        numDays: z.number().int().min(1).max(14).default(7),
        fixedMealTypes: z.array(z.enum(MEAL_TYPE_VALUES)).default([]),
        additionalNotes: z.string().optional(),
        basedOnPreviousPlan: z.boolean().default(false),
        fastMode: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate Limiting prÃ¼fen
      checkRateLimit(ctx.user.id);

      // Monatliches Plan-Limit basierend auf Abo-Plan prÃ¼fen
      const org = await ctx.prisma.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
      });
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const plansThisMonth = await ctx.prisma.mealPlan.count({
        where: {
          patient: { organizationId: ctx.organizationId },
          createdAt: { gte: startOfMonth },
        },
      });
      const monthlyLimit = PLAN_LIMITS[org.subscriptionPlan].maxPlansPerMonth;
      if (plansThisMonth >= monthlyLimit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Monatliches Plan-Limit (${monthlyLimit}) erreicht. Bitte upgraden Sie Ihren Plan.`,
        });
      }

      // Testphase prÃ¼fen
      if (org.subscriptionPlan === "TRIAL" && org.trialEndsAt && org.trialEndsAt < new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ihre Testphase ist abgelaufen. Bitte wÃ¤hlen Sie einen Plan unter /billing.",
        });
      }

      // Patient laden und Berechtigung prÃ¼fen
      const patient = await ctx.prisma.patient.findUnique({
        where: { id: input.patientId },
      });

      if (!patient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Patient nicht gefunden.",
        });
      }

      // Sicherheitshinweis: Organization-Check
      if (patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      // ZusÃ¤tzliche Hinweise zusammenbauen
      let notes = input.additionalNotes || "";

      if (input.basedOnPreviousPlan) {
        const previousPlan = await ctx.prisma.mealPlan.findFirst({
          where: { patientId: input.patientId },
          orderBy: { createdAt: "desc" },
        });

        if (previousPlan) {
          notes += "\n\nVorheriger Plan als Referenz vorhanden. Bitte variiere die Mahlzeiten, behalte aber die Kalorienverteilung bei.";
        }
      }

      // Autonomie-Absprachen laden und als Text aufbereiten
      const agreement = await ctx.prisma.autonomyAgreement.findUnique({
        where: { patientId: input.patientId },
      });

      let autonomyText: string | null = null;
      if (agreement) {
        const parts: string[] = [];
        if (agreement.canPortionIndependent) {
          parts.push("Darf vollstÃ¤ndig eigenstÃ¤ndig portionieren");
        } else if (agreement.canPortionSupervised) {
          parts.push("Darf unter Aufsicht portionieren");
        }
        if (agreement.notes) {
          parts.push(agreement.notes);
        }
        if (parts.length > 0) {
          autonomyText = parts.join(". ");
        }
      }

      // Fallback auf Legacy-Feld wenn kein Agreement
      const effectiveAutonomyNotes = autonomyText || patient.autonomyNotes;

      // KI-Plan generieren mit Progress-Tracking
      setProgress(ctx.user.id, "Wird vorbereitet...", 0, input.numDays);

      let plan: Awaited<ReturnType<typeof generateMealPlan>>["plan"];
      let prompt: string;
      try {
        const generated = await generateMealPlan(
          {
            birthYear: patient.birthYear,
            currentWeight: Number(patient.currentWeight),
            targetWeight: Number(patient.targetWeight),
            allergies: patient.allergies,
            autonomyNotes: effectiveAutonomyNotes,
          },
          notes || undefined,
          {
            numDays: input.numDays,
            fixedMealTypes: input.fixedMealTypes,
            fastMode: input.fastMode,
            onProgress: (message: string) => {
              // Extrahiert Tag-Index und Gesamtanzahl aus dem Fortschritts-Text.
              const dayMatch = message.match(/\((\d+)\/(\d+)\)/);
              const dayIndex = dayMatch ? parseInt(dayMatch[1], 10) : 0;
              const totalDays = dayMatch ? parseInt(dayMatch[2], 10) : input.numDays;
              setProgress(ctx.user.id, message, dayIndex, totalDays);
            },
          }
        );
        plan = generated.plan;
        prompt = generated.prompt;
      } catch (error) {
        const rawMessage =
          error instanceof Error ? error.message : "Unbekannter Generierungsfehler";
        console.error("[mealPlans.generate] KI-Generierung fehlgeschlagen:", rawMessage);

        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Die Plan-Generierung ist fehlgeschlagen. Bitte erneut versuchen oder die Tagesanzahl reduzieren.",
        });
      }

      // Gesamt-Kalorien berechnen
      const totalKcal = plan.days.reduce(
        (sum, day) => sum + day.dailyKcal,
        0
      );

      // Plan in DB speichern
      const mealPlan = await ctx.prisma.mealPlan.create({
        data: {
          patientId: input.patientId,
          weekStart: input.weekStart,
          planJson: plan as unknown as Prisma.InputJsonValue,
          totalKcal,
          promptUsed: prompt,
          createdBy: ctx.user.id,
        },
      });

      return { id: mealPlan.id };
    }),

  // Alle PlÃ¤ne eines Patienten
  getByPatient: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Sicherheitshinweis: ZunÃ¤chst prÃ¼fen ob Patient zur Organisation gehÃ¶rt
      const patient = await ctx.prisma.patient.findUnique({
        where: { id: input.patientId },
        select: { organizationId: true },
      });

      if (!patient || patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      return ctx.prisma.mealPlan.findMany({
        where: { patientId: input.patientId },
        orderBy: { createdAt: "desc" },
        include: {
          createdByUser: {
            select: { name: true },
          },
          shoppingList: {
            select: { id: true },
          },
        },
      });
    }),

  // Alle PlÃ¤ne der eigenen Organisation (z. B. fÃ¼r Ãœbersichtsseite)
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.mealPlan.findMany({
        where: {
          patient: {
            is: {
              organizationId: ctx.organizationId,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
        include: {
          patient: {
            select: {
              id: true,
              pseudonym: true,
            },
          },
          createdByUser: {
            select: { name: true },
          },
          shoppingList: {
            select: { id: true },
          },
        },
      });
    }),

  // Rezept eines Gerichts im gespeicherten Plan aktualisieren
  updateMealRecipe: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        dayIndex: z.number().int().min(0).max(30),
        mealIndex: z.number().int().min(0).max(10),
        recipe: z
          .string()
          .trim()
          .min(5, "Das Rezept muss mindestens 5 Zeichen lang sein.")
          .max(5000, "Das Rezept ist zu lang."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.prisma.mealPlan.findUnique({
        where: { id: input.planId },
        include: {
          patient: {
            select: {
              organizationId: true,
            },
          },
        },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ErnÃ¤hrungsplan nicht gefunden.",
        });
      }

      if (plan.patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      const planData = plan.planJson as unknown as {
        days?: Array<{
          meals?: Array<Record<string, unknown>>;
        }>;
      };

      const day = planData.days?.[input.dayIndex];
      const meal = day?.meals?.[input.mealIndex];
      if (!day || !meal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "UngÃ¼ltiger Tag oder Mahlzeit.",
        });
      }

      meal.recipe = input.recipe;

      await ctx.prisma.mealPlan.update({
        where: { id: input.planId },
        data: {
          planJson: planData as unknown as Prisma.InputJsonValue,
        },
      });

      return { success: true };
    }),

  // Einzelnen Plan laden
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const plan = await ctx.prisma.mealPlan.findUnique({
        where: { id: input.id },
        include: {
          patient: {
            select: {
              pseudonym: true,
              organizationId: true,
              allergies: true,
              autonomyNotes: true,
              autonomyAgreement: {
                select: {
                  canPortionSupervised: true,
                  canPortionIndependent: true,
                  notes: true,
                },
              },
            },
          },
          createdByUser: {
            select: { name: true },
          },
          shoppingList: true,
        },
      });

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "ErnÃ¤hrungsplan nicht gefunden.",
        });
      }

      // Sicherheitshinweis: Organization-Check Ã¼ber Patient-Relation
      if (plan.patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      return plan;
    }),

  // Fortschritt einer laufenden Plan-Generierung abrufen
  getProgress: protectedProcedure.query(({ ctx }) => {
    const progress = getProgress(ctx.user.id);
    return progress || { message: null, dayIndex: 0, totalDays: 7 };
  }),
});



