import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../init";
import { PLAN_LIMITS } from "@/lib/stripe";

export const patientsRouter = router({
  // Neuen Patienten anlegen
  create: protectedProcedure
    .input(
      z.object({
        pseudonym: z
          .string()
          .min(2, "Pseudonym muss mindestens 2 Zeichen lang sein.")
          .max(50, "Pseudonym darf maximal 50 Zeichen lang sein."),
        birthYear: z
          .number()
          .int()
          .min(1990, "Geburtsjahr muss zwischen 1990 und 2015 liegen.")
          .max(2015, "Geburtsjahr muss zwischen 1990 und 2015 liegen."),
        currentWeight: z
          .number()
          .min(30, "Gewicht muss mindestens 30 kg betragen.")
          .max(200, "Gewicht darf maximal 200 kg betragen."),
        targetWeight: z
          .number()
          .min(30, "Zielgewicht muss mindestens 30 kg betragen.")
          .max(200, "Zielgewicht darf maximal 200 kg betragen."),
        targetDate: z.coerce.date().optional().nullable(),
        allergies: z.array(z.string()),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Patientenlimit basierend auf Abo-Plan prüfen
      const org = await ctx.prisma.organization.findUniqueOrThrow({
        where: { id: ctx.organizationId },
      });
      const patientCount = await ctx.prisma.patient.count({
        where: { organizationId: ctx.organizationId, isActive: true },
      });
      const limits = PLAN_LIMITS[org.subscriptionPlan];
      if (patientCount >= limits.maxPatients) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Maximale Patientenanzahl (${limits.maxPatients}) für Ihren Plan erreicht. Bitte upgraden Sie Ihren Plan.`,
        });
      }

      // Sicherheitshinweis: organizationId wird aus der Session entnommen, nicht vom Client
      const patient = await ctx.prisma.patient.create({
        data: {
          ...input,
          organizationId: ctx.organizationId,
          createdBy: ctx.user.id,
        },
      });

      // Initialen Gewichtseintrag erstellen
      await ctx.prisma.weightEntry.create({
        data: {
          patientId: patient.id,
          weightKg: input.currentWeight,
          recordedBy: ctx.user.id,
        },
      });

      return patient;
    }),

  // Alle Patienten der eigenen Organisation auflisten
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      // Sicherheitshinweis: Nur Patienten der eigenen Organisation werden geladen
      const patients = await ctx.prisma.patient.findMany({
        where: {
          organizationId: ctx.organizationId,
          isActive: true,
          ...(input?.search
            ? {
                pseudonym: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              }
            : {}),
        },
        include: {
          mealPlans: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return patients;
    }),

  // Einzelnen Patienten laden
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findUnique({
        where: { id: input.id },
        include: {
          weightHistory: {
            orderBy: { recordedAt: "asc" },
          },
          mealPlans: {
            orderBy: { createdAt: "desc" },
            include: {
              shoppingList: true,
              createdByUser: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!patient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Patient nicht gefunden.",
        });
      }

      // Sicherheitshinweis: Prüfen ob Patient zur eigenen Organisation gehört
      if (patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert. Patient gehört nicht zu Ihrer Einrichtung.",
        });
      }

      return patient;
    }),

  // Patientendaten aktualisieren
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        currentWeight: z.number().min(30).max(200).optional(),
        targetWeight: z.number().min(30).max(200).optional(),
        targetDate: z.coerce.date().optional().nullable(),
        allergies: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findUnique({
        where: { id: input.id },
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

      const { id, ...updateData } = input;

      const updatedPatient = await ctx.prisma.patient.update({
        where: { id },
        data: updateData,
      });

      // Bei Gewichtsänderung: Automatisch neuen WeightEntry erstellen
      if (
        input.currentWeight &&
        Number(patient.currentWeight) !== input.currentWeight
      ) {
        await ctx.prisma.weightEntry.create({
          data: {
            patientId: id,
            weightKg: input.currentWeight,
            recordedBy: ctx.user.id,
          },
        });
      }

      return updatedPatient;
    }),

  // Sicherheitshinweis: Soft-Delete – Daten werden aus DSGVO-Gründen nicht hart gelöscht
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const patient = await ctx.prisma.patient.findUnique({
        where: { id: input.id },
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

      return ctx.prisma.patient.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),
});
