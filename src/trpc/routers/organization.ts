import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../init";

export const organizationRouter = router({
  get: adminProcedure.query(async ({ ctx }) => {
    const organization = await ctx.prisma.organization.findUnique({
      where: { id: ctx.organizationId },
      select: {
        id: true,
        name: true,
        contactEmail: true,
        contactPhone: true,
        websiteUrl: true,
        addressLine: true,
        postalCode: true,
        city: true,
        country: true,
        profileNotes: true,
        createdAt: true,
      },
    });

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Einrichtung nicht gefunden.",
      });
    }

    return organization;
  }),

  updateName: adminProcedure
    .input(
      z.object({
        name: z
          .string()
          .trim()
          .min(2, "Der Einrichtungsname muss mindestens 2 Zeichen lang sein.")
          .max(120, "Der Einrichtungsname darf maximal 120 Zeichen lang sein."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.organization.update({
        where: { id: ctx.organizationId },
        data: { name: input.name },
        select: {
          id: true,
          name: true,
          contactEmail: true,
          contactPhone: true,
          websiteUrl: true,
          addressLine: true,
          postalCode: true,
          city: true,
          country: true,
          profileNotes: true,
          createdAt: true,
        },
      });
    }),

  updateProfile: adminProcedure
    .input(
      z.object({
        name: z
          .string()
          .trim()
          .min(2, "Der Einrichtungsname muss mindestens 2 Zeichen lang sein.")
          .max(120, "Der Einrichtungsname darf maximal 120 Zeichen lang sein.")
          .regex(/^[^<>]*$/, "Bitte keine HTML-Tags oder Sondermarkierungen verwenden."),
        contactEmail: z
          .string()
          .trim()
          .email("Bitte geben Sie eine gültige Kontakt-E-Mail ein.")
          .max(160)
          .optional()
          .nullable(),
        contactPhone: z
          .string()
          .trim()
          .max(40, "Telefonnummer darf maximal 40 Zeichen lang sein.")
          .regex(/^[0-9+\-()\/\s.]*$/, "Telefonnummer enthält ungültige Zeichen.")
          .optional()
          .nullable(),
        websiteUrl: z
          .string()
          .trim()
          .url("Bitte eine gültige URL angeben (z. B. https://example.de).")
          .max(200)
          .optional()
          .nullable(),
        addressLine: z
          .string()
          .trim()
          .max(160, "Adresse darf maximal 160 Zeichen lang sein.")
          .regex(/^[^<>]*$/, "Bitte keine HTML-Tags oder Sondermarkierungen verwenden.")
          .optional()
          .nullable(),
        postalCode: z
          .string()
          .trim()
          .max(20, "PLZ darf maximal 20 Zeichen lang sein.")
          .regex(/^[A-Za-z0-9\- ]*$/, "PLZ enthält ungültige Zeichen.")
          .optional()
          .nullable(),
        city: z
          .string()
          .trim()
          .max(100, "Ort darf maximal 100 Zeichen lang sein.")
          .regex(/^[^<>]*$/, "Bitte keine HTML-Tags oder Sondermarkierungen verwenden.")
          .optional()
          .nullable(),
        country: z
          .string()
          .trim()
          .max(100, "Land darf maximal 100 Zeichen lang sein.")
          .regex(/^[^<>]*$/, "Bitte keine HTML-Tags oder Sondermarkierungen verwenden.")
          .optional()
          .nullable(),
        profileNotes: z
          .string()
          .trim()
          .max(1500, "Hinweise dürfen maximal 1500 Zeichen lang sein.")
          .regex(/^[^<>]*$/, "Bitte keine HTML-Tags oder Sondermarkierungen verwenden.")
          .optional()
          .nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const normalizeOptional = (value?: string | null) => {
        if (!value) return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };

      return ctx.prisma.organization.update({
        where: { id: ctx.organizationId },
        data: {
          name: input.name.trim(),
          contactEmail: normalizeOptional(input.contactEmail)?.toLowerCase() ?? null,
          contactPhone: normalizeOptional(input.contactPhone),
          websiteUrl: normalizeOptional(input.websiteUrl),
          addressLine: normalizeOptional(input.addressLine),
          postalCode: normalizeOptional(input.postalCode),
          city: normalizeOptional(input.city),
          country: normalizeOptional(input.country),
          profileNotes: normalizeOptional(input.profileNotes),
        },
        select: {
          id: true,
          name: true,
          contactEmail: true,
          contactPhone: true,
          websiteUrl: true,
          addressLine: true,
          postalCode: true,
          city: true,
          country: true,
          profileNotes: true,
          createdAt: true,
        },
      });
    }),

  // Alias für Abwärtskompatibilität
  update: adminProcedure
    .input(
      z.object({
        name: z
          .string()
          .trim()
          .min(2, "Der Einrichtungsname muss mindestens 2 Zeichen lang sein.")
          .max(120, "Der Einrichtungsname darf maximal 120 Zeichen lang sein."),
        websiteUrl: z
          .string()
          .trim()
          .url("Bitte eine gültige URL angeben (z. B. https://example.de).")
          .optional()
          .or(z.literal("").transform(() => undefined)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.organization.update({
        where: { id: ctx.organizationId },
        data: {
          name: input.name,
          websiteUrl: input.websiteUrl ?? null,
        },
        select: {
          id: true,
          name: true,
          contactEmail: true,
          contactPhone: true,
          websiteUrl: true,
          addressLine: true,
          postalCode: true,
          city: true,
          country: true,
          profileNotes: true,
          createdAt: true,
        },
      });
    }),
});
