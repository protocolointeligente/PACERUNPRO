import { CATEGORY_KEYS, type CategoryKey } from "../data/categories";
import { POSITIONS } from "../data/positions";
import type { FocusKey } from "../data/foci";
import { baseThemes } from "../data/baseThemes";
import { posTemplates } from "../data/posTemplates";
import { special } from "../data/special";
import { makeExercise } from "./factory";
import type { Exercise } from "./types";

const VARIANTS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const GROUPS: Record<string, CategoryKey[]> = {
  ludico: ["sub-5", "sub-7"],
  base: ["sub-9", "sub-10", "sub-11", "sub-12"],
  aper: ["sub-13", "sub-14", "sub-15"],
  comp: ["sub-17", "sub-20"],
  all: CATEGORY_KEYS,
};

const POS_AGE_GROUPS = ["base", "aper", "comp", "all"] as const;
const POS_FOCI: FocusKey[] = ["tecnico", "tatico", "misto"];
const POS_STRUCTURES = [
  "1x1",
  "2x1",
  "3x2",
  "4x4",
  "5x5",
  "jogo setorizado",
  "transição",
  "finalização",
  "saída de bola",
  "defesa em bloco",
  "jogo reduzido condicionado",
];

function createBank(): Exercise[] {
  const bank: Exercise[] = [];
  let id = 1;

  for (let i = 0; i < 210; i++) {
    const t = baseThemes[i % baseThemes.length];
    const v = VARIANTS[Math.floor(i / baseThemes.length) % VARIANTS.length];
    const group = ["ludico", "base", "aper", "comp", "all"][i % 5];
    const struct = t[3][i % t[3].length];
    const catsel = group === "all" ? CATEGORY_KEYS : GROUPS[group];
    bank.push(
      makeExercise(
        id++,
        `${t[0]} ${v}`,
        t[1],
        "geral",
        struct,
        t[2],
        catsel,
        t[4],
        i < 70 ? "Drive + base metodológica" : "Variação metodológica",
        t[5]
      )
    );
  }

  (Object.keys(posTemplates) as (keyof typeof posTemplates)[]).forEach((pos) => {
    for (let i = 0; i < 34; i++) {
      const templates = posTemplates[pos];
      const temp = templates[i % templates.length];
      const age = POS_AGE_GROUPS[i % POS_AGE_GROUPS.length];
      const focus = POS_FOCI[i % 3];
      const struct = POS_STRUCTURES[i % POS_STRUCTURES.length];
      const catsel = age === "all" ? CATEGORY_KEYS : GROUPS[age];
      bank.push(
        makeExercise(
          id++,
          `${temp[0]} ${i + 1}`,
          focus,
          pos,
          struct,
          [temp[1], ...(POSITIONS[pos].fundamentos || []).slice(0, 5)],
          catsel,
          temp[2],
          i < 10 ? "Drive + módulo por posição" : "Variação por posição",
          `Exercício específico para ${POSITIONS[pos].label.toLowerCase()}, com desenho tático coerente com ${temp[0].toLowerCase()}.`
        )
      );
    }
  });

  while (bank.length < 500) {
    const i = bank.length;
    const s = special[i % special.length];
    const pos = s[2];
    const catsel = i % 2 ? GROUPS.aper.concat(GROUPS.comp) : GROUPS.base.concat(GROUPS.aper);
    bank.push(
      makeExercise(
        id++,
        `${s[0]} ${(i % 37) + 1}`,
        s[1],
        pos,
        s[3],
        s[4].concat((POSITIONS[pos]?.fundamentos || []).slice(0, 2)),
        catsel,
        s[5],
        "Complemento técnico",
        "Variação complementar para ampliar repertório de planejamento sem perder coerência metodológica."
      )
    );
  }

  return bank.slice(0, 500);
}

let _exercises: Exercise[] | null = null;

export function getExercises(): Exercise[] {
  if (!_exercises) _exercises = createBank();
  return _exercises;
}
