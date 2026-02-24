import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
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
    fontSize: 14,
    fontWeight: 600,
    color: "#2D6A4F",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#444",
    marginBottom: 15,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryHeader: {
    backgroundColor: "#E8F5EF",
    padding: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: "#2D6A4F",
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottom: "0.5px solid #F0F0F0",
  },
  checkbox: {
    width: 12,
    height: 12,
    border: "1px solid #999",
    borderRadius: 2,
    marginRight: 8,
  },
  itemName: {
    width: "60%",
    fontSize: 9,
  },
  itemAmount: {
    width: "30%",
    fontSize: 9,
    textAlign: "right",
    color: "#444",
  },
  summary: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#F8F9FA",
    borderRadius: 4,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    textAlign: "center",
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: 700,
    color: "#2D6A4F",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#666",
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

const categoryEmojis: Record<string, string> = {
  "Gemüse & Obst": "Gemüse & Obst",
  Protein: "Protein",
  Milchprodukte: "Milchprodukte",
  Kohlenhydrate: "Kohlenhydrate",
  Sonstiges: "Sonstiges",
};

interface ShoppingItem {
  name: string;
  amount: number;
  unit: string;
  category: string;
}

interface ShoppingListPdfProps {
  items: Record<string, ShoppingItem[]>;
  patientPseudonym: string;
  weekStart: string;
  organizationName?: string;
}

export function ShoppingListPdfDocument({
  items,
  patientPseudonym,
  weekStart,
  organizationName = "mein-nutrikompass.de",
}: ShoppingListPdfProps) {
  const totalItems = Object.values(items).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  const categoryCount = Object.values(items).filter(
    (arr) => arr.length > 0
  ).length;

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

        {/* Titel */}
        <Text style={styles.subtitle}>Einkaufsliste</Text>
        <Text style={styles.meta}>
          Patient: {patientPseudonym} | Woche ab:{" "}
          {new Date(weekStart).toLocaleDateString("de-DE")}
        </Text>

        {/* Zusammenfassung */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{totalItems}</Text>
            <Text style={styles.summaryLabel}>Artikel gesamt</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{categoryCount}</Text>
            <Text style={styles.summaryLabel}>Kategorien</Text>
          </View>
        </View>

        {/* Kategorien */}
        {Object.entries(items).map(
          ([category, categoryItems]) =>
            categoryItems.length > 0 && (
              <View key={category} style={styles.categorySection} wrap={false}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>
                    {categoryEmojis[category] || category}
                  </Text>
                </View>
                {categoryItems.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.checkbox} />
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemAmount}>
                      {item.amount} {item.unit}
                    </Text>
                  </View>
                ))}
              </View>
            )
        )}

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
