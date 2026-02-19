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
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";

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
  basedOnPreviousPlan: z.boolean().optional(),
  fastMode: z.boolean().optional(),
  additionalNotes: z.string().optional(),
});

type GeneratePlanFormData = z.infer<typeof generatePlanSchema>;

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
  } | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GeneratePlanFormData>({
    resolver: zodResolver(generatePlanSchema),
    defaultValues: {
      weekStart: getNextMonday(),
      basedOnPreviousPlan: false,
      fastMode: false,
      additionalNotes: "",
    },
  });

  const basedOnPrevious = watch("basedOnPreviousPlan");
  const fastMode = watch("fastMode");

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
      setProgress(null);

      toast.success("Ernährungsplan erfolgreich erstellt!");
      setInlineFeedback({
        type: "success",
        message: "Plan wurde erstellt. Weiterleitung zur Detailseite...",
      });
      onSuccess();
      router.push(`/meal-plans/${data.id}`);
    },
    onError: (error) => {
      // Polling stoppen
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
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
    if (!open && progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, [open]);

  function onSubmit(data: GeneratePlanFormData) {
    setInlineFeedback(null);
    setProgress({ message: "Wird vorbereitet...", dayIndex: 0 });

    // Polling starten
    progressIntervalRef.current = setInterval(() => {
      refetchProgress().then((result) => {
        if (result.data?.message) {
          setProgress({
            message: result.data.message,
            dayIndex: result.data.dayIndex ?? 0,
          });
        }
      });
    }, 500);

    generatePlan.mutate({
      patientId,
      weekStart: data.weekStart,
      basedOnPreviousPlan: data.basedOnPreviousPlan ?? false,
      fastMode: data.fastMode ?? false,
      additionalNotes: data.additionalNotes || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
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

          <label className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${generatePlan.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-accent/30"}`}>
            <Checkbox
              checked={fastMode}
              disabled={generatePlan.isPending}
              onCheckedChange={(checked) => setValue("fastMode", !!checked)}
            />
            <div>
              <span className="text-sm font-medium">Schnellmodus</span>
              <p className="text-xs text-muted-foreground">
                Schneller, aber mit etwas höherem Fehlerrisiko bei der Generierung
              </p>
            </div>
          </label>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Besondere Hinweise für diese Woche (optional)</Label>
            <Textarea
              id="additionalNotes"
              className="rounded-xl"
              placeholder="z.B. Keine Suppen, mehr Snacks, vegetarische Woche..."
              rows={3}
              disabled={generatePlan.isPending}
              {...register("additionalNotes")}
            />
          </div>

          <div className="rounded-xl bg-accent/50 px-4 py-3 text-xs text-muted-foreground">
            {fastMode
              ? "Schnellmodus: meist 30-90 Sekunden."
              : "Stabilmodus: meist 60-180 Sekunden mit höherer Erfolgsquote."}{" "}
            Der Plan wird mit mindestens 1800 kcal pro Tag erstellt.
          </div>

          {progress && (
            <div className="space-y-2 rounded-xl bg-primary/5 p-4 border border-primary/20">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-text-main">{progress.message}</span>
                <span className="text-muted-foreground">
                  {progress.dayIndex}/9
                </span>
              </div>
              <Progress
                value={(progress.dayIndex / 9) * 100}
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
                ? "bg-destructive hover:bg-destructive-700"
                : "bg-primary hover:bg-primary-600"
            }`}
          >
            {generatePlan.isPending ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Generierung abbrechen
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
