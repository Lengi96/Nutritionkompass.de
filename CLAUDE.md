# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nutrikompass** — AI-assisted meal planning for therapeutic institutions focused on eating disorders in adolescents. Clinical teams use it to generate, approve, and hand off meal plans including shopping lists, patient management, and PDF export.

## Commands

```bash
# Development
npm run dev                  # Start dev server (localhost:3000)
npm run build                # Production build (runs legal:check + env:check first)
npm run lint                 # ESLint

# Database
npm run db:generate          # Regenerate Prisma Client after schema changes
npm run db:migrate           # Run Prisma migrations (dev)
npm run db:push              # Push schema to DB without migration history
npm run db:seed              # Seed database
npm run db:studio            # Open Prisma Studio

# Testing
npm run test:ai-eval         # AI benchmark (5 clinical scenarios, LLM-as-judge)
npm run test:security        # Security QA suite (15 adversarial prompts)
npm run test:smoke           # Playwright smoke tests
npm run test:e2e             # Full Playwright E2E suite

# Knowledge base ingestion
npx tsx scripts/ingest-knowledge.ts knowledge/allergene.md
npx tsx scripts/ingest-knowledge.ts knowledge/rezepte.xlsx  # .md .json .xlsx .pdf .html .ts .txt .csv

# Scripts (use tsx, not ts-node)
npx tsx scripts/<script>.ts
```

## Architecture

### Request Flow

```
Browser → Next.js App Router
  → tRPC HTTP Handler (/api/trpc/[trpc])
    → init.ts (createContext: session + prisma)
    → protectedProcedure / adminProcedure middleware
    → Router (patients / mealPlans / shoppingList / organization / billing / staff / autonomy)
      → AI security guard → generateMealPlan() → RAG context → OpenAI
```

### Key Structural Patterns

**tRPC** (`src/trpc/`):
- `init.ts` — defines `publicProcedure`, `protectedProcedure` (auth check), `adminProcedure` (ADMIN role check). Context always includes `session` and `prisma`.
- `routers/_app.ts` — root router combining all sub-routers
- `server.ts` — `serverApi` caller for Server Components
- `client.tsx` — client-side tRPC provider

**Auth** (`src/server/auth`): NextAuth v5-beta. Session includes `user.organizationId` and `user.role`.

**AI Pipeline** (`src/lib/openai/`):
- `client.ts` — lazy singleton `getOpenAIClient()`, never instantiate directly
- `nutritionPrompt.ts` — `generateMealPlan()` with Zod schemas (`MealPlanData`, `mealPlanSchema`). Automatically fetches RAG context before generation.

**RAG** (`src/lib/rag/`):
- `ingestion.ts` — ingest documents into pgvector
- `getNutriContext.ts` — converts query → embedding → `$queryRawUnsafe` → context string
- Vector ops use `prisma.$queryRawUnsafe` (no Supabase JS client)
- pgvector table: `nutri_knowledge` (set up via `supabase-rag-migration.sql`, not Prisma migrations)

**AI Security** (`src/lib/ai-security/guardrails.ts`):
- `validateInput()` — two-stage: Regex (~0ms) → LLM classifier (~300ms). Timeout (3s) → reject.
- `sanitizeOutput()` — suppresses prompt leakage, UUIDs, internal paths
- Integrated into `mealPlans.generate` tRPC procedure

**Database** (`prisma/schema.prisma`):
- Multi-tenant: every entity scoped to `organizationId`
- Key models: `Organization`, `User` (roles: ADMIN/STAFF), `Patient` (pseudonymized), `MealPlan` (planJson: Json), `ShoppingList`, `AutonomyAgreement`, `AutonomyAuditLog`
- Subscription via Stripe: `SubscriptionPlan` (TRIAL/BASIC/PROFESSIONAL), `SubscriptionStatus`
- PgBouncer: `DATABASE_URL` uses port 6543 + `?pgbouncer=true`; `DIRECT_URL` port 5432 for migrations

**App Router** (`src/app/`):
- `(auth)/` — public auth pages
- `(dashboard)/` — protected app shell
- `(public)/` — public-facing pages
- `api/` — REST endpoints: `auth/`, `chat/` (streaming AI), `trpc/`, `webhooks/` (Stripe)

## Important Conventions

- `prisma` is a singleton export (`export const prisma = ...`), not a function — import and use directly
- All scripts use `tsx` and `dotenv` (`require("dotenv").config({ path: ".env" })`)
- Zod v4 is used (`zod@^4`) — API may differ from v3 in some areas
- Patient data is always pseudonymized — no real names in prompts or logs
- `AutonomyAuditLog` is append-only — never update or delete entries

## CI/CD

On every PR to `main`:
1. **AI Quality Gate** (`.github/workflows/ai-eval.yml`) — exits 1 if accuracy < 90% or hard constraint (allergen) violated
2. Netlify preview build

Production deploys to Netlify manually after merge.
