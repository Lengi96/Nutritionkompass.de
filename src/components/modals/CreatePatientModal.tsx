"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Geburtsjahr-Optionen
const birthYearOptions = Array.from({ length: 26 }, (_, i) => 1990 + i);

const createPatientSchema = z
  .object({
    pseudonym: z
      .string()
      .min(2, "Pseudonym muss mindestens 2 Zeichen lang sein.")
      .max(30, "Pseudonym darf maximal 30 Zeichen lang sein."),
    birthYear: z.number({
      error: "Bitte ein Geburtsjahr auswählen.",
    }),
    currentWeight: z
      .number({
        error: "Bitte eine gültige Zahl eingeben.",
      })
      .min(30, "Gewicht muss mindestens 30 kg betragen.")
      .max(200, "Gewicht darf maximal 200 kg betragen."),
    targetWeight: z
      .number({
        error: "Bitte eine gültige Zahl eingeben.",
      })
      .min(30, "Zielgewicht muss mindestens 30 kg betragen.")
      .max(200, "Zielgewicht darf maximal 200 kg betragen."),
    targetDate: z.string().optional(),
    allergies: z.array(z.string()),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Sicherheitshinweis: BMI-Plausibilitätsprüfung
      // BMI 17.5 ist die klinische Untergrenze
      // Approximation: Durchschnittsgröße für das Alter als Basis
      const currentYear = new Date().getFullYear();
      const age = currentYear - data.birthYear;
      // Geschätzte Durchschnittsgröße (Vereinfachung)
      const estimatedHeightM = age < 14 ? 1.55 : age < 16 ? 1.65 : 1.70;
      const targetBmi =
        data.targetWeight / (estimatedHeightM * estimatedHeightM);
      return targetBmi >= 17.5;
    },
    {
      message:
        "Das Zielgewicht erscheint für das angegebene Alter zu niedrig (BMI unter 17.5). Bitte überprüfen Sie die Eingabe.",
      path: ["targetWeight"],
    }
  );

type CreatePatientFormData = z.infer<typeof createPatientSchema>;

interface CreatePatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePatientModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePatientModalProps) {
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
  } = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      pseudonym: "",
      allergies: [],
      notes: "",
    },
  });

  const createPatient = trpc.patients.create.useMutation({
    onSuccess: () => {
      toast.success("Bewohner:in erfolgreich angelegt!");
      setInlineFeedback({
        type: "success",
        message: "Bewohner:in wurde erfolgreich angelegt.",
      });
      reset();
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Anlegen.");
      setInlineFeedback({
        type: "error",
        message: error.message || "Fehler beim Anlegen.",
      });
    },
  });

  function onSubmit(data: CreatePatientFormData) {
    setInlineFeedback(null);
    createPatient.mutate({
      ...data,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-text-main">
            Neue Bewohner:in anlegen
          </DialogTitle>
          <DialogDescription>
            Bitte füllen Sie die Daten aus. Alle Angaben
            werden pseudonymisiert gespeichert.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Pseudonym */}
          <div className="space-y-2">
            <Label htmlFor="pseudonym">
              Pseudonym / Kürzel <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pseudonym"
              className="rounded-xl"
              placeholder='z.B. "Lisa M.", "Sonnenschein", "Raider 3"'
              maxLength={30}
              {...register("pseudonym")}
            />
            {errors.pseudonym && (
              <p className="text-xs text-destructive">
                {errors.pseudonym.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Wählen Sie ein Kürzel, das intern verwendet wird. Bitte keinen vollständigen Klarnamen verwenden.
            </p>
          </div>

          {/* Geburtsjahr */}
          <div className="space-y-2">
            <Label>
              Geburtsjahr <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="birthYear"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(val) => field.onChange(parseInt(val))}
                  value={field.value?.toString()}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Geburtsjahr auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {birthYearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.birthYear && (
              <p className="text-xs text-destructive">
                {errors.birthYear.message}
              </p>
            )}
          </div>

          {/* Gewicht-Felder */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentWeight">
                Aktuelles Gewicht (kg){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currentWeight"
                type="number"
                step="0.1"
                className="rounded-xl"
                placeholder="z.B. 55.0"
                {...register("currentWeight", { valueAsNumber: true })}
              />
              {errors.currentWeight && (
                <p className="text-xs text-destructive">
                  {errors.currentWeight.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetWeight">
                Zielgewicht (kg){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetWeight"
                type="number"
                step="0.1"
                className="rounded-xl"
                placeholder="z.B. 60.0"
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
            <Label htmlFor="targetDate">
              Zieldatum (optional)
            </Label>
            <Input
              id="targetDate"
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
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
            <Label htmlFor="notes">Notizen für das Team (optional)</Label>
            <Textarea
              id="notes"
              className="rounded-xl"
              placeholder="Besondere Hinweise für das Team..."
              rows={3}
              {...register("notes")}
            />
          </div>

          {/* Submit */}
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
            type="submit"
            className="w-full rounded-xl bg-primary hover:bg-primary-600"
            disabled={createPatient.isPending}
          >
            {createPatient.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird angelegt...
              </>
            ) : (
              "Bewohner:in anlegen"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
