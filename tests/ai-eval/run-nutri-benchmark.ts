/**
 * Nutrikompass AI Benchmark Runner
 *
 * Führt 5 kritische Testszenarien gegen den echten generateMealPlan()-Output aus.
 * Nutzt GPT-4o als LLM-as-a-Judge für medizinische Plausibilität und Tonfall.
 *
 * Exitcode 0 = alle Checks bestanden (accuracy ≥ 90%, keine hardConstraint-Verletzung)
 * Exitcode 1 = Quality Gate fehlgeschlagen → CI blockiert Deployment
 *
 * Lokal starten:
 *   npx tsx tests/ai-eval/run-nutri-benchmark.ts
 *
 * Erfordert:
 *   OPENAI_API_KEY, DATABASE_URL, DIRECT_URL in .env
 */

// .env für lokale Ausführung laden
// eslint-disable-next-line @typescript-eslint/no-require-imports
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

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

const ACCURACY_THRESHOLD = 0.9; // 90 % Mindest-Accuracy
const JUDGE_MODEL = "gpt-4o";    // Stärkeres Modell als Gutachter
const NUM_DAYS = 7;              // Vollständiger Wochenplan pro Szenario

// Vercel AI SDK OpenAI-Provider (zeigt provider-agnostische Kompetenz)
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// LLM-as-a-Judge
// ---------------------------------------------------------------------------

async function runJudge(
  scenarioName: string,
  patientContext: string,
  plan: MealPlanData
): Promise<JudgeResponse | null> {
  // Plan in kompakter, lesbarer Form zusammenfassen
  const planSummary = plan.days
    .slice(0, 3) // Nur 3 Tage für Judge (Kosten-/Zeitoptimierung)
    .map((day) => {
      const meals = day.meals
        .map((m) => `  ${m.mealType}: ${m.name} (${m.kcal} kcal, P:${m.protein}g, K:${m.carbs}g, F:${m.fat}g)`)
        .join("\n");
      return `${day.dayName}:\n${meals}`;
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
    return object as {
      medicalScore: number;
      complianceScore: number;
      toneScore: number;
      overallScore: number;
      reasoning: string;
      concerns: string[];
    };
  } catch (err) {
    console.error(`  [Judge] Fehler: ${String(err)}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Einzelnes Szenario ausführen
// ---------------------------------------------------------------------------

async function runScenario(
  scenario: (typeof BENCHMARK_SCENARIOS)[number]
): Promise<ScenarioResult> {
  const start = Date.now();
  const { patient, additionalNotes } = scenario;

  const patientContext = [
    `Geburtsjahr: ${patient.birthYear}`,
    `Gewicht: ${patient.currentWeight} kg → Ziel: ${patient.targetWeight} kg`,
    `Allergien: ${patient.allergies.length > 0 ? patient.allergies.join(", ") : "keine"}`,
    additionalNotes ? `Hinweise: ${additionalNotes}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  // 1. Mahlzeitplan generieren
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

  // 2. Constraint-Validierung
  const { passed, violations } = scenario.validate(plan);

  // 3. LLM-as-a-Judge (parallel zur Ergebnisauswertung)
  const judgeResult = await runJudge(scenario.name, patientContext, plan);

  return {
    id: scenario.id,
    name: scenario.name,
    passed,
    hardConstraint: scenario.hardConstraint,
    violations,
    judgeScore: judgeResult?.overallScore ?? null,
    judgeReasoning: judgeResult?.reasoning ?? "–",
    concerns: judgeResult?.concerns ?? [],
    durationMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// Report-Ausgabe
// ---------------------------------------------------------------------------

function printReport(results: ScenarioResult[]) {
  const LINE = "─".repeat(70);
  console.log("\n" + LINE);
  console.log("  NUTRIKOMPASS AI BENCHMARK REPORT");
  console.log(LINE);

  for (const r of results) {
    const icon = r.passed ? "✓" : "✗";
    const judgeStr =
      r.judgeScore !== null ? `[Judge: ${r.judgeScore.toFixed(1)}/10]` : "[Judge: n/a]";
    const hardTag = r.hardConstraint ? " [HARD]" : "";
    const duration = `${(r.durationMs / 1000).toFixed(1)}s`;

    console.log(
      `\n${icon} ${r.name}${hardTag}  ${judgeStr}  (${duration})`
    );

    if (!r.passed && r.violations.length > 0) {
      for (const v of r.violations.slice(0, 5)) {
        console.log(`   ⚠ ${v}`);
      }
      if (r.violations.length > 5) {
        console.log(`   ... und ${r.violations.length - 5} weitere`);
      }
    }

    if (r.judgeReasoning && r.judgeReasoning !== "–") {
      console.log(`   → ${r.judgeReasoning}`);
    }

    if (r.concerns.length > 0) {
      for (const c of r.concerns) {
        console.log(`   ⚠ Concern: ${c}`);
      }
    }
  }

  console.log("\n" + LINE);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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

  // Szenarien sequentiell ausführen (Rate Limit schonen)
  for (const scenario of BENCHMARK_SCENARIOS) {
    process.stdout.write(`Starte: ${scenario.name}...`);
    const result = await runScenario(scenario);
    results.push(result);
    process.stdout.write(
      ` ${result.passed ? "✓" : "✗"} (${(result.durationMs / 1000).toFixed(1)}s)\n`
    );
  }

  // Report ausgeben
  printReport(results);

  // Quality Gate auswerten
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const accuracy = passedCount / totalCount;
  const hardViolations = results.filter(
    (r) => r.hardConstraint && !r.passed
  );

  console.log(`\nAccuracy:   ${passedCount}/${totalCount} (${(accuracy * 100).toFixed(0)}%)`);
  console.log(`Threshold:  ${(ACCURACY_THRESHOLD * 100).toFixed(0)}%`);

  if (hardViolations.length > 0) {
    console.log("\n🚨 HARD CONSTRAINT VERLETZUNG:");
    for (const r of hardViolations) {
      console.log(`   ${r.name}: ${r.violations.join(", ")}`);
    }
    console.log(
      "\n❌ CI FEHLGESCHLAGEN: Sicherheitskritische Constraint-Verletzung."
    );
    process.exit(1);
  }

  if (accuracy < ACCURACY_THRESHOLD) {
    console.log(
      `\n❌ CI FEHLGESCHLAGEN: Accuracy ${(accuracy * 100).toFixed(0)}% < ${(ACCURACY_THRESHOLD * 100).toFixed(0)}% Mindest-Schwelle.`
    );
    process.exit(1);
  }

  console.log(`\n✅ QUALITY GATE BESTANDEN (${(accuracy * 100).toFixed(0)}%)`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\nUnerwarteter Fehler:", err);
  process.exit(1);
});
