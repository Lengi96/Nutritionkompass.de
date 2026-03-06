import { z } from "zod";
import {
  AI_MODELS,
  createJsonChatCompletion,
  parseJsonResponse,
  type MealPlanGenerationInput,
} from "./models";

const structureDaySchema = z.object({
  day: z.enum([
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
    "Samstag",
    "Sonntag",
  ]),
  meals: z.object({
    breakfast: z.string(),
    snack1: z.string(),
    lunch: z.string(),
    snack2: z.string(),
    dinner: z.string(),
    lateSnack: z.string().nullable().optional(),
  }),
});

export const weekPlanStructureSchema = z.object({
  days: z.array(structureDaySchema).length(7),
});

export type WeekPlanStructure = z.infer<typeof weekPlanStructureSchema>;

export async function generateMealPlanStructure(
  input: MealPlanGenerationInput
): Promise<WeekPlanStructure> {
  const compactInput = {
    diagnosis_focus: input.diagnosis_focus,
    age_group: input.age_group,
    setting: input.setting,
    allergies_intolerances: input.allergies_intolerances,
    safe_foods: input.repertoire_aversions_safe_foods.safe_foods,
    typical_difficulties: input.typical_difficulties,
    goal_non_weight_based: input.goal_non_weight_based,
    fixed_meal_types: input.fixed_meal_types ?? [],
  };

  const system = `Du erstellst ausschließlich die kompakte Wochenstruktur für einen essstörungssensiblen Essensplan.
Gib nur JSON zurück.
Regeln:
- genau 7 Tage Montag bis Sonntag
- pro Tag breakfast, snack1, lunch, snack2, dinner und optional lateSnack
- keine Rezepte
- keine Kalorien
- keine moralische Sprache
- kurze konkrete Gerichtsnamen
- sichere, alltagsnahe Mahlzeiten für therapeutische Einrichtungen
- kein identisches Frühstück an zwei aufeinanderfolgenden Tagen
- Proteinquellen rotieren
- mindestens drei Küchenstile über die Woche
- wenn fixed_meal_types gesetzt sind, halte diese Mahlzeitentypen über alle Tage möglichst konsistent
${input.rag_context ? `- beachte den Fachkontext:\n${input.rag_context}` : ""}`;

  const user = `Erzeuge die Wochenstruktur für:
${JSON.stringify(compactInput)}

Ausgabeformat:
{
  "days": [
    {
      "day": "Montag",
      "meals": {
        "breakfast": "string",
        "snack1": "string",
        "lunch": "string",
        "snack2": "string",
        "dinner": "string",
        "lateSnack": "string|null"
      }
    }
  ]
}`;

  const content = await createJsonChatCompletion(
    AI_MODELS.MEALPLAN_STRUCTURE,
    system,
    user,
    900
  );

  return weekPlanStructureSchema.parse(parseJsonResponse(content));
}
