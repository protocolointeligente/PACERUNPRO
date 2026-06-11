"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RadarChart, type RadarSeries } from "@/components/charts/RadarChart";
import {
  averageScore,
  EVALUATION_DIMENSIONS,
  EVALUATION_DIMENSION_KEYS,
  emptyScores,
  type EvaluationScores,
} from "@/lib/avaliacao/dimensions";
import { CATEGORIES, CATEGORY_KEYS, type CategoryKey } from "@/lib/data/categories";
import { POSITIONS, POSITION_KEYS, type PositionKey } from "@/lib/data/positions";
import { genId, loadAthletes, saveAthletes, type Athlete, type AthleteEvaluation } from "@/lib/storage";

function calcAge(birthdate?: string): number | null {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export default function AtletaDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [name, setName] = useState("");
  const [position, setPosition] = useState<PositionKey>("geral");
  const [category, setCategory] = useState<CategoryKey | "">("");
  const [birthdate, setBirthdate] = useState("");
  const [notes, setNotes] = useState("");

  const [scores, setScores] = useState<EvaluationScores>(emptyScores());
  const [evalDate, setEvalDate] = useState("");
  const [evalNotes, setEvalNotes] = useState("");

  useEffect(() => {
    // Reads persisted athletes after mount to avoid SSR/client markup mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAthletes(loadAthletes());
    setEvalDate(new Date().toISOString().slice(0, 10));
    setLoaded(true);
  }, []);

  const athlete = useMemo(() => athletes.find((a) => a.id === params.id) ?? null, [athletes, params.id]);

  useEffect(() => {
    if (!athlete || initialized) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(athlete.name);
    setPosition(athlete.position);
    setCategory(athlete.category ?? "");
    setBirthdate(athlete.birthdate ?? "");
    setNotes(athlete.notes ?? "");
    setInitialized(true);
  }, [athlete, initialized]);

  if (!loaded) return null;

  if (!athlete) {
    return (
      <div className="card p-4.5">
        <h1 className="m-0 text-2xl font-black tracking-tight">Atleta não encontrado</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          O atleta solicitado não existe ou foi removido.
        </p>
        <Link href="/atletas" className="btn mt-4 inline-flex w-fit">
          Voltar a Atletas
        </Link>
      </div>
    );
  }

  const age = calcAge(athlete.birthdate);
  const lastEvaluation = athlete.evaluations[athlete.evaluations.length - 1];

  function persist(updated: Athlete) {
    const next = athletes.map((a) => (a.id === updated.id ? updated : a));
    setAthletes(next);
    saveAthletes(next);
  }

  function handleSaveInfo() {
    if (!athlete) return;
    persist({
      ...athlete,
      name: name.trim() || athlete.name,
      position,
      category: category || undefined,
      birthdate: birthdate || undefined,
      notes: notes.trim() || undefined,
    });
  }

  function handleRemoveAthlete() {
    if (!athlete) return;
    const next = athletes.filter((a) => a.id !== athlete.id);
    saveAthletes(next);
    router.push("/atletas");
  }

  function handleScoreChange(key: keyof EvaluationScores, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
  }

  function handleSaveEvaluation() {
    if (!athlete) return;
    const evaluation: AthleteEvaluation = {
      id: genId(),
      date: evalDate || new Date().toISOString().slice(0, 10),
      scores: { ...scores },
      notes: evalNotes.trim() || undefined,
    };
    persist({ ...athlete, evaluations: [...athlete.evaluations, evaluation] });
    setEvalNotes("");
  }

  function handleLoadEvaluation(evaluation: AthleteEvaluation) {
    setScores({ ...evaluation.scores });
    setEvalDate(evaluation.date);
    setEvalNotes(evaluation.notes ?? "");
  }

  function handleRemoveEvaluation(id: string) {
    if (!athlete) return;
    persist({ ...athlete, evaluations: athlete.evaluations.filter((e) => e.id !== id) });
  }

  const labels = EVALUATION_DIMENSIONS.map((d) => d.label);
  const currentValues = EVALUATION_DIMENSION_KEYS.map((k) => scores[k]);
  const radarSeries: RadarSeries[] = [{ label: "Avaliação atual", values: currentValues, color: "var(--accent)" }];
  if (lastEvaluation) {
    radarSeries.push({
      label: "Última avaliação salva",
      values: EVALUATION_DIMENSION_KEYS.map((k) => lastEvaluation.scores[k]),
      color: "var(--gold)",
      dashed: true,
    });
  }

  return (
    <div>
      <div className="mb-4.5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/atletas" className="text-xs font-extrabold uppercase tracking-wider" style={{ color: "var(--accent2)" }}>
            ← Atletas
          </Link>
          <h1 className="m-0 mt-1.5 text-2xl font-black tracking-tight">{athlete.name}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="chip chip-accent">{POSITIONS[athlete.position].label}</span>
            {athlete.category && <span className="chip">{CATEGORIES[athlete.category].label}</span>}
            {age != null && <span className="chip">{age} anos</span>}
            <span className="chip">{athlete.evaluations.length} avaliação(ões)</span>
          </div>
        </div>
        <button type="button" className="btn-secondary whitespace-nowrap" style={{ color: "var(--danger)" }} onClick={handleRemoveAthlete}>
          Remover atleta
        </button>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[380px_1fr]">
        <div className="card p-4.5">
          <h3 className="m-0 mb-3 text-sm font-extrabold uppercase tracking-wide" style={{ color: "var(--accent2)" }}>
            Radar de desempenho
          </h3>
          <RadarChart labels={labels} series={radarSeries} />
        </div>

        <div className="card p-4.5">
          <h3 className="m-0 mb-3 text-sm font-extrabold uppercase tracking-wide" style={{ color: "var(--accent2)" }}>
            Dados do atleta
          </h3>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="field-label" htmlFor="atlNome">
                Nome
              </label>
              <input id="atlNome" className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="atlPosicao">
                Posição
              </label>
              <select id="atlPosicao" className="field-input" value={position} onChange={(e) => setPosition(e.target.value as PositionKey)}>
                {POSITION_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {POSITIONS[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="atlCategoria">
                Categoria
              </label>
              <select id="atlCategoria" className="field-input" value={category} onChange={(e) => setCategory(e.target.value as CategoryKey | "")}>
                <option value="">Não informada</option>
                {CATEGORY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORIES[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="atlNascimento">
                Data de nascimento
              </label>
              <input id="atlNascimento" type="date" className="field-input" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="field-label" htmlFor="atlObs">
                Observações
              </label>
              <input id="atlObs" className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <button type="button" className="btn-secondary mt-3" onClick={handleSaveInfo}>
            Salvar dados
          </button>

          <h3 className="m-0 mb-3 mt-5 text-sm font-extrabold uppercase tracking-wide" style={{ color: "var(--accent2)" }}>
            Nova avaliação
          </h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="evalData">
                Data
              </label>
              <input id="evalData" type="date" className="field-input" value={evalDate} onChange={(e) => setEvalDate(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="evalNotas">
                Observações da avaliação
              </label>
              <input id="evalNotas" className="field-input" placeholder="ex: evoluiu na pressão pós-perda" value={evalNotes} onChange={(e) => setEvalNotes(e.target.value)} />
            </div>
          </div>

          <div className="mt-3 grid gap-3">
            {EVALUATION_DIMENSIONS.map((dim, i) => (
              <div key={dim.key}>
                <div className="flex items-center justify-between">
                  <label className="field-label m-0" htmlFor={`score-${dim.key}`}>
                    {i + 1}. {dim.label}
                  </label>
                  <span className="chip chip-accent">{scores[dim.key].toFixed(1)}</span>
                </div>
                <input
                  id={`score-${dim.key}`}
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={scores[dim.key]}
                  onChange={(e) => handleScoreChange(dim.key, Number(e.target.value))}
                  className="mt-1.5 w-full accent-[var(--accent)]"
                />
                <p className="m-0 text-[11px]" style={{ color: "var(--muted)" }}>
                  {dim.description}
                </p>
              </div>
            ))}
          </div>

          <button type="button" className="btn mt-3.5" onClick={handleSaveEvaluation}>
            Salvar avaliação
          </button>

          <h3 className="m-0 mb-3 mt-5 text-sm font-extrabold uppercase tracking-wide" style={{ color: "var(--accent2)" }}>
            Histórico de avaliações
          </h3>
          {athlete.evaluations.length === 0 ? (
            <p className="m-0 text-sm" style={{ color: "var(--muted)" }}>
              Nenhuma avaliação registrada ainda.
            </p>
          ) : (
            <div className="grid gap-2">
              {[...athlete.evaluations].reverse().map((ev) => (
                <div key={ev.id} className="surface flex flex-wrap items-center gap-2 p-2.5 text-[12px]">
                  <span className="chip chip-accent">{new Date(ev.date).toLocaleDateString("pt-BR")}</span>
                  <span className="chip">Média {averageScore(ev.scores).toFixed(1)}</span>
                  {ev.notes && (
                    <span className="min-w-0 flex-1 truncate" style={{ color: "var(--muted)" }}>
                      {ev.notes}
                    </span>
                  )}
                  <button type="button" className="chip ml-auto" style={{ color: "var(--accent2)" }} onClick={() => handleLoadEvaluation(ev)}>
                    Carregar
                  </button>
                  <button type="button" className="chip" style={{ color: "var(--danger)" }} onClick={() => handleRemoveEvaluation(ev.id)}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
