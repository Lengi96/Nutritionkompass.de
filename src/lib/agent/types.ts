export type AgentActionType =
  | "PATIENT_CREATE"
  | "WEIGHT_ADD"
  | "MEALPLAN_DRAFT_CREATE";

export interface AgentPatientRefById {
  by: "id";
  value: string;
}

export interface AgentPatientRefByPseudonym {
  by: "pseudonym";
  value: string;
}

export type AgentPatientRef = AgentPatientRefById | AgentPatientRefByPseudonym;

export interface PatientCreateAction {
  type: "PATIENT_CREATE";
  data: {
    pseudonym: string;
    birthYear: number;
    currentWeight: number;
    targetWeight: number;
    targetDate?: string;
    allergies?: string[];
    fearFoods?: string[];
    notes?: string;
  };
}

export interface WeightAddAction {
  type: "WEIGHT_ADD";
  data: {
    patient: AgentPatientRef;
    weightKg: number;
    date: string;
  };
}

export interface MealPlanDraftCreateAction {
  type: "MEALPLAN_DRAFT_CREATE";
  data: {
    patient: AgentPatientRef;
    weekStart: string;
    notes?: string;
  };
}

export type AgentProposedAction =
  | PatientCreateAction
  | WeightAddAction
  | MealPlanDraftCreateAction;

export interface AgentPlan {
  intentSummary: string;
  questions: string[];
  proposedActions: AgentProposedAction[];
}

export interface AgentCommitResult {
  createdPatientIds: string[];
  createdWeightEntryIds: string[];
  createdMealPlanIds: string[];
  summary: string;
}
