import type { CategoryKey } from "../data/categories";
import type { PositionKey } from "../data/positions";
import type { FocusKey } from "../data/foci";

export interface Exercise {
  id: number;
  title: string;
  focus: FocusKey;
  position: PositionKey;
  structure: string;
  fundamentals: string[];
  categories: CategoryKey[];
  pattern: string;
  source: string;
  objective: string;
  description: string;
  organization: string;
  execution: string;
  coaching: string;
}
