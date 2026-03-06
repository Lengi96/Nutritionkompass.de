require("dotenv").config({ path: ".env" });

import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { generateMealPlan } from "../../src/lib/openai/nutritionPrompt";
import {
  BENCHMARK_SCENARIOS,
  JUDGE_SYSTEM_PROMPT,
  JUDGE_USER_PROMPT_TEMPLATE,
} from "../../src/prompts/configs";
import type { MealPlanData } from "../../src/lib/openai/nutritionPrompt";
import { getRecipeById, isOkMealPlan } from "../../src/lib/mealPlans/planFormat";

const ACCURACY_THRESHOLD = 0.9;
const JUDGE_MODEL = "gpt-4o";
const NUM_DAYS = 7;

const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const JudgeResponseSchema = z.object({
  medicalScore: z.number().min(1).max(10),
  complianceScore: z.number().min(1).max(10),
  toneScore: z.number().min(1).max(10),
  overallScore: z.number().min(1).max(10),
  reasoning: z.string(),
  concerns: z.array(z.string()),
});

type JudgeResponse = z.infer<typeof JudgeResponseSchema>;

interface ScenarioResult {
  id: string;
  name: string;
  passed: boolean;
  hardConstraint: boolean;
  violations: string[];
  judgeScore: number | null;
  judgeReasoning: string;
  concerns: string[];
  durationMs: number;
}

async function runJudge(
  scenarioName: string,
  patientContext: string,
  plan: MealPlanData
): Promise<JudgeResponse | null> {
  const planSummary = !isOkMealPlan(plan)
    ? `${plan.message}\n${plan.recommended_action}\n${plan.refeeding_note}`
    : plan.days
        .slice(0, 3)
        .map((day) => {
          const meals = day.meals
            .filter((meal) => Boolean(meal.title))
            .map((meal) => {
              const recipe = getRecipeById(plan, meal.recipe_id);
              return `  ${meal.slot}: ${meal.title} | ${recipe?.short_preparation ?? ""}`;
            })
            .join("\n");
          return `${day.day_name}:\n${meals}`;
        })
        .join("\n\n");

  try {
    const { object } = await generateObject({
      model: openaiProvider(JUDGE_MODEL),
      schema: JudgeResponseSchema,
      system: JUDGE_SYSTEM_PROMPT,
      prompt: JUDGE_USER_PROMPT_TEMPLATE(scenarioName, patientContext, planSummary),
      temperature: 0,
    });
    return object as JudgeResponse;
  } catch (err) {
    console.error(`  [Judge] Fehler: ${String(err)}`);
    return null;
  }
}

async function runScenario(
  scenario: (typeof BENCHMARK_SCENARIOS)[number]
): Promise<ScenarioResult> {
  const start = Date.now();
  const { patient, additionalNotes } = scenario;

  const patientContext = [
    `Geburtsjahr: ${patient.birthYear}`,
    `Gewicht: ${patient.currentWeight} kg -> Ziel: ${patient.targetWeight} kg`,
    `Allergien: ${patient.allergies.length > 0 ? patient.allergies.join(", ") : "keine"}`,
    additionalNotes ? `Hinweise: ${additionalNotes}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  let plan: MealPlanData;
  try {
    const result = await generateMealPlan(patient, additionalNotes, {
      numDays: NUM_DAYS,
      fastMode: true,
      requestTimeoutMs: 30_000,
    });
    plan = result.plan;
  } catch (err) {
    return {
      id: scenario.id,
      name: scenario.name,
      passed: false,
      hardConstraint: scenario.hardConstraint,
      violations: [`Generierungsfehler: ${String(err)}`],
      judgeScore: null,
      judgeReasoning: "Plan konnte nicht generiert werden.",
      concerns: [],
      durationMs: Date.now() - start,
    };
  }

  const { passed, violations } = scenario.validate(plan);
  const judgeResult = await runJudge(scenario.name, patientContext, plan);

  return {
    id: scenario.id,
    name: scenario.name,
    passed,
    hardConstraint: scenario.hardConstraint,
    violations,
    judgeScore: judgeResult?.overallScore ?? null,
    judgeReasoning: judgeResult?.reasoning ?? "-",
    concerns: judgeResult?.concerns ?? [],
    durationMs: Date.now() - start,
  };
}

function printReport(results: ScenarioResult[]) {
  const line = "-".repeat(70);
  console.log(`\n${line}`);
  console.log("  NUTRIKOMPASS AI BENCHMARK REPORT");
  console.log(line);

  for (const result of results) {
    const icon = result.passed ? "OK" : "FAIL";
    const judgeStr =
      result.judgeScore !== null ? `[Judge: ${result.judgeScore.toFixed(1)}/10]` : "[Judge: n/a]";
    const hardTag = result.hardConstraint ? " [HARD]" : "";
    const duration = `${(result.durationMs / 1000).toFixed(1)}s`;

    console.log(`\n${icon} ${result.name}${hardTag} ${judgeStr} (${duration})`);

    for (const violation of result.violations.slice(0, 5)) {
      console.log(`   ! ${violation}`);
    }

    if (result.judgeReasoning && result.judgeReasoning !== "-") {
      console.log(`   -> ${result.judgeReasoning}`);
    }

    for (const concern of result.concerns) {
      console.log(`   ! Concern: ${concern}`);
    }
  }

  console.log(`\n${line}`);
}

async function main() {
  console.log("Nutrikompass AI Benchmark\n");
  console.log(`Szenarien:  ${BENCHMARK_SCENARIOS.length}`);
  console.log(`Tage/Plan:  ${NUM_DAYS}`);
  console.log(`Judge:      ${JUDGE_MODEL}`);
  console.log(`Threshold:  ${(ACCURACY_THRESHOLD * 100).toFixed(0)}%\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.error("Fehler: OPENAI_API_KEY nicht gesetzt.");
    process.exit(1);
  }

  const results: ScenarioResult[] = [];
  for (const scenario of BENCHMARK_SCENARIOS) {
    process.stdout.write(`Starte: ${scenario.name}...`);
    const result = await runScenario(scenario);
    results.push(result);
    process.stdout.write(" fertig.\n");
  }

  printReport(results);

  const hardFailures = results.filter((result) => result.hardConstraint && !result.passed);
  const passedCount = results.filter((result) => result.passed).length;
  const accuracy = passedCount / Math.max(results.length, 1);

  if (hardFailures.length > 0 || accuracy < ACCURACY_THRESHOLD) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
