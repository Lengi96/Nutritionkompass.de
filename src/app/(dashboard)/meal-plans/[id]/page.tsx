"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileDown, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NutrientBadge } from "@/components/ui/NutrientBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { MealPlanData } from "@/lib/openai/nutritionPrompt";
import {
  getDayNutrition,
  getMealNutrition,
  getPlanNutrition,
  getRecipeById,
  isLegacyMealPlan,
  isNewMealPlan,
  isOkMealPlan,
  isRedFlagMealPlan,
  type LegacyMealPlanData,
} from "@/lib/mealPlans/planFormat";

function PdfExportButton({
  plan,
  patientPseudonym,
  weekStart,
  createdBy,
}: {
  plan: MealPlanData;
  patientPseudonym: string;
  weekStart: string;
  createdBy: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  return (
    <Button
      variant="outline"
      className="rounded-xl"
      disabled={isExporting}
      onClick={async () => {
        setIsExporting(true);
        try {
          const { pdf } = await import("@react-pdf/renderer");
          const { MealPlanPdfDocument } = await import("@/lib/pdf/mealPlanPdf");
          const blob = await pdf(
            <MealPlanPdfDocument
              plan={plan}
              patientPseudonym={patientPseudonym}
              weekStart={weekStart}
              createdBy={createdBy}
            />
          ).toBlob();

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `ernaehrungsplan-${patientPseudonym}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("PDF erfolgreich erstellt.");
        } catch (error) {
          toast.error(
            `PDF konnte nicht erstellt werden: ${
              error instanceof Error ? error.message : "Unbekannter Fehler"
            }`
          );
        } finally {
          setIsExporting(false);
        }
      }}
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      PDF exportieren
    </Button>
  );
}

export default function MealPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();
  const planId = params.id as string;
  const [recipeDrafts, setRecipeDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const { data: plan, isLoading } = trpc.mealPlans.getById.useQuery({ id: planId });
  const generateShoppingList = trpc.shoppingList.generateFromPlan.useMutation({
    onSuccess: (data) => {
      toast.success("Einkaufsliste erfolgreich erstellt.");
      router.push(`/shopping-lists/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMealRecipe = trpc.mealPlans.updateMealRecipe.useMutation({
    onSuccess: async () => {
      await utils.mealPlans.getById.invalidate({ id: planId });
      toast.success("Zubereitung gespeichert.");
    },
    onError: (error) => {
      toast.error(error.message || "Zubereitung konnte nicht gespeichert werden.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return <div className="py-20 text-center text-muted-foreground">Plan nicht gefunden.</div>;
  }

  const planData = plan.planJson as MealPlanData | LegacyMealPlanData;
  const isLegacy = isLegacyMealPlan(planData);
  const isRegularNewPlan = isOkMealPlan(planData);
  const isRedFlagPlan = isNewMealPlan(planData) && isRedFlagMealPlan(planData);
  const planNutrients = getPlanNutrition(planData);

  return (
    <div className="space-y-6">
      <Link
        href={`/patients/${plan.patientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-text-main"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurueck zur Bewohner:in
      </Link>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl text-text-main">
                Ernaehrungsplan - {plan.patient.pseudonym}
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                KW {getWeekNumber(new Date(plan.weekStart))} - erstellt am{" "}
                {new Date(plan.createdAt).toLocaleDateString("de-DE")} - von{" "}
                {plan.createdByUser.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={generateShoppingList.isPending || !!plan.shoppingList || isRedFlagPlan}
                onClick={() => generateShoppingList.mutate({ mealPlanId: planId })}
              >
                {generateShoppingList.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                {plan.shoppingList ? "Einkaufsliste vorhanden" : "Einkaufsliste generieren"}
              </Button>
              {!isLegacy ? (
                <PdfExportButton
                  plan={planData}
                  patientPseudonym={plan.patient.pseudonym}
                  weekStart={String(plan.weekStart)}
                  createdBy={plan.createdByUser.name}
                />
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isRegularNewPlan ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-xl bg-primary/10 text-primary">
                  7-Tage-Struktur
                </Badge>
                <Badge variant="secondary" className="rounded-xl bg-secondary/20 text-secondary-600">
                  Snack-Zeiten: {planData.week_overview.snack_times.join(", ")}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <NutrientBadge type="kcal" value={planNutrients.kcal} />
                <NutrientBadge type="protein" value={planNutrients.protein} />
                <NutrientBadge type="carbs" value={planNutrients.carbs} />
                <NutrientBadge type="fat" value={planNutrients.fat} />
              </div>
              <p className="text-sm text-text-main">{planData.week_overview.daily_structure}</p>
              <p className="text-sm text-muted-foreground">{planData.week_overview.strategy}</p>
            </div>
          ) : isRedFlagPlan ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-medium">{planData.message}</p>
              <p className="mt-2">{planData.recommended_action}</p>
              <p className="mt-2">{planData.refeeding_note}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-xl bg-primary/10 text-primary">
                Bestehender Plan
              </Badge>
              <p className="text-sm text-muted-foreground">
                Dieser Plan wurde im aelteren Format gespeichert und wird kompatibel angezeigt.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isRegularNewPlan ? (
        <>
          <Tabs defaultValue={planData.days[0]?.day_name} className="space-y-4">
            <div className="sticky top-0 z-10 -mx-2 overflow-x-auto px-2 pb-2 pt-1 backdrop-blur">
              <TabsList className="h-auto min-w-max gap-2 rounded-2xl border bg-background/95 p-1 shadow-sm">
                {planData.days.map((day) => (
                  <TabsTrigger
                    key={day.day_name}
                    value={day.day_name}
                    className="rounded-xl px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {day.day_name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {planData.days.map((day, dayIndex) => (
              <TabsContent key={day.day_name} value={day.day_name} className="mt-0">
                {(() => {
                  const dayNutrients = getDayNutrition(planData, dayIndex);
                  return (
                <Card className="rounded-2xl border-primary/10 shadow-sm">
                  <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-secondary/10 to-background">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg text-text-main">{day.day_name}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <NutrientBadge type="kcal" value={dayNutrients.kcal} compact />
                          <NutrientBadge type="protein" value={dayNutrients.protein} compact />
                          <NutrientBadge type="carbs" value={dayNutrients.carbs} compact />
                          <NutrientBadge type="fat" value={dayNutrients.fat} compact />
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="w-fit rounded-xl bg-background/80 text-text-main"
                      >
                        {day.meals.filter((meal) => meal.title).length} Mahlzeiten
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-4 lg:grid-cols-2">
                    {day.meals.map((meal, mealIndex) => {
                      if (!meal.title) {
                        return null;
                      }

                      const recipe = getRecipeById(planData, meal.recipe_id);
                      const draftKey = `${dayIndex}-${mealIndex}`;
                      const draftValue = recipeDrafts[draftKey] ?? recipe?.short_preparation ?? "";
                      const mealNutrients = getMealNutrition(planData, dayIndex, mealIndex);

                      return (
                        <div
                          key={draftKey}
                          className={`rounded-2xl border p-4 shadow-sm ${getMealCardClassName(meal.slot)}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getMealSlotBadgeClassName(meal.slot)}`}
                            >
                              {meal.slot}
                            </span>
                            {meal.arfid_exposure ? (
                              <Badge variant="outline" className="rounded-xl">
                                Exposition
                              </Badge>
                            ) : null}
                          </div>

                          <h3 className="mt-3 text-sm font-semibold text-text-main">{meal.title}</h3>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <NutrientBadge type="kcal" value={mealNutrients.kcal} compact />
                            <NutrientBadge type="protein" value={mealNutrients.protein} compact />
                            <NutrientBadge type="carbs" value={mealNutrients.carbs} compact />
                            <NutrientBadge type="fat" value={mealNutrients.fat} compact />
                          </div>

                          {meal.components ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {meal.components.carb} · {meal.components.protein} · {meal.components.fat} ·{" "}
                              {meal.components.fruit_or_veg}
                            </p>
                          ) : null}

                          {meal.alternatives.length > 0 ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Alternativen: {meal.alternatives.join(" | ")}
                            </p>
                          ) : null}

                          {meal.arfid_exposure ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Kleine Exposition: {meal.arfid_exposure}
                            </p>
                          ) : null}

                          {recipe ? (
                            <>
                              <div className="mt-3 rounded-xl bg-background/80 p-3 text-xs text-text-main ring-1 ring-black/5">
                                <p className="font-semibold">Rezept</p>
                                {recipe.shopping_items.length > 0 ? (
                                  <p className="mt-1 text-muted-foreground">
                                    Zutaten: {recipe.shopping_items
                                      .map((item) => `${item.amount} ${item.unit} ${item.name}`)
                                      .join(", ")}
                                  </p>
                                ) : null}
                                <div className="mt-2 space-y-1 text-muted-foreground">
                                  {recipe.short_preparation
                                    .split("\n")
                                    .map((step) => step.trim())
                                    .filter(Boolean)
                                    .map((step, index) => (
                                      <p key={`${recipe.recipe_id}-step-${index}`}>{step}</p>
                                    ))}
                                </div>
                                <p className="mt-2 text-muted-foreground">
                                  Sensorik: {recipe.sensory_features.join(", ")}
                                </p>
                                <p className="mt-1 text-muted-foreground">
                                  Warum hilfreich: {recipe.ed_support_rationale}
                                </p>
                              </div>

                              <Textarea
                                className="mt-3 rounded-xl"
                                rows={3}
                                value={draftValue}
                                onChange={(event) =>
                                  setRecipeDrafts((current) => ({
                                    ...current,
                                    [draftKey]: event.target.value,
                                  }))
                                }
                              />

                              <Button
                                className="mt-2 rounded-xl"
                                disabled={
                                  savingKey === draftKey ||
                                  draftValue.trim().length < 5 ||
                                  draftValue.trim() === (recipe.short_preparation ?? "").trim()
                                }
                                onClick={async () => {
                                  setSavingKey(draftKey);
                                  try {
                                    await updateMealRecipe.mutateAsync({
                                      planId,
                                      dayIndex,
                                      mealIndex,
                                      recipe: draftValue,
                                    });
                                  } finally {
                                    setSavingKey(null);
                                  }
                                }}
                              >
                                {savingKey === draftKey ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Zubereitung speichern
                              </Button>
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
                  );
                })()}
              </TabsContent>
            ))}
          </Tabs>

          {planData.meal_support_hints.length > 0 ? (
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-text-main">Meal-Support-Hinweise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {planData.meal_support_hints.map((hint, index) => (
                  <p key={`${hint}-${index}`} className="text-sm text-muted-foreground">
                    {hint}
                  </p>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : isLegacy ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {planData.days.map((day, dayIndex) => (
            <Card key={`${day.dayName}-${dayIndex}`} className="rounded-xl shadow-sm">
              <CardHeader>
                <div className="space-y-2">
                  <CardTitle className="text-lg text-text-main">{day.dayName}</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <NutrientBadge type="kcal" value={getDayNutrition(planData, dayIndex).kcal} compact />
                    <NutrientBadge type="protein" value={getDayNutrition(planData, dayIndex).protein} compact />
                    <NutrientBadge type="carbs" value={getDayNutrition(planData, dayIndex).carbs} compact />
                    <NutrientBadge type="fat" value={getDayNutrition(planData, dayIndex).fat} compact />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {day.meals.map((meal, mealIndex) => (
                  <div key={`${dayIndex}-${mealIndex}`} className="rounded-xl border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {meal.mealType}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-text-main">{meal.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <NutrientBadge type="kcal" value={getMealNutrition(planData, dayIndex, mealIndex).kcal} compact />
                      <NutrientBadge type="protein" value={getMealNutrition(planData, dayIndex, mealIndex).protein} compact />
                      <NutrientBadge type="carbs" value={getMealNutrition(planData, dayIndex, mealIndex).carbs} compact />
                      <NutrientBadge type="fat" value={getMealNutrition(planData, dayIndex, mealIndex).fat} compact />
                    </div>
                    {meal.description ? (
                      <p className="mt-2 text-xs text-muted-foreground">{meal.description}</p>
                    ) : null}
                    {meal.recipe ? (
                      <div className="mt-3 rounded-lg bg-accent/30 p-3 text-xs text-text-main">
                        <p className="font-semibold">Rezept</p>
                        <p className="mt-1 whitespace-pre-wrap">{meal.recipe}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getMealCardClassName(slot: string): string {
  switch (slot) {
    case "Frühstück":
      return "border-amber-200 bg-amber-50/70";
    case "Snack 1":
    case "Snack 2":
    case "Später Snack":
      return "border-sky-200 bg-sky-50/70";
    case "Mittagessen":
      return "border-emerald-200 bg-emerald-50/70";
    case "Abendessen":
      return "border-rose-200 bg-rose-50/70";
    default:
      return "border-border bg-card";
  }
}

function getMealSlotBadgeClassName(slot: string): string {
  switch (slot) {
    case "Frühstück":
      return "bg-amber-100 text-amber-900";
    case "Snack 1":
    case "Snack 2":
    case "Später Snack":
      return "bg-sky-100 text-sky-900";
    case "Mittagessen":
      return "bg-emerald-100 text-emerald-900";
    case "Abendessen":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-muted text-muted-foreground";
  }
}
