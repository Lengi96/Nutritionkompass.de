import { router } from "../init";
import { patientsRouter } from "./patients";
import { mealPlansRouter } from "./mealPlans";
import { shoppingListRouter } from "./shoppingList";
import { organizationRouter } from "./organization";
import { authRouter } from "./auth";
import { billingRouter } from "./billing";
import { staffRouter } from "./staff";

export const appRouter = router({
  auth: authRouter,
  patients: patientsRouter,
  mealPlans: mealPlansRouter,
  shoppingList: shoppingListRouter,
  organization: organizationRouter,
  billing: billingRouter,
  staff: staffRouter,
});

export type AppRouter = typeof appRouter;
