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
        websiteUrl: true,
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
          websiteUrl: true,
          createdAt: true,
        },
      });
    }),

  // Alias für Abwärtskompatibilität (kann nach vollständigem Deployment entfernt werden)
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
          websiteUrl: true,
          createdAt: true,
        },
      });
    }),
});
