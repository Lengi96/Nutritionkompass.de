"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShoppingCart, CalendarDays, List } from "lucide-react";

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

/** ISO-Montag der Woche des übergebenen Datums */
function getMondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // 1=Mo … 7=So
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

/** Alle itemsJson mehrerer Listen zusammenführen (Mengen addieren) */
function aggregateLists(lists: { itemsJson: unknown }[]): Record<string, ShoppingItem[]> {
  const ingredientMap = new Map<string, ShoppingItem>();

  for (const list of lists) {
    const grouped = list.itemsJson as Record<string, ShoppingItem[]>;
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

type WeekFilter = "this" | "next" | "all";

export default function ShoppingListsPage() {
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("this");

  const {
    data: lists,
    isLoading,
    error,
    refetch,
  } = trpc.shoppingList.list.useQuery(
    { limit: 200 },
    { retry: 1 }
  );

  // Wochenanfänge berechnen
  const thisMonday = getMondayOf(new Date());
  const nextMonday = new Date(thisMonday);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);

  const isoThis = thisMonday.toISOString().slice(0, 10);
  const isoNext = nextMonday.toISOString().slice(0, 10);

  // Gefilterte Listen
  const filteredLists = useMemo(() => {
    if (!lists) return [];
    if (weekFilter === "all") return lists;
    const targetIso = weekFilter === "this" ? isoThis : isoNext;
    return lists.filter((l) => {
      const ws = new Date(l.mealPlan.weekStart);
      const monday = getMondayOf(ws);
      return monday.toISOString().slice(0, 10) === targetIso;
    });
  }, [lists, weekFilter, isoThis, isoNext]);

  // Aggregierte Wochenansicht
  const aggregated = useMemo(() => {
    if (weekFilter === "all") return null;
    return aggregateLists(filteredLists);
  }, [filteredLists, weekFilter]);

  const totalAggregatedItems = aggregated
    ? Object.values(aggregated).reduce((s, arr) => s + arr.length, 0)
    : 0;

  const thisWeekKW = getWeekNumber(thisMonday);
  const nextWeekKW = getWeekNumber(nextMonday);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Einkaufslisten</h2>
        <p className="text-muted-foreground">
          Übersicht aller generierten Einkaufslisten Ihrer Einrichtung
        </p>
      </div>

      {/* Wochenfilter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={weekFilter === "this" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setWeekFilter("this")}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Diese Woche (KW {thisWeekKW})
        </Button>
        <Button
          variant={weekFilter === "next" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setWeekFilter("next")}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          Nächste Woche (KW {nextWeekKW})
        </Button>
        <Button
          variant={weekFilter === "all" ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => setWeekFilter("all")}
        >
          <List className="mr-2 h-4 w-4" />
          Alle
        </Button>
      </div>

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
      ) : weekFilter !== "all" ? (
        /* ── Aggregierte Wochenansicht ── */
        <>
          {filteredLists.length === 0 ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="text-center py-10 text-muted-foreground">
                <ShoppingCart className="mx-auto h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium text-text-main">
                  Keine Einkaufslisten für{" "}
                  {weekFilter === "this" ? `KW ${thisWeekKW}` : `KW ${nextWeekKW}`}.
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
                    <span className="font-semibold text-text-main">
                      KW {weekFilter === "this" ? thisWeekKW : nextWeekKW}
                    </span>{" "}
                    –{" "}
                    <span className="font-semibold text-text-main">
                      {filteredLists.length} Patient{filteredLists.length !== 1 ? "en" : ""}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mengen aller Patienten dieser Woche wurden zusammengeführt.
                  </p>
                </div>

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
                    <p className="text-sm text-muted-foreground">Patienten</p>
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
                    <TableHead>Patient</TableHead>
                    <TableHead>Kalenderwoche</TableHead>
                    <TableHead>Erstellt von</TableHead>
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
                      <TableCell>{list.mealPlan.createdByUser.name}</TableCell>
                      <TableCell>{new Date(list.createdAt).toLocaleDateString("de-DE")}</TableCell>
                      <TableCell>
                        <Link href={`/shopping-lists/${list.id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl">
                            Öffnen
                          </Button>
                        </Link>
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
