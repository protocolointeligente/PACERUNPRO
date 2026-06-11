import raw from "./raw/posTemplates.json";
import type { PositionKey } from "./positions";

/** [title, fundamental, pattern] */
export type PosTemplate = [string, string, string];

export const posTemplates = raw as unknown as Record<Exclude<PositionKey, "geral">, PosTemplate[]>;
