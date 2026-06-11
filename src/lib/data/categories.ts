import raw from "./raw/categories.json";

export interface CategoryInfo {
  label: string;
  idade: string;
  stage: string;
  prioridades: string[];
  objetivos: string[];
  fundamentos: string[];
}

export type CategoryKey =
  | "sub-5"
  | "sub-7"
  | "sub-9"
  | "sub-10"
  | "sub-11"
  | "sub-12"
  | "sub-13"
  | "sub-14"
  | "sub-15"
  | "sub-17"
  | "sub-20";

export const CATEGORIES = raw as unknown as Record<CategoryKey, CategoryInfo>;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];
