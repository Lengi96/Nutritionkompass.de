# NutriKompass

NutriKompass ist eine KI-gestützte Ernährungsplanung für Einrichtungen.
Die Anwendung unterstützt Teams bei der strukturierten Planung, Freigabe und Übergabe von Ernährungsplänen inklusive Einkaufslisten.

## Aktueller Funktionsumfang

- Flexible Planungszeiträume: `1`, `3`, `7` oder bis `14` Tage
- Optionale feste Mahlzeiten über den ganzen Plan (z. B. Frühstück täglich gleich)
- Detaillierte Rezeptausgaben mit Mengen, Schritten und Küchentipps
- Hintergrund-Generierung mit Fortschrittsanzeige und Benachrichtigung im UI
- Dynamische Tages-Tabs je nach Planlänge
- Automatische Einkaufslisten aus Plänen
- Einkaufslisten-Ansicht (Woche/Alle) und Löschfunktion für Nutzer
- PDF-Export für Ernährungspläne und Einkaufslisten
- Rollen-/Teamfunktionen, Authentifizierung und Organisationskontext

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- tRPC
- Prisma + PostgreSQL
- NextAuth
- Tailwind CSS
- OpenAI API

## Voraussetzungen

- Node.js 20+
- npm 10+
- PostgreSQL-Datenbank
- OpenAI API Key

## Lokales Setup

1. Abhängigkeiten installieren

```bash
npm install
```

2. Umgebungsvariablen anlegen

```bash
cp .env.example .env
```

Danach Werte in `.env` eintragen.

3. Prisma Client generieren

```bash
npm run db:generate
```

4. Datenbank migrieren (Dev)

```bash
npm run db:migrate
```

5. Dev-Server starten

```bash
npm run dev
```

App läuft dann unter: `http://localhost:3000`

## Wichtige Scripts

- `npm run dev` - Development Server
- `npm run build` - Production Build
- `npm run start` - Production Server
- `npm run lint` - ESLint
- `npm run db:generate` - Prisma Client generieren
- `npm run db:migrate` - Prisma Migrationen (Dev)
- `npm run db:push` - Schema in DB pushen
- `npm run db:seed` - Seed ausführen
- `npm run db:studio` - Prisma Studio

## Deploy-Hinweis (Netlify)

Aktuell ist Auto-Build auf Netlify bewusst deaktiviert (`stop_builds=true`), damit lokal getestet und gesammelt deployt werden kann.

Empfohlener Ablauf:

1. Lokal entwickeln und testen (`npm run dev`, ggf. `npm run build`)
2. Änderungen gesammelt auf `main` pushen
3. Manuellen Netlify-Build/Deploy auslösen

## Sicherheit & Datenschutz

- Keine echten Patientennamen im Klartext verwenden
- API-Keys und Secrets niemals committen
- Produktive Secrets nur in sicheren Umgebungen setzen

## Contributing

Bitte zuerst `CONTRIBUTING.md` lesen.

## Lizenz

MIT-Lizenz, siehe `LICENSE`.
