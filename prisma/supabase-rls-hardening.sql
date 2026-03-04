-- ============================================================
-- Supabase RLS hardening for public tables (Prisma-managed schema)
-- Safe to run multiple times in the Supabase SQL Editor.
-- ============================================================

ALTER TABLE public."WeightEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MealPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ShoppingList" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AutonomyAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AutonomyAgreement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."StaffInvitation" ENABLE ROW LEVEL SECURITY;

-- Security Advisor Errors (2025-03): fehlende RLS auf 3 Tabellen
ALTER TABLE public.nutri_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DailyEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditEvent" ENABLE ROW LEVEL SECURITY;

-- Optional verification (run separately):
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN (
--     'WeightEntry', 'Patient', 'MealPlan', 'ShoppingList', 'Organization',
--     'AutonomyAuditLog', 'User', 'AutonomyAgreement', 'StaffInvitation',
--     'nutri_knowledge', 'DailyEntry', 'AuditEvent'
--   );

-- ============================================================
-- Security Advisor Warnings (2025-03)
-- ============================================================

-- Warning 1: Function Search Path Mutable – match_nutri_knowledge
-- Setzt expliziten search_path um Schema-Injection zu verhindern.
-- Funktionssignatur: (query_embedding vector(1536), match_count int, similarity_threshold float)
-- Reihenfolge laut supabase-rag-migration.sql: vector, integer, double precision
ALTER FUNCTION public.match_nutri_knowledge(vector, integer, double precision)
  SET search_path = '';

-- Warning 2: Extension in Public (public.vector / pgvector)
-- NICHT beheben: Das Verschieben nach 'extensions' würde nutri_knowledge-Tabelle
-- und match_nutri_knowledge-Funktion brechen (vector-Typ-Referenzen).
-- Supabase stuft dies als Low-Priority-Warnung ein – kein Sicherheitsrisiko.
