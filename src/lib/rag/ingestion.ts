/**
 * RAG Ingestion Service
 *
 * Verarbeitet Markdown- und JSON-Dokumente zu Embedding-Chunks
 * und speichert diese in der nutri_knowledge Tabelle (pgvector).
 *
 * Nutzung via CLI: npx tsx scripts/ingest-knowledge.ts
 */

import { readFileSync } from "fs";
import { getOpenAIClient } from "@/lib/openai/client";
import { prisma } from "@/lib/prisma";

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 500; // Zeichen
const CHUNK_OVERLAP = 50; // Zeichen Überlappung

// ---------------------------------------------------------------------------
// Chunk-Splitting
// ---------------------------------------------------------------------------

/**
 * Teilt einen Text in überlappende Chunks auf.
 * Versucht an Satzgrenzen zu splitten um semantische Kohärenz zu erhalten.
 */
export function chunkText(
  text: string,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= chunkSize) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    let chunk = normalized.slice(start, end);

    // An Satz- oder Absatzgrenze abrunden wenn möglich
    if (end < normalized.length) {
      const lastPeriod = Math.max(
        chunk.lastIndexOf(". "),
        chunk.lastIndexOf("\n\n"),
        chunk.lastIndexOf("\n")
      );
      if (lastPeriod > chunkSize * 0.6) {
        chunk = chunk.slice(0, lastPeriod + 1);
      }
    }

    if (chunk.trim().length > 20) {
      chunks.push(chunk.trim());
    }

    start += chunk.length - overlap;
    if (start >= normalized.length) break;
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Embedding-Generierung
// ---------------------------------------------------------------------------

/**
 * Generiert ein Embedding für einen Text-Chunk via OpenAI text-embedding-3-small.
 * Liefert einen 1536-dimensionalen Float-Vektor.
 */
export async function embedChunk(text: string): Promise<number[]> {
  const response = await getOpenAIClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.replace(/\n/g, " "),
  });
  return response.data[0].embedding;
}

// ---------------------------------------------------------------------------
// Upsert in nutri_knowledge
// ---------------------------------------------------------------------------

async function upsertChunk(
  source: string,
  chunkIndex: number,
  content: string,
  embedding: number[],
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const embeddingStr = `[${embedding.join(",")}]`;

  await prisma.$executeRawUnsafe(
    `INSERT INTO nutri_knowledge (source, chunk_index, content, embedding, metadata)
     VALUES ($1, $2, $3, $4::vector, $5::jsonb)
     ON CONFLICT (source, chunk_index) DO UPDATE SET
       content   = EXCLUDED.content,
       embedding = EXCLUDED.embedding,
       metadata  = EXCLUDED.metadata`,
    source,
    chunkIndex,
    content,
    embeddingStr,
    JSON.stringify(metadata)
  );
}

// ---------------------------------------------------------------------------
// Öffentliche Ingestion-API
// ---------------------------------------------------------------------------

export interface IngestResult {
  source: string;
  chunksProcessed: number;
  chunksSkipped: number;
}

/**
 * Liest eine Markdown-Datei, zerlegt sie in Chunks, embeds und speichert.
 */
export async function ingestMarkdownFile(
  filePath: string,
  source?: string
): Promise<IngestResult> {
  const content = readFileSync(filePath, "utf-8");
  const sourceName = source ?? filePath.split(/[\\/]/).pop() ?? filePath;
  return ingestText(content, sourceName, { format: "markdown" });
}

/**
 * Verarbeitet ein Array von Rezept-Objekten (JSON) zur Wissensbasis.
 * Jedes Rezept wird in einen lesbaren Text serialisiert.
 */
export async function ingestJsonRecipes(
  recipes: Array<{
    name: string;
    description?: string;
    ingredients?: string[];
    instructions?: string;
    [key: string]: unknown;
  }>,
  source: string
): Promise<IngestResult> {
  const text = recipes
    .map((r) => {
      const lines = [`# ${r.name}`];
      if (r.description) lines.push(r.description);
      if (r.ingredients?.length) {
        lines.push("Zutaten: " + r.ingredients.join(", "));
      }
      if (r.instructions) lines.push("Zubereitung: " + r.instructions);
      return lines.join("\n");
    })
    .join("\n\n---\n\n");

  return ingestText(text, source, { format: "json-recipes" });
}

/**
 * Kernfunktion: Teilt Text auf, embeds jeden Chunk, schreibt in DB.
 */
