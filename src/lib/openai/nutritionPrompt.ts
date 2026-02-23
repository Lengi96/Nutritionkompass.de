import { z } from "zod";
import { getOpenAIClient } from "./client";

const ingredientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.enum(["g", "ml", "StÃ¼ck", "EL", "TL"]),
  category: z.enum([
    "GemÃ¼se & Obst",
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
  recipe: z.string().min(220, "Rezept ist zu kurz.").max(1600, "Rezept ist zu lang."),
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
type MealType = MealData["mealType"];

const DAY_REQUEST_TIMEOUT_MS = 6_500;

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

const BASE_MEAL_LIBRARY = {
  "Frühstück": [
    "Overnight-Oats mit Banane",
    "Vollkornbrot mit FrischkÃ¤se und Gurke",
    "Joghurt-Bowl mit Haferflocken",
    "RÃ¼hrei mit Vollkorntoast",
  ],
  "Mittagessen": [
    "Linsencurry mit Reis",
    "Pasta mit Tomatensauce und GemÃ¼se",
    "Kartoffelpfanne mit KrÃ¤uterquark",
    "Reis-Bowl mit Kichererbsen",
  ],
  "Abendessen": [
    "GemÃ¼seomelett mit Ofenkartoffeln",
    "Wraps mit Bohnen und Salat",
    "Couscous-Salat mit Feta",
    "Vollkornbrotzeit mit Rohkost",
  ],
  "Snack": [
    "Apfel mit Nussmus",
    "Quark mit Beeren",
    "Haferkekse und Banane",
    "Joghurt mit NÃ¼ssen",
  ],
} as const;

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

function buildFallbackRecipe(mealName: string): string {
  return `Alle Zutaten exakt abwiegen (z. B. 180 g Beilage, 120 g Proteinquelle, 150 g Gemuese, 1 EL Oel) und griffbereit stellen; Beilage nach Packungsangabe garen und dabei die Garzeit auf 10-12 Minuten timen; Proteinquelle in einer beschichteten Pfanne mit 1 EL Oel bei mittlerer Hitze 4-6 Minuten anbraten und einmal wenden; Gemuese zugeben, 50 ml Wasser oder Sauce einruehren und weitere 6-8 Minuten sanft garen; Mit Salz, Pfeffer und Kraeutern abschmecken, dann alles portionsgerecht anrichten; Tipp: Fuer ${mealName} die Sauce erst am Ende zugeben, damit Konsistenz und Naehrstoffe erhalten bleiben.`;
}

function createFallbackMeal(
  mealType: "Frühstück" | "Mittagessen" | "Abendessen" | "Snack",
  dayIndex: number
) {
  const pool = BASE_MEAL_LIBRARY[mealType];
  const mealName = pool[dayIndex % pool.length];
  const kcalMap = {
    "Frühstück": 430,
    "Mittagessen": 620,
    "Abendessen": 560,
    "Snack": 260,
  } as const;
  const kcal = kcalMap[mealType];

  return {
    mealType,
    name: mealName,
    description: "Ausgewogene, alltagstaugliche Mahlzeit mit klarer Zubereitung.",
    recipe: buildFallbackRecipe(mealName),
    kcal,
    protein: Math.round(kcal * 0.2 / 4),
    carbs: Math.round(kcal * 0.5 / 4),
    fat: Math.round(kcal * 0.3 / 9),
    ingredients: [
      { name: "Hauptzutat", amount: 180, unit: "g" as const, category: "Kohlenhydrate" as const },
      { name: "GemÃ¼se", amount: 150, unit: "g" as const, category: "GemÃ¼se & Obst" as const },
      { name: "Proteinquelle", amount: 120, unit: "g" as const, category: "Protein" as const },
      { name: "Ã–l", amount: 1, unit: "EL" as const, category: "Sonstiges" as const },
    ],
  };
}

function buildFallbackPlan(dayNames: string[]): MealPlanData {
  const days = dayNames.map((dayName, dayIndex) => {
    const meals = [
      createFallbackMeal("Frühstück", dayIndex),
      createFallbackMeal("Mittagessen", dayIndex),
      createFallbackMeal("Abendessen", dayIndex),
      createFallbackMeal("Snack", dayIndex),
    ];
    const dailyKcal = meals.reduce((sum, meal) => sum + meal.kcal, 0);
    return { dayName, meals, dailyKcal };
  });

  const parsed = mealPlanSchema.safeParse({ days });
  if (!parsed.success) {
    throw new Error("Fallback-Plan konnte nicht erstellt werden.");
  }
  return parsed.data;
}

function applyFixedMealTypes(
  plan: MealPlanData,
  fixedMealTypes: MealType[]
): MealPlanData {
  if (fixedMealTypes.length === 0 || plan.days.length === 0) {
    return plan;
  }

  const fixedSet = new Set(fixedMealTypes);
  const templateByType = new Map<MealType, MealData>();

  for (const meal of plan.days[0].meals) {
    if (fixedSet.has(meal.mealType)) {
      templateByType.set(meal.mealType, meal);
    }
  }

  const normalizedDays = plan.days.map((day) => {
    const meals = day.meals.map((meal) => {
      const template = templateByType.get(meal.mealType);
      return template
        ? {
            ...template,
            mealType: meal.mealType,
          }
        : meal;
    });

    const normalizedDay = {
      ...day,
      meals,
    };

    return {
      ...normalizedDay,
      dailyKcal: getEffectiveDailyKcal(normalizedDay),
    };
  });

  return { days: normalizedDays };
}

export async function generateMealPlan(
  patient: PatientForPrompt,
  additionalNotes?: string,
  options?: {
    numDays?: number;
    fixedMealTypes?: MealType[];
    fastMode?: boolean;
    requestTimeoutMs?: number;
    onProgress?: (message: string) => void;
  }
): Promise<{ plan: MealPlanData; prompt: string }> {
  const numDays = Math.min(14, Math.max(1, options?.numDays ?? 7));
  const requestTimeoutMs =
    options?.requestTimeoutMs ?? (options?.fastMode ? 12_000 : DAY_REQUEST_TIMEOUT_MS);
  const fixedMealTypes = options?.fixedMealTypes ?? [];
  const onProgress = options?.onProgress;
  const dayNames = Array.from({ length: numDays }, (_, index) => getDayNameByIndex(index));
  const { age, allergiesText, notesText, autonomyText } = buildPatientBasePrompt(
    patient,
    additionalNotes
  );

  onProgress?.(`Erstelle Gesamtplan (${numDays} Tage)...`);

  const systemPrompt = `Du bist ein spezialisierter ErnÃ¤hrungsplaner.
Gib AUSSCHLIESSLICH ein valides JSON-Objekt zurÃ¼ck.

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
          "recipe": "string (6-9 Schritte, durch ';' getrennt, 420-900 Zeichen, letzter Schritt beginnt mit 'Tipp:')",
          "kcal": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "ingredients": [
            {
              "name": "string",
              "amount": number,
              "unit": "g" | "ml" | "StÃ¼ck" | "EL" | "TL",
              "category": "GemÃ¼se & Obst" | "Protein" | "Milchprodukte" | "Kohlenhydrate" | "Sonstiges"
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
- Rezept je Mahlzeit mit klaren Arbeitsschritten, Zeitangaben und Hitzehinweisen (z. B. mittlere Hitze, 8 Minuten).
- In jedem Rezept konkrete Mengen aus den Zutaten verwenden (z. B. 120 g, 1 EL, 200 ml).
- Letzter Rezeptschritt beginnt immer mit "Tipp:" und gibt einen praktischen Zubereitungshinweis.
- ${fixedMealTypes.length > 0 ? `Diese Mahlzeiten muessen jeden Tag identisch sein (Name, Rezept, Zutaten): ${fixedMealTypes.join(", ")}.` : "Wenn keine fixen Mahlzeiten vorgegeben sind, variiere die Gerichte ueber die Tage."}
- Allergien strikt beachten.
- Kein Zusatztext, kein Markdown, keine CodeblÃ¶cke.`;

  const userPrompt = `Patient:
- Alter: ${age}
- Aktuelles Gewicht: ${patient.currentWeight} kg
- Zielgewicht: ${patient.targetWeight} kg
- Allergien/UnvertrÃ¤glichkeiten: ${allergiesText}
- Besondere Hinweise: ${notesText}
- Selbstständigkeit/Absprachen: ${autonomyText}
${fixedMealTypes.length > 0 ? `- Feste Mahlzeiten (taeglich gleich): ${fixedMealTypes.join(", ")}` : ""}

Erstelle den vollstÃ¤ndigen ${numDays}-Tage-Plan in genau einem JSON-Objekt im geforderten Format.`;

  let parsedPlan: MealPlanData | null = null;
  const maxTokens = Math.min(3800, 700 + numDays * 400);

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
      requestTimeoutMs,
      "TIMEOUT_PLAN"
    );

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = tryParseModelJson(content);
      const result = mealPlanSchema.safeParse(parsed);
      if (result.success && result.data.days.length >= numDays) {
        const normalizedDays = result.data.days.slice(0, numDays).map((day, idx) => ({
          ...day,
          dayName: dayNames[idx],
          dailyKcal: getEffectiveDailyKcal(day),
        }));
        parsedPlan = { days: normalizedDays };
      }
    }
  } catch {
    // fallback below
  }

  if (!parsedPlan) {
    onProgress?.("KI langsam, verwende schnellen Fallback-Plan...");
    parsedPlan = buildFallbackPlan(dayNames);
  }

  parsedPlan = applyFixedMealTypes(parsedPlan, fixedMealTypes);
  findVarietyIssues(parsedPlan.days);

  const result = mealPlanSchema.safeParse(parsedPlan);
  if (!result.success) throw new Error("Der erzeugte Plan ist ungueltig.");
  onProgress?.(`Plan erstellt (${numDays}/${numDays})...`);

  return {
    plan: result.data,
    prompt: `Einzelschuss-Generierung | Alter: ${age} | Allergien: ${allergiesText} | Hinweise: ${notesText} | Fixe Mahlzeiten: ${fixedMealTypes.length > 0 ? fixedMealTypes.join(", ") : "Keine"} | Absprachen: ${autonomyText}`,
  };
}




