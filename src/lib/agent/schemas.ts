import { z } from "zod";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const patientRefSchema = z
  .discriminatedUnion("by", [
    z
      .object({
        by: z.literal("id"),
        value: z.string().min(1).max(100),
      })
      .strict(),
    z
      .object({
        by: z.literal("pseudonym"),
        value: z.string().min(2).max(100),
      })
      .strict(),
  ]);

export const patientCreateActionSchema = z
  .object({
    type: z.literal("PATIENT_CREATE"),
    data: z
      .object({
        pseudonym: z.string().min(2).max(50),
        birthYear: z.number().int().min(1990).max(2015),
        currentWeight: z.number().min(20).max(300),
        targetWeight: z.number().min(20).max(300),
        targetDate: z.string().regex(ISO_DATE_RE).optional(),
        allergies: z.array(z.string().min(1).max(100)).max(30).optional(),
        fearFoods: z.array(z.string().min(1).max(100)).max(50).optional(),
        notes: z.string().max(2000).optional(),
      })
      .strict(),
  })
  .strict();

export const weightAddActionSchema = z
  .object({
    type: z.literal("WEIGHT_ADD"),
    data: z
      .object({
        patient: patientRefSchema,
        weightKg: z.number().min(20).max(300),
        date: z.string().regex(ISO_DATE_RE),
      })
      .strict(),
  })
  .strict();

export const mealPlanDraftCreateActionSchema = z
  .object({
    type: z.literal("MEALPLAN_DRAFT_CREATE"),
    data: z
      .object({
        patient: patientRefSchema,
        weekStart: z.string().regex(ISO_DATE_RE),
        notes: z.string().max(2000).optional(),
      })
      .strict(),
  })
  .strict();

export const proposedActionSchema = z
  .union([
    patientCreateActionSchema,
    weightAddActionSchema,
    mealPlanDraftCreateActionSchema,
  ]);

export const agentPlanSchema = z
  .object({
    intentSummary: z.string().min(1).max(500),
    questions: z.array(z.string().min(1).max(300)).max(10),
    proposedActions: z.array(proposedActionSchema).max(10),
  })
  .strict();

export const agentPlanRequestSchema = z
  .object({
    message: z.string().min(1).max(2000),
  })
  .strict();

export const agentCommitInputSchema = z
  .object({
    intentSummary: z.string().min(1).max(500).optional(),
    proposedActions: z.array(proposedActionSchema).min(1).max(10),
  })
  .strict();

export const agentPreviewInputSchema = z
  .object({
    proposedActions: z.array(proposedActionSchema).min(1).max(10),
  })
  .strict();

export type AgentPlanInput = z.infer<typeof agentPlanRequestSchema>;
export type AgentCommitInput = z.infer<typeof agentCommitInputSchema>;
export type AgentPreviewInput = z.infer<typeof agentPreviewInputSchema>;
