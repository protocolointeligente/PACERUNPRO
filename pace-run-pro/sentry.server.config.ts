import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.05,
  environment: process.env.NEXT_PUBLIC_ENV ?? process.env.NODE_ENV,
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
    "AbortError",
  ],
  beforeSend(event) {
    // Scrub sensitive fields
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      for (const key of ["password", "accessToken", "refreshToken", "token", "secret"]) {
        if (key in data) data[key] = "[Filtered]";
      }
    }
    return event;
  },
});
