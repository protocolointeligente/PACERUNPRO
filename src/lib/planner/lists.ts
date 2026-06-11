import { CATEGORIES, type CategoryKey } from "../data/categories";
import { FOCI, type FocusKey } from "../data/foci";
import { POSITIONS, type PositionKey } from "../data/positions";
import { uniq } from "../utils";

export type CustomPriorities = Partial<Record<CategoryKey, string[]>>;

export function getPriorities(cat: CategoryKey, customPriorities: CustomPriorities): string[] {
  return customPriorities[cat] ?? CATEGORIES[cat].prioridades ?? [];
}

export function objetivosPara(
  cat: CategoryKey,
  foco: FocusKey,
  pos: PositionKey,
  customPriorities: CustomPriorities = {}
): string[] {
  return uniq([
    ...(CATEGORIES[cat].objetivos || []),
    ...(POSITIONS[pos].objetivos || []),
    `Aplicar foco ${FOCI[foco].toLowerCase()} em situação representativa`,
    ...getPriorities(cat, customPriorities).slice(0, 2),
  ]);
}

export function fundamentosPara(cat: CategoryKey, foco: FocusKey, pos: PositionKey): string[] {
  let f = [...(CATEGORIES[cat].fundamentos || []), ...(POSITIONS[pos].fundamentos || [])];
  if (foco === "tecnico") f = f.concat(["passe", "domínio", "condução", "finalização"]);
  if (foco === "tatico") f = f.concat(["apoio", "cobertura", "compactação", "transição"]);
  if (foco === "cognitivo") f = f.concat(["percepção", "tomada de decisão", "criatividade"]);
  if (foco === "fisico") f = f.concat(["coordenação", "mudança de direção", "reação"]);
  return uniq(f);
}
