import { auth } from "@/auth";
import type { Session } from "next-auth";

export class AuthSessionError extends Error {
  cause: unknown;

  constructor(cause: unknown) {
    super("Failed to resolve authenticated session");
    this.name = "AuthSessionError";
    this.cause = cause;
  }
}

function isNextDynamicServerError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const maybeDynamic = error as Error & {
    digest?: string;
    description?: string;
  };

  return (
    maybeDynamic.digest === "DYNAMIC_SERVER_USAGE" ||
    maybeDynamic.description?.includes("couldn't be rendered statically") === true ||
    error.message.includes("Dynamic server usage")
  );
}

/**
 * Resolves the current Auth.js session.
 *
 * A missing/anonymous session is still returned as null by Auth.js. Runtime
 * failures are re-thrown so API handlers and server components surface a real
 * 500 instead of disguising database/Auth.js errors as "not logged in".
 */
export async function getSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch (error) {
    if (isNextDynamicServerError(error)) {
      throw error;
    }

    console.error("[AUTH SESSION ERROR]", error);
    throw new AuthSessionError(error);
  }
}
