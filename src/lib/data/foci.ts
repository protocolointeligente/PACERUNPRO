import raw from "./raw/foci.json";

export type FocusKey = "misto" | "tecnico" | "tatico" | "cognitivo" | "fisico";

export const FOCI = raw as unknown as Record<FocusKey, string>;

export const FOCUS_KEYS = Object.keys(FOCI) as FocusKey[];