async function ingestText(
  text: string,
  source: string,
  metadata: Record<string, unknown> = {}
): Promise<IngestResult> {
  const chunks = chunkText(text);
  let chunksProcessed = 0;
  let chunksSkipped = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk || chunk.length < 20) {
      chunksSkipped++;
      continue;
    }

    try {
      const embedding = await embedChunk(chunk);
      await upsertChunk(source, i, chunk, embedding, {
        ...metadata,
        totalChunks: chunks.length,
      });
      chunksProcessed++;
      process.stdout.write(
        `\r  ${source}: Chunk ${i + 1}/${chunks.length} ✓`
      );
    } catch (err) {
      console.error(`\n  Fehler bei Chunk ${i}: ${String(err)}`);
      chunksSkipped++;
    }
  }

  process.stdout.write("\n");
  return { source, chunksProcessed, chunksSkipped };
}

/**
 * Liest eine beliebige Textdatei (.txt, .ts, .js, .csv, …) und speichert den Inhalt.
 * Nützlich für Code-Dokumentation, Protokolle oder sonstige Textformate.
 */
export async function ingestTextFile(
  filePath: string,
  source: string
): Promise<IngestResult> {
  const content = readFileSync(filePath, "utf-8");
  const ext = filePath.split(".").pop() ?? "txt";
  return ingestText(content, source, { format: ext });
}

/**
 * Verarbeitet eine HTML-Datei: Entfernt Tags, Skripte und Styles,
 * dekodiert HTML-Entitäten und speichert den reinen Fließtext.
 */
export async function ingestHtmlFile(
  filePath: string,
  source: string
): Promise<IngestResult> {
  const raw = readFileSync(filePath, "utf-8");
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();

  return ingestText(text, source, { format: "html" });
}

/**
 * Verarbeitet eine PDF-Datei: Extrahiert Text aus allen Seiten.
 */
export async function ingestPdfFile(
  filePath: string,
  source: string
): Promise<IngestResult> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (
    buffer: Buffer,
    options?: object
  ) => Promise<{ text: string; numpages: number }>;

  const buffer = readFileSync(filePath);
  const { text, numpages } = await pdfParse(buffer);
  const cleaned = text.replace(/\s{3,}/g, "\n\n").trim();

  return ingestText(cleaned, source, { format: "pdf", pages: numpages });
}

/**
 * Verarbeitet eine beliebige JSON-Datei.
 * Unterstützt Arrays von Objekten UND einzelne Objekte.
 * Jeder Eintrag wird zu einem lesbaren Text serialisiert.
 */
export async function ingestGenericJson(
  filePath: string,
  source: string
): Promise<IngestResult> {
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as unknown;

  const items: unknown[] = Array.isArray(data) ? data : [data];

  const text = items
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return Object.entries(item as Record<string, unknown>)
          .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
          .map(([k, v]) =>
            typeof v === "object"
              ? `${k}: ${JSON.stringify(v)}`
              : `${k}: ${String(v)}`
          )
          .join(" | ");
      }
      return String(item);
    })
    .filter((t) => t.length > 10)
    .join("\n\n");

  return ingestText(text, source, { format: "json", itemCount: items.length });
}

/**
 * Verarbeitet eine Excel-Datei (.xlsx / .xls) zur Wissensbasis.
 * Die erste Zeile wird als Spaltenüberschriften interpretiert.
 * Jede Datenzeile wird als eigenständiger Text-Chunk gespeichert.
 * Leere Zellen werden übersprungen.
 */
export async function ingestExcelFile(
  filePath: string,
  source: string,
  sheetName?: string
): Promise<IngestResult> {
  // Dynamischer Import damit xlsx nur für Ingestion-Scripts geladen wird
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx") as typeof import("xlsx");

  const workbook = XLSX.readFile(filePath);
  const targetSheet = sheetName ?? workbook.SheetNames[0];
  const worksheet = workbook.Sheets[targetSheet];

  if (!worksheet) {
    throw new Error(
      `Sheet "${targetSheet}" nicht gefunden. Verfügbare Sheets: ${workbook.SheetNames.join(", ")}`
    );
  }

  // Zeilen als Objekte (erste Zeile = Header)
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false, // Alle Werte als Strings
  });

  if (rows.length === 0) {
    return { source, chunksProcessed: 0, chunksSkipped: 0 };
  }

  // Jede Zeile → lesbarer Text: "Spalte1: Wert1 | Spalte2: Wert2 | ..."
  const rowTexts = rows.map((row) => {
    return Object.entries(row)
      .filter(([, val]) => String(val).trim().length > 0)
      .map(([key, val]) => `${key}: ${String(val).trim()}`)
      .join(" | ");
  }).filter((text) => text.length > 20);

  const combinedText = rowTexts.join("\n\n");
  return ingestText(combinedText, source, { format: "excel", sheet: targetSheet, rowCount: rows.length });
}

/**
 * Löscht alle Einträge einer Quelle (oder alle wenn kein source angegeben).
 * Nützlich für Re-Ingestion nach Dokumentänderungen.
 */
export async function clearKnowledgeBase(source?: string): Promise<number> {

  if (source) {
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM nutri_knowledge WHERE source = $1`,
      source
    );
    return result;
  }

  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM nutri_knowledge`
  );
  return result;
}
