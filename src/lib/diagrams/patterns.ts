import raw from "./raw/patterns.json";
import type { DiagramElement } from "./types";

export const DIAGRAM_PATTERNS = raw as unknown as Record<string, DiagramElement[]>;

export const DEFAULT_PATTERN = "posse";

export const PATTERN_KEYS = Object.keys(DIAGRAM_PATTERNS);
