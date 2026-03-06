import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { MealPlanData } from "@/lib/openai/nutritionPrompt";
import { getRecipeById, isOkMealPlan } from "@/lib/mealPlans/planFormat";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 32,
    color: "#1A1A2E",
  },
  header: {
    marginBottom: 14,
    borderBottom: "2px solid #2D6A4F",
    paddingBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: "#2D6A4F",
  },
  meta: {
    marginTop: 4,
    fontSize: 8,
    color: "#666",
  },
  overview: {
    border: "1px solid #DDE7DF",
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
    backgroundColor: "#F7FBF8",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#2D6A4F",
    marginBottom: 4,
  },
  daySection: {
    marginBottom: 10,
    border: "1px solid #E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  dayHeader: {
    backgroundColor: "#2D6A4F",
    color: "#FFFFFF",
    padding: 6,
    fontSize: 10,
    fontWeight: 600,
  },
  mealRow: {
    padding: 6,
    borderBottom: "0.5px solid #E8E8E8",
  },
  mealSlot: {
    fontSize: 8,
    fontWeight: 600,
    color: "#2D6A4F",
  },
  mealTitle: {
    fontSize: 9,
    marginTop: 1,
  },
  mealMeta: {
    fontSize: 7,
    color: "#666",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#999",
    borderTop: "1px solid #E0E0E0",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

interface MealPlanPdfProps {
  plan: MealPlanData;
  patientPseudonym: string;
  weekStart: string;
  createdBy: string;
  organizationName?: string;
}

export function MealPlanPdfDocument({
  plan,
  patientPseudonym,
  weekStart,
  createdBy,
  organizationName = "mein-nutrikompass.de",
}: MealPlanPdfProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Ernährungsplan</Text>
          <Text style={styles.meta}>{organizationName}</Text>
          <Text style={styles.meta}>Patient: {patientPseudonym}</Text>
          <Text style={styles.meta}>
            Woche ab: {new Date(weekStart).toLocaleDateString("de-DE")}
          </Text>
          <Text style={styles.meta}>Erstellt von: {createdBy}</Text>
        </View>

        {!isOkMealPlan(plan) ? (
          <View style={styles.overview}>
            <Text style={styles.sectionTitle}>Medizinischer Hinweis</Text>
            <Text>{plan.message}</Text>
            <Text style={styles.mealMeta}>{plan.recommended_action}</Text>
            <Text style={styles.mealMeta}>{plan.refeeding_note}</Text>
          </View>
        ) : (
          <>
            <View style={styles.overview}>
              <Text style={styles.sectionTitle}>Wochenüberblick</Text>
              <Text>{plan.week_overview.daily_structure}</Text>
              <Text style={styles.mealMeta}>
                Snack-Zeiten: {plan.week_overview.snack_times.join(", ")}
              </Text>
              <Text style={styles.mealMeta}>{plan.week_overview.strategy}</Text>
            </View>

            {plan.days.map((day) => (
              <View key={day.day_name} style={styles.daySection} wrap={false}>
                <Text style={styles.dayHeader}>{day.day_name}</Text>
                {day.meals.map((meal, index) => {
                  if (!meal.title) {
                    return null;
                  }
                  const recipe = getRecipeById(plan, meal.recipe_id);
                  const components = meal.components
                    ? [
                        meal.components.carb,
                        meal.components.protein,
                        meal.components.fat,
                        meal.components.fruit_or_veg,
                      ].join(" | ")
                    : "";

                  return (
                    <View key={`${day.day_name}-${index}`} style={styles.mealRow}>
                      <Text style={styles.mealSlot}>{meal.slot}</Text>
                      <Text style={styles.mealTitle}>{meal.title}</Text>
                      <Text style={styles.mealMeta}>{components}</Text>
                      {recipe ? (
                        <Text style={styles.mealMeta}>
                          {recipe.short_preparation}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        )}

        <View style={styles.footer} fixed>
          <Text>Erstellt mit mein-nutrikompass.de</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Seite ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
