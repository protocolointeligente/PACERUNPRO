"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/data/categories";
import { FOCI, FOCUS_KEYS, type FocusKey } from "@/lib/data/foci";
import { POSITIONS, POSITION_KEYS, type PositionKey } from "@/lib/data/positions";
import { STRUCTURES } from "@/lib/data/structures";
import { getExercises } from "@/lib/exercises/bank";

const PAGE_SIZES = [
  { value: 25, label: "25 por página" },
  { value: 50, label: "50 por página" },
  { value: 100, label: "100 por página" },
  { value: 500, label: "Todos" },
];

export default function BibliotecaPage() {
  const exercises = useMemo(() => getExercises(), []);

  const [categoria, setCategoria] = useState<CategoryKey | "todas">("todas");
  const [foco, setFoco] = useState<FocusKey | "todos">("todos");
  const [posicao, setPosicao] = useState<PositionKey | "todas">("todas");
  const [estrutura, setEstrutura] = useState("todas");
  const [busca, setBusca] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return exercises.filter(
      (ex) =>
        (categoria === "todas" || ex.categories.includes(categoria)) &&
        (foco === "todos" || ex.focus === foco) &&
        (posicao === "todas" || ex.position === posicao) &&
        (estrutura === "todas" || ex.structure === estrutura) &&
        (!q || JSON.stringify(ex).toLowerCase().includes(q))
    );
  }, [exercises, categoria, foco, posicao, estrutura, busca]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  function withReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setCategoria("todas");
    setFoco("todos");
    setPosicao("todas");
    setEstrutura("todas");
    setBusca("");
    setPageSize(50);
    setPage(1);
  }

  return (
    <div className="card p-4.5">
      <h2 className="m-0 mb-4 flex items-center gap-2.5 text-[19px] font-bold tracking-tight">
        <span className="grid h-[31px] w-[31px] place-items-center rounded-xl text-sm font-black text-white" style={{ background: "var(--accent)" }}>
          2
        </span>
        Biblioteca de exercícios
      </h2>

      <div className="mb-3.5 rounded-2xl border p-3.5 text-sm leading-relaxed" style={{ borderColor: "rgba(255,120,31,.28)", background: "rgba(255,120,31,.12)", color: "var(--text)" }}>
        A biblioteca tem {exercises.length} exercícios. Use os filtros ou selecione &ldquo;Todos&rdquo; no tamanho da página para visualizar o banco inteiro.
      </div>

      <div className="mb-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="field-label" htmlFor="libCategoria">
            Categoria
          </label>
          <select
            id="libCategoria"
            className="field-input"
            value={categoria}
            onChange={(e) => withReset(setCategoria)(e.target.value as CategoryKey | "todas")}
          >
            <option value="todas">Todas as categorias</option>
            {CATEGORY_KEYS.map((key) => (
              <option key={key} value={key}>
                {CATEGORIES[key].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="libFoco">
            Foco
          </label>
          <select id="libFoco" className="field-input" value={foco} onChange={(e) => withReset(setFoco)(e.target.value as FocusKey | "todos")}>
            <option value="todos">Todos os focos</option>
            {FOCUS_KEYS.map((key) => (
              <option key={key} value={key}>
                {FOCI[key]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="libPosicao">
            Posição
          </label>
          <select
            id="libPosicao"
            className="field-input"
            value={posicao}
            onChange={(e) => withReset(setPosicao)(e.target.value as PositionKey | "todas")}
          >
            <option value="todas">Todas as posições</option>
            {POSITION_KEYS.map((key) => (
              <option key={key} value={key}>
                {POSITIONS[key].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="libEstrutura">
            Estrutura
          </label>
          <select id="libEstrutura" className="field-input" value={estrutura} onChange={(e) => withReset(setEstrutura)(e.target.value)}>
            {STRUCTURES.map((s) => (
              <option key={s} value={s}>
                {s === "todas" ? "Todas as estruturas" : s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="pageSize">
            Tamanho
          </label>
          <select id="pageSize" className="field-input" value={pageSize} onChange={(e) => withReset(setPageSize)(Number(e.target.value))}>
            {PAGE_SIZES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="libBusca">
            Busca
          </label>
          <input
            id="libBusca"
            className="field-input"
            placeholder="ex: cruzamento, goleiro, 3x2"
            value={busca}
            onChange={(e) => withReset(setBusca)(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="callout flex-1">
          <b>{filtered.length}</b> exercícios encontrados no banco de <b>{exercises.length}</b>. Mostrando {slice.length} exercício(s) nesta página.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
            Anterior
          </button>
          <span className="chip chip-accent">
            Página {safePage} de {pages}
          </span>
          <button type="button" className="btn-secondary" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={safePage >= pages}>
            Próxima
          </button>
          <button type="button" className="btn-secondary" onClick={clearFilters}>
            Limpar filtros
          </button>
        </div>
      </div>

      {slice.length === 0 ? (
        <div className="rounded-[22px] border border-dashed p-9 text-center" style={{ borderColor: "var(--line)", background: "rgba(255,255,255,.025)", color: "var(--muted)" }}>
          Nenhum exercício encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {slice.map((ex) => (
            <div key={ex.id} className="surface p-3.5">
              <h4 className="m-0 mb-2 text-[15px] font-bold">
                {ex.id}. {ex.title}
              </h4>
              <p className="m-0 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                {ex.objective}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="chip chip-accent">{POSITIONS[ex.position].label}</span>
                <span className="chip">{FOCI[ex.focus]}</span>
                <span className="chip">{ex.structure}</span>
                <span className="chip">{ex.categories.slice(0, 4).join(", ")}</span>
                <span className="chip">{ex.pattern}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
