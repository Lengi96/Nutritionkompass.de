# FHIR Interop Architecture (MVP)

## Ziel
- FHIR-first Mapping-Layer auf Basis bestehender Domänenmodelle einführen.
- Keine direkte TI/ePA-Integration.
- DSGVO-konforme, mandantenisolierte Exporte mit Audit-Logging.

## Scope (MVP)
- Ressourcen: `Patient`, `Observation` (Gewicht), `DocumentReference` (MealPlan, ShoppingList), `Bundle`.
- Export für einen Patienten, optional mit Zeitraum und Ressourcenauswahl.
- Synchroner Export über tRPC.

## Nicht-Ziele
- Kein HL7/FHIR Profiling gegen nationale IGs.
- Kein Import, keine bidirektionale Synchronisation.
- Keine zusätzlichen medizinischen Stammdaten (Diagnosen, Medikation etc.).

## Architekturbausteine
- `src/lib/fhir/types.ts`
  - Minimales FHIR R4 Type-Subset als TypeScript Interfaces.
- `src/lib/fhir/codes.ts`
  - Stabile Coding-Konstanten (LOINC/UCUM).
- `src/lib/fhir/mappers/*`
  - Domäne -> FHIR pro Ressource.
- `src/lib/fhir/bundle.ts`
  - Sammlung und Referenzierbarkeit in `Bundle(type=collection)`.
- `src/trpc/routers/fhir.ts`
  - Export-Endpunkt inkl. Tenant-Check, Rollencheck, Rate-Limit, Payload-Limit.
- `src/server/security/*`
  - FHIR-spezifische Guardrails (Validation, Rate-Limit, Audit Logging).
- `src/app/(dashboard)/fhir-export/page.tsx`
  - Admin-UI für Download als JSON-Datei.

## Datenmodell-Erweiterung (minimal-invasiv)
- `FhirExportAuditLog`:
  - `organizationId`, `userId`, `patientIds[]`, `resourceTypes[]`, `dateFrom`, `dateTo`, `payloadBytes`, `createdAt`.
- Externe IDs sind als spätere Erweiterung vorgesehen, im MVP aber nicht im Runtime-Modell.

## Mapping-Entscheidungen
- Patient:
  - `identifier.system = https://mein-nutrikompass.de/patient`
  - `identifier.value = patient.id`
  - `name` standardmäßig nicht gesetzt (optional pseudonymisierter `name.text` per Flag).
- Gewicht:
  - `WeightEntry -> Observation` mit LOINC `29463-7` (Body weight), UCUM `kg`.
- MealPlan/ShoppingList:
  - MVP als `DocumentReference` mit Base64 JSON im `attachment.data`.
  - Grund: bestehende `planJson/itemsJson` sind flexibel und ohne Strukturverlust exportierbar.

## Security / DSGVO
- Serverseitig:
  - `protectedProcedure` + Organisation aus Session.
  - zusätzlicher Patienten-Ownership-Check.
  - optional Admin-only Export (`FHIR_EXPORT_ADMIN_ONLY`, default: `true`).
- Abuse-Schutz:
  - Rate-Limit: 10 Exporte / Stunde / User (konfigurierbar).
  - Max-Payload: 5 MB (konfigurierbar), sonst kontrollierter Fehler.
- Audit:
  - Jeder erfolgreiche Export wird in `FhirExportAuditLog` geschrieben.
- Datenminimierung:
  - Keine Klarnamenfelder im Export; nur pseudonyme Identifikation.

## API (MVP)
- `fhir.exportPatientBundle`
  - Input: `patientId`, `dateFrom?`, `dateTo?`, `include`, `includePseudonymName?`
  - Output: `{ bundle, filename }`
  - Exportformat: FHIR `Bundle` mit `type: "collection"`.

## Betriebs-/Developer-Notes
- Migration:
  - SQL-Migration unter `prisma/migrations/20260305190000_add_fhir_export_audit_log/migration.sql`.
- Konfiguration:
  - `FHIR_EXPORT_ADMIN_ONLY` (`true|false`, default `true`)
  - `FHIR_EXPORT_RATE_LIMIT_MAX` (default `10`)
  - `FHIR_EXPORT_RATE_LIMIT_WINDOW_MS` (default `3600000`)
  - `FHIR_EXPORT_MAX_PAYLOAD_BYTES` (default `5242880`)

## Offene TODOs
- Async Export Jobs (Queue + persistente Artefakte).
- Signierte Attachments (`attachment.url`) statt Base64-Inline für große Exporte.
- Profilierung gegen HL7 DE / zukünftige TI-Anforderungen.
