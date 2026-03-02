/**
 * Ingestion CLI Script
 *
 * Verarbeitet Wissensdokumente (Markdown/JSON) in die nutri_knowledge Tabelle.
 *
 * Verwendung:
 *   npx tsx scripts/ingest-knowledge.ts [--clear] [--source <name>] <dateipfad>
 *
 * Beispiele:
 *   npx tsx scripts/ingest-knowledge.ts knowledge/allergene.md
 *   npx tsx scripts/ingest-knowledge.ts --clear knowledge/allergene.md
 *   npx tsx scripts/ingest-knowledge.ts --source "Allergien-v2" knowledge/allergene.md
 *   npx tsx scripts/ingest-knowledge.ts knowledge/rezepte.json
 *
 * Voraussetzungen:
 *   - OPENAI_API_KEY in .env
 *   - DATABASE_URL in .env (Supabase PostgreSQL mit pgvector)
 *   - supabase-rag-migration.sql wurde im Supabase SQL-Editor ausgeführt
 */

// Lade .env Datei (für lokale Nutzung)
import { config } from "process";
void config;

// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: ".env" });

import { existsSync, readFileSync } from "fs";
import { resolve, extname } from "path";
import {
  ingestMarkdownFile,
  ingestJsonRecipes,
  ingestGenericJson,
  ingestExcelFile,
  ingestPdfFile,
  ingestHtmlFile,
  ingestTextFile,
  clearKnowledgeBase,
  type IngestResult,
} from "../src/lib/rag/ingestion";

// ---------------------------------------------------------------------------
// CLI-Argument-Parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help")) {
  console.log(`
Nutrikompass Wissens-Ingestion

Verwendung:
  npx tsx scripts/ingest-knowledge.ts [Optionen] <dateipfad>

Optionen:
  --clear           Löscht Einträge der Quelle vor der Ingestion
  --clear-all       Löscht ALLE Einträge in der Wissensbasis
  --source <name>   Überschreibt den Quellnamen (Standard: Dateiname)

Unterstützte Formate:
  .md               Markdown-Dokumente
  .json             JSON (Array oder Objekt, beliebige Struktur)
  .xlsx .xls        Excel (erste Zeile = Spaltenüberschriften)
  .pdf              PDF-Dokumente (Text aller Seiten)
  .html .htm        HTML-Seiten (Tags werden entfernt)
  .ts .js .txt .csv Beliebige Textdateien

Optionen für Excel:
  --sheet <name>  Bestimmtes Sheet verwenden (Standard: erstes Sheet)
`);
  process.exit(0);
}

const clearFlag = args.includes("--clear");
const clearAllFlag = args.includes("--clear-all");
const sourceIdx = args.indexOf("--source");
const customSource = sourceIdx !== -1 ? args[sourceIdx + 1] : undefined;
const sheetIdx = args.indexOf("--sheet");
const customSheet = sheetIdx !== -1 ? args[sheetIdx + 1] : undefined;

// Dateipfad ist das letzte nicht-Flag-Argument
const filePath = args.filter(
  (a) => !a.startsWith("--") && a !== customSource && a !== customSheet
).pop();

// ---------------------------------------------------------------------------
// Validierung
// ---------------------------------------------------------------------------

if (!filePath && !clearAllFlag) {
  console.error("Fehler: Kein Dateipfad angegeben.");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Fehler: OPENAI_API_KEY ist nicht gesetzt.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Fehler: DATABASE_URL ist nicht gesetzt.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Ausführung
// ---------------------------------------------------------------------------

async function main() {
  console.log("Nutrikompass Wissens-Ingestion\n");

  // Alle Einträge löschen
  if (clearAllFlag) {
    console.log("Lösche ALLE Einträge in der Wissensbasis...");
    const deleted = await clearKnowledgeBase();
    console.log(`✓ ${deleted} Einträge gelöscht.\n`);
    if (!filePath) return;
  }

  const absolutePath = resolve(filePath!);
  if (!existsSync(absolutePath)) {
    console.error(`Fehler: Datei nicht gefunden: ${absolutePath}`);
    process.exit(1);
  }

  const ext = extname(absolutePath).toLowerCase();
  const sourceName = customSource ?? absolutePath.split(/[\\/]/).pop()!;

  // Quelle leeren vor Re-Ingestion
  if (clearFlag) {
    console.log(`Lösche bestehende Einträge für Quelle "${sourceName}"...`);
    const deleted = await clearKnowledgeBase(sourceName);
    console.log(`✓ ${deleted} Einträge gelöscht.\n`);
  }

  console.log(`Verarbeite: ${absolutePath}`);
  console.log(`Quelle:     ${sourceName}`);
  console.log(`Format:     ${ext}\n`);

  let result: IngestResult;

  if (ext === ".md") {
    result = await ingestMarkdownFile(absolutePath, sourceName);
  } else if (ext === ".json") {
    result = await ingestGenericJson(absolutePath, sourceName);
  } else if (ext === ".xlsx" || ext === ".xls") {
    if (customSheet) {
      console.log(`Sheet:      ${customSheet}\n`);
    }
    result = await ingestExcelFile(absolutePath, sourceName, customSheet);
  } else if (ext === ".pdf") {
    result = await ingestPdfFile(absolutePath, sourceName);
  } else if (ext === ".html" || ext === ".htm") {
    result = await ingestHtmlFile(absolutePath, sourceName);
  } else if ([".ts", ".js", ".txt", ".csv"].includes(ext)) {
    result = await ingestTextFile(absolutePath, sourceName);
  } else {
    console.error(
      `Fehler: Nicht unterstütztes Format: ${ext}\n` +
      `Unterstützt: .md, .json, .xlsx, .xls, .pdf, .html, .htm, .ts, .js, .txt, .csv`
    );
    process.exit(1);
  }

  console.log("─".repeat(50));
  console.log(`✓ Quelle:            ${result.source}`);
  console.log(`✓ Chunks verarbeitet: ${result.chunksProcessed}`);
  if (result.chunksSkipped > 0) {
    console.log(`⚠ Chunks übersprungen: ${result.chunksSkipped}`);
  }
  console.log("\nIngestion abgeschlossen.");
}

main().catch((err) => {
  console.error("\nFehler:", err);
  process.exit(1);
});
