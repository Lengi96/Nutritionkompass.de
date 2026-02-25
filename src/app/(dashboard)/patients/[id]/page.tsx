"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { trpc } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  ArrowLeft,
  ClipboardList,
  TrendingUp,
  Pencil,
  Trash2,
  CalendarDays,
  Handshake,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { GeneratePlanModal } from "@/components/modals/GeneratePlanModal";
import { EditPatientModal } from "@/components/modals/EditPatientModal";
import { AutonomyTab } from "@/components/autonomy/AutonomyTab";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const patientIdParam = params.id;
  const patientId = Array.isArray(patientIdParam) ? patientIdParam[0] : patientIdParam;
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  const deletePatient = trpc.patients.delete.useMutation({
    onSuccess: () => {
      router.push("/patients");
    },
  });

  const {
    data: patient,
    isLoading,
    error,
    refetch,
  } = trpc.patients.getById.useQuery(
    { id: patientId ?? "" },
    {
      enabled: !!patientId,
      retry: 1,
    }
  );

  if (!patientId || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="font-medium text-text-main">Daten konnten nicht geladen werden.</p>
        <p className="mt-1 text-sm">{error.message}</p>
        <Link href="/patients">
          <Button variant="link" className="mt-2">
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Bewohner:in nicht gefunden.</p>
        <Link href="/patients">
          <Button variant="link" className="mt-2">
            Zurück zur Übersicht
          </Button>
        </Link>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const age = currentYear - patient.birthYear;
  const currentWeight = Number(patient.currentWeight);
  const targetWeight = Number(patient.targetWeight);

  // Fortschrittsberechnung
  const firstWeight =
    patient.weightHistory.length > 0
      ? Number(patient.weightHistory[0].weightKg)
      : currentWeight;
  const totalDiff = Math.abs(targetWeight - firstWeight);
  const currentDiff = Math.abs(currentWeight - firstWeight);
  const progressPercent =
    totalDiff > 0 ? Math.min(100, Math.round((currentDiff / totalDiff) * 100)) : 0;

  // Chart-Daten
  const chartData = patient.weightHistory.map((entry) => ({
    date: new Date(entry.recordedAt).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    }),
    gewicht: Number(entry.weightKg),
  }));

  return (
    <div className="space-y-6">
      {/* Zurück-Link */}
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-text-main"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </Link>

      {/* Patient Header Card */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl text-text-main">
                {patient.pseudonym}
              </CardTitle>
              <CardDescription>
                {age} Jahre | Allergien:{" "}
                {patient.allergies.length > 0
                  ? patient.allergies.join(", ")
                  : "Keine bekannt"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setEditModalOpen(true)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </Button>
              {isAdmin && (
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </Button>
              )}
              {patient.mealPlans[0] ? (
                <Link href={`/meal-plans/${patient.mealPlans[0].id}`}>
                  <Button variant="outline" className="rounded-xl">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Letzter Plan →
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="rounded-xl" disabled>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Noch kein Plan
                </Button>
              )}
              <Button
                className="rounded-xl bg-primary hover:bg-primary-600"
                onClick={() => setGenerateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Plan generieren
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Aktuell: {currentWeight.toFixed(1)} kg
              </span>
              <span className="text-muted-foreground">
                Ziel: {targetWeight.toFixed(1)} kg
              </span>
            </div>
            <Progress value={progressPercent} className="h-3 rounded-xl" />
            <p className="text-xs text-muted-foreground text-center">
              Fortschritt: {progressPercent}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto rounded-xl">
          <TabsTrigger value="overview" className="rounded-xl">
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="plans" className="rounded-xl">
            Ernährungspläne
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl">
            Verlauf
          </TabsTrigger>
          <TabsTrigger value="autonomy" className="rounded-xl">
            <Handshake className="mr-1 h-4 w-4" />
            Absprachen
          </TabsTrigger>
        </TabsList>

        {/* Übersicht */}
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Informationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Pseudonym
                  </span>
                  <span className="text-sm font-medium">
                    {patient.pseudonym}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Alter</span>
                  <span className="text-sm font-medium">{age} Jahre</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Aktuelles Gewicht
                  </span>
                  <span className="text-sm font-medium">
                    {currentWeight.toFixed(1)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Zielgewicht
                  </span>
                  <span className="text-sm font-medium">
                    {targetWeight.toFixed(1)} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Allergien
                  </span>
                  <span className="text-sm font-medium">
                    {patient.allergies.length > 0
                      ? patient.allergies.join(", ")
                      : "Keine"}
                  </span>
                </div>
                {patient.targetDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Zieldatum
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(patient.targetDate).toLocaleDateString("de-DE", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Notizen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-main">
                  {patient.notes || "Keine Notizen vorhanden."}
                </p>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        {/* Ernährungspläne */}
        <TabsContent value="plans">
          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-0">
              {patient.mealPlans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Noch keine Ernährungspläne erstellt.</p>
                  <Button
                    variant="link"
                    className="mt-2 text-primary"
                    onClick={() => setGenerateModalOpen(true)}
                  >
                    Ersten Plan generieren
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kalenderwoche</TableHead>
                      <TableHead>Kalorien/Woche</TableHead>
                      <TableHead>Erstellt von</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Einkaufsliste</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.mealPlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          KW{" "}
                          {getWeekNumber(new Date(plan.weekStart))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="rounded-xl bg-secondary/20 text-secondary-600"
                          >
                            {plan.totalKcal.toLocaleString("de-DE")} kcal
                          </Badge>
                        </TableCell>
                        <TableCell>{plan.createdByUser.name}</TableCell>
                        <TableCell>
                          {new Date(plan.createdAt).toLocaleDateString("de-DE")}
                        </TableCell>
                        <TableCell>
                          {plan.shoppingList ? (
                            <Link
                              href={`/shopping-lists/${plan.shoppingList.id}`}
                            >
                              <Badge className="rounded-xl bg-primary/10 text-primary cursor-pointer">
                                Vorhanden
                              </Badge>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/meal-plans/${plan.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl"
                            >
                              Ansehen
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
        </TabsContent>

        {/* Absprachen */}
        <TabsContent value="autonomy">
          <AutonomyTab patientId={patientId} />
        </TabsContent>

        {/* Verlauf */}
        <TabsContent value="history">
          <Card className="rounded-xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-text-main">
                <TrendingUp className="h-5 w-5 text-primary" />
                Gewichtsverlauf
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length < 2 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="mx-auto h-12 w-12 mb-3 opacity-50" />
                  <p>Noch nicht genug Datenpunkte für den Verlauf.</p>
                  <p className="text-sm mt-1">
                    Mindestens 2 Messungen werden benötigt.
                  </p>
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis
                        dataKey="date"
                        stroke="#666"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#666"
                        fontSize={12}
                        domain={["auto", "auto"]}
                        unit=" kg"
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "0.75rem",
                          border: "1px solid #E0E0E0",
                        }}
                        formatter={(value: number | undefined) => [
                          value != null ? `${value.toFixed(1)} kg` : "—",
                          "Gewicht",
                        ]}
                      />
                      <ReferenceLine
                        y={targetWeight}
                        stroke="#74C69D"
                        strokeDasharray="5 5"
                        label={{
                          value: "Ziel",
                          position: "right",
                          fill: "#74C69D",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="gewicht"
                        stroke="#2D6A4F"
                        strokeWidth={2}
                        dot={{ fill: "#2D6A4F", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Plan Modal */}
      <GeneratePlanModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        patientId={patientId}
        patientPseudonym={patient.pseudonym}
        onSuccess={() => {
          setGenerateModalOpen(false);
          refetch();
        }}
      />

      {/* Edit Patient Modal */}
      <EditPatientModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        patient={{
          id: patientId,
          pseudonym: patient.pseudonym,
          currentWeight: Number(patient.currentWeight),
          targetWeight: Number(patient.targetWeight),
          targetDate: patient.targetDate,
          allergies: patient.allergies,
          notes: patient.notes,
        }}
        onSuccess={() => {
          setEditModalOpen(false);
          refetch();
        }}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Patient löschen?</DialogTitle>
            <DialogDescription>
              Der Patient <strong>{patient.pseudonym}</strong> wird deaktiviert
              und ist nicht mehr in der Übersicht sichtbar. Alle Pläne bleiben
              erhalten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="rounded-xl"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deletePatient.isPending}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={deletePatient.isPending}
              onClick={() => {
                if (patientId) deletePatient.mutate({ id: patientId });
              }}
            >
              {deletePatient.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
