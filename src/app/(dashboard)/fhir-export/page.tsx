"use client";

import { useMemo, useState } from "react";
import { Loader2, Download, ShieldCheck, FileJson } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/fhir+json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function FhirExportPage() {
  const [patientId, setPatientId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [includeWeight, setIncludeWeight] = useState(true);
  const [includeMealPlans, setIncludeMealPlans] = useState(true);
  const [includeShoppingLists, setIncludeShoppingLists] = useState(false);
  const [includePseudonymName, setIncludePseudonymName] = useState(false);

  const patientsQuery = trpc.patients.list.useQuery();
  const exportMutation = trpc.fhir.exportPatientBundle.useMutation({
    onSuccess: (result) => {
      downloadJson(result.filename, result.bundle);
      toast.success("FHIR-Export wurde heruntergeladen.");
    },
    onError: (error) => {
      toast.error(error.message || "FHIR-Export fehlgeschlagen.");
    },
  });

  const isExportDisabled = useMemo(() => {
    return !patientId || exportMutation.isPending;
  }, [patientId, exportMutation.isPending]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">FHIR Export</h2>
          <p className="text-muted-foreground">
            Interoperabler Datenexport pro Bewohner:in als FHIR Bundle (R4).
          </p>
        </div>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-main">
            <FileJson className="h-5 w-5 text-primary" />
            Export konfigurieren
          </CardTitle>
          <CardDescription>
            Standardmäßig pseudonymisiert und datenminimal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patientId">Bewohner:in</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger id="patientId" className="rounded-xl">
                <SelectValue placeholder="Bewohner:in auswählen" />
              </SelectTrigger>
              <SelectContent>
                {(patientsQuery.data ?? []).map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.pseudonym}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Zeitraum von (optional)</Label>
              <Input
                id="dateFrom"
                type="date"
                className="rounded-xl"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Zeitraum bis (optional)</Label>
              <Input
                id="dateTo"
                type="date"
                className="rounded-xl"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Ressourcen</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-xl border p-3">
                <Checkbox
                  checked={includeWeight}
                  onCheckedChange={(checked) => setIncludeWeight(checked === true)}
                />
                <span className="text-sm">Gewichtsverlauf (Observation)</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl border p-3">
                <Checkbox
                  checked={includeMealPlans}
                  onCheckedChange={(checked) => setIncludeMealPlans(checked === true)}
                />
                <span className="text-sm">Ernährungspläne (DocumentReference)</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl border p-3">
                <Checkbox
                  checked={includeShoppingLists}
                  onCheckedChange={(checked) => setIncludeShoppingLists(checked === true)}
                />
                <span className="text-sm">Einkaufslisten (DocumentReference)</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl border p-3">
                <Checkbox
                  checked={includePseudonymName}
                  onCheckedChange={(checked) =>
                    setIncludePseudonymName(checked === true)
                  }
                />
                <span className="text-sm">Pseudonym als Patient.name aufnehmen</span>
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4" />
              Sicherheitsregeln aktiv
            </div>
            <p className="mt-1">
              Tenant-Isolation, Rollenprüfung, Audit-Logging und Rate-Limit sind serverseitig erzwungen.
            </p>
          </div>

          <Button
            className="rounded-xl"
            disabled={isExportDisabled}
            onClick={() => {
              exportMutation.mutate({
                patientId,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                includePseudonymName,
                include: {
                  weight: includeWeight,
                  mealPlans: includeMealPlans,
                  shoppingLists: includeShoppingLists,
                },
              });
            }}
          >
            {exportMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            FHIR Export herunterladen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
