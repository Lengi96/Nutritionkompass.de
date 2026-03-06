import { z } from "zod";
import {
  AI_MODELS,
  createJsonChatCompletion,
  parseJsonResponse,
} from "./models";
import type { MealPlanData } from "@/lib/mealPlans/planFormat";

export const mealPlanScoreSchema = z.object({
  qualityScore: z.number().int().min(0).max(100),
  weakPoints: z.array(z.string()),
  suggestedImprovements: z.array(z.string()),
});

export type MealPlanScore = z.infer<typeof mealPlanScoreSchema>;

export async function scoreMealPlan(plan: MealPlanData): Promise<MealPlanScore> {
  const system = `Du bewertest die Qualität eines finalen Wochen-Essensplans.
Gib nur JSON zurück.
Bewerte knapp:
- Struktur
- Varianz
- Ernährungsbalance
- Essstörungssensibilität
- Rezeptqualität
Gib nur einen Gesamtwert 0 bis 100 sowie kurze weakPoints und suggestedImprovements.`;

  const user = `Bewerte diesen finalen MealPlan:
${JSON.stringify(plan)}

Ausgabeformat:
{
  "qualityScore": 87,
  "weakPoints": ["string"],
  "suggestedImprovements": ["string"]
}`;

  const content = await createJsonChatCompletion(
    AI_MODELS.MEALPLAN_SCORING,
    system,
    user,
    700
  );

  return mealPlanScoreSchema.parse(parseJsonResponse(content));
}
