export function uniq<T>(arr: readonly (T | null | undefined | false | 0 | "")[] | null | undefined): T[] {
  return Array.from(new Set((arr ?? []).filter(Boolean) as T[]));
}
