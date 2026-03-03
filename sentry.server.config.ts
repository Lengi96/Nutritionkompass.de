import * as Sentry from "@sentry/nextjs";

// PII-Keywords die aus Error-Messages redaktiert werden (DSGVO Art. 9)
const PII_PATTERNS = [
  /Allergien:[^\n]*/gi,
  /autonomyNotes:[^\n]*/gi,
  /\d+[\.,]\d*\s*kg/gi,
  /Zielgewicht:[^\n]*/gi,
  /Notizen:[^\n]*/gi,
];

function redactPii(value: string): string {
  let result = value;
  for (const pattern of PII_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Tracing: 10 % der Server-Requests
  tracesSampleRate: 0.1,

  debug: false,

  beforeSend(event) {
    // Request-Body nicht an Sentry senden (enthält Patientendaten)
    if (event.request?.data) {
      event.request.data = "[REDACTED]";
    }

    // Extra-Felder mit PII entfernen
    if (event.extra) {
      delete event.extra.prompt;
      delete event.extra.promptUsed;
      delete event.extra.allergies;
      delete event.extra.autonomyNotes;
    }

    // Exception-Messages auf PII-Keywords prüfen und redaktieren
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (ex.value) {
          ex.value = redactPii(ex.value);
        }
      }
    }

    return event;
  },
});
