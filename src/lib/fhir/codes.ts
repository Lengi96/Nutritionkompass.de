import type { CodeableConcept } from "./types";

export const FHIR_SYSTEMS = {
  loinc: "http://loinc.org",
  ucum: "http://unitsofmeasure.org",
  sct: "http://snomed.info/sct",
  patientIdentifier: "https://mein-nutrikompass.de/patient",
} as const;

export const BODY_WEIGHT_CODE: CodeableConcept = {
  coding: [
    {
      system: FHIR_SYSTEMS.loinc,
      code: "29463-7",
      display: "Body weight",
    },
  ],
  text: "Körpergewicht",
};

export const MEAL_PLAN_DOCUMENT_CODE: CodeableConcept = {
  coding: [
    {
      system: FHIR_SYSTEMS.sct,
      code: "371531000",
      display: "Diet plan",
    },
  ],
  text: "Ernährungsplan",
};

export const SHOPPING_LIST_DOCUMENT_CODE: CodeableConcept = {
  text: "Einkaufsliste",
};
