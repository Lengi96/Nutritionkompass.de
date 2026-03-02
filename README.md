# mein-nutrikompass.de

KI-gestützte Ernährungsplanung für therapeutische Einrichtungen — spezialisiert auf Essstörungen bei Jugendlichen.

Die Anwendung unterstützt klinische Teams bei der strukturierten Planung, Freigabe und Übergabe von Ernährungsplänen inklusive Einkaufslisten, Patientenverwaltung und PDF-Export.

---

## Funktionsumfang

### Ernährungsplanung
- Flexible Planungszeiträume: 1, 3, 7 oder bis 14 Tage
- Optionale feste Mahlzeiten über den gesamten Plan (z. B. Frühstück täglich gleich)
- Detaillierte Rezeptausgaben mit Mengen, Zubereitungsschritten und Küchentipps
- Hintergrund-Generierung mit Fortschrittsanzeige und Echtzeit-Benachrichtigung im UI
- Dynamische Tages-Tabs je nach Planlänge
- Automatische Einkaufslisten aus generierten Plänen
- Einkaufslisten-Ansicht (Woche / Alle) mit Löschfunktion
- PDF-Export für Ernährungspläne und Einkaufslisten

### RAG-Wissensbasis (Retrieval-Augmented Generation)
- Vektordatenbank via Supabase pgvector (HNSW-Index, cosine similarity)
- Ingestion-CLI für alle gängigen Formate: `.md`, `.json`, `.xlsx`, `.xls`, `.pdf`, `.html`, `.ts`, `.txt`, `.csv`
- Wissensquellen fließen automatisch als Kontext in LLM-Prompts ein
- Dokumente können einzeln oder vollständig re-ingested werden

### AI Eval Framework
- 5 klinische Benchmark-Szenarien (Allergie, Diabetes, Budget, Makros, Vielfalt)
- LLM-as-a-Judge via GPT-4o (medizinische Plausibilität, Compliance, Empathie)
- GitHub Actions CI Quality Gate: blockiert Merges bei < 90 % Genauigkeit
- Hard-Constraint-Prüfung: automatischer Exit bei Allergen-Verletzungen

### AI Security Layer
- Zweistufiges Prompt-Injection-Guardrail: Regex-Check (~0 ms) → LLM-Classifier (~300 ms)
- Fail-Safe-Design: Timeout oder API-Fehler → Anfrage ablehnen
- Output-Sanitizer: unterdrückt System-Prompt-Leakage, UUIDs und interne Pfade
- 15-Adversarial-Prompts QA-Suite (Direktinjection, Exfiltration, Social Engineering)
- Integration in tRPC `mealPlans.generate` mit max. 2000 Zeichen Limit

### Plattform
- Rollen- und Teamfunktionen, Authentifizierung (NextAuth)
- Organisationskontext und Patientenverwaltung
- Billing via Stripe (Basic / Professional)
- Transaktionale E-Mails via Resend
- Error-Tracking via Sentry
- Rate-Limiting und DSGVO-konforme Datenspeicherung

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Sprache | TypeScript 5 |
| API-Schicht | tRPC v11 |
| Datenbank | Prisma v6 + PostgreSQL (Supabase) |
| Vektordatenbank | pgvector via Supabase |
| Auth | NextAuth v5 |
| Styling | Tailwind CSS + Radix UI |
| KI-Generierung | OpenAI API (gpt-4o-mini, text-embedding-3-small) |
| AI Eval | Vercel AI SDK + GPT-4o als Judge |
| Billing | Stripe |
| E-Mail | Resend |
| Monitoring | Sentry |
| PDF | @react-pdf/renderer |
| CI/CD | GitHub Actions + Netlify |

---

## Voraussetzungen

- Node.js 22+
- npm 10+
- Supabase-Projekt (PostgreSQL + pgvector)
- OpenAI API Key

---

## Lokales Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen anlegen

```bash
cp .env.example .env
```

Pflichtfelder in `.env`:

| Variable | Beschreibung |
|---|---|
| `DATABASE_URL` | Supabase Transaction Pooler (Port 6543, mit `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Direct Connection (Port 5432, für Migrationen) |
| `OPENAI_API_KEY` | OpenAI API Key |
| `NEXTAUTH_SECRET` | Beliebiger zufälliger String |
| `STRIPE_SECRET_KEY` | Stripe Secret Key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret |
| `RESEND_API_KEY` | Resend API Key |

### 3. Datenbank einrichten

```bash
# Prisma Client generieren
npm run db:generate

# Schema migrieren
npm run db:migrate

# pgvector + RAG-Tabelle anlegen (einmalig im Supabase SQL-Editor ausführen)
# → supabase-rag-migration.sql
```

### 4. Wissensbasis befüllen (optional)

```bash
# Markdown-Dokument einlesen
npx tsx scripts/ingest-knowledge.ts knowledge/allergene.md

# Excel-Datei (erste Zeile = Spaltenüberschriften)
npx tsx scripts/ingest-knowledge.ts knowledge/rezepte.xlsx

# PDF-Dokument
npx tsx scripts/ingest-knowledge.ts knowledge/leitfaden.pdf

# Alle Formate anzeigen
npx tsx scripts/ingest-knowledge.ts --help
```

### 5. Dev-Server starten

```bash
npm run dev
```

App läuft unter: `http://localhost:3000`

---

## Scripts

| Script | Beschreibung |
|---|---|
| `npm run dev` | Development Server |
| `npm run build` | Production Build (inkl. Legal- und Env-Check) |
| `npm run start` | Production Server |
| `npm run lint` | ESLint |
| `npm run db:generate` | Prisma Client generieren |
| `npm run db:migrate` | Prisma Migrationen (Dev) |
| `npm run db:push` | Schema direkt in DB pushen |
| `npm run db:seed` | Seed ausführen |
| `npm run db:studio` | Prisma Studio öffnen |
| `npm run test:ai-eval` | AI Benchmark (5 Szenarien, LLM-as-a-Judge) |
| `npm run test:security` | Security QA (15 Adversarial Prompts) |
| `npm run test:smoke` | Playwright Smoke Tests |
| `npm run env:check` | Umgebungsvariablen validieren |

---

## CI/CD

Bei jedem Pull Request auf `main` läuft automatisch:

1. **AI Quality Gate** (`.github/workflows/ai-eval.yml`) — blockiert Merge bei Qualitätsverlust
2. Netlify Preview-Build

Empfohlener Workflow:

1. Feature-Branch erstellen
2. Lokal testen (`npm run dev`, `npm run build`)
3. Pull Request öffnen → CI-Checks abwarten
4. Nach Merge: manuellen Netlify-Produktions-Deploy auslösen

---

## Sicherheit & Datenschutz

- Prompt-Injection-Schutz auf allen KI-Endpunkten
- Keine echten Patientennamen im Klartext in Prompts
- API-Keys und Secrets niemals committen (`.env` ist in `.gitignore`)
- Produktive Secrets ausschließlich über Netlify / GitHub Environment Variables setzen
- Weitere Details: `SECURITY.md`

---

## Contributing

Bitte zuerst `CONTRIBUTING.md` lesen.

## Lizenz

MIT — siehe `LICENSE`.
