-- ============================================================
-- Nutrikompass RAG Migration
-- Aktiviert pgvector und erstellt die nutri_knowledge Tabelle
--
-- Ausführen: Supabase Dashboard → SQL-Editor → Run
-- ============================================================

-- 1. pgvector Extension aktivieren
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Wissensbasis-Tabelle für Embedding-Chunks
CREATE TABLE IF NOT EXISTS nutri_knowledge (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source       TEXT        NOT NULL,          -- Dateiname, z.B. "allergene-leitfaden.md"
  chunk_index  INTEGER     NOT NULL,          -- Position des Chunks in der Quelldatei
  content      TEXT        NOT NULL,          -- Rohtext des Chunks
  embedding    vector(1536) NOT NULL,         -- OpenAI text-embedding-3-small (1536 dims)
  metadata     JSONB       DEFAULT '{}',      -- Beliebige Zusatzdaten (Autor, Kategorie, etc.)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Verhindert doppelte Ingestion der gleichen Quelle+Chunk-Kombination
CREATE UNIQUE INDEX IF NOT EXISTS nutri_knowledge_source_chunk_idx
  ON nutri_knowledge (source, chunk_index);

-- 3. HNSW-Index für performante Cosine-Similarity-Suche
--    m=16 und ef_construction=64 sind gute Defaults für <1M Einträge
CREATE INDEX IF NOT EXISTS nutri_knowledge_embedding_idx
  ON nutri_knowledge
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- 4. Stored Function für Ähnlichkeitssuche
--    Wird von getNutriContext() via Prisma $queryRaw aufgerufen
CREATE OR REPLACE FUNCTION match_nutri_knowledge(
  query_embedding      vector(1536),
  match_count          INT     DEFAULT 5,
  similarity_threshold FLOAT   DEFAULT 0.7
)
RETURNS TABLE (
  id         UUID,
  source     TEXT,
  content    TEXT,
  metadata   JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nk.id,
    nk.source,
    nk.content,
    nk.metadata,
    (1 - (nk.embedding <=> query_embedding))::FLOAT AS similarity
  FROM nutri_knowledge nk
  WHERE (1 - (nk.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY nk.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Überprüfung nach Ausführung:
--   SELECT * FROM nutri_knowledge LIMIT 5;
--   SELECT match_nutri_knowledge('[0.1, 0.2, ...]'::vector, 3, 0.5);
-- ============================================================
