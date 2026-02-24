"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  ClipboardList,
  ShoppingCart,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";

// ─────────────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────────────

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ─────────────────────────────────────────────────
// Sub-Komponenten
// ─────────────────────────────────────────────────

/** Klickbare Stats-Karte mit optionalem Link (Opt. 2) */
function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor,
  href,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  href?: string;
  isLoading: boolean;
}) {
  const content = (
    <Card
      className={`rounded-xl shadow-sm transition-all duration-200 ${
        href
          ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md group"
          : ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* Pfeil erscheint bei Hover, nur bei klickbaren Karten */}
          {href && (
            <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold text-text-main">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

/** Onboarding-Willkommen für neue Nutzer (Opt. 4) */
function OnboardingEmptyState() {
  return (
    <Card className="rounded-[20px] shadow-sm">
      <CardContent className="px-8 py-12">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧭</div>
          <h3 className="text-2xl font-bold text-text-main mb-2">
            Willkommen bei mein-nutrikompass.de!
          </h3>
          <p className="text-muted-foreground">
            Legen Sie Ihre erste Bewohnerin an, um loszulegen.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Schritt 1 – aktiv */}
          <Card className="rounded-xl border-2 border-primary/20 shadow-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-3">👤</div>
              <h4 className="font-semibold text-text-main mb-1">
                Bewohnerin anlegen
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Erstellen Sie ein pseudonymisiertes Profil mit Gewicht und
                Zielgewicht.
              </p>
              <Link href="/patients">
                <Button className="w-full rounded-xl bg-primary hover:bg-primary-600">
                  Jetzt anlegen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Schritt 2 – gedimmt */}
          <Card className="rounded-xl shadow-sm opacity-50">
            <CardContent className="pt-6 text-center">
              <Badge
                variant="secondary"
                className="mb-2 rounded-lg text-xs"
              >
                Schritt 2
              </Badge>
              <div className="text-3xl mb-3">✨</div>
              <h4 className="font-semibold text-text-main mb-1">
                Plan generieren
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Lassen Sie per KI einen ausgewogenen Wochenernährungsplan
                erstellen.
              </p>
              <Button
                className="w-full rounded-xl"
                variant="secondary"
                disabled
              >
                Zuerst eine Bewohnerin anlegen
              </Button>
            </CardContent>
          </Card>

          {/* Schritt 3 – gedimmt */}
          <Card className="rounded-xl shadow-sm opacity-50">
            <CardContent className="pt-6 text-center">
              <Badge
                variant="secondary"
                className="mb-2 rounded-lg text-xs"
              >
                Schritt 3
              </Badge>
              <div className="text-3xl mb-3">🛒</div>
              <h4 className="font-semibold text-text-main mb-1">
                Einkaufsliste
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Automatisch aggregierte Einkaufsliste für die ganze Einrichtung.
              </p>
              <Button
                className="w-full rounded-xl"
                variant="secondary"
                disabled
              >
                Zuerst eine Bewohnerin anlegen
              </Button>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

/** Schnellaktions-Widget (Opt. 6) */
function QuickActions({
  patients,
  lastShoppingList,
}: {
  patients: Array<{ id: string; pseudonym: string }>;
  lastShoppingList?: {
    id: string;
    mealPlan: {
      weekStart: string | Date;
      patient: { pseudonym: string };
    };
  } | null;
}) {
  const router = useRouter();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="px-7 py-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Schnellaktionen
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
          {/* Aktion 1: Plan generieren */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h4 className="text-sm font-semibold text-text-main">
                Plan generieren
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Wochenplan für eine Bewohnerin erstellen
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={selectedPatientId}
                onValueChange={setSelectedPatientId}
              >
                <SelectTrigger className="rounded-xl flex-1">
                  <SelectValue placeholder="Bewohnerin wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.pseudonym}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="rounded-xl bg-primary hover:bg-primary-600 shrink-0"
                disabled={!selectedPatientId}
                onClick={() => {
                  if (selectedPatientId) {
                    router.push(`/patients/${selectedPatientId}`);
                  }
                }}
              >
                Plan erstellen
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Trennlinie */}
          <div className="hidden sm:block w-px bg-gray-200 mx-6" />
          <div className="sm:hidden h-px bg-gray-200" />

          {/* Aktion 2: Einkaufsliste anzeigen */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛒</span>
              <h4 className="text-sm font-semibold text-text-main">
                Einkaufsliste anzeigen
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Zuletzt erstellte Einkaufsliste öffnen
            </p>
            {lastShoppingList ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-main">
                  {lastShoppingList.mealPlan.patient.pseudonym} – KW{" "}
                  {getWeekNumber(
                    new Date(lastShoppingList.mealPlan.weekStart)
                  )}
                </span>
                <Link href={`/shopping-lists/${lastShoppingList.id}`}>
                  <Button
                    variant="outline"
                    className="rounded-xl shrink-0"
                  >
                    Öffnen
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                variant="outline"
                className="rounded-xl"
                disabled
              >
                Noch keine Einkaufslisten
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Tabelle mit klickbaren Zeilen (Opt. 3) */
function MealPlanTable({
  plans,
}: {
  plans: Array<{
    id: string;
    weekStart: string | Date;
    totalKcal: number;
    createdAt: string | Date;
    patient: { pseudonym: string };
  }>;
}) {
  const router = useRouter();

  // Leere Tabelle: Placeholder
  if (plans.length === 0) {
    return (
      <Card className="rounded-xl shadow-sm">
        <CardContent className="py-12 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium text-text-main">
            Noch keine Ernährungspläne erstellt
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Erstellen Sie den ersten Plan für eine Bewohnerin.
          </p>
          <Link href="/patients">
            <Button className="mt-4 rounded-xl bg-primary hover:bg-primary-600">
              Ersten Plan erstellen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-text-main">
          Letzte Ernährungspläne
        </CardTitle>
        <CardDescription>
          Die zuletzt erstellten Ernährungspläne
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bewohner:in</TableHead>
              <TableHead>Kalenderwoche</TableHead>
              <TableHead>Kalorien/Woche</TableHead>
              <TableHead>Erstellt am</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow
                key={plan.id}
                className="cursor-pointer group hover:bg-[#F0FDF4] transition-colors"
                onClick={() => router.push(`/meal-plans/${plan.id}`)}
              >
                <TableCell className="font-medium">
                  {plan.patient.pseudonym}
                </TableCell>
                <TableCell>
                  KW {getWeekNumber(new Date(plan.weekStart))}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="rounded-xl bg-secondary/20 text-secondary-600"
                  >
                    {plan.totalKcal.toLocaleString("de-DE")} kcal
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(plan.createdAt).toLocaleDateString("de-DE")}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/meal-plans/${plan.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[13px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Öffnen →
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** Loading-Skeleton für Stats-Karten */
function StatsSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Loading-Skeleton für Tabelle */
function TableSkeleton() {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-20 rounded-xl" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// Haupt-Seite
// ─────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();

  // Opt. 1: Tageszeit-abhängiges Greeting
  const [greeting, setGreeting] = useState("Guten Tag");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Guten Morgen");
    else if (hour < 18) setGreeting("Guten Tag");
    else setGreeting("Guten Abend");
  }, []);

  // Vorname extrahieren
  const firstName =
    session?.user?.name?.split(" ")[0] ?? "Benutzer";

  // Daten laden
  const { data: patients, isLoading: patientsLoading } =
    trpc.patients.list.useQuery({});
  const { data: mealPlans, isLoading: plansLoading } =
    trpc.mealPlans.list.useQuery({ limit: 10 });
  const { data: shoppingLists, isLoading: shoppingLoading } =
    trpc.shoppingList.list.useQuery({ limit: 50 });

  const isLoading = patientsLoading || plansLoading || shoppingLoading;

  // Abgeleitete Werte
  const activePatients = patients?.length ?? 0;
  const plansThisWeek =
    mealPlans?.filter((mp) => {
      const created = new Date(mp.createdAt).getTime();
      return created > Date.now() - 7 * 24 * 60 * 60 * 1000;
    }).length ?? 0;
  const openShoppingLists = shoppingLists?.length ?? 0;

  // Letzte Aktivität berechnen
  const lastActivity = mealPlans?.[0]
    ? new Date(mealPlans[0].createdAt).toLocaleDateString("de-DE")
    : "Keine Aktivität";

  // Letzte Einkaufsliste für Quick Actions
  const lastShoppingList = shoppingLists?.[0] ?? null;

  // Onboarding-Bedingungen (Opt. 4)
  const isCompleteEmpty =
    !isLoading && activePatients === 0 && (mealPlans?.length ?? 0) === 0;
  const hasPatientButNoPlans =
    !isLoading && activePatients > 0 && (mealPlans?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      {/* Header mit Greeting + CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main">
            {greeting}, {firstName}
          </h2>
          <p className="text-muted-foreground">
            Hier ist die Übersicht Ihrer Einrichtung
          </p>
        </div>
        <Link href="/patients">
          <Button className="rounded-xl bg-primary hover:bg-primary-600">
            <Plus className="mr-2 h-4 w-4" />
            Neuen Plan erstellen
          </Button>
        </Link>
      </div>

      {/* ───── Onboarding Empty State (Opt. 4) ───── */}
      {isCompleteEmpty ? (
        <OnboardingEmptyState />
      ) : (
        <>
          {/* ───── Stats-Karten (Opt. 2) ───── */}
          {isLoading ? (
            <StatsSkeletonGrid />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                label="Aktive Bewohner:innen"
                value={activePatients}
                icon={Users}
                iconColor="text-primary"
                href="/patients"
                isLoading={false}
              />
              <StatsCard
                label="Pläne diese Woche"
                value={plansThisWeek}
                icon={ClipboardList}
                iconColor="text-secondary"
                href="/meal-plans"
                isLoading={false}
              />
              <StatsCard
                label="Einkaufslisten"
                value={openShoppingLists}
                icon={ShoppingCart}
                iconColor="text-primary"
                href="/shopping-lists"
                isLoading={false}
              />
              <StatsCard
                label="Letzte Aktivität"
                value={lastActivity}
                icon={Clock}
                iconColor="text-secondary"
                isLoading={false}
              />
            </div>
          )}

          {/* ───── Schnellaktions-Widget (Opt. 6) ───── */}
          {!isLoading && activePatients > 0 && patients && (
            <QuickActions
              patients={patients.map((p) => ({
                id: p.id,
                pseudonym: p.pseudonym,
              }))}
              lastShoppingList={
                lastShoppingList
                  ? {
                      id: lastShoppingList.id,
                      mealPlan: {
                        weekStart: lastShoppingList.mealPlan.weekStart,
                        patient: {
                          pseudonym:
                            lastShoppingList.mealPlan.patient.pseudonym,
                        },
                      },
                    }
                  : null
              }
            />
          )}

          {/* ───── Ernährungspläne-Tabelle (Opt. 3 + 4) ───── */}
          {isLoading ? (
            <TableSkeleton />
          ) : hasPatientButNoPlans ? (
            // Patienten vorhanden, aber noch keine Pläne
            <Card className="rounded-xl shadow-sm">
              <CardContent className="py-12 text-center">
                <Sparkles className="mx-auto h-12 w-12 mb-3 text-primary opacity-60" />
                <p className="font-medium text-text-main">
                  Sie haben {activePatients}{" "}
                  {activePatients === 1 ? "Bewohnerin" : "Bewohnerinnen"}{" "}
                  angelegt.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Erstellen Sie jetzt den ersten Ernährungsplan.
                </p>
                <Link href="/patients">
                  <Button className="mt-4 rounded-xl bg-primary hover:bg-primary-600">
                    Plan erstellen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <MealPlanTable
              plans={
                mealPlans?.slice(0, 5).map((mp) => ({
                  id: mp.id,
                  weekStart: mp.weekStart,
                  totalKcal: mp.totalKcal,
                  createdAt: mp.createdAt,
                  patient: { pseudonym: mp.patient.pseudonym },
                })) ?? []
              }
            />
          )}
        </>
      )}
    </div>
  );
}
