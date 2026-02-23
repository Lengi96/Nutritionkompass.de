import { z } from "zod";
import { getOpenAIClient } from "./client";

const ingredientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.enum(["g", "ml", "Stück", "EL", "TL"]),
  category: z.enum([
    "Gemüse & Obst",
    "Protein",
    "Milchprodukte",
    "Kohlenhydrate",
    "Sonstiges",
  ]),
});

const mealSchema = z.object({
  mealType: z.enum(["Frühstück", "Mittagessen", "Abendessen", "Snack"]),
  name: z.string(),
  description: z.string(),
  recipe: z.string().min(140, "Rezept ist zu kurz.").max(1200, "Rezept ist zu lang."),
  kcal: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  ingredients: z.array(ingredientSchema),
});

const daySchema = z.object({
  dayName: z.string(),
  meals: z.array(mealSchema),
  dailyKcal: z.number(),
});

export const mealPlanSchema = z.object({
  days: z.array(daySchema).min(1).max(14),
});

export type MealPlanData = z.infer<typeof mealPlanSchema>;
export type MealData = z.infer<typeof mealSchema>;
export type IngredientData = z.infer<typeof ingredientSchema>;

type DayPlanData = z.infer<typeof daySchema>;

const DAY_REQUEST_TIMEOUT_MS = 25_000;
const DAY_FALLBACK_TIMEOUT_MS = 45_000;

interface PatientForPrompt {
  birthYear: number;
  currentWeight: number;
  targetWeight: number;
  allergies: string[];
  autonomyNotes?: string | null;
}

const DAY_NAMES = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;

function getDayNameByIndex(index: number): string {
  const weekday = DAY_NAMES[index % DAY_NAMES.length];
  const cycle = Math.floor(index / DAY_NAMES.length) + 1;
  return cycle === 1 ? weekday : `${weekday} (Woche ${cycle})`;
}

function buildPatientBasePrompt(patient: PatientForPrompt, additionalNotes?: string) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - patient.birthYear;
  const allergiesText =
    patient.allergies.length > 0 ? patient.allergies.join(", ") : "Keine bekannt";
  const notesText = additionalNotes || "Keine besonderen Hinweise";
  const autonomyText = patient.autonomyNotes || "Keine Absprachen";

  return {
    age,
    allergiesText,
    notesText,
    autonomyText,
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutError: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(timeoutError)), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function getEffectiveDailyKcal(day: DayPlanData): number {
  const mealSum = day.meals.reduce((sum, meal) => sum + meal.kcal, 0);
  return Math.round(Math.max(day.dailyKcal, mealSum));
}

function tryParseModelJson(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    // noop
  }

  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1]);
    } catch {
      // noop
    }
  }

  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(content.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("INVALID_JSON");
}

function normalizeMealName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findVarietyIssues(days: DayPlanData[]): number[] {
  const byType = new Map<string, number[]>();

  days.forEach((day, dayIdx) => {
    day.meals.forEach((meal) => {
      const key = `${meal.mealType}:${normalizeMealName(meal.name)}`;
      const arr = byType.get(key) ?? [];
      arr.push(dayIdx);
      byType.set(key, arr);
    });
  });

  const badDays = new Set<number>();
  for (const [key, dayIndexes] of Array.from(byType.entries())) {
    const [mealType] = key.split(":");
    const allowed = mealType === "Snack" ? 2 : 1;
    if (dayIndexes.length > allowed) {
      dayIndexes.slice(allowed).forEach((idx) => badDays.add(idx));
    }
  }

  return Array.from(badDays.values()).sort((a, b) => a - b);
}

