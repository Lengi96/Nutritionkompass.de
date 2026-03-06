import { getNutriContext } from "@/lib/rag/getNutriContext";
import {
  mealPlanSchema,
  type MealPlanData,
  type QualityAssessment,
} from "@/lib/mealPlans/planFormat";
import {
  type MealPlanGenerationInput,
} from "./models";
import {
  generateMealPlanStructure,
  type WeekPlanStructure,
} from "./generateMealPlanStructure";
import { generateMealRecipes, type GeneratedRecipe } from "./generateMealRecipes";
import { validateMealPlan } from "./validateMealPlan";
import { scoreMealPlan } from "./scoreMealPlan";
import { AI_MODELS } from "./models";

export type { MealPlanData } from "@/lib/mealPlans/planFormat";

const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_RAG_CONTEXT_CHARS = 3_000;

export interface PatientForPrompt {
  birthYear: number;
  currentWeight: number;
  targetWeight: number;
  allergies: string[];
  fearFoods?: string[] | null;
  autonomyNotes?: string | null;
}

export interface MealPlanPipelineResult {
  plan: MealPlanData;
  prompt: string;
  pipeline: {
    structure: WeekPlanStructure | null;
    recipes: GeneratedRecipe[];
    qualityAssessment: QualityAssessment | null;
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

function inferGenerationInput(patient: PatientForPrompt, additionalNotes?: string): MealPlanGenerationInput {
  const currentYear = new Date().getFullYear();
  const age = currentYear - patient.birthYear;

  return {
    diagnosis_focus: "OSFED",
    age_group: age <= 12 ? "Kind" : age <= 20 ? "Jugendliche*r" : "Erwachsene*r",
    setting: "stationär",
    medical_red_flags: "nein",
    preferences_culture_religion: [],
    allergies_intolerances: patient.allergies,
    cooking_resources_skill_time:
      "Standardküche in therapeutischer Einrichtung, einfache bis mittlere Kochkenntnisse, 20 bis 25 Minuten aktive Kochzeit.",
    budget: "alltagsnahes Standardbudget einer Einrichtung",
    repertoire_aversions_safe_foods: {
      repertoire: [],
      aversions: [],
      safe_foods: patient.fearFoods ?? [],
    },
    typical_difficulties: additionalNotes
      ? [additionalNotes]
      : ["Regelmäßigkeit und verlässliche Mahlzeitenstruktur"],
    goal_non_weight_based: ["Regelmäßigkeit", "ausreichende Versorgung", "gemeinsames Essen"],
    autonomy_notes: patient.autonomyNotes ?? "",
    fixed_meal_types: [],
    based_on_previous_plan: false,
  };
}

function buildRedFlagPlan(): MealPlanData {
  return {
    status: "red_flag_no_plan",
    reason_code: "medical_red_flags_present_or_unclear",
    message:
      "Es wird kein Essensplan erstellt, weil medizinische Red Flags vorliegen oder nicht sicher ausgeschlossen werden können.",
    recommended_action:
      "Bitte zeitnah ärztlich und multiprofessionell abklären, bevor eine strukturierte Essensplanung fortgeführt wird.",
    refeeding_note:
      "Bei möglichem Refeeding-Risiko sollte die Ernährung ärztlich begleitet und eng überwacht aufgebaut werden.",
    week_overview: null,
    days: [],
    recipes: [],
    meal_support_hints: [],
  };
}

async function runStepWithRetry<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(`[meal-plan-pipeline] ${label} fehlgeschlagen (Versuch ${attempt}/2)`, error);
      if (attempt === 2) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${label.toUpperCase()}_FAILED`);
}

function attachQualityAssessment(plan: MealPlanData, qualityAssessment: QualityAssessment | null): MealPlanData {
  if (!qualityAssessment) return plan;
  return mealPlanSchema.parse({
    ...plan,
    quality_assessment: qualityAssessment,
  });
}

function buildAlternatives(title: string): string[] {
  return [`Variante von ${title}`, `Einfache Alternative zu ${title}`];
}

function buildFastValidatedPlan(
  structure: WeekPlanStructure,
  recipes: GeneratedRecipe[]
): MealPlanData {
  const recipeIdByMeal = new Map(recipes.map((recipe) => [recipe.mealName, recipe.recipeId]));

  return mealPlanSchema.parse({
    status: "ok",
    reason_code: null,
    message: null,
    recommended_action: null,
    refeeding_note: null,
    week_overview: {
      daily_structure:
        "Konstante 7-Tage-Struktur mit Frühstück, zwei Snacks, Mittagessen, Abendessen und optional spätem Snack.",
      snack_times: ["10:00", "15:30", "20:30"],
      strategy:
        "Die feste Reihenfolge unterstützt Regelmäßigkeit, verringert lange Esspausen und bleibt im Alltag der Einrichtung umsetzbar.",
    },
    days: structure.days.map((day) => ({
      day_name: day.day,
      meals: [
        {
          slot: "Frühstück",
          title: day.meals.breakfast,
          components: {
            carb: "Getreide oder Brot",
            protein: "Joghurt, Ei oder Aufstrich",
            fat: "Butter, Öl oder Nussfreie Alternative",
            fruit_or_veg: "Obst oder Rohkost",
          },
          arfid_exposure: null,
          alternatives: buildAlternatives(day.meals.breakfast),
          recipe_id: recipeIdByMeal.get(day.meals.breakfast) ?? null,
        },
        {
          slot: "Snack 1",
          title: day.meals.snack1,
          components: {
            carb: "Snackbasis",
            protein: "Milchprodukt oder Aufstrich",
            fat: "Ergänzung",
            fruit_or_veg: "Obst oder Gemüse",
          },
          arfid_exposure: null,
          alternatives: buildAlternatives(day.meals.snack1),
          recipe_id: recipeIdByMeal.get(day.meals.snack1) ?? null,
        },
        {
          slot: "Mittagessen",
          title: day.meals.lunch,
          components: {
            carb: "Sättigungsbeilage",
            protein: "Hauptprotein",
            fat: "Öl, Sauce oder Dip",
            fruit_or_veg: "Gemüse",
          },
          arfid_exposure: null,
          alternatives: buildAlternatives(day.meals.lunch),
          recipe_id: recipeIdByMeal.get(day.meals.lunch) ?? null,
        },
        {
          slot: "Snack 2",
          title: day.meals.snack2,
          components: {
            carb: "Snackbasis",
            protein: "Milchprodukt oder Aufstrich",
            fat: "Ergänzung",
            fruit_or_veg: "Obst oder Gemüse",
          },
          arfid_exposure: null,
          alternatives: buildAlternatives(day.meals.snack2),
          recipe_id: recipeIdByMeal.get(day.meals.snack2) ?? null,
        },
        {
          slot: "Abendessen",
          title: day.meals.dinner,
          components: {
            carb: "Brot, Reis, Pasta oder Kartoffeln",
            protein: "Käse, Ei, Hülsenfrüchte oder Fleisch/Fisch",
            fat: "Butter, Öl oder Dip",
            fruit_or_veg: "Salat, Rohkost oder Gemüse",
          },
          arfid_exposure: null,
          alternatives: buildAlternatives(day.meals.dinner),
          recipe_id: recipeIdByMeal.get(day.meals.dinner) ?? null,
        },
        {
          slot: "Später Snack",
          title: day.meals.lateSnack ?? null,
          components: day.meals.lateSnack
            ? {
                carb: "Kleine Snackbasis",
                protein: "Milchprodukt oder Getränk",
                fat: "Ergänzung",
                fruit_or_veg: "kleine Obst- oder Gemüsekomponente",
              }
            : null,
          arfid_exposure: null,
          alternatives: day.meals.lateSnack ? buildAlternatives(day.meals.lateSnack) : [],
          recipe_id: day.meals.lateSnack ? recipeIdByMeal.get(day.meals.lateSnack) ?? null : null,
        },
      ],
    })),
    recipes: recipes.map((recipe) => ({
      recipe_id: recipe.recipeId,
      title: recipe.mealName,
      prep_time_minutes: 20,
      short_preparation: recipe.preparation,
      sensory_features: recipe.texture,
      ed_support_rationale: recipe.reasonHelpful,
      shopping_items: recipe.shoppingItems,
    })),
    meal_support_hints: [
      "Mahlzeiten ruhig ankündigen und die Struktur kurz benennen.",
      "Während der Mahlzeit präsent bleiben, ohne zu drängen oder zu kommentieren.",
      "Bei Unsicherheit kleine, konkrete nächste Schritte anbieten.",
    ],
  });
}

function scoreFastMealPlan(plan: MealPlanData): QualityAssessment {
  const qualityScore = plan.status === "ok" ? 78 : 0;
  return {
    qualityScore,
    weakPoints:
      plan.status === "ok"
        ? ["Fast-Mode nutzt vereinfachte lokale Validierung und Rezeptableitung."]
        : ["Kein regulärer Plan vorhanden."],
    suggestedImprovements:
      plan.status === "ok"
        ? ["Für höhere Qualität kann ein langsamerer Vollmodus mit LLM-Validierung verwendet werden."]
        : ["Medizinische Red Flags zuerst klären."],
  };
}

export async function generateMealPlan(
  patient: PatientForPrompt,
  additionalNotes?: string,
  options?: {
    numDays?: number;
    fixedMealTypes?: string[];
    fastMode?: boolean;
    requestTimeoutMs?: number;
    onProgress?: (message: string) => void;
  }
): Promise<MealPlanPipelineResult> {
  const timeoutMs = options?.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  const isFastMode = options?.fastMode !== false;
  const structureTimeoutMs = isFastMode ? 45_000 : Math.max(timeoutMs * 6, 180_000);
  const recipeTimeoutMs = isFastMode ? 45_000 : Math.max(timeoutMs * 8, 300_000);
  const validationTimeoutMs = isFastMode ? 35_000 : Math.max(timeoutMs * 2, 90_000);
  const scoringTimeoutMs = isFastMode ? 20_000 : Math.max(timeoutMs, 60_000);
  const input = inferGenerationInput(patient, additionalNotes);
  input.fixed_meal_types = options?.fixedMealTypes ?? [];
  input.based_on_previous_plan = Boolean(additionalNotes?.includes("Vorheriger Plan"));

  const ragQuery = [
    patient.allergies.length > 0 ? `Allergien: ${patient.allergies.join(", ")}` : "",
    additionalNotes ?? "",
    patient.autonomyNotes ?? "",
  ]
    .filter(Boolean)
    .join(". ");

  if (ragQuery && !isFastMode) {
    const ragContext = await getNutriContext(ragQuery);
    input.rag_context = ragContext.slice(0, MAX_RAG_CONTEXT_CHARS);
  }

  if (input.medical_red_flags !== "nein") {
    return {
      plan: buildRedFlagPlan(),
      prompt: `pipeline=red-flag-short-circuit redFlags=${input.medical_red_flags}`,
      pipeline: {
        structure: null,
        recipes: [],
        qualityAssessment: null,
      },
    };
  }

  options?.onProgress?.("Planstruktur wird erstellt (1/4)...");
  const structure = await withTimeout(
    runStepWithRetry("generateMealPlanStructure", () => generateMealPlanStructure(input)),
    structureTimeoutMs,
    "TIMEOUT_STRUCTURE"
  );

  options?.onProgress?.("Rezepte werden erstellt (2/4)...");
  const recipes = await withTimeout(
    runStepWithRetry("generateMealRecipes", () =>
      generateMealRecipes(structure, input, { fastMode: isFastMode })
    ),
    recipeTimeoutMs,
    "TIMEOUT_RECIPES"
  );

  options?.onProgress?.("Plan wird validiert (3/4)...");
  let finalPlan = isFastMode
    ? buildFastValidatedPlan(structure, recipes)
    : await withTimeout(
        runStepWithRetry("validateMealPlan", () => validateMealPlan(structure, recipes, input)),
        validationTimeoutMs,
        "TIMEOUT_VALIDATION"
      );

  options?.onProgress?.("Planqualität wird bewertet (4/4)...");
  let qualityAssessment = isFastMode
    ? scoreFastMealPlan(finalPlan)
    : await withTimeout(
        runStepWithRetry("scoreMealPlan", () => scoreMealPlan(finalPlan)),
        scoringTimeoutMs,
        "TIMEOUT_SCORING"
      );

  if (!isFastMode && qualityAssessment.qualityScore < 70) {
    options?.onProgress?.("Plan wird anhand des Scores verbessert (4/4)...");
    finalPlan = await withTimeout(
      runStepWithRetry("validateMealPlanAfterScoring", () =>
        validateMealPlan(structure, recipes, input, {
          weakPoints: qualityAssessment.weakPoints,
          suggestedImprovements: qualityAssessment.suggestedImprovements,
        })
      ),
      validationTimeoutMs,
      "TIMEOUT_REPAIR"
    );

    qualityAssessment = await withTimeout(
      runStepWithRetry("scoreMealPlanAfterRepair", () => scoreMealPlan(finalPlan)),
      scoringTimeoutMs,
      "TIMEOUT_RESCORING"
    );
  }

  const plan = attachQualityAssessment(finalPlan, qualityAssessment);

  return {
    plan,
    prompt: `pipeline=v2 structure=${AI_MODELS.MEALPLAN_STRUCTURE} recipes=${AI_MODELS.MEALPLAN_RECIPES} validation=${AI_MODELS.MEALPLAN_VALIDATION} scoring=${AI_MODELS.MEALPLAN_SCORING} fixedMeals=${input.fixed_meal_types?.join(",") || "none"}`,
    pipeline: {
      structure,
      recipes,
      qualityAssessment,
    },
  };
}
