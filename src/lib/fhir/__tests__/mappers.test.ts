import assert from "node:assert/strict";
import { mapPatientToFhir } from "@/lib/fhir/mappers/patient.mapper";
import { mapWeightEntryToObservation } from "@/lib/fhir/mappers/weightObservation.mapper";
import { mapMealPlanToDocumentReference } from "@/lib/fhir/mappers/mealPlan.mapper";
import { buildCollectionBundle } from "@/lib/fhir/bundle";

function run() {
  const patient = mapPatientToFhir({
    id: "pat-001",
    pseudonym: "PSEUDO-ALPHA",
    organizationId: "org-1",
  });
  assert.equal(patient.resourceType, "Patient");
  assert.equal(patient.id, "pat-001");
  assert.equal(patient.identifier?.[0]?.value, "pat-001");
  assert.equal(patient.name, undefined);

  const observation = mapWeightEntryToObservation({
    id: "w-1",
    patientId: "pat-1",
    weightKg: 63.4,
    recordedAt: new Date("2026-01-15T09:30:00.000Z"),
  });
  assert.equal(observation.resourceType, "Observation");
  assert.equal(observation.valueQuantity.value, 63.4);
  assert.equal(observation.valueQuantity.code, "kg");
  assert.equal(observation.code.coding?.[0]?.code, "29463-7");
  assert.equal(observation.subject.reference, "Patient/pat-1");

  const mealDoc = mapMealPlanToDocumentReference({
    id: "plan-2",
    patientId: "pat-2",
    weekStart: new Date("2026-02-02T00:00:00.000Z"),
    planJson: { days: [] },
  });

  const bundle = buildCollectionBundle([patient, mealDoc]);
  assert.equal(bundle.resourceType, "Bundle");
  assert.equal(bundle.type, "collection");
  assert.equal(bundle.entry.length, 2);
  assert.equal(bundle.entry[0]?.fullUrl, "Patient/pat-001");
  assert.equal(bundle.entry[1]?.resource.resourceType, "DocumentReference");
}

run();
console.log("FHIR mapper tests passed.");
