import { prisma } from "@/lib/prisma";
import {
  DEFAULT_USER_SETTINGS,
  getLandingPageHref,
} from "@/lib/settings";

export async function ensureUserSettings(userId: string) {
  return prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...DEFAULT_USER_SETTINGS,
    },
  });
}

export async function getUserLandingPageHref(userId: string) {
  const settings = await ensureUserSettings(userId);
  return getLandingPageHref(settings.defaultLandingPage);
}
