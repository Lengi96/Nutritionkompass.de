import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,

  debug: false,

  beforeSend(event) {
    // Request-Body nicht an Sentry senden (enthält Patientendaten)
    if (event.request?.data) {
      event.request.data = "[REDACTED]";
    }
    return event;
  },
});
