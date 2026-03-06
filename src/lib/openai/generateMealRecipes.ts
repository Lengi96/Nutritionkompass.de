import { z } from "zod";
import {
  AI_MODELS,
  createJsonChatCompletion,
  parseJsonResponse,
  type MealPlanGenerationInput,
} from "./models";
import type { WeekPlanStructure } from "./generateMealPlanStructure";
import type { ShoppingCategory, ShoppingItem } from "@/lib/mealPlans/planFormat";

const ALLOWED_UNITS = [
  "g",
  "ml",
  "St\u00fcck",
  "EL",
  "TL",
  "Packung",
  "Becher",
  "Dose",
] as const;
const ALLOWED_CATEGORIES = [
  "Gem\u00fcse & Obst",
  "Protein",
  "Milchprodukte",
  "Kohlenhydrate",
  "Sonstiges",
] as const;

const shoppingItemSchema = z.object({
  name: z.string(),
  amount: z.number().positive(),
  unit: z.enum(ALLOWED_UNITS),
  category: z.enum(ALLOWED_CATEGORIES),
});

const recipeResultSchema = z.object({
  mealName: z.string(),
  ingredients: z.array(z.string()).min(1),
  preparation: z.string().min(20),
  texture: z.array(z.string()).min(1).max(5),
  reasonHelpful: z.string().min(10),
  shoppingItems: z.array(shoppingItemSchema).min(1),
  cuisineType: z.string().min(2),
});

const recipeBatchSchema = z.object({
  recipes: z.array(
    z.object({
      mealName: z.string(),
      ingredients: z.array(z.string()).min(1).catch(["Standardzutaten"]),
      preparation: z.string().min(10).catch("1. Einfach zubereiten.\n2. Direkt servieren."),
      texture: z.array(z.string()).min(1).catch(["mild"]),
      reasonHelpful: z
        .string()
        .min(5)
        .catch("Unterst\u00fctzt eine verl\u00e4ssliche Mahlzeitenstruktur."),
      shoppingItems: z
        .array(
          z.object({
            name: z.string(),
            amount: z.number().positive().catch(1),
            unit: z.string().catch("St\u00fcck"),
            category: z.string().catch("Sonstiges"),
          })
        )
        .min(1)
        .catch([{ name: "Standardzutat", amount: 1, unit: "St\u00fcck", category: "Sonstiges" }]),
      cuisineType: z.string().min(2).catch("Alltagsk\u00fcche"),
    })
  ),
});

type RecipeBatchItem = z.infer<typeof recipeBatchSchema>["recipes"][number];

export type GeneratedRecipe = z.infer<typeof recipeResultSchema> & {
  recipeId: string;
};

function normalizeUnit(unit: string): (typeof ALLOWED_UNITS)[number] {
  const normalized = unit.trim().toLowerCase();
  if (normalized === "g") return "g";
  if (normalized === "ml") return "ml";
  if (normalized === "st\u00fcck" || normalized === "stueck" || normalized === "stk") {
    return "St\u00fcck";
  }
  if (normalized === "el") return "EL";
  if (normalized === "tl") return "TL";
  if (normalized === "packung" || normalized === "pkg" || normalized === "p\u00e4ckchen") {
    return "Packung";
  }
  if (normalized === "becher") return "Becher";
  if (normalized === "dose") return "Dose";
  return "St\u00fcck";
}

function normalizeCategory(category: string): ShoppingCategory {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes("gem\u00fcse") || normalized.includes("obst")) return "Gem\u00fcse & Obst";
  if (normalized.includes("protein")) return "Protein";
  if (normalized.includes("milch")) return "Milchprodukte";
  if (
    normalized.includes("kohle") ||
    normalized.includes("getreide") ||
    normalized.includes("brot")
  ) {
    return "Kohlenhydrate";
  }
  return "Sonstiges";
}

function normalizeTexture(texture: string[]): [string, string, string] {
  const cleaned = texture.map((entry) => entry.trim()).filter(Boolean);
  const fallback = ["mild", "alltagsnah", "s\u00e4ttigend"];
  const merged = [...cleaned, ...fallback].slice(0, 3);
  while (merged.length < 3) {
    merged.push(fallback[merged.length] ?? "mild");
  }
  return [merged[0], merged[1], merged[2]];
}

