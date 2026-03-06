"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Send, ShieldAlert, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { AgentPlan } from "@/lib/agent/types";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PreviewResult {
  warnings: string[];
  matches: Array<{
    actionIndex: number;
    patientRef: string;
    matchedPatientId: string | null;
  }>;
}

function formatAction(action: AgentPlan["proposedActions"][number]): string {
  if (action.type === "PATIENT_CREATE") {
    return `Pseudonym: ${action.data.pseudonym}, Geburtsjahr: ${action.data.birthYear}, Startgewicht: ${action.data.currentWeight} kg`;
  }
  if (action.type === "WEIGHT_ADD") {
    return `Patient (${action.data.patient.by}): ${action.data.patient.value}, Gewicht: ${action.data.weightKg} kg, Datum: ${action.data.date}`;
  }
  return `Patient (${action.data.patient.by}): ${action.data.patient.value}, Woche: ${action.data.weekStart}`;
}

export default function AgentPage() {
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [commitResult, setCommitResult] = useState<{
    summary: string;
    createdPatientIds: string[];
    createdWeightEntryIds: string[];
    createdMealPlanIds: string[];
    auditId: string | null;
  } | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const previewMutation = trpc.agent.preview.useMutation();
  const commitMutation = trpc.agent.commit.useMutation({
    onSuccess: (result) => {
      setCommitResult(result);
      toast.success("Aktionen wurden erfolgreich gespeichert.");
    },
    onError: (error) => {
      toast.error(error.message || "Commit fehlgeschlagen.");
    },
  });

  const hasQuestions = (plan?.questions.length ?? 0) > 0;
  const hasAmbiguousWarnings = (preview?.warnings.length ?? 0) > 0;
  const canCommit = useMemo(() => {
    if (!plan) return false;
    if (plan.proposedActions.length === 0) return false;
    if (hasQuestions) return false;
    if (hasAmbiguousWarnings) return false;
    return !commitMutation.isPending;
  }, [plan, hasQuestions, hasAmbiguousWarnings, commitMutation.isPending]);

  async function createPlan() {
    const liveValue = messageRef.current?.value ?? message;
    const trimmed = liveValue.trim();
    if (!trimmed) {
      toast.error("Bitte zuerst eine Eingabe formulieren.");
      return;
    }
    if (trimmed.length > 2000) {
      toast.error("Nachricht ist zu lang (max. 2000 Zeichen).");
      return;
    }

    setIsPlanning(true);
    setCommitResult(null);
    try {
      const response = await fetch("/api/agent/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await response.json()) as { plan?: AgentPlan; error?: string };
      if (!response.ok || !data.plan) {
        toast.error(data.error || "Vorschlag konnte nicht erstellt werden.");
        return;
      }

      setPlan(data.plan);
      if (data.plan.proposedActions.length > 0) {
        const previewResult = await previewMutation.mutateAsync({
          proposedActions: data.plan.proposedActions,
        });
        setPreview(previewResult);
      } else {
        setPreview(null);
      }
    } catch {
      toast.error("Vorschlag konnte nicht erstellt werden.");
    } finally {
      setIsPlanning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-main">Agent</h2>
        <p className="text-muted-foreground">
          Chat-basierte Dateneingabe mit Bestätigungs-Workflow vor jedem Write.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Eingabe
          </CardTitle>
          <CardDescription>
            Beispiel: Lege Pseudonym Morgenstern an, Jahrgang 2008, 49 kg aktuell, Ziel 55 kg.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            ref={messageRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onInput={(event) =>
              setMessage((event.target as HTMLTextAreaElement).value)
            }
            placeholder="Was soll der Agent vorbereiten?"
            className="min-h-28 rounded-xl"
            maxLength={2000}
          />
          <div className="flex gap-2">
            <Button onClick={createPlan} disabled={isPlanning}>
              {isPlanning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Vorschlag erstellen
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Vorschau</CardTitle>
            <CardDescription>{plan.intentSummary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {plan.questions.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <div className="mb-1 font-medium">Rückfragen erforderlich</div>
                <ul className="list-disc pl-5">
                  {plan.questions.map((question, index) => (
                    <li key={`${question}-${index}`}>{question}</li>
                  ))}
                </ul>
              </div>
            )}

            {preview && preview.warnings.length > 0 && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <ShieldAlert className="h-4 w-4" />
                  Konflikte erkannt
                </div>
                <ul className="list-disc pl-5">
                  {preview.warnings.map((warning, index) => (
                    <li key={`${warning}-${index}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {plan.proposedActions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.proposedActions.map((action, index) => (
                    <TableRow key={`${action.type}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{action.type}</TableCell>
                      <TableCell>{formatAction(action)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Es wurden keine speicherbaren Aktionen erkannt.
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {canCommit && (
                <Button
                  onClick={() =>
                    commitMutation.mutate({
                      intentSummary: plan.intentSummary,
                      proposedActions: plan.proposedActions,
                    })
                  }
                  disabled={commitMutation.isPending}
                >
                  {commitMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Bestätigen und Speichern
                </Button>
              )}
              {!canCommit && (
                <p className="text-sm text-muted-foreground">
                  Commit ist erst möglich, wenn keine Rückfragen oder Mehrdeutigkeiten offen sind.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {commitResult && (
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Ergebnis</CardTitle>
            <CardDescription>{commitResult.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Audit-ID: {commitResult.auditId ?? "nicht verfuegbar"}</p>
            <p>Neue Patient:innen: {commitResult.createdPatientIds.length}</p>
            <p>Neue Gewichtseinträge: {commitResult.createdWeightEntryIds.length}</p>
            <p>Neue MealPlan Drafts: {commitResult.createdMealPlanIds.length}</p>
            {commitResult.createdPatientIds[0] && (
              <Link
                href={`/patients/${commitResult.createdPatientIds[0]}`}
                className="inline-block text-primary hover:underline"
              >
                Zum ersten angelegten Patienten
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
