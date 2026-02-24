"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Loader2, Sparkles } from "lucide-react";
import { CreatePatientModal } from "@/components/modals/CreatePatientModal";
import { GeneratePlanModal } from "@/components/modals/GeneratePlanModal";
import { AutonomyBadge } from "@/components/autonomy/AutonomyBadge";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPatientForPlan, setSelectedPatientForPlan] = useState<{
    id: string;
    pseudonym: string;
  } | null>(null);
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { data: patients, isLoading, refetch } = trpc.patients.list.useQuery({
    search: search || undefined,
  });

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Bewohner:innen</h2>
          <p className="text-muted-foreground">
            Übersicht aller betreuten Personen
          </p>
        </div>
        <Button
          className="w-full rounded-xl bg-primary hover:bg-primary-600 sm:w-auto"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Neue Bewohner:in anlegen
        </Button>
      </div>

      {/* Suche */}
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

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Nach Pseudonym suchen..."
          className="rounded-xl pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabelle */}
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">Keine Bewohner:innen gefunden</p>
              <p className="text-sm mt-1">
                {search
                  ? "Versuchen Sie einen anderen Suchbegriff."
                  : "Legen Sie die erste Bewohner:in an."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pseudonym</TableHead>
                  <TableHead className="hidden sm:table-cell">Alter</TableHead>
                  <TableHead>Akt. Gewicht</TableHead>
                  <TableHead className="hidden md:table-cell">Zielgewicht</TableHead>
                  <TableHead className="hidden md:table-cell">Autonomie</TableHead>
                  <TableHead className="hidden sm:table-cell">Letzter Plan</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer hover:bg-accent/50"
                  >
                    <TableCell>
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-medium text-text-main hover:text-primary"
                      >
                        {patient.pseudonym}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {currentYear - patient.birthYear} Jahre
                    </TableCell>
                    <TableCell>
                      {Number(patient.currentWeight).toFixed(1)} kg
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {Number(patient.targetWeight).toFixed(1)} kg
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <AutonomyBadge agreement={patient.autonomyAgreement} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {patient.mealPlans[0] ? (
                        <Badge
                          variant="secondary"
                          className="rounded-xl bg-secondary/20 text-secondary-600"
                        >
                          {new Date(
                            patient.mealPlans[0].createdAt
                          ).toLocaleDateString("de-DE")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Kein Plan
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => {
                            setSelectedPatientForPlan({
                              id: patient.id,
                              pseudonym: patient.pseudonym,
                            });
                            setPlanModalOpen(true);
                          }}
                        >
                          <Sparkles className="mr-1 h-3 w-3" />
                          Plan
                        </Button>
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm" className="rounded-xl">
                            Details
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <CreatePatientModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => {
          setModalOpen(false);
          setInlineFeedback({
            type: "success",
            message: "Bewohner:in wurde erfolgreich gespeichert.",
          });
          refetch();
        }}
      />

      {selectedPatientForPlan && (
        <GeneratePlanModal
          open={planModalOpen}
          onOpenChange={setPlanModalOpen}
          patientId={selectedPatientForPlan.id}
          patientPseudonym={selectedPatientForPlan.pseudonym}
          onSuccess={() => {
            setPlanModalOpen(false);
            setInlineFeedback({
              type: "success",
              message: `Ernährungsplan für ${selectedPatientForPlan.pseudonym} wurde erstellt.`,
            });
            refetch();
          }}
        />
      )}
    </div>
  );
}
