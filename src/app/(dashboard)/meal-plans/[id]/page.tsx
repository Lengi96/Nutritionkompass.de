"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  FileDown,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react";
import { toast } from "sonner";
import type { MealPlanData } from "@/lib/openai/nutritionPrompt";

export default function MealPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = trpc.useUtils();
  const planId = params.id as string;
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [recipeDrafts, setRecipeDrafts] = useState<Record<string, string>>({});
  const [savingRecipeKey, setSavingRecipeKey] = useState<string | null>(null);

  const { data: plan, isLoading } = trpc.mealPlans.getById.useQuery({
    id: planId,
  });

  const generateShoppingList =
    trpc.shoppingList.generateFromPlan.useMutation({
      onSuccess: (data) => {
        toast.success("Einkaufsliste erfolgreich erstellt!");
        setInlineFeedback({
          type: "success",
          message: "Einkaufsliste wurde erfolgreich erstellt.",
        });
        router.push(`/shopping-lists/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
        setInlineFeedback({
          type: "error",
          message: error.message || "Einkaufsliste konnte nicht erstellt werden.",
        });
      },
    });

  const updateMealRecipe = trpc.mealPlans.updateMealRecipe.useMutation({
    onSuccess: async () => {
      toast.success("Rezept gespeichert.");
      setInlineFeedback({
        type: "success",
        message: "Rezept wurde gespeichert.",
      });
      await utils.mealPlans.getById.invalidate({ id: planId });
    },
    onError: (error) => {
      toast.error(error.message || "Rezept konnte nicht gespeichert werden.");
      setInlineFeedback({
        type: "error",
        message: error.message || "Rezept konnte nicht gespeichert werden.",
      });
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
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Ernährungsplan nicht gefunden.</p>
      </div>
    );
  }

  const planData = plan.planJson as unknown as MealPlanData;
  const weekTotalKcal = planData.days.reduce(
    (sum, day) => sum + day.dailyKcal,
    0
  );
  const avgDailyKcal = Math.round(weekTotalKcal / 7);

  // Makros für die ganze Woche
  const weekMacros = planData.days.reduce(
    (acc, day) => {
      for (const meal of day.meals) {
        acc.protein += meal.protein ?? 0;
        acc.carbs += meal.carbs ?? 0;
        acc.fat += meal.fat ?? 0;
      }
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 }
  );
  const avgMacros = {
    protein: Math.round(weekMacros.protein / 7),
    carbs: Math.round(weekMacros.carbs / 7),
    fat: Math.round(weekMacros.fat / 7),
  };

  function getMealKey(dayIdx: number, mealIdx: number): string {
    return `${dayIdx}-${mealIdx}`;
  }

  function getRecipeDraft(
    key: string,
    fallbackRecipe: string | undefined
  ): string {
    if (Object.prototype.hasOwnProperty.call(recipeDrafts, key)) {
      return recipeDrafts[key];
    }
    return fallbackRecipe ?? "";
  }

  return (
    <div className="space-y-6">
      {/* Zurück-Link */}
      <Link
        href={`/patients/${plan.patientId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-text-main"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Patienten
      </Link>

      {/* Plan-Header */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-text-main">
                Ernährungsplan – {plan.patient.pseudonym}
              </CardTitle>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                <span>
                  KW {getWeekNumber(new Date(plan.weekStart))} (
                  {new Date(plan.weekStart).toLocaleDateString("de-DE")})
                </span>
                <span>|</span>
                <span>Erstellt von: {plan.createdByUser.name}</span>
                <span>|</span>
                <span>
                  {new Date(plan.createdAt).toLocaleDateString("de-DE")}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setInlineFeedback(null);
                  generateShoppingList.mutate({ mealPlanId: planId });
                }}
                disabled={
                  generateShoppingList.isPending || !!plan.shoppingList
                }
              >
                {generateShoppingList.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="mr-2 h-4 w-4" />
                )}
                {plan.shoppingList
                  ? "Einkaufsliste vorhanden"
                  : "Einkaufsliste generieren"}
              </Button>
              <PdfExportButton
                plan={planData}
                patientPseudonym={plan.patient.pseudonym}
                weekStart={plan.weekStart.toString()}
                createdBy={plan.createdByUser.name}
                onStatus={setInlineFeedback}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inlineFeedback && (
            <div
              role="status"
              aria-live={inlineFeedback.type === "error" ? "assertive" : "polite"}
              className={
                inlineFeedback.type === "error"
                  ? "mb-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  : "mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              }
            >
              {inlineFeedback.message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Badge
              variant="secondary"
              className="rounded-xl bg-secondary/20 text-secondary-600 text-base px-4 py-1"
            >
              Ø {avgDailyKcal} kcal/Tag
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-xl bg-primary/10 text-primary text-base px-4 py-1"
            >
              {weekTotalKcal.toLocaleString("de-DE")} kcal/Woche
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-xl bg-blue-50 text-blue-600 text-sm px-3 py-1 flex items-center gap-1"
            >
              <Beef className="h-3.5 w-3.5" />
              Ø {avgMacros.protein}g P / {Math.round(weekMacros.protein)}g/Wo
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-xl bg-amber-50 text-amber-600 text-sm px-3 py-1 flex items-center gap-1"
            >
              <Wheat className="h-3.5 w-3.5" />
              Ø {avgMacros.carbs}g K / {Math.round(weekMacros.carbs)}g/Wo
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-xl bg-rose-50 text-rose-500 text-sm px-3 py-1 flex items-center gap-1"
            >
              <Droplets className="h-3.5 w-3.5" />
              Ø {avgMacros.fat}g F / {Math.round(weekMacros.fat)}g/Wo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 7-Tage-Grid */}
      <div className="grid gap-4">
        {planData.days.map((day, dayIdx) => {
          const dayProtein = Math.round(day.meals.reduce((s, m) => s + (m.protein ?? 0), 0));
          const dayCarbs = Math.round(day.meals.reduce((s, m) => s + (m.carbs ?? 0), 0));
          const dayFat = Math.round(day.meals.reduce((s, m) => s + (m.fat ?? 0), 0));
          return (
          <Card key={day.dayName} className="rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg text-text-main">
                  {day.dayName}
                </CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="rounded-xl bg-primary text-white">
                    {day.dailyKcal} kcal
                  </Badge>
                  <Badge variant="secondary" className="rounded-xl bg-blue-50 text-blue-600 text-xs px-2 py-0.5 flex items-center gap-1">
                    <Beef className="h-3 w-3" />{dayProtein}g
                  </Badge>
                  <Badge variant="secondary" className="rounded-xl bg-amber-50 text-amber-600 text-xs px-2 py-0.5 flex items-center gap-1">
                    <Wheat className="h-3 w-3" />{dayCarbs}g
                  </Badge>
                  <Badge variant="secondary" className="rounded-xl bg-rose-50 text-rose-500 text-xs px-2 py-0.5 flex items-center gap-1">
                    <Droplets className="h-3 w-3" />{dayFat}g
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {day.meals.map((meal, mealIdx) => {
                  const mealKey = getMealKey(dayIdx, mealIdx);
                  const currentRecipe =
                    (meal as unknown as { recipe?: string }).recipe ?? "";
                  const draftRecipe = getRecipeDraft(mealKey, currentRecipe);
                  const recipeSteps = parseRecipeSteps(currentRecipe);
                  const canSaveRecipe =
                    draftRecipe.trim().length >= 5 &&
                    draftRecipe.trim() !== currentRecipe.trim();

                  return (
                  <div
                    key={mealKey}
                    className="rounded-xl border p-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-primary uppercase">
                        {meal.mealType}
                      </span>
                      <Badge
                        variant="outline"
                        className="rounded-xl text-xs"
                      >
                        {meal.kcal} kcal
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm text-text-main">
                      {meal.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {meal.description}
                    </p>
                    <p className="mt-2 text-xs text-text-main/80">
                      <span className="font-medium">Rezept:</span>{" "}
                      {(recipeSteps[0] ||
                        "Keine Rezeptschritte vorhanden.")}
                    </p>
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                      <span>P: {meal.protein}g</span>
                      <span>K: {meal.carbs}g</span>
                      <span>F: {meal.fat}g</span>
                    </div>

                    <details className="mt-3 rounded-lg border bg-white/70 p-2">
                      <summary className="cursor-pointer text-xs font-medium text-primary">
                        Rezept anzeigen / bearbeiten
                      </summary>
                      <div className="mt-2 space-y-2">
                        {recipeSteps.length > 0 && (
                          <ol className="list-decimal space-y-1 pl-4 text-xs text-text-main/80">
                            {recipeSteps.map((step, idx) => (
                              <li key={`${mealKey}-step-${idx}`}>{step}</li>
                            ))}
                          </ol>
                        )}
                        <Textarea
                          value={draftRecipe}
                          onChange={(event) =>
                            setRecipeDrafts((prev) => ({
                              ...prev,
                              [mealKey]: event.target.value,
                            }))
                          }
                          rows={5}
                          className="rounded-lg text-xs"
                          placeholder="Rezept in kurzen Schritten, z.B. Schritt 1; Schritt 2; Schritt 3"
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            className="rounded-lg"
                            disabled={
                              savingRecipeKey === mealKey ||
                              updateMealRecipe.isPending ||
                              !canSaveRecipe
                            }
                            onClick={() => {
                              setInlineFeedback(null);
                              setSavingRecipeKey(mealKey);
                              updateMealRecipe.mutate(
                                {
                                  planId,
                                  dayIndex: dayIdx,
                                  mealIndex: mealIdx,
                                  recipe: draftRecipe.trim(),
                                },
                                {
                                  onSettled: () => {
                                    setSavingRecipeKey(null);
                                  },
                                }
                              );
                            }}
                          >
                            {savingRecipeKey === mealKey ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Speichert...
                              </>
                            ) : (
                              "Rezept speichern"
                            )}
                          </Button>
                        </div>
                      </div>
                    </details>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Shopping List Link */}
      {plan.shoppingList && (
        <div className="text-center">
          <Link href={`/shopping-lists/${plan.shoppingList.id}`}>
            <Button variant="outline" className="rounded-xl">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Zur Einkaufsliste
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// PDF-Export-Button Komponente (Client-only wegen @react-pdf/renderer)
function PdfExportButton({
  plan,
  patientPseudonym,
  weekStart,
  createdBy,
  onStatus,
}: {
  plan: MealPlanData;
  patientPseudonym: string;
  weekStart: string;
  createdBy: string;
  onStatus: (status: { type: "success" | "error"; message: string } | null) => void;
}) {
  // Da PDFDownloadLink und MealPlanPdfDocument dynamisch geladen werden,
  // verwenden wir einen einfachen Download-Ansatz
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePdfExport = async () => {
    setIsGenerating(true);
    onStatus(null);
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
      a.download = `ernaehrungsplan-${patientPseudonym}-${weekStart}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF erfolgreich erstellt!");
      onStatus({
        type: "success",
        message: "PDF wurde erfolgreich erstellt.",
      });
    } catch {
      toast.error("Fehler beim Erstellen des PDFs.");
      onStatus({
        type: "error",
        message: "PDF konnte nicht erstellt werden.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="rounded-xl"
      onClick={handlePdfExport}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      Als PDF exportieren
    </Button>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function parseRecipeSteps(recipe: string): string[] {
  return recipe
    .split(/;|\n/)
    .map((step) => step.trim())
    .filter((step) => step.length > 0);
}
