export type FhirResourceType =
  | "Patient"
  | "Observation"
  | "CarePlan"
  | "DocumentReference"
  | "Bundle";

export interface Identifier {
  system?: string;
  value?: string;
}

export interface Reference {
  reference: string;
  display?: string;
}

export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Quantity {
  value?: number;
  unit?: string;
  system?: string;
  code?: string;
}

export interface HumanName {
  text?: string;
}

interface ResourceBase {
  resourceType: FhirResourceType;
  id?: string;
}

export interface PatientResource extends ResourceBase {
  resourceType: "Patient";
  identifier?: Identifier[];
  name?: HumanName[];
  managingOrganization?: Reference;
}

export interface ObservationResource extends ResourceBase {
  resourceType: "Observation";
  status: "final";
  code: CodeableConcept;
  subject: Reference;
  effectiveDateTime: string;
  valueQuantity: Quantity;
}

export interface CarePlanActivityDetail {
  description?: string;
}

export interface CarePlanActivity {
  detail?: CarePlanActivityDetail;
}

export interface CarePlanResource extends ResourceBase {
  resourceType: "CarePlan";
  status: "active";
  intent: "plan";
  subject: Reference;
  period?: {
    start?: string;
    end?: string;
  };
  activity?: CarePlanActivity[];
}

export interface Attachment {
  contentType?: string;
  data?: string;
  title?: string;
}

export interface DocumentReferenceContent {
  attachment: Attachment;
}

export interface DocumentReferenceResource extends ResourceBase {
  resourceType: "DocumentReference";
  status: "current";
  type?: CodeableConcept;
  subject: Reference;
  date?: string;
  description?: string;
  content: DocumentReferenceContent[];
}

export type FhirResource =
  | PatientResource
  | ObservationResource
  | CarePlanResource
  | DocumentReferenceResource;

export interface BundleEntry {
  fullUrl?: string;
  resource: FhirResource;
}

export interface BundleResource extends ResourceBase {
  resourceType: "Bundle";
  type: "collection";
  entry: BundleEntry[];
}
