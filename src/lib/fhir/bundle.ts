import type { BundleResource, FhirResource } from "./types";

function getResourceFullUrl(resource: FhirResource): string | undefined {
  if (!resource.id) {
    return undefined;
  }

  return `${resource.resourceType}/${resource.id}`;
}

export function buildCollectionBundle(resources: FhirResource[]): BundleResource {
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: resources.map((resource) => ({
      fullUrl: getResourceFullUrl(resource),
      resource,
    })),
  };
}
