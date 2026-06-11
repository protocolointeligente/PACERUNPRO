import raw from "./raw/baseThemes.json";
import type { FocusKey } from "./foci";

/** [title, focus, fundamentals, structures, pattern, description] */
export type BaseTheme = [string, FocusKey, string[], string[], string, string];

export const baseThemes = raw as unknown as BaseTheme[];
