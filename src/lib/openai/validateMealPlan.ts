import {
  AI_MODELS,
  createJsonChatCompletion,
  parseJsonResponse,
  type MealPlanGenerationInput,
} from "./models";
import type { WeekPlanStructure } from "./generateMealPlanStructure";
import type { GeneratedRecipe } from "./generateMealRecipes";
import { mealPlanSchema, type MealPlanData } from "@/lib/mealPlans/planFormat";

const validatedPlanSchema = mealPlanSchema.refine((plan) => plan.status === "ok", {
  message: "Expected a validated regular meal plan.",
});

export async function validateMealPlan(
  structure: WeekPlanStructure,
  recipes: GeneratedRecipe[],
  input: MealPlanGenerationInput,
  qualityFeedback?: {
    weakPoints: string[];
    suggestedImprovements: string[];
  }
): Promise<MealPlanData> {
  const system = `Du validierst und reparierst einen Wochen-Essensplan für essstörungssensible therapeutische Nutzung.
Gib nur JSON zurück.
Prüfe und korrigiere knapp:
- vollständige Tagesstruktur
- kein identisches Frühstück an zwei Folgetagen
- Proteinrotation
- mindestens drei Küchenstile
- keine triggernden oder diätbezogenen Formulierungen
- Rezepte realistisch und einfach

Gib das finale Ergebnis im finalen MealPlan-Format zurück:
- status = ok
- week_overview
- days mit Slots Frühstück, Snack 1, Mittagessen, Snack 2, Abendessen, Später Snack
- recipes
- meal_support_hints
- optional quality_assessment nicht befüllen`;

  const compactInput = {
    diagnosis_focus: input.diagnosis_focus,
    age_group: input.age_group,
    setting: input.setting,
    allergies_intolerances: input.allergies_intolerances,
    typical_difficulties: input.typical_difficulties,
    goal_non_weight_based: input.goal_non_weight_based,
  };

  const user = `Parameter:
${JSON.stringify(compactInput)}

Wochenstruktur:
${JSON.stringify(structure)}

Rezepte:
${JSON.stringify(recipes)}

${qualityFeedback ? `Verbesserungshinweise aus dem Scoring:
${JSON.stringify(qualityFeedback)}` : ""}

Erstelle daraus den finalen, validierten MealPlan als JSON.`;

  const content = await createJsonChatCompletion(
    AI_MODELS.MEALPLAN_VALIDATION,
    system,
    user,
    2400
  );

  return validatedPlanSchema.parse(parseJsonResponse(content));
}
