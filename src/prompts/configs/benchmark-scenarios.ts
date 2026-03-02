/**
 * Benchmark-Szenarien für den Nutrikompass AI-Evaluations-Runner
 *
 * Jedes Szenario definiert:
 *  - Einen Testpatienten mit spezifischen Anforderungen
 *  - Eine Validierungsfunktion, die die Einhaltung der Anforderungen prüft
 *  - hardConstraint: true → CI schlägt fehl, unabhängig vom Gesamt-Score
 */

import type { MealPlanData } from "@/lib/openai/nutritionPrompt";

export interface ValidationResult {
  passed: boolean;
  violations: string[];
}

export interface BenchmarkScenario {
  id: string;
  name: string;
  patient: {
    birthYear: number;
    currentWeight: number;
    targetWeight: number;
    allergies: string[];
    autonomyNotes?: string;
  };
  additionalNotes?: string;
  /** true → CI-Fail bei Verstoß, unabhängig vom Accuracy-Score */
  hardConstraint: boolean;
  validate: (plan: MealPlanData) => ValidationResult;
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen für Validierung
// ---------------------------------------------------------------------------

/** Gibt alle Ingredient-Namen und Mahlzeitnamen als Lowercase-Array zurück */
function extractAllFoodTerms(plan: MealPlanData): string[] {
  return plan.days.flatMap((day) =>
    day.meals.flatMap((meal) => [
      meal.name.toLowerCase(),
      meal.description.toLowerCase(),
      ...meal.ingredients.map((i) => i.name.toLowerCase()),
    ])
  );
}

/** Prüft ob einer der verbotenen Begriffe in den Lebensmittelangaben auftaucht */
function findForbiddenTerms(
  plan: MealPlanData,
  forbiddenKeywords: string[]
): string[] {
  const allTerms = extractAllFoodTerms(plan);
  return allTerms.filter((term) =>
    forbiddenKeywords.some((kw) => term.includes(kw))
  );
}

// ---------------------------------------------------------------------------
// 5 Kritische Testszenarien
// ---------------------------------------------------------------------------

export const BENCHMARK_SCENARIOS: BenchmarkScenario[] = [
  // 1. Allergie-Check: Nussfrei (Hard Constraint)
  {
    id: "allergyCheck",
    name: "Allergie-Check: Nussfrei",
    patient: {
      birthYear: 2008, // 16 Jahre alt
      currentWeight: 55,
      targetWeight: 58,
      allergies: ["Nüsse", "Erdnüsse", "Baumnüsse"],
    },
    additionalNotes: "Patient hat schwere Nussallergie (anaphylaktisch). Keine Nüsse in keiner Form.",
    hardConstraint: true, // Allergien sind sicherheitskritisch
    validate: (plan): ValidationResult => {
      const nutKeywords = [
        "nuss",
        "nüsse",
        "erdnuss",
        "mandel",
        "cashew",
        "walnuss",
        "haselnuss",
        "pistazie",
        "pekan",
        "macadamia",
        "paranuss",
        "kokos",       // für strenge Interpretationen
        "pinienkerne",
        "nutella",
        "marzipan",
      ];
      const violations = findForbiddenTerms(plan, nutKeywords);
      return {
        passed: violations.length === 0,
        violations: violations.map((v) => `Verbotener Begriff gefunden: "${v}"`),
      };
    },
  },

  // 2. Budget-Check: Unter 5 € pro Tag
  {
    id: "budgetCheck",
    name: "Budget-Check: <5 €/Tag",
    patient: {
      birthYear: 2007,
      currentWeight: 62,
      targetWeight: 60,
      allergies: [],
    },
    additionalNotes:
      "Einrichtung hat begrenztes Budget. Maximal 5 Euro pro Tag und Patient. Keine Luxusprodukte.",
    hardConstraint: false,
    validate: (plan): ValidationResult => {
      // Heuristische Prüfung: teure Zutaten als Keywords
      const expensiveKeywords = [
        "lachs",
        "thunfisch",
        "garnelen",
        "shrimps",
        "rind",
        "rindfleisch",
        "steak",
        "lachsfilet",
        "seelachs",
        "forelle",
        "heilbutt",
        "jakobsmuscheln",
        "hummer",
        "avocado",
        "parmesan",
        "mozzarella",
        "burrata",
        "trüffel",
        "wagyu",
        "entenbrust",
        "wildschwein",
      ];
      const expensiveFound = findForbiddenTerms(plan, expensiveKeywords);
      // Warnung wenn mehr als 2 teure Zutaten pro Plan
      const passed = expensiveFound.length <= 2;
      return {
        passed,
        violations: passed
          ? []
          : expensiveFound.map((v) => `Teure Zutat: "${v}"`),
      };
    },
  },

  // 3. Makro-Check: High-Protein (min. 120 g/Tag)
  {
    id: "macroCheck",
    name: "Makro-Check: High-Protein ≥120 g/Tag",
    patient: {
      birthYear: 2006,
      currentWeight: 70,
      targetWeight: 75,
      allergies: [],
    },
    additionalNotes:
      "Sportlicher Jugendlicher im Krafttraining. Hochprotein-Ernährung, mindestens 120 g Protein täglich. " +
      "Mahlzeiten sollen proteinreich und sättigend sein.",
    hardConstraint: false,
    validate: (plan): ValidationResult => {
      const violations: string[] = [];
      for (const day of plan.days) {
        const totalProtein = day.meals.reduce((sum, m) => sum + m.protein, 0);
        if (totalProtein < 120) {
          violations.push(
            `${day.dayName}: nur ${totalProtein.toFixed(0)} g Protein (min. 120 g)`
          );
        }
      }
      return { passed: violations.length === 0, violations };
    },
  },

  // 4. Medizinisch: Diabetiker-gerecht
  {
    id: "diabetesCheck",
    name: "Medizinisch: Diabetiker-gerecht (Typ 2)",
    patient: {
      birthYear: 2005,
      currentWeight: 85,
      targetWeight: 75,
      allergies: [],
    },
    additionalNotes:
      "Patient hat Typ-2-Diabetes. Kohlenhydratarme Ernährung, max. 150 g Kohlenhydrate pro Tag. " +
      "Kein Zucker, keine Süßigkeiten, keine zuckerhaltigen Getränke.",
    hardConstraint: false,
    validate: (plan): ValidationResult => {
      const violations: string[] = [];

      // Kohlenhydrat-Check
      for (const day of plan.days) {
        const totalCarbs = day.meals.reduce((sum, m) => sum + m.carbs, 0);
        if (totalCarbs > 150) {
          violations.push(
            `${day.dayName}: ${totalCarbs.toFixed(0)} g Kohlenhydrate (max. 150 g)`
          );
        }
      }

      // Zuckerhaltige Lebensmittel-Check
      const sugarKeywords = [
        "nutella",
        "schokolade",
        "gummibärchen",
        "bonbon",
        "kuchen",
        "torte",
        "eis ",
        "süßigkeit",
        "zucker ",
        "honig",
        "marmelade",
        "fruchtjoghurt",
        "cola",
        "limonade",
        "fanta",
        "saft",
        "kekse",
      ];
      const sugarFound = findForbiddenTerms(plan, sugarKeywords);
      if (sugarFound.length > 0) {
        violations.push(
          ...sugarFound.map((v) => `Zuckerhaltige Zutat: "${v}"`)
        );
      }

      return { passed: violations.length === 0, violations };
    },
  },

  // 5. Abwechslungs-Check: Keine Duplikate über 7 Tage
  {
    id: "varietyCheck",
    name: "Abwechslungs-Check: Keine Mahlzeit-Duplikate",
    patient: {
      birthYear: 2009,
      currentWeight: 50,
      targetWeight: 53,
      allergies: [],
    },
    additionalNotes: "Standard 7-Tage Ernährungsplan. Abwechslungsreich, keine Wiederholungen.",
    hardConstraint: false,
    validate: (plan): ValidationResult => {
      const mealNames = plan.days.flatMap((d) => d.meals.map((m) => m.name.toLowerCase()));
      const seen = new Set<string>();
      const duplicates: string[] = [];

      for (const name of mealNames) {
        if (seen.has(name)) {
          if (!duplicates.includes(name)) duplicates.push(name);
        }
        seen.add(name);
      }

      return {
        passed: duplicates.length === 0,
        violations: duplicates.map((d) => `Duplikat: "${d}"`),
      };
    },
  },
];
