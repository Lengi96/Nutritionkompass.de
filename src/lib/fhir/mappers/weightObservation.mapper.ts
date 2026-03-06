import { BODY_WEIGHT_CODE, FHIR_SYSTEMS } from "../codes";
import type { ObservationResource } from "../types";
import { getPatientReference } from "./patient.mapper";

interface MapWeightEntryInput {
  id: string;
  patientId: string;
  weightKg: number;
  recordedAt: Date;
}

export function mapWeightEntryToObservation(
  entry: MapWeightEntryInput
): ObservationResource {
  return {
    resourceType: "Observation",
    id: entry.id,
    status: "final",
    code: BODY_WEIGHT_CODE,
    subject: getPatientReference(entry.patientId),
    effectiveDateTime: entry.recordedAt.toISOString(),
    valueQuantity: {
      value: entry.weightKg,
      unit: "kg",
      system: FHIR_SYSTEMS.ucum,
      code: "kg",
    },
  };
}
