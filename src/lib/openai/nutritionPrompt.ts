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
  recipe: z
    .string()
    .min(20, "Rezept ist zu kurz.")
    .max(5000, "Rezept ist zu lang."),
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
  days: z.array(daySchema).length(7),
});

export type MealPlanData = z.infer<typeof mealPlanSchema>;
export type MealData = z.infer<typeof mealSchema>;
export type IngredientData = z.infer<typeof ingredientSchema>;

type DayPlanData = z.infer<typeof daySchema>;

interface PatientForPrompt {
  birthYear: number;
  currentWeight: number;
  targetWeight: number;
  allergies: string[];
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

function buildPatientBasePrompt(patient: PatientForPrompt, additionalNotes?: string) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - patient.birthYear;
  const allergiesText =
    patient.allergies.length > 0 ? patient.allergies.join(", ") : "Keine bekannt";
  const notesText = additionalNotes || "Keine besonderen Hinweise";

  return {
    age,
    allergiesText,
    notesText,
  };
}

function buildDayPrompts(
  patient: PatientForPrompt,
  dayName: string,
  additionalNotes?: string,
  mode: "normal" | "compact" | "ultra" = "normal",
  excludedMealNames: string[] = []
) {
  const { age, allergiesText, notesText } = buildPatientBasePrompt(
    patient,
    additionalNotes
  );

  const maxIngredients = mode === "ultra" ? 3 : 5;
  const maxDescriptionChars = mode === "ultra" ? 60 : 100;

  const systemPrompt = `Du bist ein spezialisierter Ernährungsplaner.
Erstelle GENAU EINEN Tagesplan als valides JSON-Objekt.

Format:
{
  "dayName": "${dayName}",
  "meals": [
    {
      "mealType": "Frühstück" | "Mittagessen" | "Abendessen" | "Snack",
      "name": "string",
      "description": "string",
      "recipe": "string (kurze Zubereitung in 3-6 Schritten, durch ';' getrennt)",
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

Regeln:
- dayName MUSS exakt "${dayName}" sein
- Genau 4 Mahlzeiten: Frühstück, Mittagessen, Abendessen, Snack
- dailyKcal mindestens 1800
- Jede Mahlzeit des Tages muss sich deutlich unterscheiden (keine Dubletten)
- Pro Mahlzeit maximal ${maxIngredients} Zutaten
- Beschreibung kurz halten (max. ${maxDescriptionChars} Zeichen)
- recipe muss pro Mahlzeit vorhanden sein (3-6 kurze Schritte, mit ';' trennen)
- Nur alltagstaugliche Zutaten in Deutschland
- Allergien strikt beachten
- Kein Zusatztext, nur JSON`;

  const userPrompt = `Patientendaten:
- Alter: ${age}
- Aktuelles Gewicht: ${patient.currentWeight} kg
- Zielgewicht: ${patient.targetWeight} kg
- Allergien/Unverträglichkeiten: ${allergiesText}
- Besondere Hinweise: ${notesText}

Erstelle den Plan für ${dayName}.
${excludedMealNames.length > 0 ? `WICHTIG: Verwende KEINE der folgenden bereits genutzten Gerichte: ${excludedMealNames.join(", ")}.` : ""}`;

  return { systemPrompt, userPrompt };
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

async function generateSingleDayPlan(
  patient: PatientForPrompt,
  dayName: string,
  additionalNotes?: string,
  fastMode = false,
  excludedMealNames: string[] = []
): Promise<DayPlanData> {
  const attempts: Array<{ mode: "normal" | "compact" | "ultra"; maxTokens: number }> = fastMode
    ? [
        { mode: "compact", maxTokens: 1400 },
        { mode: "ultra", maxTokens: 1800 },
      ]
    : [
        { mode: "normal", maxTokens: 1600 },
        { mode: "compact", maxTokens: 2000 },
        { mode: "ultra", maxTokens: 2400 },
      ];

  let lastError = "Die KI-Antwort war unvollständig.";

  for (const attempt of attempts) {
    const { systemPrompt, userPrompt } = buildDayPrompts(
      patient,
      dayName,
      additionalNotes,
      attempt.mode,
      excludedMealNames
    );

    const response = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.35,
      max_tokens: attempt.maxTokens,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content;

    if (!content || choice?.finish_reason === "length") {
      lastError = "Die KI-Antwort war unvollständig.";
      continue;
    }

    let parsed: unknown;
    try {
      parsed = tryParseModelJson(content);
    } catch {
      lastError = "Die KI-Antwort konnte nicht verarbeitet werden.";
      continue;
    }

    const result = daySchema.safeParse(parsed);
    if (!result.success) {
      lastError = "Die KI-Antwort entsprach nicht dem erwarteten Format.";
      continue;
    }

    if (result.data.dayName !== dayName) {
      lastError = "Die KI hat einen falschen Wochentag geliefert.";
      continue;
    }

    if (result.data.dailyKcal < 1800) {
      lastError = `${dayName} unterschreitet 1800 kcal.`;
      continue;
    }

    return result.data;
  }

  throw new Error(`${dayName}: ${lastError} Bitte erneut versuchen.`);
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

function getExcludedNamesFromDays(days: DayPlanData[], skipIndex = -1): string[] {
  const names = new Set<string>();
  for (let i = 0; i < days.length; i++) {
    if (i === skipIndex) continue;
    for (const meal of days[i].meals) {
      names.add(meal.name);
    }
  }
  return Array.from(names);
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
      dayIndexes
        .slice(allowed)
        .forEach((idx) => badDays.add(idx));
    }
  }

  return Array.from(badDays.values()).sort((a, b) => a - b);
}

export async function generateMealPlan(
  patient: PatientForPrompt,
  additionalNotes?: string,
  options?: {
    fastMode?: boolean;
  }
): Promise<{ plan: MealPlanData; prompt: string }> {
  const fastMode = options?.fastMode ?? false;

  const days: DayPlanData[] = [];
  for (const dayName of DAY_NAMES) {
    const excludedNames = getExcludedNamesFromDays(days);
    const dayPlan = await generateSingleDayPlan(
      patient,
      dayName,
      additionalNotes,
      fastMode,
      excludedNames
    );
    days.push(dayPlan);
  }

  // Nachkorrektur: doppelte Gerichte über die Woche reduzieren
  for (let pass = 0; pass < 2; pass++) {
    const issues = findVarietyIssues(days);
    if (issues.length === 0) break;

    for (const dayIndex of issues) {
      const excludedNames = getExcludedNamesFromDays(days, dayIndex);
      days[dayIndex] = await generateSingleDayPlan(
        patient,
        DAY_NAMES[dayIndex],
        additionalNotes,
        fastMode,
        excludedNames
      );
    }
  }

  const remainingIssues = findVarietyIssues(days);
  if (remainingIssues.length > 0) {
    throw new Error(
      "Der Plan ist noch nicht abwechslungsreich genug. Bitte erneut generieren."
    );
  }

  const result = mealPlanSchema.safeParse({ days });
  if (!result.success) {
    throw new Error("Der zusammengesetzte Wochenplan ist ungültig.");
  }

  const { age, allergiesText, notesText } = buildPatientBasePrompt(
    patient,
    additionalNotes
  );

  return {
    plan: result.data,
    prompt: `Tagweise Generierung | Alter: ${age} | Allergien: ${allergiesText} | Hinweise: ${notesText}`,
  };
}
