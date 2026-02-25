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
    "Vollkornbrot mit Frischkäse und Gurke",
    "Joghurt-Bowl mit Haferflocken",
    "Rührei mit Vollkorntoast",
  ],
  "Mittagessen": [
    "Linsencurry mit Reis",
    "Pasta mit Tomatensauce und Gemüse",
    "Kartoffelpfanne mit Kräuterquark",
    "Reis-Bowl mit Kichererbsen",
  ],
  "Abendessen": [
    "Gemüseomelett mit Ofenkartoffeln",
    "Wraps mit Bohnen und Salat",
    "Couscous-Salat mit Feta",
    "Vollkornbrotzeit mit Rohkost",
  ],
  "Snack": [
    "Apfel mit Nussmus",
    "Quark mit Beeren",
    "Haferkekse und Banane",
    "Joghurt mit Nüssen",
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

function buildContextualKitchenTip(meal: Pick<MealData, "mealType" | "name" | "ingredients">): string {
  const name = normalizeMealName(meal.name);
  const ingredientNames = meal.ingredients.map((i) => normalizeMealName(i.name));
  const has = (pattern: RegExp) =>
    pattern.test(name) || ingredientNames.some((n) => pattern.test(n));

  if (has(/\bovernight\b|\boats\b|hafer/)) {
    return "Overnight-Oats über Nacht gut quellen lassen und morgens erst kurz vor dem Servieren Obst oder Toppings unterheben, damit die Konsistenz cremig bleibt.";
  }
  if (has(/\bjoghurt\b|quark/)) {
    return "Kalte Komponenten erst direkt vor dem Servieren mischen, damit Joghurt oder Quark nicht wässrig werden.";
  }
  if (has(/\bpasta\b|nudel/)) {
    return "Nudeln 1 Minute vor Ende der Packungszeit prüfen und mit etwas Kochwasser zur Sauce geben, damit alles besser bindet.";
  }
  if (has(/\breis\b/)) {
    return "Reis nach dem Garen 5 Minuten zugedeckt ziehen lassen und erst dann lockern, damit die Körner nicht brechen.";
  }
  if (has(/curry/)) {
    return "Gewürze kurz im heißen Öl anrösten, bevor Flüssigkeit dazukommt, damit das Curry aromatischer wird.";
  }
  if (has(/omelett|r[uü]hrei|ei/)) {
    return "Eierspeisen bei mittlerer bis niedriger Hitze stocken lassen und nicht zu lange garen, damit sie saftig bleiben.";
  }
  if (has(/wrap/)) {
    return "Wraps kurz trocken anwärmen und feuchte Zutaten erst zum Schluss einfüllen, damit sie beim Rollen nicht reißen.";
  }
  if (has(/salat|couscous/)) {
    return "Dressing erst kurz vor dem Servieren zugeben, damit Gemüse und Kräuter frisch und bissfest bleiben.";
  }
  if (has(/brot|toast/)) {
    return "Brotkomponenten getrennt vorbereiten und feuchte Aufstriche erst direkt vor dem Essen auftragen, damit nichts durchweicht.";
  }
  if (meal.mealType === "Snack") {
    return "Snack-Portionen direkt abwiegen und in kleinen Schalen anrichten, damit die Menge im Alltag leichter eingehalten wird.";
  }

  return `Für ${meal.name} zuerst alle Zutaten abwiegen und in der Reihenfolge der Garzeiten verarbeiten, damit die Portion gleichmäßig gelingt.`;
}

function buildFallbackRecipe(meal: Pick<MealData, "mealType" | "name" | "ingredients">): string {
  return `Alle Zutaten exakt abwiegen (z. B. 180 g Beilage, 120 g Proteinquelle, 150 g Gemüse, 1 EL Öl) und griffbereit stellen; Beilage nach Packungsangabe garen und dabei die Garzeit auf 10-12 Minuten timen; Proteinquelle in einer beschichteten Pfanne mit 1 EL Öl bei mittlerer Hitze 4-6 Minuten anbraten und einmal wenden; Gemüse zugeben, 50 ml Wasser oder Sauce einrühren und weitere 6-8 Minuten sanft garen; Mit Salz, Pfeffer und Kräutern abschmecken, dann alles portionsgerecht anrichten; Tipp: ${buildContextualKitchenTip(meal)}`;
}

function replaceOrAppendTip(recipe: string, meal: Pick<MealData, "mealType" | "name" | "ingredients">): string {
  const steps = recipe
    .split(/;|\n/)
    .map((step) => step.trim())
    .filter((step) => step.length > 0);

  if (steps.length === 0) {
    return `Tipp: ${buildContextualKitchenTip(meal)}`;
  }

  const genericTipPattern =
    /^tipp:\s*(f[üu]r .* die sauce erst am ende zugeben|die sauce erst am ende zugeben)/i;
  const lastIndex = steps.length - 1;
  const lastStep = steps[lastIndex];

  if (/^tipp:/i.test(lastStep)) {
    if (genericTipPattern.test(lastStep)) {
      steps[lastIndex] = `Tipp: ${buildContextualKitchenTip(meal)}`;
    }
  } else {
    steps.push(`Tipp: ${buildContextualKitchenTip(meal)}`);
  }

  return steps.join("; ");
}

function improveRecipeTips(plan: MealPlanData): MealPlanData {
  return {
    days: plan.days.map((day) => ({
      ...day,
      meals: day.meals.map((meal) => ({
        ...meal,
        recipe: replaceOrAppendTip(recipeToString(meal.recipe), meal),
      })),
    })),
  };
}

function recipeToString(recipe: string): string {
  return typeof recipe === "string" ? recipe : "";
}

type FallbackIngredient = {
  name: string;
  amount: number;
  unit: "g" | "ml" | "Stück" | "EL" | "TL";
  category: "Gemüse & Obst" | "Protein" | "Milchprodukte" | "Kohlenhydrate" | "Sonstiges";
};

const FALLBACK_INGREDIENTS: Record<
  "Frühstück" | "Mittagessen" | "Abendessen" | "Snack",
  FallbackIngredient[][]
> = {
  "Frühstück": [
    [
      { name: "Haferflocken", amount: 80, unit: "g", category: "Kohlenhydrate" },
      { name: "Magerquark", amount: 150, unit: "g", category: "Milchprodukte" },
      { name: "Banane", amount: 120, unit: "g", category: "Gemüse & Obst" },
      { name: "Rapsöl", amount: 1, unit: "EL", category: "Sonstiges" },
    ],
    [
      { name: "Vollkornbrot", amount: 100, unit: "g", category: "Kohlenhydrate" },
      { name: "Schnittkäse", amount: 40, unit: "g", category: "Milchprodukte" },
      { name: "Tomate", amount: 100, unit: "g", category: "Gemüse & Obst" },
      { name: "Butter", amount: 10, unit: "g", category: "Sonstiges" },
    ],
    [
      { name: "Eier", amount: 2, unit: "Stück", category: "Protein" },
      { name: "Vollkornbrot", amount: 80, unit: "g", category: "Kohlenhydrate" },
      { name: "Gurke", amount: 100, unit: "g", category: "Gemüse & Obst" },
      { name: "Olivenöl", amount: 1, unit: "EL", category: "Sonstiges" },
    ],
    [
      { name: "Naturjoghurt", amount: 200, unit: "g", category: "Milchprodukte" },
      { name: "Müsli", amount: 60, unit: "g", category: "Kohlenhydrate" },
      { name: "Apfel", amount: 130, unit: "g", category: "Gemüse & Obst" },
      { name: "Honig", amount: 1, unit: "TL", category: "Sonstiges" },
    ],
    [
      { name: "Rührei", amount: 120, unit: "g", category: "Protein" },
      { name: "Weißbrot", amount: 80, unit: "g", category: "Kohlenhydrate" },
      { name: "Paprika", amount: 80, unit: "g", category: "Gemüse & Obst" },
      { name: "Butter", amount: 10, unit: "g", category: "Sonstiges" },
    ],
  ],
  "Mittagessen": [
    [
      { name: "Hühnerbrust", amount: 150, unit: "g", category: "Protein" },
      { name: "Weißreis", amount: 180, unit: "g", category: "Kohlenhydrate" },
      { name: "Brokkoli", amount: 200, unit: "g", category: "Gemüse & Obst" },
      { name: "Olivenöl", amount: 1, unit: "EL", category: "Sonstiges" },
    ],
    [
      { name: "Lachsfilet", amount: 150, unit: "g", category: "Protein" },
      { name: "Kartoffeln", amount: 200, unit: "g", category: "Kohlenhydrate" },
      { name: "Erbsen", amount: 120, unit: "g", category: "Gemüse & Obst" },
      { name: "Butter", amount: 10, unit: "g", category: "Sonstiges" },
    ],
    [
      { name: "Rinderhackfleisch", amount: 150, unit: "g", category: "Protein" },
      { name: "Spaghetti", amount: 180, unit: "g", category: "Kohlenhydrate" },
      { name: "Tomaten", amount: 150, unit: "g", category: "Gemüse & Obst" },
      { name: "Olivenöl", amount: 1, unit: "EL", category: "Sonstiges" },
    ],
    [
      { name: "Schweineschnitzel", amount: 150, unit: "g", category: "Protein" },
      { name: "Kartoffelpüree", amount: 200, unit: "g", category: "Kohlenhydrate" },
      { name: "Karotten", amount: 150, unit: "g", category: "Gemüse & Obst" },
      { name: "Butter", amount: 10, unit: "g", category: "Sonstiges" },
    ],
    [
      { name: "Hähnchenkeule", amount: 160, unit: "g", category: "Protein" },
      { name: "Basmati-Reis", amount: 180, unit: "g", category: "Kohlenhydrate" },
      { name: "Zucchini", amount: 150, unit: "g", category: "Gemüse & Obst" },
      { name: "Rapsöl", amount: 1, unit: "EL", category: "Sonstiges" },
    ],
  ],
  "Abendessen": [
    [
      { name: "Vollkornbrot", amount: 120, unit: "g", category: "Kohlenhydrate" },
      { name: "Frischkäse", amount: 60, unit: "g", category: "Milchprodukte" },
      { name: "Paprika", amount: 100, unit: "g", category: "Gemüse & Obst" },
      { name: "Butter", amount: 10, unit: "g", category: "Sonstiges" },
    ],
    [
      { name: "Thunfisch (Dose)", amount: 130, unit: "g", category: "Protein" },
      { name: "Vollkornbrot", amount: 100, unit: "g", category: "Kohlenhydrate" },
      { name: "Salatgurke", amount: 100, unit: "g", category: "Gemüse & Obst" },
      { name: "Olivenöl", amount: 1, unit: "EL", category: "Sonstiges" },
    ],
    [
      { name: "Mozzarella", amount: 125, unit: "g", category: "Milchprodukte" },
      { name: "Vollkornbrot", amount: 100, unit: "g", category: "Kohlenhydrate" },
      { name: "Tomate", amount: 120, unit: "g", category: "Gemüse & Obst" },
      { name: "Olivenöl", amount: 1, unit: "EL", category: "Sonstiges" },
    ],
    [
      { name: "Hüttenkäse", amount: 150, unit: "g", category: "Milchprodukte" },
      { name: "Vollkornknäckebrot", amount: 60, unit: "g", category: "Kohlenhydrate" },
      { name: "Radieschen", amount: 80, unit: "g", category: "Gemüse & Obst" },
      { name: "Leinöl", amount: 1, unit: "TL", category: "Sonstiges" },
    ],
    [
      { name: "Eier", amount: 3, unit: "Stück", category: "Protein" },
      { name: "Gouda", amount: 40, unit: "g", category: "Milchprodukte" },
      { name: "Vollkornbrot", amount: 80, unit: "g", category: "Kohlenhydrate" },
      { name: "Butter", amount: 10, unit: "g", category: "Sonstiges" },
    ],
  ],
  "Snack": [
    [
      { name: "Magerquark", amount: 150, unit: "g", category: "Milchprodukte" },
      { name: "Walnüsse", amount: 30, unit: "g", category: "Sonstiges" },
      { name: "Apfel", amount: 130, unit: "g", category: "Gemüse & Obst" },
    ],
    [
      { name: "Vollkornbrot", amount: 60, unit: "g", category: "Kohlenhydrate" },
      { name: "Erdnussbutter", amount: 30, unit: "g", category: "Sonstiges" },
      { name: "Banane", amount: 120, unit: "g", category: "Gemüse & Obst" },
    ],
    [
      { name: "Naturjoghurt", amount: 200, unit: "g", category: "Milchprodukte" },
      { name: "Müsli", amount: 40, unit: "g", category: "Kohlenhydrate" },
      { name: "Blaubeeren", amount: 80, unit: "g", category: "Gemüse & Obst" },
    ],
    [
      { name: "Studentenfutter", amount: 50, unit: "g", category: "Sonstiges" },
      { name: "Apfel", amount: 130, unit: "g", category: "Gemüse & Obst" },
      { name: "Naturjoghurt", amount: 150, unit: "g", category: "Milchprodukte" },
    ],
    [
      { name: "Knäckebrot", amount: 40, unit: "g", category: "Kohlenhydrate" },
      { name: "Frischkäse", amount: 50, unit: "g", category: "Milchprodukte" },
      { name: "Salatgurke", amount: 80, unit: "g", category: "Gemüse & Obst" },
    ],
  ],
};

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

  const ingredientVariants = FALLBACK_INGREDIENTS[mealType];
  const ingredients = ingredientVariants[dayIndex % ingredientVariants.length];

  return {
    mealType,
    name: mealName,
    description: "Ausgewogene, alltagstaugliche Mahlzeit mit klarer Zubereitung.",
    recipe: buildFallbackRecipe({ mealType, name: mealName, ingredients }),
    kcal,
    protein: Math.round(kcal * 0.2 / 4),
    carbs: Math.round(kcal * 0.5 / 4),
    fat: Math.round(kcal * 0.3 / 9),
    ingredients,
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
          "recipe": "string (6-9 Schritte, durch ';' getrennt, 420-900 Zeichen, letzter Schritt beginnt mit 'Tipp:')",
          "kcal": number,
          "protein": number,
          "carbs": number,
          "fat": number,
          "ingredients": [
            {
              "name": "konkreter Lebensmittelname, z. B. Hühnerbrust, Weißreis, Spinat, Olivenöl",
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
- ingredients[].name MUSS ein spezifischer, konkreter Lebensmittelname sein (z. B. "Hühnerbrust", "Weißreis", "Blattspinat", "Olivenöl", "Magerquark", "Haferflocken"). NIEMALS generische Begriffe wie "Proteinquelle", "Hauptzutat", "Gemüse", "Öl", "Fleisch" oder ähnliche Kategorienamen verwenden.
- Rezept je Mahlzeit mit klaren Arbeitsschritten, Zeitangaben und Hitzehinweisen (z. B. mittlere Hitze, 8 Minuten).
- In jedem Rezept konkrete Mengen aus den Zutaten verwenden (z. B. 120 g, 1 EL, 200 ml).
- Letzter Rezeptschritt beginnt immer mit "Tipp:" und gibt einen praktischen, gerichtsspezifischen Zubereitungshinweis (kein generischer Standardsatz, keine Wiederholung derselben Formulierung über mehrere Gerichte).
- ${fixedMealTypes.length > 0 ? `Diese Mahlzeiten müssen jeden Tag identisch sein (Name, Rezept, Zutaten): ${fixedMealTypes.join(", ")}.` : "Wenn keine fixen Mahlzeiten vorgegeben sind, variiere die Gerichte über die Tage."}
- Allergien strikt beachten.
- Kein Zusatztext, kein Markdown, keine Codeblöcke.`;

  const userPrompt = `Patient:
- Alter: ${age}
- Aktuelles Gewicht: ${patient.currentWeight} kg
- Zielgewicht: ${patient.targetWeight} kg
- Allergien/Unverträglichkeiten: ${allergiesText}
- Besondere Hinweise: ${notesText}
- Selbstständigkeit/Absprachen: ${autonomyText}
${fixedMealTypes.length > 0 ? `- Feste Mahlzeiten (täglich gleich): ${fixedMealTypes.join(", ")}` : ""}

Erstelle den vollständigen ${numDays}-Tage-Plan in genau einem JSON-Objekt im geforderten Format.`;

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
  parsedPlan = improveRecipeTips(parsedPlan);
  findVarietyIssues(parsedPlan.days);

  const result = mealPlanSchema.safeParse(parsedPlan);
  if (!result.success) throw new Error("Der erzeugte Plan ist ungültig.");
  onProgress?.(`Plan erstellt (${numDays}/${numDays})...`);

  return {
    plan: result.data,
    prompt: `Einzelschuss-Generierung | Alter: ${age} | Allergien: ${allergiesText} | Hinweise: ${notesText} | Fixe Mahlzeiten: ${fixedMealTypes.length > 0 ? fixedMealTypes.join(", ") : "Keine"} | Absprachen: ${autonomyText}`,
  };
}




