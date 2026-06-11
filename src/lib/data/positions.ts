import raw from "./raw/positions.json";

export interface PositionInfo {
  label: string;
  objetivos: string[];
  fundamentos: string[];
}

export type PositionKey =
  | "geral"
  | "goleiro"
  | "zagueiro"
  | "lateral"
  | "volante"
  | "meia"
  | "extremo"
  | "atacante";

export const POSITIONS = raw as unknown as Record<PositionKey, PositionInfo>;

export const POSITION_KEYS = Object.keys(POSITIONS) as PositionKey[];
