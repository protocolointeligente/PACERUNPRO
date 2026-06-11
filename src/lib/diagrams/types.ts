export interface PlayerElement {
  type: "player";
  x: number;
  y: number;
  color: string;
  label: string;
}

export interface BallElement {
  type: "ball";
  x: number;
  y: number;
}

export interface ConeElement {
  type: "cone";
  x: number;
  y: number;
}

export interface ArrowElement {
  type: "arrow";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  dash?: boolean;
  label?: string;
}

export interface ZoneElement {
  type: "zone";
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  color: string;
}

export interface MiniGoalElement {
  type: "miniGoal";
  x: number;
  y: number;
}

export type DiagramElement =
  | PlayerElement
  | BallElement
  | ConeElement
  | ArrowElement
  | ZoneElement
  | MiniGoalElement;

export interface DiagramSpec {
  pattern: string;
  elements: DiagramElement[];
}

/** Common tactical colors used throughout the diagram bank. */
export const DIAGRAM_COLORS = {
  team: "#ffffff",
  opponent: "#ff5a52",
  support: "#65c7ff",
  pass: "#ffd166",
  progress: "#8ef5b6",
} as const;
