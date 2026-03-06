import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import { router, protectedProcedure } from "../init";
import {
  aggregateShoppingItems,
  isNewMealPlan,
  isRedFlagMealPlan,
} from "@/lib/mealPlans/planFormat";

export const shoppingListRouter = router({
  generateFromPlan: protectedProcedure
    .input(z.object({ mealPlanId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const mealPlan = await ctx.prisma.mealPlan.findUnique({
        where: { id: input.mealPlanId },
        include: {
          patient: {
            select: { organizationId: true },
          },
          shoppingList: true,
        },
      });

      if (!mealPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ernährungsplan nicht gefunden.",
        });
      }

      if (mealPlan.patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      if (mealPlan.shoppingList) {
        return mealPlan.shoppingList;
      }

      if (isNewMealPlan(mealPlan.planJson) && isRedFlagMealPlan(mealPlan.planJson)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Für einen Red-Flag-Hinweisplan kann keine Einkaufsliste erstellt werden.",
        });
      }

      const groupedItems = aggregateShoppingItems(mealPlan.planJson as never);

      const shoppingList = await ctx.prisma.shoppingList.create({
        data: {
          mealPlanId: input.mealPlanId,
          itemsJson: groupedItems as unknown as Prisma.InputJsonValue,
        },
      });

      return shoppingList;
    }),

  getByMealPlan: protectedProcedure
    .input(z.object({ mealPlanId: z.string() }))
    .query(async ({ ctx, input }) => {
      const shoppingList = await ctx.prisma.shoppingList.findUnique({
        where: { mealPlanId: input.mealPlanId },
        include: {
          mealPlan: {
            include: {
              patient: {
                select: { organizationId: true, pseudonym: true },
              },
            },
          },
        },
      });

      if (!shoppingList) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einkaufsliste nicht gefunden.",
        });
      }

      if (shoppingList.mealPlan.patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      return shoppingList;
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.shoppingList.findMany({
        where: {
          mealPlan: {
            is: {
              patient: {
                is: {
                  organizationId: ctx.organizationId,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
        include: {
          mealPlan: {
            select: {
              id: true,
              planJson: true,
              weekStart: true,
              patient: {
                select: {
                  id: true,
                  pseudonym: true,
                },
              },
              createdByUser: {
                select: { name: true },
              },
            },
          },
        },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const shoppingList = await ctx.prisma.shoppingList.findUnique({
        where: { id: input.id },
        include: {
          mealPlan: {
            include: {
              patient: {
                select: { organizationId: true, pseudonym: true },
              },
              createdByUser: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!shoppingList) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einkaufsliste nicht gefunden.",
        });
      }

      if (shoppingList.mealPlan.patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      return shoppingList;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const shoppingList = await ctx.prisma.shoppingList.findUnique({
        where: { id: input.id },
        include: {
          mealPlan: {
            include: {
              patient: {
                select: { organizationId: true },
              },
            },
          },
        },
      });

      if (!shoppingList) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Einkaufsliste nicht gefunden.",
        });
      }

      if (shoppingList.mealPlan.patient.organizationId !== ctx.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Zugriff verweigert.",
        });
      }

      await ctx.prisma.shoppingList.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
