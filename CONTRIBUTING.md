# Contributing Guide

Danke fuer deinen Beitrag zu mein-nutrikompass.de.

## Workflow

1. Fork erstellen und Branch anlegen:
   - `feature/<name>` fuer Features
   - `fix/<name>` fuer Fehlerbehebungen
2. Aenderungen klein und fokussiert halten.
3. Lint/Build lokal pruefen:
   - `npm run lint`
   - `npm run build`
4. Pull Request mit klarer Beschreibung erstellen.

## Commit-Konvention

Empfohlenes Prefix:

- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `chore:`

Beispiel: `feat: add meal plan PDF export`

## Pull Request Checklist

- [ ] Code ist lesbar und konsistent
- [ ] Keine Secrets oder Zugangsdaten committed
- [ ] README/Docs bei Bedarf aktualisiert
- [ ] Relevante Tests oder manuelle Checks dokumentiert

## Code Style

- TypeScript strict und klar typisiert
- Kleine, wiederverwendbare Komponenten
- Keine ungenutzten Imports/Variablen

## Security

Bitte Sicherheitsluecken nicht oeffentlich als Issue posten.
Verwende stattdessen den Prozess in `SECURITY.md`.
