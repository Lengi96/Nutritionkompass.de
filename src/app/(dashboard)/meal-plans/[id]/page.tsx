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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  FileDown,
  Beef,
  Wheat,
  Droplets,
  Handshake,
  Coffee,
  UtensilsCrossed,
  Moon,
  Apple,
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
  const [selectedDayTab, setSelectedDayTab] = useState("day-0");
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
  const planHint = extractPlanHint(plan.promptUsed);
  const totalDays = Math.max(planData.days.length, 1);
  const weekTotalKcal = planData.days.reduce(
    (sum, day) => sum + day.dailyKcal,
    0
  );
  const avgDailyKcal = Math.round(weekTotalKcal / totalDays);

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
    protein: Math.round(weekMacros.protein / totalDays),
    carbs: Math.round(weekMacros.carbs / totalDays),
    fat: Math.round(weekMacros.fat / totalDays),
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
        Zurück zur Bewohner:in
      </Link>

      {/* Plan-Header */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-text-main">
                Ernährungsplan – {plan.patient.pseudonym}
                {planHint ? (
                  <span className="ml-1 text-base font-medium text-muted-foreground">
                    ({planHint})
                  </span>
                ) : null}
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
              {weekTotalKcal.toLocaleString("de-DE")} kcal/Plan
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
              className="rounded-xl bg-amber-50 text-amber-600 text-sm px-3 py-1 flex items-center gap-1"
            >
              <Droplets className="h-3.5 w-3.5" />
              Ø {avgMacros.fat}g F / {Math.round(weekMacros.fat)}g/Wo
            </Badge>
          </div>
          {(() => {
            const ag = plan.patient.autonomyAgreement;
            if (ag) {
              const parts: string[] = [];
              if (ag.canPortionIndependent) {
                parts.push("Darf vollständig eigenständig portionieren");
              } else if (ag.canPortionSupervised) {
                parts.push("Darf unter Aufsicht portionieren");
              }
              if (ag.notes) parts.push(ag.notes);
              if (parts.length > 0) {
                return (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-700">
                    <Handshake className="h-4 w-4 mt-0.5 shrink-0" />
                    <span><span className="font-medium">Absprachen:</span> {parts.join(". ")}</span>
                  </div>
                );
              }
            }
            // Legacy-Fallback
            if (plan.patient.autonomyNotes) {
              return (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-700">
                  <Handshake className="h-4 w-4 mt-0.5 shrink-0" />
                  <span><span className="font-medium">Absprachen:</span> {plan.patient.autonomyNotes}</span>
                </div>
              );
            }
            return null;
          })()}
        </CardContent>
      </Card>

      <Tabs value={selectedDayTab} onValueChange={setSelectedDayTab} className="space-y-4">
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-xl p-2">
          {planData.days.map((day, dayIdx) => {
            const dayDate = getDateByOffset(new Date(plan.weekStart), dayIdx);
            const shortWeekday = getShortWeekday(dayDate);
            return (
              <TabsTrigger
                key={`day-trigger-${dayIdx}`}
                value={`day-${dayIdx}`}
                className="rounded-lg px-3 py-2"
              >
                {shortWeekday}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {planData.days.map((day, dayIdx) => {
          const dayProtein = Math.round(day.meals.reduce((s, m) => s + (m.protein ?? 0), 0));
          const dayCarbs = Math.round(day.meals.reduce((s, m) => s + (m.carbs ?? 0), 0));
          const dayFat = Math.round(day.meals.reduce((s, m) => s + (m.fat ?? 0), 0));
          const dayDate = getDateByOffset(new Date(plan.weekStart), dayIdx);

          return (
            <TabsContent key={`day-content-${dayIdx}`} value={`day-${dayIdx}`}>
              <Card className="rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg text-text-main">
                      {day.dayName} - {dayDate.toLocaleDateString("de-DE")}
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
                      <Badge variant="secondary" className="rounded-xl bg-amber-50 text-amber-600 text-xs px-2 py-0.5 flex items-center gap-1">
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
                      const allRecipeSteps = parseRecipeSteps(currentRecipe);
                      const recipeSteps = allRecipeSteps.filter(
                        (step) => !/^tipp:/i.test(step)
                      );
                      const tipSteps = allRecipeSteps.filter((step) =>
                        /^tipp:/i.test(step)
                      );
                      const mealMeta = getMealTypeMeta(meal.mealType);
                      const canSaveRecipe =
                        draftRecipe.trim().length >= 5 &&
                        draftRecipe.trim() !== currentRecipe.trim();

                      return (
                        <div
                          key={mealKey}
                          className="rounded-xl border p-3 hover:bg-accent/30 transition-colors"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                              <mealMeta.icon className="h-3.5 w-3.5" />
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

                          <div className="mt-2 rounded-lg border bg-white/80 p-2">
                            <p className="text-[11px] font-semibold text-text-main/90">
                              Zutaten pro Portion
                            </p>
                            <div className="mt-1 space-y-1 text-[11px] text-text-main/80">
                              {(meal.ingredients ?? []).slice(0, 5).map((ingredient, idx) => (
                                <div
                                  key={`${mealKey}-ingredient-${idx}`}
                                  className="flex items-center justify-between gap-2"
                                >
                                  <span className="truncate">{ingredient.name}</span>
                                  <span className="shrink-0 font-medium">
                                    {ingredient.amount} {ingredient.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-2 rounded-lg border bg-primary/5 p-2">
                            <p className="text-[11px] font-semibold text-text-main/90">
                              Zubereitung (kurz)
                            </p>
                            {recipeSteps.length > 0 ? (
                              <ol className="mt-1 list-decimal space-y-1 pl-4 text-[11px] text-text-main/80">
                                {recipeSteps.slice(0, 2).map((step, idx) => (
                                  <li key={`${mealKey}-preview-step-${idx}`}>{step}</li>
                                ))}
                              </ol>
                            ) : (
                              <p className="mt-1 text-[11px] text-text-main/70">
                                Keine Rezeptschritte vorhanden.
                              </p>
                            )}
                          </div>

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
                              <div className="rounded-lg border bg-white p-2">
                                <p className="text-xs font-medium text-text-main">
                                  Zutaten mit Mengen
                                </p>
                                <div className="mt-1 space-y-1 text-xs text-text-main/80">
                                  {(meal.ingredients ?? []).map((ingredient, idx) => (
                                    <div
                                      key={`${mealKey}-ingredient-full-${idx}`}
                                      className="flex items-center justify-between gap-2"
                                    >
                                      <span>{ingredient.name}</span>
                                      <span className="font-medium">
                                        {ingredient.amount} {ingredient.unit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {recipeSteps.length > 0 ? (
                                <div className="rounded-lg border bg-white p-2">
                                  <p className="text-xs font-medium text-text-main">
                                    Schritt-für-Schritt-Anleitung
                                  </p>
                                  <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-text-main/80">
                                    {recipeSteps.map((step, idx) => (
                                      <li key={`${mealKey}-step-${idx}`}>{step}</li>
                                    ))}
                                  </ol>
                                </div>
                              ) : null}
                              {(tipSteps[0] || "").length > 0 && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                                  <span className="font-medium">Küchentipp:</span>{" "}
                                  {tipSteps[0].replace(/^tipp:\s*/i, "")}
                                </div>
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
                                placeholder="Rezept mit Mengen/Zeiten, z.B. Schritt 1; Schritt 2; ...; Tipp: ..."
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
            </TabsContent>
          );
        })}
      </Tabs>

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
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unbekannter Fehler";
      console.error("[PDF] Export fehlgeschlagen:", err);
      toast.error(`Fehler beim Erstellen des PDFs: ${detail}`);
      onStatus({
        type: "error",
        message: `PDF konnte nicht erstellt werden: ${detail}`,
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

function getDateByOffset(startDate: Date, dayOffset: number): Date {
  const date = new Date(startDate);
  date.setDate(startDate.getDate() + dayOffset);
  return date;
}

function getShortWeekday(date: Date): string {
  return date
    .toLocaleDateString("de-DE", { weekday: "short" })
    .replace(".", "");
}

function getMealTypeMeta(mealType: string): {
  icon: typeof Coffee;
} {
  switch (mealType) {
    case "Frühstück":
      return { icon: Coffee };
    case "Mittagessen":
      return { icon: UtensilsCrossed };
    case "Abendessen":
      return { icon: Moon };
    case "Snack":
      return { icon: Apple };
    default:
      return { icon: Coffee };
  }
}

function extractPlanHint(promptUsed?: string | null): string | null {
  if (!promptUsed) return null;

  const hintMatch = promptUsed.match(/Hinweise:\s*([^|]+)/i);
  if (!hintMatch?.[1]) return null;

  let hint = hintMatch[1].trim();
  if (!hint || /keine besonderen hinweise/i.test(hint)) return null;

  hint = hint
    .replace(/Vorheriger Plan als Referenz vorhanden[\s\S]*/i, "")
    .split(/\r?\n/)[0]
    .trim();

  if (!hint) return null;

  const normalized = hint.toLowerCase();
  if (normalized.includes("vegetar")) return "vegetarisch";
  if (normalized.includes("vegan")) return "vegan";
  if (normalized.includes("laktose")) return "laktosearm";
  if (normalized.includes("gluten")) return "glutenfrei";
  if (normalized.includes("snack")) return "mehr Snacks";
  if (normalized.includes("mittags warm") || normalized.includes("abends kalt")) {
    return "mittags warm, abends kalt";
  }

  return hint.length > 36 ? `${hint.slice(0, 33).trim()}...` : hint;
}
function parseRecipeSteps(recipe: string): string[] {
  return recipe
    .split(/;|\n/)
    .map((step) => step.trim())
    .filter((step) => step.length > 0);
}