export async function generateMealPlan(
  patient: PatientForPrompt,
  additionalNotes?: string,
  options?: {
    numDays?: number;
    fastMode?: boolean;
    requestTimeoutMs?: number;
    onProgress?: (message: string) => void;
  }
): Promise<{ plan: MealPlanData; prompt: string }> {
  const numDays = Math.min(14, Math.max(1, options?.numDays ?? 7));
  const requestTimeoutMs =
    options?.requestTimeoutMs ?? (options?.fastMode ? 12_000 : DAY_REQUEST_TIMEOUT_MS);
  const onProgress = options?.onProgress;
  const dayNames = Array.from({ length: numDays }, (_, index) => getDayNameByIndex(index));
  const { age, allergiesText, notesText, autonomyText } = buildPatientBasePrompt(
    patient,
    additionalNotes
  );

  onProgress?.(`Erstelle Gesamtplan (${numDays} Tage)...`);

  const systemPrompt = `Du bist ein spezialisierter Ernährungsplaner.
Gib AUSSCHLIESSLICH ein valides JSON-Objekt zurück.

Format:
{
  "days": [
    {
      "dayName": "string",
      "meals": [
        {
          "mealType": "Frühstück" | "Mittagessen" | "Abendessen" | "Snack",
          "name": "string",
          "description": "string",
          "recipe": "string (4-7 Schritte, durch ';' getrennt, 320-650 Zeichen)",
          "kcal": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "ingredients": [
            {
              "name": "string",
              "amount": number,
              "unit": "g" | "ml" | "Stück" | "EL" | "TL",
              "category": "Gemüse & Obst" | "Protein" | "Milchprodukte" | "Kohlenhydrate" | "Sonstiges"
            }
          ]
        }
      ],
      "dailyKcal": number
    }
  ]
}

Regeln:
- Erzeuge GENAU ${numDays} Tage.
- dayName muss exakt einem dieser Werte entsprechen: ${dayNames.join(", ")}.
- Pro Tag genau 4 Mahlzeiten: Frühstück, Mittagessen, Abendessen, Snack.
- dailyKcal mindestens 1800.
- Zutaten alltagstauglich in Deutschland.
- Allergien strikt beachten.
- Kein Zusatztext, kein Markdown, keine Codeblöcke.`;

  const userPrompt = `Patient:
- Alter: ${age}
- Aktuelles Gewicht: ${patient.currentWeight} kg
- Zielgewicht: ${patient.targetWeight} kg
- Allergien/Unverträglichkeiten: ${allergiesText}
- Besondere Hinweise: ${notesText}
- Selbstständigkeit/Absprachen: ${autonomyText}

Erstelle den vollständigen ${numDays}-Tage-Plan in genau einem JSON-Objekt im geforderten Format.`;

  let parsedPlan: MealPlanData | null = null;
  const maxTokens = Math.min(3800, 700 + numDays * 400);

  for (let attempt = 0; attempt < 2; attempt++) {
    const timeoutMs = attempt === 0 ? requestTimeoutMs : DAY_FALLBACK_TIMEOUT_MS;
    try {
      const response = await withTimeout(
        getOpenAIClient().chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: maxTokens,
        }),
        timeoutMs,
        "TIMEOUT_PLAN"
      );

      const content = response.choices[0]?.message?.content;
      if (!content) continue;

      const parsed = tryParseModelJson(content);
      const result = mealPlanSchema.safeParse(parsed);
      if (!result.success) continue;
      if (result.data.days.length < numDays) continue;

      const normalizedDays = result.data.days.slice(0, numDays).map((day, idx) => ({
        ...day,
        dayName: dayNames[idx],
        dailyKcal: getEffectiveDailyKcal(day),
      }));

      parsedPlan = { days: normalizedDays };
      break;
    } catch {
      // retry
    }
  }

  if (!parsedPlan) {
    throw new Error("Plan konnte nicht stabil als JSON erzeugt werden.");
  }

  findVarietyIssues(parsedPlan.days);

  const result = mealPlanSchema.safeParse(parsedPlan);
  if (!result.success) throw new Error("Der erzeugte Plan ist ungueltig.");
  onProgress?.(`Plan erstellt (${numDays}/${numDays})...`);

  return {
    plan: result.data,
    prompt: `Einzelschuss-Generierung | Alter: ${age} | Allergien: ${allergiesText} | Hinweise: ${notesText} | Absprachen: ${autonomyText}`,
  };
}
