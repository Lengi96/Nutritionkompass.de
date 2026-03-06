import { getOpenAIClient } from "./client";

export const AI_MODELS = {
  MEALPLAN_STRUCTURE:
    process.env.OPENAI_MODEL_MEALPLAN_STRUCTURE ?? "gpt-4o-mini",
  MEALPLAN_RECIPES:
    process.env.OPENAI_MODEL_MEALPLAN_RECIPES ?? "gpt-4o-mini",
  MEALPLAN_VALIDATION:
    process.env.OPENAI_MODEL_MEALPLAN_VALIDATION ?? "gpt-4o-mini",
  MEALPLAN_SCORING:
    process.env.OPENAI_MODEL_MEALPLAN_SCORING ?? "gpt-4o-mini",
} as const;

export type AIModelKey = keyof typeof AI_MODELS;

export interface MealPlanGenerationInput {
  diagnosis_focus: "AN" | "BN" | "BED" | "ARFID" | "OSFED";
  age_group: "Kind" | "Jugendliche*r" | "Erwachsene*r";
  setting: "ambulant" | "teilstationär" | "stationär" | "Nachsorge";
  medical_red_flags: "ja" | "nein" | "unklar";
  preferences_culture_religion: string[];
  allergies_intolerances: string[];
  cooking_resources_skill_time: string;
  budget: string;
  repertoire_aversions_safe_foods: {
    repertoire: string[];
    aversions: string[];
    safe_foods: string[];
  };
  typical_difficulties: string[];
  goal_non_weight_based: string[];
  autonomy_notes?: string;
  fixed_meal_types?: string[];
  based_on_previous_plan?: boolean;
  rag_context?: string;
}

export async function createJsonChatCompletion(
  model: string,
  system: string,
  user: string,
  maxCompletionTokens: number
): Promise<string> {
  const isGpt5Family = /^gpt-5/i.test(model);
  const request = (completionTokenBudget: number) =>
    getOpenAIClient().chat.completions.create(
      isGpt5Family
        ? {
            model,
            response_format: { type: "json_object" },
            max_completion_tokens: completionTokenBudget,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          }
        : {
            model,
            response_format: { type: "json_object" },
            max_tokens: completionTokenBudget,
            temperature: 0.2,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
          }
    );

  let completion = await request(maxCompletionTokens);
  let content = completion.choices[0]?.message?.content ?? "";

  if (!content && completion.choices[0]?.finish_reason === "length") {
    completion = await request(Math.max(maxCompletionTokens * 4, 8000));
    content = completion.choices[0]?.message?.content ?? "";
  }

  if (!content) {
    throw new Error(
      `EMPTY_MODEL_RESPONSE${completion.choices[0]?.finish_reason ? `:${completion.choices[0].finish_reason}` : ""}`
    );
  }

  return content;
}

export function parseJsonResponse(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    // noop
  }

  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1]);
  }

  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return JSON.parse(content.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("INVALID_JSON");
}
