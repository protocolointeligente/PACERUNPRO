"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/data/categories";
import { FOCI, FOCUS_KEYS, type FocusKey } from "@/lib/data/foci";
import { POSITIONS, POSITION_KEYS, type PositionKey } from "@/lib/data/positions";
import { STRUCTURES } from "@/lib/data/structures";
import { gerarTreino, type LessonPlan } from "@/lib/planner/generate";
import { FUNDAMENTO_GROUP_KEYS, FUNDAMENTO_GROUP_LABELS, groupFundamentos } from "@/lib/planner/groups";
import { fundamentosPara, objetivosPara } from "@/lib/planner/lists";
import type { PlannerConfig } from "@/lib/planner/types";
import { loadCustomPriorities } from "@/lib/storage";

const TEMPOS = [40, 50, 60, 70, 80, 90, 100];
const NIVEIS = ["Inicial", "Intermediário", "Avançado", "Competitivo"];
const ESPACOS = ["Quadra", "Campo reduzido", "Meio campo", "Campo inteiro"];

interface PlannerWizardProps {
  onPlanGenerated: (plan: LessonPlan) => void;
}

export function PlannerWizard({ onPlanGenerated }: PlannerWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [categoria, setCategoria] = useState<CategoryKey>("sub-13");
  const [foco, setFoco] = useState<FocusKey>("misto");
  const [posicao, setPosicao] = useState<PositionKey>("geral");
  const [estrutura, setEstrutura] = useState("todas");
  const [tempo, setTempo] = useState(60);
  const [atletas, setAtletas] = useState(16);
  const [nivel, setNivel] = useState("Intermediário");
  const [espaco, setEspaco] = useState("Meio campo");

  const [objetivosOptions, setObjetivosOptions] = useState<string[]>([]);
  const [objetivosSelected, setObjetivosSelected] = useState<Set<string>>(new Set());
  const [fundamentosOptions, setFundamentosOptions] = useState<string[]>([]);
  const [fundamentosSelected, setFundamentosSelected] = useState<Set<string>>(new Set());

  function refreshLists(cat: CategoryKey, f: FocusKey, pos: PositionKey) {
    const customPriorities = loadCustomPriorities();
    const objs = objetivosPara(cat, f, pos, customPriorities);
    const funds = fundamentosPara(cat, f, pos);
    setObjetivosOptions(objs);
    setObjetivosSelected(new Set(objs.slice(0, 4)));
    setFundamentosOptions(funds);
    setFundamentosSelected(new Set(funds.slice(0, 8)));
  }

  useEffect(() => {
    // Reads custom priorities from localStorage, so it must run after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshLists(categoria, foco, posicao);
  }, [categoria, foco, posicao]);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function handleGerar() {
    const cfg: PlannerConfig = {
      categoria,
      foco,
      posicao,
      estrutura,
      tempo,
      atletas,
      nivel,
      espaco,
      objetivos: Array.from(objetivosSelected),
      fundamentos: Array.from(fundamentosSelected),
    };
    onPlanGenerated(gerarTreino(cfg, loadCustomPriorities()));
  }

  const fundamentoGroups = groupFundamentos(fundamentosOptions);

  return (
    <div className="card p-4.5">
      <div className="mb-4.5 flex items-center gap-3">
        <StepBadge n={1} label="Configuração" active={step === 1} />
        <div className="h-0.5 flex-1 rounded-full" style={{ background: step === 2 ? "var(--accent)" : "var(--line)" }} />
        <StepBadge n={2} label="Objetivos e fundamentos" active={step === 2} />
      </div>

      {step === 1 ? (
        <div>
          <h2 className="m-0 mb-4 text-[19px] font-bold tracking-tight">Configurar aula</h2>

          <div className="mb-3.5">
            <label className="field-label" htmlFor="categoria">
              Categoria
            </label>
            <select id="categoria" className="field-input" value={categoria} onChange={(e) => setCategoria(e.target.value as CategoryKey)}>
              {CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {CATEGORIES[key].label} • {CATEGORIES[key].idade}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3.5 grid grid-cols-2 gap-2.5">
            <div>
              <label className="field-label" htmlFor="foco">
                Foco
              </label>
              <select id="foco" className="field-input" value={foco} onChange={(e) => setFoco(e.target.value as FocusKey)}>
                {FOCUS_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {FOCI[key]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="posicao">
                Posição
              </label>
              <select id="posicao" className="field-input" value={posicao} onChange={(e) => setPosicao(e.target.value as PositionKey)}>
                {POSITION_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {POSITIONS[key].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3.5">
            <label className="field-label" htmlFor="estrutura">
              Estrutura funcional
            </label>
            <select id="estrutura" className="field-input" value={estrutura} onChange={(e) => setEstrutura(e.target.value)}>
              {STRUCTURES.map((s) => (
                <option key={s} value={s}>
                  {s === "todas" ? "Todas" : s}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3.5 grid grid-cols-2 gap-2.5">
            <div>
              <label className="field-label" htmlFor="tempo">
                Tempo
              </label>
              <select id="tempo" className="field-input" value={tempo} onChange={(e) => setTempo(Number(e.target.value))}>
                {TEMPOS.map((t) => (
                  <option key={t} value={t}>
                    {t} min
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="atletas">
                Atletas
              </label>
              <input
                id="atletas"
                type="number"
                min={4}
                max={34}
                value={atletas}
                onChange={(e) => setAtletas(Number(e.target.value))}
                className="field-input"
              />
            </div>
          </div>

          <div className="mb-4.5 grid grid-cols-2 gap-2.5">
            <div>
              <label className="field-label" htmlFor="nivel">
                Nível
              </label>
              <select id="nivel" className="field-input" value={nivel} onChange={(e) => setNivel(e.target.value)}>
                {NIVEIS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="espaco">
                Espaço
              </label>
              <select id="espaco" className="field-input" value={espaco} onChange={(e) => setEspaco(e.target.value)}>
                {ESPACOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button type="button" className="btn w-full" onClick={() => setStep(2)}>
            Continuar
          </button>
        </div>
      ) : (
        <div>
          <h2 className="m-0 mb-4 text-[19px] font-bold tracking-tight">Objetivos e fundamentos</h2>

          <div className="mb-3.5">
            <div className="field-label">Fundamentos / princípios</div>
            <div className="grid gap-2.5">
              {FUNDAMENTO_GROUP_KEYS.map((groupKey) => {
                const items = fundamentoGroups[groupKey];
                if (items.length === 0) return null;
                return (
                  <div key={groupKey}>
                    <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "var(--accent2)" }}>
                      {FUNDAMENTO_GROUP_LABELS[groupKey]}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((f) => (
                        <button
                          key={f}
                          type="button"
                          className={`chip-toggle ${fundamentosSelected.has(f) ? "active" : ""}`}
                          onClick={() => toggle(fundamentosSelected, setFundamentosSelected, f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2.5 rounded-xl border px-2.5 py-1.5 text-xs" style={{ borderColor: "rgba(34,197,94,.22)", background: "rgba(48,209,88,.10)", color: "var(--ok)" }}>
              {fundamentosOptions.length} opções carregadas • {fundamentosSelected.size} selecionadas
            </div>
          </div>

          <div className="mb-4.5">
            <div className="field-label">Objetivos pré-estabelecidos</div>
            <div className="checklist">
              {objetivosOptions.map((o) => (
                <label key={o} className="check-item">
                  <input type="checkbox" checked={objetivosSelected.has(o)} onChange={() => toggle(objetivosSelected, setObjetivosSelected, o)} />
                  <span>{o}</span>
                </label>
              ))}
            </div>
            <div className="mt-1.5 rounded-xl border px-2.5 py-1.5 text-xs" style={{ borderColor: "rgba(34,197,94,.22)", background: "rgba(48,209,88,.10)", color: "var(--ok)" }}>
              {objetivosOptions.length} opções carregadas • {objetivosSelected.size} selecionadas
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
              Voltar
            </button>
            <button type="button" className="btn" onClick={handleGerar}>
              Gerar treino inteligente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepBadge({ n, label, active }: { n: number; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="grid h-7 w-7 flex-none place-items-center rounded-full text-xs font-black"
        style={{
          background: active ? "var(--accent)" : "var(--panel2)",
          color: active ? "#fff" : "var(--muted)",
          border: active ? "none" : "1px solid var(--line)",
        }}
      >
        {n}
      </span>
      <span className="hidden text-xs font-extrabold uppercase tracking-wider sm:inline" style={{ color: active ? "var(--text)" : "var(--muted)" }}>
        {label}
      </span>
    </div>
  );
}
