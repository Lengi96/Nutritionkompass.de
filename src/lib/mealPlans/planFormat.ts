import { z } from "zod";

const shoppingCategorySchema = z.enum([
  "Gemüse & Obst",
  "Protein",
  "Milchprodukte",
  "Kohlenhydrate",
  "Sonstiges",
]);

const shoppingItemSchema = z.object({
  name: z.string(),
  amount: z.number().positive(),
  unit: z.enum(["g", "ml", "Stück", "EL", "TL", "Packung", "Becher", "Dose"]),
  category: shoppingCategorySchema,
});

const mealComponentsSchema = z.object({
  carb: z.string(),
  protein: z.string(),
  fat: z.string(),
  fruit_or_veg: z.string(),
});

const mealSlotSchema = z.enum([
  "Frühstück",
  "Snack 1",
  "Mittagessen",
  "Snack 2",
  "Abendessen",
  "Später Snack",
]);

const planMealSchema = z.object({
  slot: mealSlotSchema,
  title: z.string().nullable(),
  components: mealComponentsSchema.nullable(),
  arfid_exposure: z.string().nullable(),
  alternatives: z.array(z.string()),
  recipe_id: z.string().nullable(),
});

const dayPlanSchema = z.object({
  day_name: z.string(),
  meals: z.array(planMealSchema).length(6),
});

const recipeSchema = z.object({
  recipe_id: z.string(),
  title: z.string(),
  prep_time_minutes: z.number().int().min(0).max(60),
  short_preparation: z.string(),
  sensory_features: z.array(z.string()).min(3).max(3),
  ed_support_rationale: z.string(),
  shopping_items: z.array(shoppingItemSchema).default([]),
});

const qualityAssessmentSchema = z.object({
  qualityScore: z.number().int().min(0).max(100),
  weakPoints: z.array(z.string()),
  suggestedImprovements: z.array(z.string()),
});

const okMealPlanSchema = z.object({
  status: z.literal("ok"),
  reason_code: z.null(),
  message: z.null(),
  recommended_action: z.null(),
  refeeding_note: z.null(),
  week_overview: z.object({
    daily_structure: z.string(),
    snack_times: z.array(z.string()),
    strategy: z.string(),
  }),
  days: z.array(dayPlanSchema).length(7),
  recipes: z.array(recipeSchema),
  meal_support_hints: z.array(z.string()).min(0).max(5),
  quality_assessment: qualityAssessmentSchema.optional(),
});

const redFlagMealPlanSchema = z.object({
  status: z.literal("red_flag_no_plan"),
  reason_code: z.literal("medical_red_flags_present_or_unclear"),
  message: z.string(),
  recommended_action: z.string(),
  refeeding_note: z.string(),
  week_overview: z.null(),
  days: z.array(z.never()).or(z.array(z.any()).length(0)),
  recipes: z.array(z.never()).or(z.array(z.any()).length(0)),
  meal_support_hints: z.array(z.never()).or(z.array(z.any()).length(0)),
  quality_assessment: qualityAssessmentSchema.optional(),
});

