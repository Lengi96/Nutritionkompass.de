import type { PatientResource, Reference } from "../types";
import { FHIR_SYSTEMS } from "../codes";

interface MapPatientInput {
  id: string;
  pseudonym: string;
  organizationId: string;
}

interface MapPatientOptions {
  includePseudonymName?: boolean;
}

export function getPatientReference(patientId: string): Reference {
  return { reference: `Patient/${patientId}` };
}

export function mapPatientToFhir(
  patient: MapPatientInput,
  options: MapPatientOptions = {}
): PatientResource {
  return {
    resourceType: "Patient",
    id: patient.id,
    identifier: [
      {
        system: FHIR_SYSTEMS.patientIdentifier,
        value: patient.id,
      },
    ],
    ...(options.includePseudonymName
      ? {
          name: [
            {
              text: patient.pseudonym,
            },
          ],
        }
      : {}),
    managingOrganization: {
      reference: `Organization/${patient.organizationId}`,
    },
  };
}
