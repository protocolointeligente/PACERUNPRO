import raw from "./raw/special.json";
import type { FocusKey } from "./foci";
import type { PositionKey } from "./positions";

/** [title, focus, position, structure, fundamentals, pattern] */
export type SpecialTemplate = [string, FocusKey, PositionKey, string, string[], string];

export const special = raw as unknown as SpecialTemplate[];
