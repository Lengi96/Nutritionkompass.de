"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShoppingCart, CalendarDays, List, ChevronLeft, ChevronRight, Trash2, FileDown } from "lucide-react";
import { toast } from "sonner";
import type { MealPlanData } from "@/lib/openai/nutritionPrompt";

interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
  category: string;
}

const categoryEmojis: Record<string, string> = {
  "Gemüse & Obst": "🥦",
  Protein: "🥩",
  Milchprodukte: "🧀",
  Kohlenhydrate: "🍞",
  Sonstiges: "🪹",
};

const CATEGORY_ORDER = ["Gemüse & Obst", "Protein", "Milchprodukte", "Kohlenhydrate", "Sonstiges"];

/** ISO-Montag der Woche des übergebenen Datums (UTC-sicher) */
function getMondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Montag einer Woche → ISO-Date-String YYYY-MM-DD */
function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Alle itemsJson mehrerer Listen zusammenführen (Mengen addieren) */
function aggregateLists(
  lists: { itemsJson: unknown; mealPlan?: { planJson?: unknown } }[]
): Record<string, ShoppingItem[]> {
  const ingredientMap = new Map<string, ShoppingItem>();

  for (const list of lists) {
    const grouped = getNormalizedItems(list.itemsJson, list.mealPlan?.planJson);
    for (const categoryItems of Object.values(grouped)) {
      for (const item of categoryItems) {
        const key = `${item.name.toLowerCase()}_${item.unit}`;
        const existing = ingredientMap.get(key);
        if (existing) {
          existing.amount += item.amount;
        } else {
          ingredientMap.set(key, { ...item });
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
    const cat = grouped[item.category] ? item.category : "Sonstiges";
    grouped[cat].push({ ...item, amount: Math.round(item.amount) });
  }

  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  return grouped;
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
    const cat = grouped[item.category] ? item.category : "Sonstiges";
    grouped[cat].push({ ...item, amount: Math.round(item.amount) });
  }

  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  return grouped;
}

function getNormalizedItems(
  itemsJson: unknown,
  planJson?: unknown
): Record<string, ShoppingItem[]> {
  const grouped = itemsJson as Record<string, ShoppingItem[]>;
  if (!isTooCoarseGroupedItems(grouped)) {
    return grouped;
  }
  return rebuildGroupedItemsFromPlan(planJson) ?? grouped;
}
type ViewMode = "week" | "all";

async function exportShoppingListPdf(params: {
  items: Record<string, ShoppingItem[]>;
  patientPseudonym: string;
  weekStart: string;
  filename: string;
}) {
  const { pdf } = await import("@react-pdf/renderer");
  const { ShoppingListPdfDocument } = await import("@/lib/pdf/shoppingListPdf");

  const blob = await pdf(
    <ShoppingListPdfDocument
      items={params.items}
      patientPseudonym={params.patientPseudonym}
      weekStart={params.weekStart}
    />
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = params.filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ShoppingListPdfExportButton({
  items,
  patientPseudonym,
  weekStart,
  filename,
  label = "PDF",
  size = "sm",
}: {
  items: Record<string, ShoppingItem[]>;
  patientPseudonym: string;
  weekStart: string;
  filename: string;
  label?: string;
  size?: "sm" | "default";
}) {
  const [isExporting, setIsExporting] = useState(false);

  return (
    <Button
      variant="outline"
      size={size}
      className="rounded-xl"
      disabled={isExporting}
      onClick={async () => {
        setIsExporting(true);
        try {
          await exportShoppingListPdf({
            items,
            patientPseudonym,
            weekStart,
            filename,
          });
          toast.success("PDF erfolgreich erstellt.");
        } catch (err) {
          const detail = err instanceof Error ? err.message : "Unbekannter Fehler";
          console.error("[PDF] Export fehlgeschlagen:", err);
          toast.error(`PDF konnte nicht erstellt werden: ${detail}`);
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
      {label}
    </Button>
  );
}

export default function ShoppingListsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  // Aktuelle Woche als Startpunkt
  const todayMonday = useMemo(() => getMondayOf(new Date()), []);

  // Ausgewählte Woche (Montag), default = diese Woche
  const [selectedMonday, setSelectedMonday] = useState<Date>(todayMonday);

  const {
    data: lists,
    isLoading,
    error,
    refetch,
  } = trpc.shoppingList.list.useQuery({ limit: 200 }, { retry: 1 });
  const deleteShoppingList = trpc.shoppingList.delete.useMutation({
    onSuccess: () => {
      toast.success("Einkaufsliste wurde gelöscht.");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Einkaufsliste konnte nicht gelöscht werden.");
    },
  });

  // Woche vor/zurück navigieren
  function shiftWeek(delta: number) {
    setSelectedMonday((prev) => {
      const d = new Date(prev);
      d.setUTCDate(d.getUTCDate() + delta * 7);
      return d;
    });
  }

  // Datum-Input (type=week) → Montag der ausgewählten Woche
  function handleWeekInput(value: string) {
    if (!value) return;
    // value = "2025-W08" → Montag dieser Woche
    const [yearStr, weekStr] = value.split("-W");
    const year = parseInt(yearStr, 10);
    const week = parseInt(weekStr, 10);
    // ISO-Wochennummer → Montag berechnen
    const jan4 = new Date(Date.UTC(year, 0, 4)); // 4. Jan ist immer in KW1
    const startOfWeek1 = getMondayOf(jan4);
    const targetMonday = new Date(startOfWeek1);
    targetMonday.setUTCDate(startOfWeek1.getUTCDate() + (week - 1) * 7);
    setSelectedMonday(targetMonday);
  }

  // Aktueller KW-Wert für input[type=week]
  const weekInputValue = useMemo(() => {
    const kw = getWeekNumber(selectedMonday);
    const year = selectedMonday.getUTCFullYear();
    // Sonderfall: KW 52/53 kann zum nächsten Jahr gehören
    const kwStr = String(kw).padStart(2, "0");
    return `${year}-W${kwStr}`;
  }, [selectedMonday]);

  const selectedIso = toIso(selectedMonday);
  const isThisWeek = selectedIso === toIso(todayMonday);
  const nextMonday = new Date(todayMonday);
  nextMonday.setUTCDate(todayMonday.getUTCDate() + 7);
  const isNextWeek = selectedIso === toIso(nextMonday);

  // Gefilterte Listen für ausgewählte Woche
  const filteredLists = useMemo(() => {
    if (!lists) return [];
    if (viewMode === "all") return lists;
    return lists.filter((l) => {
      const ws = new Date(l.mealPlan.weekStart);
      return toIso(getMondayOf(ws)) === selectedIso;
    });
  }, [lists, viewMode, selectedIso]);

  // Aggregierte Wochenansicht
  const aggregated = useMemo(() => {
    if (viewMode === "all") return null;
    return aggregateLists(filteredLists);
  }, [filteredLists, viewMode]);

  const totalAggregatedItems = aggregated
    ? Object.values(aggregated).reduce((s, arr) => s + arr.length, 0)
    : 0;

  const selectedKW = getWeekNumber(selectedMonday);

  // Label für aktuelle Auswahl
  const weekLabel = isThisWeek
    ? `Diese Woche (KW ${selectedKW})`
    : isNextWeek
    ? `Nächste Woche (KW ${selectedKW})`
    : `KW ${selectedKW} / ${selectedMonday.getUTCFullYear()}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Einkaufslisten</h2>
        <p className="text-muted-foreground">
          Übersicht aller generierten Einkaufslisten Ihrer Einrichtung
        </p>
      </div>

      {/* Ansicht-Wechsler */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant={viewMode === "week" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => { setViewMode("week"); setSelectedMonday(todayMonday); }}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Wochenansicht
        </Button>
        <Button
          variant={viewMode === "all" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setViewMode("all")}
        >
          <List className="mr-2 h-4 w-4" />
          Alle
        </Button>
      </div>

      {/* Wochennavigation (nur im Wochenmodus) */}
      {viewMode === "week" && (
        <div className="flex flex-wrap items-end gap-3">
          {/* Schnellauswahl */}
          <div className="flex gap-1">
            <Button
              variant={isThisWeek ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setSelectedMonday(todayMonday)}
            >
              Diese Woche
            </Button>
            <Button
              variant={isNextWeek ? "default" : "outline"}
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setSelectedMonday(new Date(nextMonday))}
            >
              Nächste Woche
            </Button>
          </div>

          {/* Pfeil-Navigation */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="rounded-xl h-8 w-8" onClick={() => shiftWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-text-main min-w-[120px] text-center">
              {weekLabel}
            </span>
            <Button variant="outline" size="icon" className="rounded-xl h-8 w-8" onClick={() => shiftWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Freie Wochenauswahl */}
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Woche wählen</Label>
              <Input
                type="week"
                value={weekInputValue}
                onChange={(e) => handleWeekInput(e.target.value)}
                className="rounded-xl h-8 text-sm w-40"
              />
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="text-center py-8 text-muted-foreground">
            <p className="font-medium text-text-main">Einkaufslisten konnten nicht geladen werden.</p>
            <p className="text-sm mt-1">{error.message}</p>
            <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "week" ? (
        /* ── Aggregierte Wochenansicht ── */
        <>
          {filteredLists.length === 0 ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="text-center py-10 text-muted-foreground">
                <ShoppingCart className="mx-auto h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium text-text-main">
                  Keine Einkaufslisten für {weekLabel}.
                </p>
                <p className="text-sm mt-1">
                  Erstellen Sie zuerst Ernährungspläne für diese Woche.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Info-Header */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Aggregierte Einkaufsliste für{" "}
                    <span className="font-semibold text-text-main">{weekLabel}</span>
                    {" – "}
                    <span className="font-semibold text-text-main">
                      {filteredLists.length} Bewohner:in{filteredLists.length !== 1 ? "nen" : ""}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mengen aller Bewohner:innen dieser Woche wurden zusammengeführt.
                  </p>
                </div>

                {aggregated && totalAggregatedItems > 0 ? (
                  <ShoppingListPdfExportButton
                    items={aggregated}
                    patientPseudonym={`Aggregiert KW ${selectedKW}`}
                    weekStart={selectedIso}
                    filename={`einkaufsliste-kw-${selectedKW}-${selectedMonday.getUTCFullYear()}.pdf`}
                    label="Aggregiert als PDF"
                  />
                ) : null}

                {/* Patienten-Chips */}
                <div className="flex flex-wrap gap-1">
                  {filteredLists.map((l) => (
                    <Link key={l.id} href={`/shopping-lists/${l.id}`}>
                      <Badge
                        variant="secondary"
                        className="rounded-xl cursor-pointer hover:bg-secondary/40 transition-colors text-xs"
                      >
                        {l.mealPlan.patient.pseudonym}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Statistiken */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="rounded-xl shadow-sm">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">{totalAggregatedItems}</div>
                    <p className="text-sm text-muted-foreground">Artikel gesamt</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl shadow-sm">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-secondary">
                      {aggregated
                        ? Object.values(aggregated).filter((arr) => arr.length > 0).length
                        : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Kategorien</p>
                  </CardContent>
                </Card>
                <Card className="rounded-xl shadow-sm">
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-text-main">{filteredLists.length}</div>
                    <p className="text-sm text-muted-foreground">Bewohner:innen</p>
                  </CardContent>
                </Card>
              </div>

              {/* Kategorien */}
              {aggregated &&
                CATEGORY_ORDER.map((category) => {
                  const categoryItems = aggregated[category] ?? [];
                  if (categoryItems.length === 0) return null;
                  return (
                    <Card key={category} className="rounded-xl shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-text-main flex items-center gap-2">
                          <span>{categoryEmojis[category] ?? ""}</span>
                          {category}
                          <Badge variant="secondary" className="rounded-xl ml-2">
                            {categoryItems.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {categoryItems.map((item, idx) => (
                            <div
                              key={`${category}-${idx}`}
                              className="flex items-center justify-between rounded-xl px-3 py-2 bg-accent/20 hover:bg-accent/30 transition-colors"
                            >
                              <span className="text-sm text-text-main">{item.name}</span>
                              <span className="text-sm text-muted-foreground font-mono ml-4 shrink-0">
                                {item.amount} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </>
          )}
        </>
      ) : (
        /* ── Alle-Listenansicht (Tabelle) ── */
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-text-main">Alle Einkaufslisten</CardTitle>
            <CardDescription>Sortiert nach Erstellungsdatum (neueste zuerst)</CardDescription>
          </CardHeader>
          <CardContent>
            {!lists || lists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>Noch keine Einkaufslisten vorhanden.</p>
                <p className="text-sm mt-1">
                  Erstellen Sie zuerst einen Ernährungsplan und daraus eine Einkaufsliste.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bewohner:in</TableHead>
                    <TableHead>Kalenderwoche</TableHead>
                    <TableHead className="hidden sm:table-cell">Erstellt von</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead>Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-medium">
                        <Link className="hover:underline" href={`/patients/${list.mealPlan.patient.id}`}>
                          {list.mealPlan.patient.pseudonym}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-xl bg-secondary/20 text-secondary-600">
                          KW {getWeekNumber(new Date(list.mealPlan.weekStart))}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{list.mealPlan.createdByUser.name}</TableCell>
                      <TableCell>{new Date(list.createdAt).toLocaleDateString("de-DE")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/shopping-lists/${list.id}`}>
                            <Button variant="outline" size="sm" className="rounded-xl">
                              Öffnen
                            </Button>
                          </Link>
                          <ShoppingListPdfExportButton
                            items={getNormalizedItems(list.itemsJson, list.mealPlan.planJson)}
                            patientPseudonym={list.mealPlan.patient.pseudonym}
                            weekStart={new Date(list.mealPlan.weekStart).toISOString()}
                            filename={`einkaufsliste-${list.mealPlan.patient.pseudonym}.pdf`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-destructive hover:text-destructive"
                            disabled={deleteShoppingList.isPending}
                            onClick={() => {
                              const ok = window.confirm(
                                "Einkaufsliste wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden."
                              );
                              if (!ok) return;
                              deleteShoppingList.mutate({ id: list.id });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