export const mealPlanSchema = z.union([okMealPlanSchema, redFlagMealPlanSchema]);
export type MealPlanData = z.infer<typeof mealPlanSchema>;
export type OkMealPlanData = z.infer<typeof okMealPlanSchema>;
export type RedFlagMealPlanData = z.infer<typeof redFlagMealPlanSchema>;
export type MealDay = z.infer<typeof dayPlanSchema>;
export type PlannedMeal = z.infer<typeof planMealSchema>;
export type RecipeData = z.infer<typeof recipeSchema>;
export type QualityAssessment = z.infer<typeof qualityAssessmentSchema>;
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;
export type ShoppingCategory = z.infer<typeof shoppingCategorySchema>;
export type MealSlot = z.infer<typeof mealSlotSchema>;
export interface NutrientSummary {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const legacyIngredientSchema = z.object({
  name: z.string(),
  amount: z.number(),
  unit: z.string(),
  category: z.string(),
});

const legacyMealSchema = z.object({
  mealType: z.string(),
  name: z.string(),
  description: z.string().optional().default(""),
  recipe: z.string().optional().default(""),
  kcal: z.number().optional().default(0),
  protein: z.number().optional().default(0),
  carbs: z.number().optional().default(0),
  fat: z.number().optional().default(0),
  ingredients: z.array(legacyIngredientSchema).optional().default([]),
});

const legacyDaySchema = z.object({
  dayName: z.string(),
  meals: z.array(legacyMealSchema),
  dailyKcal: z.number().optional().default(0),
});

export const legacyMealPlanSchema = z.object({
  days: z.array(legacyDaySchema),
});

export type LegacyMealPlanData = z.infer<typeof legacyMealPlanSchema>;

export function isNewMealPlan(plan: unknown): plan is MealPlanData {
  return mealPlanSchema.safeParse(plan).success;
}

export function isLegacyMealPlan(plan: unknown): plan is LegacyMealPlanData {
  return legacyMealPlanSchema.safeParse(plan).success;
}

export function isOkMealPlan(plan: unknown): plan is OkMealPlanData {
  return isNewMealPlan(plan) && plan.status === "ok";
}

export function isRedFlagMealPlan(plan: unknown): plan is RedFlagMealPlanData {
  return isNewMealPlan(plan) && plan.status === "red_flag_no_plan";
}

export function getRecipeById(plan: MealPlanData, recipeId: string | null | undefined) {
  if (!recipeId || plan.status !== "ok") return null;
  return plan.recipes.find((recipe) => recipe.recipe_id === recipeId) ?? null;
}

export function listMealTitles(plan: MealPlanData | LegacyMealPlanData): string[] {
  if (isLegacyMealPlan(plan)) {
    return plan.days.flatMap((day) => day.meals.map((meal) => meal.name));
  }

  if (plan.status !== "ok") return [];
  return plan.days.flatMap((day) =>
    day.meals.map((meal) => meal.title).filter((title): title is string => Boolean(title))
  );
}

export function aggregateShoppingItemsFromNewPlan(
  plan: MealPlanData
): Record<ShoppingCategory, ShoppingItem[]> {
  const grouped: Record<ShoppingCategory, ShoppingItem[]> = {
    "Gemüse & Obst": [],
    Protein: [],
    Milchprodukte: [],
    Kohlenhydrate: [],
    Sonstiges: [],
  };

  if (plan.status !== "ok") {
    return grouped;
  }

  const itemMap = new Map<string, ShoppingItem>();

  for (const recipe of plan.recipes) {
    for (const item of recipe.shopping_items) {
      const key = `${item.name.toLowerCase()}_${item.unit}_${item.category}`;
      const existing = itemMap.get(key);
      if (existing) {
        existing.amount += item.amount;
      } else {
        itemMap.set(key, { ...item });
      }
    }
  }

  for (const item of Array.from(itemMap.values())) {
    grouped[item.category].push({
      ...item,
      amount: Math.round(item.amount * 10) / 10,
    });
  }

  for (const category of Object.keys(grouped) as ShoppingCategory[]) {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  return grouped;
}

export function aggregateShoppingItemsFromLegacyPlan(
  plan: LegacyMealPlanData
): Record<ShoppingCategory, ShoppingItem[]> {
  const grouped: Record<ShoppingCategory, ShoppingItem[]> = {
    "Gemüse & Obst": [],
    Protein: [],
    Milchprodukte: [],
    Kohlenhydrate: [],
    Sonstiges: [],
  };

  const itemMap = new Map<string, ShoppingItem>();

  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const ingredient of meal.ingredients) {
        const category = shoppingCategorySchema.safeParse(ingredient.category).success
          ? (ingredient.category as ShoppingCategory)
          : "Sonstiges";
        const safeUnit = shoppingItemSchema.shape.unit.safeParse(ingredient.unit).success
          ? (ingredient.unit as ShoppingItem["unit"])
          : "Stück";
        const key = `${ingredient.name.toLowerCase()}_${safeUnit}_${category}`;
        const existing = itemMap.get(key);
        if (existing) {
          existing.amount += ingredient.amount;
        } else {
          itemMap.set(key, {
            name: ingredient.name,
            amount: ingredient.amount,
            unit: safeUnit,
            category,
          });
        }
      }
    }
  }

  for (const item of Array.from(itemMap.values())) {
    grouped[item.category].push({
      ...item,
      amount: Math.round(item.amount * 10) / 10,
    });
  }

  for (const category of Object.keys(grouped) as ShoppingCategory[]) {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  return grouped;
}

export function aggregateShoppingItems(
  plan: MealPlanData | LegacyMealPlanData
): Record<ShoppingCategory, ShoppingItem[]> {
  return isLegacyMealPlan(plan)
    ? aggregateShoppingItemsFromLegacyPlan(plan)
    : aggregateShoppingItemsFromNewPlan(plan);
}

function emptyNutrients(): NutrientSummary {
  return {
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };
}

