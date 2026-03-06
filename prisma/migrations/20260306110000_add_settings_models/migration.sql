-- CreateEnum
CREATE TYPE "UserDefaultLandingPage" AS ENUM ('DASHBOARD', 'PATIENTS', 'MEAL_PLANS', 'SHOPPING_LISTS');

-- CreateEnum
CREATE TYPE "UiDensity" AS ENUM ('COMFORTABLE', 'COMPACT');

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultLandingPage" "UserDefaultLandingPage" NOT NULL DEFAULT 'DASHBOARD',
    "uiDensity" "UiDensity" NOT NULL DEFAULT 'COMFORTABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "defaultMealsPerDay" INTEGER NOT NULL DEFAULT 3,
    "defaultSnacksPerDay" INTEGER NOT NULL DEFAULT 2,
    "defaultMaxCookTimeMinutes" INTEGER,
    "defaultMaxRecipeRepeatsPerWeek" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_organizationId_key" ON "OrganizationSettings"("organizationId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
