# Agent Chat Architecture (MVP)

## Ziel
- Chat-Assistenz für strukturierte Dateneingabe mit Confirm-before-write.
- Keine direkten Writes durch LLM.
- Tenant-safe Ausführung über tRPC Commit.

## Dataflow
1. Nutzer schreibt Nachricht in `/agent`.
2. `POST /api/agent/plan` erstellt aus Freitext einen `AgentPlan`:
   - `intentSummary`
   - `questions`
   - `proposedActions`
3. UI zeigt Vorschau + Rückfragen.
4. Optional `agent.preview` prüft Referenzen (Treffer/Mehrdeutigkeit).
5. Erst nach Bestätigung ruft UI `agent.commit` auf.
6. Commit schreibt Daten transaktional und erzeugt `AgentAuditLog`.

## Sicherheitsprinzipien
- Sessionpflicht auf API und tRPC.
- `organizationId` ausschließlich aus Session-Kontext, nie vom Client.
- Optional Admin-only Commit via `AGENT_COMMIT_ADMIN_ONLY` (Default: `true`).
- Keine vertraulichen Daten im LLM-Prompt (keine Session-/Tenant-IDs).
- Längen-/Mengenlimits:
  - Nachricht max 2000 Zeichen
  - max 10 Actions pro Plan
- LLM darf nur Vorschläge liefern, niemals Commit bestätigen.

## Schema
- Zod-strict Schemas in `src/lib/agent/schemas.ts`.
- Aktionen:
  - `PATIENT_CREATE`
  - `WEIGHT_ADD`
  - `MEALPLAN_DRAFT_CREATE`
- Datumsfelder: `YYYY-MM-DD`.
- Plausibilitätsgrenzen:
  - `weightKg`: 20-300

## Persistenz/Audit
- Model `AgentAuditLog`:
  - `organizationId`, `userId`, `createdAt`
  - `intentSummary`
  - `proposedActionsJson`
  - `committed`
  - `commitResultJson`
- Indexe:
  - `(organizationId, createdAt)`
  - `(userId, createdAt)`
  - `(createdAt)`

## Commit-Verhalten
- Alles in DB-Transaktion.
- `PATIENT_CREATE` erzeugt Patient + initialen WeightEntry.
- `WEIGHT_ADD` löst Patient per ID oder pseudonymisiertem Namen auf.
  - Mehrdeutigkeit => Blocker.
- `MEALPLAN_DRAFT_CREATE` erzeugt Draft-Record ohne KI-Generierung.

## TODO (nicht in MVP)
- Draft direkt mit bestehendem MealPlan-Generator anreichern.
- Asynchrone Jobs + Streaming Chat UI.
- Persistentes Rate-Limiting (Redis/Upstash).
- Organization-spezifische Policy Engine / Feature Flags.
