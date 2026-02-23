"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, X, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { incrementMealPlansUnreadCount } from "@/lib/mealPlanNotifications";

const OPTIMISTIC_TICK_MS = 700;

function getNextMonday(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split("T")[0];
}

const generatePlanSchema = z.object({
  weekStart: z.string().min(1, "Bitte eine Woche auswählen."),
  numDays: z.number().int().min(1).max(14).default(7),
  basedOnPreviousPlan: z.boolean().optional(),
  additionalNotes: z.string().optional(),
});

type GeneratePlanFormInput = z.input<typeof generatePlanSchema>;
type GeneratePlanFormData = z.output<typeof generatePlanSchema>;

interface GeneratePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientPseudonym: string;
  onSuccess: () => void;
}

export function GeneratePlanModal({
  open,
  onOpenChange,
  patientId,
  patientPseudonym,
  onSuccess,
}: GeneratePlanModalProps) {
  const router = useRouter();
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [progress, setProgress] = useState<{
    message: string;
    dayIndex: number;
    totalDays: number;
  } | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const optimisticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generationStartedAtRef = useRef<number>(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GeneratePlanFormInput, unknown, GeneratePlanFormData>({
    resolver: zodResolver(generatePlanSchema),
    defaultValues: {
      weekStart: getNextMonday(),
      numDays: 7,
      basedOnPreviousPlan: false,
      additionalNotes: "",
    },
  });

  const basedOnPrevious = watch("basedOnPreviousPlan");

  const additionalNotesExamples = [
    "Vegetarisch, keine Fischgerichte",
    "Mittags warm, abends kalt",
    "Mehr Snacks zwischen den Hauptmahlzeiten",
    "Laktosearm und keine rohen Zwiebeln",
    "Einfache Rezepte mit maximal 20 Minuten Zubereitung",
  ];

  const noteTemplates = [
    {
      id: "vegetarisch",
      label: "Vegetarische Woche",
      text: "Vegetarische Woche, keine Fisch- oder Fleischgerichte.",
    },
    {
      id: "schnell",
      label: "Schnelle Rezepte",
      text: "Bitte nur einfache Rezepte mit maximal 20 Minuten Zubereitungszeit.",
    },
    {
      id: "snacks",
      label: "Mehr Snacks",
      text: "Mehr Zwischenmahlzeiten und energiereiche Snacks einplanen.",
    },
    {
      id: "unvertraeglichkeiten",
      label: "Laktosearm",
      text: "Laktosearme Planung, bitte ohne offensichtliche Milchprodukte.",
    },
    {
      id: "struktur",
      label: "Tagesstruktur",
      text: "Mittags warm, abends kalt; klare, wiederkehrende Tagesstruktur.",
    },
  ] as const;

  function getActiveDayMessage(completedDays: number, totalDays: number): string {
    if (completedDays >= totalDays) {
      return `Finalisiere Plan (${totalDays}/${totalDays})...`;
    }
    return `Tag ${Math.min(completedDays + 1, totalDays)} von ${totalDays} wird erstellt...`;
  }

  // Progress Query
  const { refetch: refetchProgress } = trpc.mealPlans.getProgress.useQuery(
    undefined,
    {
      enabled: false, // Nicht automatisch abrufen
    }
  );

  const generatePlan = trpc.mealPlans.generate.useMutation({
    onSuccess: (data) => {
      // Polling stoppen
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (optimisticIntervalRef.current) {
        clearInterval(optimisticIntervalRef.current);
        optimisticIntervalRef.current = null;
      }
      setProgress(null);

      onSuccess();

      if (open) {
        toast.success("Ernährungsplan erfolgreich erstellt!");
        setInlineFeedback({
          type: "success",
          message: "Plan wurde erstellt. Weiterleitung zur Detailseite...",
        });
        router.push(`/meal-plans/${data.id}`);
      } else {
        incrementMealPlansUnreadCount(1);
        toast.success("Plan fertig. Unter „Ernährungspläne“ wartet ein neuer Eintrag.");
      }
    },
    onError: (error) => {
      // Polling stoppen
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (optimisticIntervalRef.current) {
        clearInterval(optimisticIntervalRef.current);
        optimisticIntervalRef.current = null;
      }
      setProgress(null);

      toast.error(
        error.message || "Fehler bei der Generierung. Bitte erneut versuchen."
      );
      setInlineFeedback({
        type: "error",
        message:
          error.message || "Fehler bei der Generierung. Bitte erneut versuchen.",
      });
    },
  });

  // Cleanup bei Modal Close
  useEffect(() => {
    if (!open) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (optimisticIntervalRef.current) {
        clearInterval(optimisticIntervalRef.current);
        optimisticIntervalRef.current = null;
      }
    }
  }, [open]);

  function onSubmit(data: GeneratePlanFormData) {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (optimisticIntervalRef.current) {
      clearInterval(optimisticIntervalRef.current);
      optimisticIntervalRef.current = null;
    }

    setInlineFeedback(null);
    setProgress({
      message: getActiveDayMessage(0, data.numDays),
      dayIndex: 0,
      totalDays: data.numDays,
    });
    generationStartedAtRef.current = Date.now();

    const estimatedMsPerDay = 2200;
    optimisticIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (!prev) return prev;
        const elapsed = Date.now() - generationStartedAtRef.current;
        const optimisticCompleted = Math.min(
          prev.totalDays - 1,
          Math.floor(elapsed / estimatedMsPerDay)
        );

        if (optimisticCompleted <= prev.dayIndex) {
          return prev;
        }

        return {
          ...prev,
          dayIndex: optimisticCompleted,
          message: getActiveDayMessage(optimisticCompleted, prev.totalDays),
        };
      });
    }, OPTIMISTIC_TICK_MS);

    // Polling starten
    progressIntervalRef.current = setInterval(() => {
      refetchProgress().then((result) => {
        if (result.data?.message) {
          const serverDayIndex = result.data.dayIndex ?? 0;
          const serverTotalDays = result.data.totalDays ?? data.numDays;
          setProgress((prev) => {
            const mergedDayIndex = Math.max(prev?.dayIndex ?? 0, serverDayIndex);
            return {
              message: result.data.message ?? getActiveDayMessage(mergedDayIndex, serverTotalDays),
              dayIndex: mergedDayIndex,
              totalDays: serverTotalDays,
            };
          });
        }
      });
    }, 500);

    generatePlan.mutate({
      patientId,
      weekStart: data.weekStart,
      numDays: data.numDays,
      basedOnPreviousPlan: data.basedOnPreviousPlan ?? false,
      fastMode: true,
      additionalNotes: data.additionalNotes || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-text-main flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Plan generieren
          </DialogTitle>
          <DialogDescription>
            Erstellt einen KI-gestützten Ernährungsplan für <strong>{patientPseudonym}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Patient</Label>
            <Input className="rounded-xl" value={patientPseudonym} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekStart">
              Woche ab (Montag) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="weekStart"
              type="date"
              className="rounded-xl"
              disabled={generatePlan.isPending}
              {...register("weekStart")}
            />
            {errors.weekStart && (
              <p className="text-xs text-destructive">{errors.weekStart.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="numDays">
              Planungszeitraum (Tage) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="numDays"
              type="number"
              min={1}
              max={14}
              step={1}
              className="rounded-xl"
              disabled={generatePlan.isPending}
              {...register("numDays", {
                setValueAs: (value) => Number(value),
              })}
            />
            {errors.numDays && (
              <p className="text-xs text-destructive">{errors.numDays.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Empfohlen: 1, 3, 7 oder 14 Tage.</p>
          </div>

          <label className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${generatePlan.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-accent/30"}`}>
            <Checkbox
              checked={basedOnPrevious}
              disabled={generatePlan.isPending}
              onCheckedChange={(checked) => setValue("basedOnPreviousPlan", !!checked)}
            />
            <div>
              <span className="text-sm font-medium">Vorherigen Plan als Basis verwenden</span>
              <p className="text-xs text-muted-foreground">
                Variiert die Mahlzeiten, behält aber die Kalorienverteilung bei
              </p>
            </div>
          </label>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Besondere Hinweise für diese Woche (optional)</Label>
            <Select
              onValueChange={(selectedId) => {
                const selectedTemplate = noteTemplates.find((tpl) => tpl.id === selectedId);
                if (!selectedTemplate) return;
                setValue("additionalNotes", selectedTemplate.text, { shouldDirty: true });
              }}
              disabled={generatePlan.isPending}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Hinweisvorlage wählen (optional)" />
              </SelectTrigger>
              <SelectContent>
                {noteTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              id="additionalNotes"
              className="rounded-xl"
              placeholder="z.B. Keine Suppen, mehr Snacks, vegetarische Woche..."
              rows={3}
              disabled={generatePlan.isPending}
              {...register("additionalNotes")}
            />
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-text-main">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                Was Sie hier eintragen können:
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {additionalNotesExamples.map((example) => (
                  <li key={example}>• {example}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl bg-accent/50 px-4 py-3 text-xs text-muted-foreground">
            Die Generierung läuft im Hintergrund und kann je nach Umfang bis zu einige Minuten dauern.
            Der Plan wird mit mindestens 1800 kcal pro Tag erstellt.
          </div>

          {progress && (
            <div className="space-y-2 rounded-xl bg-primary/5 p-4 border border-primary/20">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-text-main">{progress.message}</span>
                <span className="text-muted-foreground">
                  {progress.dayIndex}/{progress.totalDays}
                </span>
              </div>
              <Progress
                value={(progress.dayIndex / Math.max(progress.totalDays, 1)) * 100}
                className="h-2 rounded-xl"
              />
            </div>
          )}

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

          <Button
            type={generatePlan.isPending ? "button" : "submit"}
            onClick={(e) => {
              if (generatePlan.isPending) {
                e.preventDefault();
                onOpenChange(false);
              }
            }}
            className={`w-full rounded-xl ${
              generatePlan.isPending
                ? "bg-muted text-foreground hover:bg-muted"
                : "bg-primary hover:bg-primary-600"
            }`}
          >
            {generatePlan.isPending ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Im Hintergrund weiterlaufen lassen
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Plan generieren
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
