import assert from "node:assert/strict";
import {
  agentPlanSchema,
  agentCommitInputSchema,
  proposedActionSchema,
} from "@/lib/agent/schemas";

function run() {
  const validAction = {
    type: "WEIGHT_ADD",
    data: {
      patient: { by: "pseudonym", value: "Morgenstern" },
      weightKg: 52.4,
      date: "2026-03-05",
    },
  } as const;

  assert.equal(proposedActionSchema.safeParse(validAction).success, true);

  const invalidWeight = {
    type: "WEIGHT_ADD",
    data: {
      patient: { by: "pseudonym", value: "Morgenstern" },
      weightKg: 5,
      date: "2026-03-05",
    },
  };
  assert.equal(proposedActionSchema.safeParse(invalidWeight).success, false);

  const invalidDate = {
    type: "MEALPLAN_DRAFT_CREATE",
    data: {
      patient: { by: "id", value: "pat-1" },
      weekStart: "05.03.2026",
    },
  };
  assert.equal(proposedActionSchema.safeParse(invalidDate).success, false);

  const validPlan = {
    intentSummary: "Gewicht nachtragen",
    questions: [],
    proposedActions: [validAction],
  };
  assert.equal(agentPlanSchema.safeParse(validPlan).success, true);

  const validCommit = {
    intentSummary: "Commit Test",
    proposedActions: [validAction],
  };
  assert.equal(agentCommitInputSchema.safeParse(validCommit).success, true);
}

run();
console.log("Agent schema tests passed.");
