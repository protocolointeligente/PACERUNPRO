import type { CategoryKey } from "../data/categories";
import type { FocusKey } from "../data/foci";
import type { PositionKey } from "../data/positions";

export interface PlannerConfig {
  categoria: CategoryKey;
  foco: FocusKey;
  posicao: PositionKey;
  estrutura: string;
  tempo: number;
  atletas: number;
  nivel: string;
  espaco: string;
  objetivos: string[];
  fundamentos: string[];
}
