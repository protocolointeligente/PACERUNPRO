/**
 * Structured logger with Sentry integration.
 * In production: JSON lines to stdout (captured by Vercel log drain).
 * In development: pretty-printed to console.
 */

import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function serialize(level: LogLevel, message: string, ctx?: LogContext): string {
  return JSON.stringify({
    level,
    message,
    ts: new Date().toISOString(),
    ...ctx,
  });
}

function log(level: LogLevel, message: string, ctx?: LogContext): void {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    // Structured JSON for log drain / Vercel
    const line = serialize(level, message, ctx);
    if (level === "error" || level === "warn") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  } else {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[${level.toUpperCase()}] ${message}`, ctx ?? "");
  }
}

export const logger = {
  debug: (message: string, ctx?: LogContext) => log("debug", message, ctx),
  info:  (message: string, ctx?: LogContext) => log("info", message, ctx),
  warn:  (message: string, ctx?: LogContext) => log("warn", message, ctx),
  error: (message: string, ctx?: LogContext) => {
    log("error", message, ctx);
    // Forward to Sentry
    const err = ctx?.err instanceof Error ? ctx.err : new Error(message);
    Sentry.captureException(err, { extra: ctx });
  },
};
