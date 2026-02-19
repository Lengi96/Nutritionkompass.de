"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const ALLERGY_OPTIONS = [
  "Laktose",
  "Gluten",
  "Nüsse",
  "Eier",
  "Fisch",
  "Soja",
  "Andere",
];

const editPatientSchema = z.object({
  currentWeight: z
    .number({ error: "Bitte eine gültige Zahl eingeben." })
    .min(30, "Gewicht muss mindestens 30 kg betragen.")
    .max(200, "Gewicht darf maximal 200 kg betragen."),
  targetWeight: z
    .number({ error: "Bitte eine gültige Zahl eingeben." })
    .min(30, "Zielgewicht muss mindestens 30 kg betragen.")
    .max(200, "Zielgewicht darf maximal 200 kg betragen."),
  targetDate: z.string().optional(),
  allergies: z.array(z.string()),
  notes: z.string().optional(),
});

type EditPatientFormData = z.infer<typeof editPatientSchema>;

interface PatientData {
  id: string;
  pseudonym: string;
  currentWeight: number | string;
  targetWeight: number | string;
  targetDate?: string | Date | null;
  allergies: string[];
  notes?: string | null;
}

interface EditPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: PatientData;
  onSuccess: () => void;
}

export function EditPatientModal({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: EditPatientModalProps) {
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditPatientFormData>({
    resolver: zodResolver(editPatientSchema),
    defaultValues: {
      currentWeight: Number(patient.currentWeight),
      targetWeight: Number(patient.targetWeight),
      targetDate: patient.targetDate
        ? new Date(patient.targetDate).toISOString().slice(0, 10)
        : "",
      allergies: patient.allergies,
      notes: patient.notes || "",
    },
  });

  // Reset form when patient changes
  useEffect(() => {
    if (open) {
      reset({
        currentWeight: Number(patient.currentWeight),
        targetWeight: Number(patient.targetWeight),
        targetDate: patient.targetDate
          ? new Date(patient.targetDate).toISOString().slice(0, 10)
          : "",
        allergies: patient.allergies,
        notes: patient.notes || "",
      });
      setInlineFeedback(null);
    }
  }, [open, patient, reset]);

  const updatePatient = trpc.patients.update.useMutation({
    onSuccess: () => {
      toast.success("Patient erfolgreich aktualisiert!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Aktualisieren.");
      setInlineFeedback({
        type: "error",
        message: error.message || "Fehler beim Aktualisieren.",
      });
    },
  });

  function onSubmit(data: EditPatientFormData) {
    setInlineFeedback(null);
    updatePatient.mutate({
      id: patient.id,
      currentWeight: data.currentWeight,
      targetWeight: data.targetWeight,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      allergies: data.allergies,
      notes: data.notes || "",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-text-main">
            {patient.pseudonym} bearbeiten
          </DialogTitle>
          <DialogDescription>
            Aktualisieren Sie die Daten des Patienten. Pseudonym und Geburtsjahr
            können aus Datenschutzgründen nicht geändert werden.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Gewicht-Felder */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editCurrentWeight">
                Aktuelles Gewicht (kg){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editCurrentWeight"
                type="number"
                step="0.1"
                className="rounded-xl"
                {...register("currentWeight", { valueAsNumber: true })}
              />
              {errors.currentWeight && (
                <p className="text-xs text-destructive">
                  {errors.currentWeight.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTargetWeight">
                Zielgewicht (kg){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="editTargetWeight"
                type="number"
                step="0.1"
                className="rounded-xl"
                {...register("targetWeight", { valueAsNumber: true })}
              />
              {errors.targetWeight && (
                <p className="text-xs text-destructive">
                  {errors.targetWeight.message}
                </p>
              )}
            </div>
          </div>

          {/* Zieldatum (optional) */}
          <div className="space-y-2">
            <Label htmlFor="editTargetDate">
              Zieldatum (optional)
            </Label>
            <Input
              id="editTargetDate"
              type="date"
              className="rounded-xl"
              {...register("targetDate")}
            />
            <p className="text-xs text-muted-foreground">
              Optionaler Zeithorizont – dient der Orientierung, nicht dem Druck.
            </p>
          </div>

          {/* Allergien */}
          <div className="space-y-2">
            <Label>Allergien / Unverträglichkeiten</Label>
            <Controller
              name="allergies"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {ALLERGY_OPTIONS.map((allergy) => (
                    <label
                      key={allergy}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer hover:bg-accent/30 transition-colors"
                    >
                      <Checkbox
                        checked={field.value.includes(allergy)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, allergy]);
                          } else {
                            field.onChange(
                              field.value.filter((a) => a !== allergy)
                            );
                          }
                        }}
                      />
                      <span className="text-sm">{allergy}</span>
                    </label>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Notizen */}
          <div className="space-y-2">
            <Label htmlFor="editNotes">Notizen (optional)</Label>
            <Textarea
              id="editNotes"
              className="rounded-xl"
              placeholder="Besondere Hinweise für das Team..."
              rows={3}
              {...register("notes")}
            />
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
            disabled={updatePatient.isPending}
          >
            {updatePatient.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichert...
              </>
            ) : (
              "Änderungen speichern"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
