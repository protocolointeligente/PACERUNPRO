"use client";

import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/data/categories";
import { FOCI, FOCUS_KEYS, type FocusKey } from "@/lib/data/foci";
import { POSITIONS, POSITION_KEYS, type PositionKey } from "@/lib/data/positions";
import { STRUCTURES } from "@/lib/data/structures";
import { gerarTreino, type LessonPlan } from "@/lib/planner/generate";
import { fundamentosPara, objetivosPara } from "@/lib/planner/lists";
import { planToText } from "@/lib/planner/text";
import type { PlannerConfig } from "@/lib/planner/types";
import { loadCustomPriorities } from "@/lib/storage";

const TEMPOS = [40, 50, 60, 70, 80, 90, 100];
const NIVEIS = ["Inicial", "Intermediário", "Avançado", "Competitivo"];
const ESPACOS = ["Quadra", "Campo reduzido", "Meio campo", "Campo inteiro"];

interface PlannerFormProps {
  onPlanChange: (plan: LessonPlan | null) => void;
}

export function PlannerForm({ onPlanChange }: PlannerFormProps) {
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
  const [planText, setPlanText] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

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
    const plan = gerarTreino(cfg, loadCustomPriorities());
    onPlanChange(plan);
    setPlanText(planToText(plan));
    setCopyStatus(null);
  }

  function handleCopiar() {
    if (!planText) {
      setCopyStatus("Gere um treino antes de copiar.");
      return;
    }
    navigator.clipboard?.writeText(planText);
    setCopyStatus("Plano copiado para a área de transferência.");
  }

  return (
    <aside className="card sticky top-[88px] p-4.5">
      <h2 className="m-0 mb-4 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
        <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
          1
        </span>
        Configurar aula
      </h2>

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

      <div className="mb-3.5">
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

      <div className="mb-3.5">
        <div className="field-label">Fundamentos / princípios</div>
        <div className="checklist">
          {fundamentosOptions.map((f) => (
            <label key={f} className="check-item">
              <input type="checkbox" checked={fundamentosSelected.has(f)} onChange={() => toggle(fundamentosSelected, setFundamentosSelected, f)} />
              <span>{f}</span>
            </label>
          ))}
        </div>
        <div className="mt-1.5 rounded-xl border px-2.5 py-1.5 text-xs" style={{ borderColor: "rgba(34,197,94,.22)", background: "rgba(48,209,88,.10)", color: "var(--ok)" }}>
          {fundamentosOptions.length} opções carregadas • {fundamentosSelected.size} selecionadas
        </div>
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

      <div className="mb-3.5 grid grid-cols-2 gap-2.5">
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

      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" className="btn-secondary" onClick={() => refreshLists(categoria, foco, posicao)}>
          Atualizar listas
        </button>
        <button type="button" className="btn" onClick={handleGerar}>
          Gerar aula
        </button>
        <button type="button" className="btn-secondary" onClick={handleCopiar}>
          Copiar
        </button>
        <button type="button" className="btn-secondary" onClick={() => window.print()}>
          Salvar PDF
        </button>
      </div>

      {copyStatus && (
        <div className="mt-2.5 rounded-xl border px-2.5 py-1.5 text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
          {copyStatus}
        </div>
      )}
    </aside>
  );
}
