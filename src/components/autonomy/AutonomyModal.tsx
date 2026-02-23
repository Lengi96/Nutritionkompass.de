"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const autonomyFormSchema = z.object({
  canPortionSupervised: z.boolean(),
  canPortionIndependent: z.boolean(),
  notes: z.string().max(500, "Maximal 500 Zeichen.").optional(),
  validFrom: z.string().min(1, "Gültig ab ist erforderlich."),
  validUntil: z.string().optional(),
  reason: z
    .string()
    .min(10, "Begründung muss mindestens 10 Zeichen lang sein.")
    .max(500, "Maximal 500 Zeichen."),
});

type AutonomyFormData = z.infer<typeof autonomyFormSchema>;

interface ExistingAgreement {
  canPortionSupervised: boolean;
  canPortionIndependent: boolean;
  notes: string | null;
  validFrom: string | Date;
  validUntil: string | Date | null;
}

interface AutonomyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  existing?: ExistingAgreement | null;
  onSuccess: () => void;
}

export function AutonomyModal({
  open,
  onOpenChange,
  patientId,
  existing,
  onSuccess,
}: AutonomyModalProps) {
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AutonomyFormData>({
    resolver: zodResolver(autonomyFormSchema),
    defaultValues: {
      canPortionSupervised: false,
      canPortionIndependent: false,
      notes: "",
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: "",
      reason: "",
    },
  });

  const canPortionSupervised = watch("canPortionSupervised");
  const canPortionIndependent = watch("canPortionIndependent");

  // Auto-reset Independent wenn Supervised deaktiviert wird
  useEffect(() => {
    if (!canPortionSupervised && canPortionIndependent) {
      setValue("canPortionIndependent", false);
    }
  }, [canPortionSupervised, canPortionIndependent, setValue]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (existing) {
        reset({
          canPortionSupervised: existing.canPortionSupervised,
          canPortionIndependent: existing.canPortionIndependent,
          notes: existing.notes || "",
          validFrom: new Date(existing.validFrom).toISOString().slice(0, 10),
          validUntil: existing.validUntil
            ? new Date(existing.validUntil).toISOString().slice(0, 10)
            : "",
          reason: "",
        });
      } else {
        reset({
          canPortionSupervised: false,
          canPortionIndependent: false,
          notes: "",
          validFrom: new Date().toISOString().slice(0, 10),
          validUntil: "",
          reason: "",
        });
      }
      setInlineFeedback(null);
    }
  }, [open, existing, reset]);

  const utils = trpc.useUtils();

  const upsertMutation = trpc.autonomy.upsert.useMutation({
    onSuccess: () => {
      toast.success(
        existing
          ? "Absprache erfolgreich aktualisiert!"
          : "Absprache erfolgreich erstellt!"
      );
      utils.autonomy.getByPatient.invalidate({ patientId });
      utils.patients.list.invalidate();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Speichern.");
      setInlineFeedback({
        type: "error",
        message: error.message || "Fehler beim Speichern.",
      });
    },
  });

  function onSubmit(data: AutonomyFormData) {
    setInlineFeedback(null);
    upsertMutation.mutate({
      patientId,
      canPortionSupervised: data.canPortionSupervised,
      canPortionIndependent: data.canPortionIndependent,
      notes: data.notes || null,
      validFrom: new Date(data.validFrom),
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
      reason: data.reason,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-text-main">
            {existing ? "Absprache bearbeiten" : "Neue Absprache erstellen"}
          </DialogTitle>
          <DialogDescription>
            Legen Sie fest, welche Tätigkeiten der/die Bewohner:in eigenständig
            durchführen darf.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div>
                <Label className="text-sm font-medium">
                  Unter Aufsicht portionieren
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Darf mit Begleitung einer Fachkraft portionieren
                </p>
              </div>
              <Switch
                checked={canPortionSupervised}
                onCheckedChange={(checked) =>
                  setValue("canPortionSupervised", checked)
                }
              />
            </div>

            <div
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                !canPortionSupervised ? "opacity-50" : ""
              }`}
            >
              <div>
                <Label className="text-sm font-medium">
                  Eigenständig portionieren
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Darf vollständig ohne Aufsicht portionieren
                </p>
              </div>
              <Switch
                checked={canPortionIndependent}
                onCheckedChange={(checked) =>
                  setValue("canPortionIndependent", checked)
                }
                disabled={!canPortionSupervised}
              />
            </div>
          </div>

          {/* Notizen */}
          <div className="space-y-2">
            <Label htmlFor="autonomyNotes">Notizen (optional)</Label>
            <Textarea
              id="autonomyNotes"
              className="rounded-xl"
              placeholder='z.B. "Gilt nur beim Abendessen", "Nur warme Mahlzeiten"...'
              rows={2}
              maxLength={500}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {/* Gültigkeit */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="validFrom">
                Gültig ab <span className="text-destructive">*</span>
              </Label>
              <Input
                id="validFrom"
                type="date"
                className="rounded-xl"
                {...register("validFrom")}
              />
              {errors.validFrom && (
                <p className="text-xs text-destructive">
                  {errors.validFrom.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Befristet bis (optional)</Label>
              <Input
                id="validUntil"
                type="date"
                className="rounded-xl"
                {...register("validUntil")}
              />
              <p className="text-xs text-muted-foreground">
                Leer = unbefristet
              </p>
            </div>
          </div>

          {/* Begründung */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Begründung <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              className="rounded-xl"
              placeholder="Warum wird diese Absprache getroffen? (mind. 10 Zeichen)"
              rows={2}
              maxLength={500}
              {...register("reason")}
            />
            {errors.reason && (
              <p className="text-xs text-destructive">
                {errors.reason.message}
              </p>
            )}
            <div className="flex items-start gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Die Begründung wird unveränderlich im Audit-Log gespeichert.
              </span>
            </div>
          </div>

          {/* Feedback */}
          {inlineFeedback && (
            <div
              role="status"
              aria-live={
                inlineFeedback.type === "error" ? "assertive" : "polite"
              }
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
            type="submit"
            className="w-full rounded-xl bg-primary hover:bg-primary-600"
            disabled={upsertMutation.isPending}
          >
            {upsertMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichert...
              </>
            ) : existing ? (
              "Änderungen speichern"
            ) : (
              "Absprache erstellen"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
