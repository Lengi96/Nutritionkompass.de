import { z } from "zod";

export const fhirExportInputSchema = z.object({
  patientId: z.string().min(1),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  includePseudonymName: z.boolean().optional().default(false),
  include: z.object({
    weight: z.boolean().default(true),
    mealPlans: z.boolean().default(true),
    shoppingLists: z.boolean().default(false),
  }),
});

export type FhirExportInput = z.infer<typeof fhirExportInputSchema>;
