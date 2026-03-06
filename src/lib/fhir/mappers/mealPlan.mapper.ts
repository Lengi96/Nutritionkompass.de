import {
  MEAL_PLAN_DOCUMENT_CODE,
  SHOPPING_LIST_DOCUMENT_CODE,
} from "../codes";
import type { DocumentReferenceResource } from "../types";
import { getPatientReference } from "./patient.mapper";

interface MapMealPlanInput {
  id: string;
  patientId: string;
  weekStart: Date;
  planJson: unknown;
}

interface MapShoppingListInput {
  id: string;
  patientId: string;
  createdAt: Date;
  itemsJson: unknown;
}

function encodeJsonPayload(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function mapMealPlanToDocumentReference(
  mealPlan: MapMealPlanInput
): DocumentReferenceResource {
  return {
    resourceType: "DocumentReference",
    id: `mealplan-${mealPlan.id}`,
    status: "current",
    type: MEAL_PLAN_DOCUMENT_CODE,
    subject: getPatientReference(mealPlan.patientId),
    date: mealPlan.weekStart.toISOString(),
    description: "Exportierter Ernährungsplan (JSON)",
    content: [
      {
        attachment: {
          contentType: "application/json",
          title: `meal-plan-${mealPlan.id}.json`,
          data: encodeJsonPayload(mealPlan.planJson),
        },
      },
    ],
  };
}

export function mapShoppingListToDocumentReference(
  shoppingList: MapShoppingListInput
): DocumentReferenceResource {
  return {
    resourceType: "DocumentReference",
    id: `shoppinglist-${shoppingList.id}`,
    status: "current",
    type: SHOPPING_LIST_DOCUMENT_CODE,
    subject: getPatientReference(shoppingList.patientId),
    date: shoppingList.createdAt.toISOString(),
    description: "Exportierte Einkaufsliste (JSON)",
    content: [
      {
        attachment: {
          contentType: "application/json",
          title: `shopping-list-${shoppingList.id}.json`,
          data: encodeJsonPayload(shoppingList.itemsJson),
        },
      },
    ],
  };
}
