"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList, Loader2, Plus, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GeneratePlanModal } from "@/components/modals/GeneratePlanModal";

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function MealPlansPage() {
  const [patientSelectOpen, setPatientSelectOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    pseudonym: string;
  } | null>(null);

  const {
    data: plans,
    isLoading,
    error,
    refetch,
  } = trpc.mealPlans.list.useQuery(
    { limit: 50 },
    {
      retry: 1,
    }
  );
  const { data: patients, isLoading: patientsLoading } = trpc.patients.list.useQuery(
    {},
    {
      enabled: patientSelectOpen,
      retry: 1,
    }
  );

  function handleSelectPatient(patient: { id: string; pseudonym: string }) {
    setSelectedPatient(patient);
    setPatientSelectOpen(false);
    setPlanModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Ernährungspläne</h2>
          <p className="text-muted-foreground">
            Übersicht aller erstellten Pläne Ihrer Einrichtung
          </p>
        </div>
        <Button
          className="rounded-xl bg-primary hover:bg-primary-600"
          onClick={() => setPatientSelectOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Neuen Plan erstellen
        </Button>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-text-main">Alle Ernährungspläne</CardTitle>
          <CardDescription>
            Sortiert nach Erstellungsdatum (neueste zuerst)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="font-medium text-text-main">Pläne konnten nicht geladen werden.</p>
              <p className="text-sm mt-1">{error.message}</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={() => refetch()}>
                Erneut versuchen
              </Button>
            </div>
          ) : !plans || plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>Noch keine Ernährungspläne erstellt.</p>
              <p className="text-sm mt-1">
                Legen Sie zuerst einen Patienten an, um einen Plan zu erstellen.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Kalenderwoche</TableHead>
                  <TableHead>Kalorien/Woche</TableHead>
                  <TableHead>Erstellt von</TableHead>
                  <TableHead>Einkaufsliste</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      {plan.patient?.id ? (
                        <Link className="hover:underline" href={`/patients/${plan.patient.id}`}>
                          {plan.patient.pseudonym}
                        </Link>
                      ) : (
                        <span>{plan.patient?.pseudonym ?? "Unbekannt"}</span>
                      )}
                    </TableCell>
                    <TableCell>KW {getWeekNumber(new Date(plan.weekStart))}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-xl bg-secondary/20 text-secondary-600">
                        {plan.totalKcal.toLocaleString("de-DE")} kcal
                      </Badge>
                    </TableCell>
                    <TableCell>{plan.createdByUser?.name ?? "Unbekannt"}</TableCell>
                    <TableCell>
                      {plan.shoppingList ? (
                        <Link href={`/shopping-lists/${plan.shoppingList.id}`}>
                          <Badge className="rounded-xl bg-primary text-white">
                            <ShoppingCart className="mr-1 h-3 w-3" />
                            Vorhanden
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Keine</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(plan.createdAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/meal-plans/${plan.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl">
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

      <Dialog open={patientSelectOpen} onOpenChange={setPatientSelectOpen}>
        <DialogContent className="max-w-xl rounded-xl">
          <DialogHeader>
            <DialogTitle>Patient auswählen</DialogTitle>
            <DialogDescription>
              Für wen soll der neue Ernährungsplan erstellt werden?
            </DialogDescription>
          </DialogHeader>

          {patientsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Es sind noch keine aktiven Patienten vorhanden.</p>
              <Link href="/patients" onClick={() => setPatientSelectOpen(false)}>
                <Button variant="outline" className="rounded-xl">
                  Zu den Patienten
                </Button>
              </Link>
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {patients.map((patient) => (
                <Button
                  key={patient.id}
                  variant="outline"
                  className="h-auto w-full justify-between rounded-xl py-3"
                  onClick={() =>
                    handleSelectPatient({
                      id: patient.id,
                      pseudonym: patient.pseudonym,
                    })
                  }
                >
                  <span className="font-medium">{patient.pseudonym}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date().getFullYear() - patient.birthYear} Jahre
                  </span>
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedPatient && (
        <GeneratePlanModal
          open={planModalOpen}
          onOpenChange={setPlanModalOpen}
          patientId={selectedPatient.id}
          patientPseudonym={selectedPatient.pseudonym}
          onSuccess={() => {
            refetch();
            setPlanModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
