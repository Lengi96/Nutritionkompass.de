import { z } from "zod";
import {
  protectedProcedure,
  router,
} from "../init";
import {
  LANDING_PAGE_OPTIONS,
  UI_DENSITY_OPTIONS,
} from "@/lib/settings";
import { ensureUserSettings } from "@/server/settings";

const landingPageSchema = z.enum(
  LANDING_PAGE_OPTIONS.map((option) => option.value) as [
    "DASHBOARD",
    "PATIENTS",
    "MEAL_PLANS",
    "SHOPPING_LISTS",
  ]
);

const uiDensitySchema = z.enum(
  UI_DENSITY_OPTIONS.map((option) => option.value) as ["COMFORTABLE", "COMPACT"]
);

export const settingsRouter = router({
  getMySettings: protectedProcedure.query(async ({ ctx }) => {
    return ensureUserSettings(ctx.user.id);
  }),

  updateMySettings: protectedProcedure
    .input(
      z.object({
        defaultLandingPage: landingPageSchema,
        uiDensity: uiDensitySchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.userSettings.upsert({
        where: { userId: ctx.user.id },
        update: input,
        create: {
          userId: ctx.user.id,
          ...input,
        },
      });
    }),

  getFormOptions: protectedProcedure.query(() => {
    return {
      landingPages: LANDING_PAGE_OPTIONS,
      uiDensity: UI_DENSITY_OPTIONS,
    };
  }),
});