function extractUniqueMeals(structure: WeekPlanStructure): string[] {
  const unique = new Set<string>();
  for (const day of structure.days) {
    for (const mealName of Object.values(day.meals)) {
      if (mealName) unique.add(mealName);
    }
  }
  return Array.from(unique);
}

function extractSnackMeals(structure: WeekPlanStructure): Set<string> {
  const snackMeals = new Set<string>();
  for (const day of structure.days) {
    for (const mealName of [day.meals.snack1, day.meals.snack2, day.meals.lateSnack]) {
      if (mealName) snackMeals.add(mealName);
    }
  }
  return snackMeals;
}

function hasKeyword(mealName: string, keywords: string[]): boolean {
  const normalized = mealName.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function buildPreparationSteps(steps: string[]): string {
  return steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
}

function createRecipeFromTemplate(
  mealName: string,
  index: number,
  config: {
    ingredients: string[];
    preparation: string;
    texture: [string, string, string];
    reasonHelpful: string;
    shoppingItems: GeneratedRecipe["shoppingItems"];
    cuisineType: string;
  }
): GeneratedRecipe {
  return {
    recipeId: `R${String(index + 1).padStart(2, "0")}`,
    mealName,
    ingredients: config.ingredients,
    preparation: config.preparation,
    texture: config.texture,
    reasonHelpful: config.reasonHelpful,
    shoppingItems: config.shoppingItems,
    cuisineType: config.cuisineType,
  };
}

function buildFallbackRecipe(mealName: string, index: number): GeneratedRecipe {
  if (hasKeyword(mealName, ["porridge", "hafer", "m\u00fcsli", "muesli"])) {
    return createRecipeFromTemplate(mealName, index, {
      ingredients: ["Haferflocken", "Milch oder Pflanzendrink", "Joghurt", "Banane oder Apfel", "Topping"],
      preparation: buildPreparationSteps([
        "150 ml Milch oder Pflanzendrink in einem kleinen Topf erhitzen.",
        "4 bis 5 EL Haferflocken einruehren und 3 bis 5 Minuten quellen lassen.",
        "In eine Schale fuellen und 2 bis 3 EL Joghurt daraufgeben.",
        "Banane oder Apfel klein schneiden und oben verteilen.",
        "Optional mit Zimt oder Nussmus servieren.",
      ]),
      texture: ["cremig", "mild", "saettigend"],
      reasonHelpful:
        "Die Kombination ist vertraut, gut planbar und unterstuetzt einen regelmaessigen Start in den Tag.",
      shoppingItems: [
        { name: "Haferflocken", amount: 1, unit: "Packung", category: "Kohlenhydrate" },
        { name: "Milch", amount: 1, unit: "Packung", category: "Milchprodukte" },
        { name: "Joghurt", amount: 2, unit: "Becher", category: "Milchprodukte" },
        { name: "Banane oder Apfel", amount: 5, unit: "St\u00fcck", category: "Gem\u00fcse & Obst" },
      ],
      cuisineType: "Fruehstueckskueche",
    });
  }

  if (hasKeyword(mealName, ["brot", "broet", "br\u00f6t", "toast", "wrap"])) {
    return createRecipeFromTemplate(mealName, index, {
      ingredients: ["Brot oder Wrap", "Frischkaese oder Hummus", "Kaese, Ei oder Tofu", "Gurke oder Tomate"],
      preparation: buildPreparationSteps([
        "2 Scheiben Brot toasten oder einen Wrap kurz erwaermen.",
        "Mit Frischkaese, Hummus oder einem anderen Aufstrich bestreichen.",
        "Mit Kaese, Ei, Putenbrust oder Tofu belegen.",
        "Gurke oder Tomate in kleine Stuecke schneiden und dazulegen.",
        "Alles auf einem Teller anrichten und direkt servieren.",
      ]),
      texture: ["mild", "handlich", "alltagsnah"],
      reasonHelpful:
        "Die Mahlzeit ist schnell vorbereitet und unterstuetzt eine verlaessliche Struktur ohne grossen Kochaufwand.",
      shoppingItems: [
        { name: "Brot oder Wraps", amount: 1, unit: "Packung", category: "Kohlenhydrate" },
        { name: "Frischkaese oder Hummus", amount: 1, unit: "Becher", category: "Milchprodukte" },
        { name: "Ei, Kaese oder Tofu", amount: 1, unit: "Packung", category: "Protein" },
        { name: "Gurke oder Tomate", amount: 4, unit: "St\u00fcck", category: "Gem\u00fcse & Obst" },
      ],
      cuisineType: "Alltagskueche",
    });
  }

  if (hasKeyword(mealName, ["reis", "bowl", "curry"])) {
    return createRecipeFromTemplate(mealName, index, {
      ingredients: ["Reis", "Tofu, Huhn oder Bohnen", "Gemuesemix", "Milde Sauce", "Oel"],
      preparation: buildPreparationSteps([
        "1 Tasse Reis nach Packungsangabe garen.",
        "Gemuese klein schneiden oder TK-Gemuese bereitstellen.",
        "Tofu, Huhn oder Bohnen mit 1 EL Oel in einer Pfanne kurz anbraten.",
        "Gemuese dazugeben und 5 bis 7 Minuten garen.",
        "Mit einer milden Sauce verruehren und zusammen mit dem Reis servieren.",
      ]),
      texture: ["warm", "saftig", "saettigend"],
      reasonHelpful:
        "Die klare Tellerstruktur kann Orientierung geben und hilft, Hauptmahlzeiten alltagstauglich umzusetzen.",
      shoppingItems: [
        { name: "Reis", amount: 1, unit: "Packung", category: "Kohlenhydrate" },
        { name: "Tofu, Huhn oder Bohnen", amount: 1, unit: "Packung", category: "Protein" },
        { name: "Gemuesemix", amount: 1, unit: "Packung", category: "Gem\u00fcse & Obst" },
        { name: "Milde Sauce", amount: 1, unit: "Packung", category: "Sonstiges" },
      ],
      cuisineType: "Bowl-Kueche",
    });
  }

  if (hasKeyword(mealName, ["pasta", "nudel", "gnocchi"])) {
    return createRecipeFromTemplate(mealName, index, {
      ingredients: ["Pasta oder Gnocchi", "Tomatensauce oder Frischkaese", "Gemuese", "Linsen, Hack oder Tofu", "Kaese"],
      preparation: buildPreparationSteps([
        "Pasta oder Gnocchi nach Packungsangabe kochen.",
        "In einer Pfanne 1 EL Oel erhitzen und das Gemuese 5 Minuten anbraten.",
        "Linsen, Hack oder Tofu dazugeben und kurz mitwaermen.",
        "Tomatensauce oder Frischkaese einruehren und 2 Minuten ziehen lassen.",
        "Mit der Pasta mischen und bei Bedarf mit Kaese servieren.",
      ]),
      texture: ["warm", "weich", "vertraut"],
      reasonHelpful:
        "Warme Nudelgerichte sind oft vertraut und koennen Versorgung sowie Saettigung zuverlaessig unterstuetzen.",
      shoppingItems: [
        { name: "Pasta oder Gnocchi", amount: 1, unit: "Packung", category: "Kohlenhydrate" },
        { name: "Tomatensauce oder Frischkaese", amount: 1, unit: "Packung", category: "Sonstiges" },
        { name: "Gemuese", amount: 1, unit: "Packung", category: "Gem\u00fcse & Obst" },
        { name: "Linsen, Hack oder Tofu", amount: 1, unit: "Packung", category: "Protein" },
      ],
      cuisineType: "Mediterran",
    });
  }

  if (hasKeyword(mealName, ["kartoffel", "gratin", "pfanne"])) {
    return createRecipeFromTemplate(mealName, index, {
      ingredients: ["Kartoffeln", "Rohkost oder Salat", "Quark oder Dip", "Ei, Fisch oder Tofu"],
      preparation: buildPreparationSteps([
        "Kartoffeln waschen, in Stuecke schneiden und 12 bis 15 Minuten kochen.",
        "Parallel Rohkost schneiden oder einen kleinen Salat vorbereiten.",
        "Quark oder Dip in eine Schale geben und kurz abschmecken.",
        "Ei, Fisch oder Tofu separat erhitzen oder kurz anbraten.",
        "Alles zusammen auf einem Teller anrichten und warm servieren.",
      ]),
      texture: ["warm", "mild", "saettigend"],
      reasonHelpful:
        "Die Kombination ist vertraut, gut saettigend und im Einrichtungsalltag einfach vorzubereiten.",
      shoppingItems: [
        { name: "Kartoffeln", amount: 1, unit: "Packung", category: "Kohlenhydrate" },
        { name: "Rohkost oder Salat", amount: 1, unit: "Packung", category: "Gem\u00fcse & Obst" },
        { name: "Quark oder Dip", amount: 1, unit: "Becher", category: "Milchprodukte" },
        { name: "Ei, Fisch oder Tofu", amount: 1, unit: "Packung", category: "Protein" },
      ],
      cuisineType: "Deutsche Kueche",
    });
  }

  if (hasKeyword(mealName, ["joghurt", "quark", "banane", "beeren", "obst", "snack"])) {
    return createRecipeFromTemplate(mealName, index, {
      ingredients: ["Joghurt oder Quark", "Banane oder Beeren", "Muesli oder Cracker", "Optional Honig"],
      preparation: buildPreparationSteps([
        "Joghurt oder Quark in eine Schale geben.",
        "Banane, Beeren oder anderes Obst waschen und klein schneiden.",
        "Das Obst auf den Joghurt geben.",
        "Muesli, Cracker oder Kekse danebenlegen oder darueberstreuen.",
        "Optional mit etwas Honig oder Zimt direkt servieren.",
      ]),
      texture: ["kuehl", "mild", "alltagsnah"],
      reasonHelpful:
        "Ein schnell verfuegbarer Snack kann helfen, lange Esspausen zu vermeiden und die Tagesstruktur zu stabilisieren.",
      shoppingItems: [
        { name: "Joghurt oder Quark", amount: 2, unit: "Becher", category: "Milchprodukte" },
        { name: "Banane oder Beeren", amount: 4, unit: "St\u00fcck", category: "Gem\u00fcse & Obst" },
        { name: "Muesli oder Cracker", amount: 1, unit: "Packung", category: "Kohlenhydrate" },
      ],
      cuisineType: "Snackkueche",
    });
  }

  return createRecipeFromTemplate(mealName, index, {
    ingredients: ["Hauptzutat", "Beilage", "Gemuese oder Obst", "Protein- oder Milchkomponente"],
    preparation: buildPreparationSteps([
      `Die Hauptzutat fuer "${mealName}" nach Packungsangabe erhitzen oder kurz zubereiten.`,
      "Eine einfache Beilage wie Brot, Reis, Kartoffeln oder Pasta parallel vorbereiten.",
      "Gemuese, Salat oder Obst waschen und in mundgerechte Stuecke schneiden.",
      "Eine Protein- oder Milchkomponente dazugeben, zum Beispiel Joghurt, Ei, Bohnen oder Kaese.",
      "Alles auf einem Teller oder in einer Schale zusammen anrichten und direkt servieren.",
    ]),
    texture: ["mild", "alltagsnah", "saettigend"],
    reasonHelpful:
      "Das Rezept bleibt niedrigschwellig und unterstuetzt eine regelmaessige Versorgung im Alltag der Einrichtung.",
    shoppingItems: [
      { name: mealName, amount: 1, unit: "Packung", category: "Sonstiges" },
      { name: "Gemuese oder Obst", amount: 1, unit: "Packung", category: "Gem\u00fcse & Obst" },
    ],
    cuisineType: "Alltagskueche",
  });
}

function normalizeRecipe(recipe: RecipeBatchItem, index: number): GeneratedRecipe {
  const normalized = recipeResultSchema.parse({
    mealName: recipe.mealName.trim(),
    ingredients: recipe.ingredients.map((entry) => entry.trim()).filter(Boolean),
    preparation: recipe.preparation.trim(),
    texture: normalizeTexture(recipe.texture),
    reasonHelpful: recipe.reasonHelpful.trim(),
    shoppingItems: recipe.shoppingItems.map((item) => ({
      name: item.name.trim(),
      amount: item.amount,
      unit: normalizeUnit(item.unit),
      category: normalizeCategory(item.category),
    })),
    cuisineType: recipe.cuisineType.trim(),
  });

  return {
    ...normalized,
    recipeId: `R${String(index + 1).padStart(2, "0")}`,
  };
}

export async function generateMealRecipes(
  structure: WeekPlanStructure,
  input: MealPlanGenerationInput,
  options?: {
    fastMode?: boolean;
  }
): Promise<GeneratedRecipe[]> {
  const uniqueMeals = extractUniqueMeals(structure);
  const snackMeals = extractSnackMeals(structure);
  const mealsForLLM = uniqueMeals.filter((mealName) => !snackMeals.has(mealName));

  if (options?.fastMode) {
    return uniqueMeals.map((mealName, index) => buildFallbackRecipe(mealName, index));
  }

  const compactInput = {
    diagnosis_focus: input.diagnosis_focus,
    age_group: input.age_group,
    setting: input.setting,
    allergies_intolerances: input.allergies_intolerances,
    safe_foods: input.repertoire_aversions_safe_foods.safe_foods,
    budget: input.budget,
    cooking_resources_skill_time: input.cooking_resources_skill_time,
  };

  const system = `Du erzeugst kurze, alltagsnahe Rezepte fuer mehrere Mahlzeiten.
Gib nur JSON zurueck.
Regeln:
- fuer jede Mahlzeit genau ein Rezept
- maximal 20 bis 25 Minuten aktive Zubereitungszeit
- einfache Zutaten
- keine Kalorienangaben
- keine Diaet- oder Gewichtsbezuege
- neutrale, essstoerungssensible Sprache
- preparation muss eine kompakte nummerierte Schrittfolge mit 3 bis 5 Schritten sein
- shoppingItems muessen konkrete Einkaufsartikel enthalten`;

  const chunkSize = 6;
  const recipeChunks: RecipeBatchItem[][] = [];

  for (let i = 0; i < mealsForLLM.length; i += chunkSize) {
    const mealChunk = mealsForLLM.slice(i, i + chunkSize);
    const chunkUser = `Parameter:
${JSON.stringify(compactInput)}

Erzeuge Rezepte fuer diese Mahlzeiten:
${JSON.stringify(mealChunk)}

Ausgabeformat:
{
  "recipes": [
    {
      "mealName": "string",
      "ingredients": ["string"],
      "preparation": "1. ...\\n2. ...\\n3. ...",
      "texture": ["warm", "herzhaft", "saettigend"],
      "reasonHelpful": "string",
      "shoppingItems": [
        {
          "name": "string",
          "amount": 1,
          "unit": "g|ml|Stueck|EL|TL|Packung|Becher|Dose",
          "category": "Gemuese & Obst|Protein|Milchprodukte|Kohlenhydrate|Sonstiges"
        }
      ],
      "cuisineType": "string"
    }
  ]
}`;

    const content = await createJsonChatCompletion(
      AI_MODELS.MEALPLAN_RECIPES,
      system,
      chunkUser,
      1600
    );
    const parsed = recipeBatchSchema.parse(parseJsonResponse(content));
    recipeChunks.push(parsed.recipes);
  }

  const byMealName = new Map(recipeChunks.flat().map((recipe) => [recipe.mealName.trim(), recipe]));

  return uniqueMeals.map((mealName, index) => {
    if (snackMeals.has(mealName)) {
      return buildFallbackRecipe(mealName, index);
    }

    const recipe = byMealName.get(mealName.trim());
    if (!recipe) {
      return buildFallbackRecipe(mealName, index);
    }

    return normalizeRecipe(recipe, index);
  });
}

export function mapShoppingItems(items: GeneratedRecipe["shoppingItems"]): ShoppingItem[] {
  return items.map((item) => ({
    name: item.name,
    amount: item.amount,
    unit: item.unit,
    category: item.category as ShoppingCategory,
  }));
}
