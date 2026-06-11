import { DEFAULT_PATTERN, DIAGRAM_PATTERNS } from "./patterns";
import type { DiagramElement, DiagramSpec } from "./types";

/**
 * Resolves the diagram spec for an exercise's pattern, falling back to a
 * generic possession diagram when the pattern is unknown.
 */
export function diagramFor(pattern: string): DiagramSpec {
  const key = DIAGRAM_PATTERNS[pattern] ? pattern : DEFAULT_PATTERN;
  return { pattern: key, elements: DIAGRAM_PATTERNS[key] };
}

export function cloneElements(elements: DiagramElement[]): DiagramElement[] {
  return elements.map((el) => ({ ...el }));
}
