import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure } from "../init";
import { generateMealPlan } from "@/lib/openai/nutritionPrompt";

// Sicherheitshinweis: Rate Limiting – Max 10 Generierungen pro User pro Stunde
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
        "Sie haben das Limit von 10 Plan-Generierungen pro Stunde erreicht. Bitte versuchen Sie es später erneut.",
    });
  }

  entry.count++;
}

export const mealPlansRouter = router({
  // Ernährungsplan mit KI generieren
  generate: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        weekStart: z.string().transform((val) => new Date(val)),
        additionalNotes: z.string().optional(),
        basedOnPreviousPlan: z.boolean().default(false),
        fastMode: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate Limiting prüfen
      checkRateLimit(ctx.user.id);

      // Patient laden und Berechtigung prüfen
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

      // Zusätzliche Hinweise zusammenbauen
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

      // KI-Plan generieren
      const { plan, prompt } = await generateMealPlan(
        {
          birthYear: patient.birthYear,
          currentWeight: Number(patient.currentWeight),
          targetWeight: Number(patient.targetWeight),
          allergies: patient.allergies,
        },
        notes || undefined,
        { fastMode: input.fastMode }
      );

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

      return mealPlan;
    }),

  // Alle Pläne eines Patienten
  getByPatient: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Sicherheitshinweis: Zunächst prüfen ob Patient zur Organisation gehört
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

  // Alle Pläne der eigenen Organisation (z. B. für Übersichtsseite)
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
        dayIndex: z.number().int().min(0).max(6),
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
          message: "Ernährungsplan nicht gefunden.",
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
          message: "Ungültiger Tag oder Mahlzeit.",
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
          message: "Ernährungsplan nicht gefunden.",
        });
      }

      // Sicherheitshinweis: Organization-Check über Patient-Relation
      if (plan.patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      return plan;
    }),
});
