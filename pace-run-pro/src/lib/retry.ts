/**
 * Exponential-backoff retry helper.
 * Usage:
 *   const data = await withRetry(() => fetch(...).then(r => r.json()), { retries: 3 });
 */

export interface RetryOptions {
  /** Max number of attempts (default 3). */
  retries?: number;
  /** Base delay in ms (default 500). Doubles each retry. */
  baseDelayMs?: number;
  /** Max delay cap in ms (default 16_000). */
  maxDelayMs?: number;
  /** Called before each retry with the error and attempt number. */
  onRetry?: (err: unknown, attempt: number) => void;
  /** Return true to abort retrying for this error (default: never abort). */
  shouldAbort?: (err: unknown) => boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const {
    retries = 3,
    baseDelayMs = 500,
    maxDelayMs = 16_000,
    onRetry,
    shouldAbort,
  } = opts;

  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (shouldAbort?.(err)) throw err;
      if (attempt === retries) break;
      onRetry?.(err, attempt);
      const wait = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await delay(wait);
    }
  }
  throw lastError;
}