function addNutrients(a: NutrientSummary, b: NutrientSummary): NutrientSummary {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

function roundNutrients(value: NutrientSummary): NutrientSummary {
  return {
    kcal: Math.round(value.kcal),
    protein: Math.round(value.protein),
    carbs: Math.round(value.carbs),
    fat: Math.round(value.fat),
  };
}

function getAmountFactor(item: ShoppingItem): number {
  switch (item.unit) {
    case "g":
    case "ml":
      return item.amount / 100;
    case "EL":
      return item.amount * 0.5;
    case "TL":
      return item.amount * 0.2;
    case "Packung":
      return item.amount * 2;
    case "Becher":
      return item.amount * 1.5;
    case "Dose":
      return item.amount * 2;
    case "Stück":
    default:
      return item.amount;
  }
}

function estimateItemNutrients(item: ShoppingItem): NutrientSummary {
  const name = item.name.toLowerCase();
  const factor = getAmountFactor(item);

  const overrides: Array<{ match: string[]; nutrients: NutrientSummary }> = [
    {
      match: ["hafer", "muesli", "müsli", "reis", "nudel", "pasta", "brot", "kartoffel"],
      nutrients: { kcal: 180, protein: 5, carbs: 32, fat: 2 },
    },
    {
      match: ["huhn", "pute", "fisch", "tofu", "ei", "bohnen", "linsen", "kicher"],
      nutrients: { kcal: 160, protein: 18, carbs: 6, fat: 7 },
    },
    {
      match: ["joghurt", "quark", "milch", "käse", "kaese", "frischkaese", "frischkäse"],
      nutrients: { kcal: 120, protein: 9, carbs: 8, fat: 5 },
    },
    {
      match: ["banane", "apfel", "beeren", "obst", "gemuese", "gemüse", "gurke", "tomate", "salat"],
      nutrients: { kcal: 55, protein: 1, carbs: 10, fat: 0 },
    },
    {
      match: ["oel", "öl", "butter", "nussmus", "sauce", "dip"],
      nutrients: { kcal: 90, protein: 1, carbs: 4, fat: 8 },
    },
  ];

  const matched = overrides.find((override) =>
    override.match.some((keyword) => name.includes(keyword))
  );

  const baseByCategory: Record<ShoppingCategory, NutrientSummary> = {
    "Gemüse & Obst": { kcal: 55, protein: 1, carbs: 10, fat: 0 },
    Protein: { kcal: 160, protein: 18, carbs: 6, fat: 7 },
    Milchprodukte: { kcal: 120, protein: 9, carbs: 8, fat: 5 },
    Kohlenhydrate: { kcal: 180, protein: 5, carbs: 32, fat: 2 },
    Sonstiges: { kcal: 90, protein: 2, carbs: 8, fat: 5 },
  };

  const base = matched?.nutrients ?? baseByCategory[item.category];

  return roundNutrients({
    kcal: base.kcal * factor,
    protein: base.protein * factor,
    carbs: base.carbs * factor,
    fat: base.fat * factor,
  });
}

export function getMealNutrition(
  plan: MealPlanData | LegacyMealPlanData,
  dayIndex: number,
  mealIndex: number
): NutrientSummary {
  if (isLegacyMealPlan(plan)) {
    const meal = plan.days[dayIndex]?.meals[mealIndex];
    return roundNutrients({
      kcal: meal?.kcal ?? 0,
      protein: meal?.protein ?? 0,
      carbs: meal?.carbs ?? 0,
      fat: meal?.fat ?? 0,
    });
  }

  if (plan.status !== "ok") {
    return emptyNutrients();
  }

  const meal = plan.days[dayIndex]?.meals[mealIndex];
  const recipe = getRecipeById(plan, meal?.recipe_id);
  if (!recipe) {
    return emptyNutrients();
  }

  return roundNutrients(
    recipe.shopping_items.reduce(
      (sum, item) => addNutrients(sum, estimateItemNutrients(item)),
      emptyNutrients()
    )
  );
}

export function getDayNutrition(
  plan: MealPlanData | LegacyMealPlanData,
  dayIndex: number
): NutrientSummary {
  if (isLegacyMealPlan(plan)) {
    const day = plan.days[dayIndex];
    return roundNutrients(
      day?.meals.reduce(
        (sum, _meal, mealIndex) => addNutrients(sum, getMealNutrition(plan, dayIndex, mealIndex)),
        emptyNutrients()
      ) ?? emptyNutrients()
    );
  }

  if (plan.status !== "ok") {
    return emptyNutrients();
  }

  return roundNutrients(
    plan.days[dayIndex]?.meals.reduce(
      (sum, _meal, mealIndex) => addNutrients(sum, getMealNutrition(plan, dayIndex, mealIndex)),
      emptyNutrients()
    ) ?? emptyNutrients()
  );
}

export function getPlanNutrition(plan: MealPlanData | LegacyMealPlanData): NutrientSummary {
  if (isLegacyMealPlan(plan)) {
    return roundNutrients(
      plan.days.reduce(
        (sum, _day, dayIndex) => addNutrients(sum, getDayNutrition(plan, dayIndex)),
        emptyNutrients()
      )
    );
  }

  if (plan.status !== "ok") {
    return emptyNutrients();
  }

  return roundNutrients(
    plan.days.reduce(
      (sum, _day, dayIndex) => addNutrients(sum, getDayNutrition(plan, dayIndex)),
      emptyNutrients()
    )
  );
}
