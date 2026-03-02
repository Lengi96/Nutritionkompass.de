/**
 * getNutriContext
 *
 * Retrieves domain-specific nutrition knowledge from the vector database
 * via cosine similarity search. Used to ground LLM prompts in factual
 * dietary/allergy/medical context before meal plan generation.
 */

import { getOpenAIClient } from "@/lib/openai/client";
import { prisma } from "@/lib/prisma";

const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_TOP_K = 5;
const DEFAULT_SIMILARITY_THRESHOLD = 0.7;

interface KnowledgeRow {
  id: string;
  source: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * Sucht relevante Ernährungsinfo für eine Anfrage und gibt sie als
 * formatierten Kontext-String zurück, der direkt in den System-Prompt
 * eingebaut werden kann.
 *
 * Gibt einen leeren String zurück wenn keine relevanten Chunks gefunden
 * werden (z.B. leere Wissensbasis) — generateMealPlan läuft dann ohne RAG.
 */
export async function getNutriContext(
  query: string,
  topK = DEFAULT_TOP_K,
  similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD
): Promise<string> {
  // 1. Query-Embedding generieren
  let queryEmbedding: number[];
  try {
    const response = await getOpenAIClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: query.replace(/\n/g, " "),
    });
    queryEmbedding = response.data[0].embedding;
  } catch {
    // Embedding-API nicht verfügbar → kein RAG-Kontext, kein Fehler
    return "";
  }

  // 2. Cosine-Similarity-Suche via pgvector
  let rows: KnowledgeRow[];
  try {
    const embeddingStr = `[${queryEmbedding.join(",")}]`;
    rows = await prisma.$queryRawUnsafe<KnowledgeRow[]>(
      `SELECT id, source, content, metadata, similarity
       FROM match_nutri_knowledge($1::vector, $2, $3)`,
      embeddingStr,
      topK,
      similarityThreshold
    );
  } catch {
    // Tabelle existiert noch nicht (Migration nicht ausgeführt) → kein Fehler
    return "";
  }

  if (!rows || rows.length === 0) return "";

  // 3. Chunks zu lesbarem Kontext-Block zusammenführen
  const contextLines = rows.map(
    (row) => `- [${row.source}] ${row.content.trim()}`
  );

  return [
    "[Relevantes Ernährungswissen aus Wissensbasis]",
    ...contextLines,
    "",
  ].join("\n");
}
