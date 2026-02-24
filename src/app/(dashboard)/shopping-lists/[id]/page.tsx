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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, FileDown, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MealPlanData } from "@/lib/openai/nutritionPrompt";

interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
  category: string;
}

const categoryEmojis: Record<string, string> = {
  "Gemüse & Obst": "\uD83E\uDD66",
  Protein: "\uD83E\uDD69",
  Milchprodukte: "\uD83E\uDDC0",
  Kohlenhydrate: "\uD83C\uDF5E",
  Sonstiges: "\uD83E\uDED9",
};

export default function ShoppingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: shoppingList, isLoading } = trpc.shoppingList.getById.useQuery({
    id: listId,
  });
  const deleteShoppingList = trpc.shoppingList.delete.useMutation({
    onSuccess: () => {
      toast.success("Einkaufsliste wurde gelöscht.");
      router.push("/shopping-lists");
    },
    onError: (error) => {
      toast.error(error.message || "Einkaufsliste konnte nicht gelöscht werden.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!shoppingList) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Einkaufsliste nicht gefunden.</p>
      </div>
    );
  }

  const rawItems = shoppingList.itemsJson as unknown as Record<string, ShoppingItem[]>;
  const items = isTooCoarseGroupedItems(rawItems)
    ? rebuildGroupedItemsFromPlan(shoppingList.mealPlan.planJson) ?? rawItems
    : rawItems;
  const totalItems = Object.values(items).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  const checkedCount = checkedItems.size;

  function toggleItem(key: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const mealPlanId = shoppingList.mealPlanId;
  const patientPseudonym = shoppingList.mealPlan.patient.pseudonym;
  const weekStart = shoppingList.mealPlan.weekStart;
  const weekStartStr = weekStart.toString();

  async function handlePdfExport() {
    setIsExporting(true);
    setInlineFeedback(null);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { ShoppingListPdfDocument } = await import(
        "@/lib/pdf/shoppingListPdf"
      );

      const blob = await pdf(
        <ShoppingListPdfDocument
          items={items}
          patientPseudonym={patientPseudonym}
          weekStart={weekStartStr}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `einkaufsliste-${patientPseudonym}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF erfolgreich erstellt!");
      setInlineFeedback({
        type: "success",
        message: "PDF wurde erfolgreich erstellt.",
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unbekannter Fehler";
      console.error("[PDF] Export fehlgeschlagen:", err);
      toast.error(`Fehler beim Erstellen des PDFs: ${detail}`);
      setInlineFeedback({
        type: "error",
        message: `PDF konnte nicht erstellt werden: ${detail}`,
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Zurück-Link */}
      <Link
        href={`/meal-plans/${mealPlanId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-text-main"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Ernährungsplan
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" />
            Einkaufsliste
          </h2>
          <p className="text-muted-foreground">
            {patientPseudonym} |{" "}
            {new Date(weekStart).toLocaleDateString("de-DE")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handlePdfExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Als PDF drucken
          </Button>
          <Button
            variant="outline"
            className="rounded-xl text-destructive hover:text-destructive"
            disabled={deleteShoppingList.isPending}
            onClick={() => {
              const ok = window.confirm(
                "Einkaufsliste wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden."
              );
              if (!ok) return;
              deleteShoppingList.mutate({ id: listId });
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
        </div>
      </div>

      {inlineFeedback && (
        <div
          role="status"
          aria-live={inlineFeedback.type === "error" ? "assertive" : "polite"}
          className={
            inlineFeedback.type === "error"
              ? "rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
          }
        >
          {inlineFeedback.message}
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{totalItems}</div>
            <p className="text-sm text-muted-foreground">Artikel gesamt</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-secondary">
              {Object.values(items).filter((arr) => arr.length > 0).length}
            </div>
            <p className="text-sm text-muted-foreground">Kategorien</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-text-main">
              {checkedCount}/{totalItems}
            </div>
            <p className="text-sm text-muted-foreground">Abgehakt</p>
          </CardContent>
        </Card>
      </div>

      {/* Kategorien */}
      {Object.entries(items).map(
        ([category, categoryItems]) =>
          categoryItems.length > 0 && (
            <Card key={category} className="rounded-xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-text-main flex items-center gap-2">
                  <span>{categoryEmojis[category] || ""}</span>
                  {category}
                  <Badge variant="secondary" className="rounded-xl ml-2">
                    {categoryItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryItems.map((item, idx) => {
                    const key = `${category}-${idx}`;
                    const isChecked = checkedItems.has(key);
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                          isChecked ? "bg-accent/50 opacity-60" : "hover:bg-accent/30"
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleItem(key)}
                          className="rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm ${
                                isChecked
                                  ? "line-through text-muted-foreground"
                                  : "text-text-main"
                              }`}
                            >
                              {item.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="rounded-lg bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
                            >
                              {item.amount} {item.unit}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )
      )}
    </div>
  );
}

function isTooCoarseGroupedItems(grouped: Record<string, ShoppingItem[]>): boolean {
  const categories = Object.keys(grouped);
  const totalItems = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
  if (totalItems === 0) return false;
  if (totalItems > categories.length + 1) return false;

  return Object.entries(grouped).every(([category, arr]) => {
    if (arr.length === 0) return true;
    if (arr.length > 1) return false;
    const name = arr[0]?.name?.toLowerCase?.().trim?.() ?? "";
    const categoryName = category.toLowerCase().trim();
    return name === categoryName || name.includes(categoryName);
  });
}

function rebuildGroupedItemsFromPlan(planJson?: unknown): Record<string, ShoppingItem[]> | null {
  if (!planJson) return null;
  const plan = planJson as MealPlanData;
  if (!plan?.days?.length) return null;

  const ingredientMap = new Map<string, ShoppingItem>();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const key = `${ingredient.name.toLowerCase()}_${ingredient.unit}`;
        const existing = ingredientMap.get(key);
        if (existing) {
          existing.amount += ingredient.amount;
        } else {
          ingredientMap.set(key, {
            name: ingredient.name,
            amount: ingredient.amount,
            unit: ingredient.unit,
            category: ingredient.category,
          });
        }
      }
    }
  }

  const grouped: Record<string, ShoppingItem[]> = {
    "Gemüse & Obst": [],
    Protein: [],
    Milchprodukte: [],
    Kohlenhydrate: [],
    Sonstiges: [],
  };

  for (const item of Array.from(ingredientMap.values())) {
    const category = grouped[item.category] ? item.category : "Sonstiges";
    grouped[category].push({
      ...item,
      amount: Math.round(item.amount),
    });
  }

  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  return grouped;
}

