import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { MealPlanData } from "@/lib/openai/nutritionPrompt";

const styles = StyleSheet.create({
  page: {
    // Built-in PDF font avoids runtime network fetches in the browser.
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 40,
    color: "#1A1A2E",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottom: "2px solid #2D6A4F",
    paddingBottom: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    color: "#2D6A4F",
  },
  headerInfo: {
    textAlign: "right",
    fontSize: 8,
    color: "#666",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#2D6A4F",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    fontSize: 9,
  },
  metaItem: {
    color: "#444",
  },
  daySection: {
    marginBottom: 12,
    borderRadius: 4,
    border: "1px solid #E0E0E0",
    overflow: "hidden",
  },
  dayHeader: {
    backgroundColor: "#2D6A4F",
    padding: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayHeaderText: {
    color: "#FFFFFF",
    fontWeight: 600,
    fontSize: 10,
  },
  dayHeaderKcal: {
    color: "#FFFFFF",
    fontSize: 9,
  },
  mealRow: {
    flexDirection: "row",
    borderBottom: "0.5px solid #E8E8E8",
    padding: 5,
    paddingLeft: 8,
  },
  mealType: {
    width: "20%",
    fontWeight: 600,
    fontSize: 8,
    color: "#2D6A4F",
  },
  mealName: {
    width: "45%",
    fontSize: 8,
  },
  mealDesc: {
    width: "25%",
    fontSize: 7,
    color: "#666",
  },
  mealKcal: {
    width: "10%",
    textAlign: "right",
    fontSize: 8,
    fontWeight: 600,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
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
  const totalWeekKcal = plan.days.reduce((sum, day) => sum + day.dailyKcal, 0);
  const avgDailyKcal = Math.round(totalWeekKcal / Math.max(plan.days.length, 1));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>mein-nutrikompass.de</Text>
          <View style={styles.headerInfo}>
            <Text>{organizationName}</Text>
            <Text>Erstellt am: {new Date().toLocaleDateString("de-DE")}</Text>
          </View>
        </View>

        {/* Meta-Informationen */}
        <Text style={styles.subtitle}>Ernährungsplan</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>Patient: {patientPseudonym}</Text>
          <Text style={styles.metaItem}>
            Woche ab: {new Date(weekStart).toLocaleDateString("de-DE")}
          </Text>
          <Text style={styles.metaItem}>Erstellt von: {createdBy}</Text>
          <Text style={styles.metaItem}>
            {"\u00D8"} {avgDailyKcal} kcal/Tag
          </Text>
        </View>

        {/* Tages-Pläne */}
        {plan.days.map((day) => (
          <View key={day.dayName} style={styles.daySection} wrap={false}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day.dayName}</Text>
              <Text style={styles.dayHeaderKcal}>
                {day.dailyKcal} kcal
              </Text>
            </View>
            {day.meals.map((meal, idx) => (
              <View key={idx} style={styles.mealRow}>
                <Text style={styles.mealType}>{meal.mealType}</Text>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealDesc}>{meal.description}</Text>
                <Text style={styles.mealKcal}>{meal.kcal} kcal</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Erstellt mit mein-nutrikompass.de – Nur für internen Gebrauch</Text>
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
