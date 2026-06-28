"use client";

import { useState } from "react";
import { Dumbbell, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from "lucide-react";

type Focus = "HIPERTROFIA" | "FORCA" | "PERDA_GORDURA" | "SUPORTE_CORRIDA";
type Level = "INICIANTE" | "INTERMEDIARIO" | "AVANCADO";

interface Week {
  week: number;
  mesocycle: number;
  isDeload: boolean;
  phase: string;
  sessions: SessionPlan[];
}

interface SessionPlan {
  label: string;
  days: string[];
  blocks: BlockPlan[];
}

interface BlockPlan {
  exercise: string;
  category: string;
  sets: number;
  reps: string;
  rest: string;
  rpe: number;
  load: string;
  notes?: string;
}

// Brad Schoenfeld-inspired parameters per focus
const FOCUS_PARAMS: Record<Focus, {
  label: string;
  description: string;
  repRange: string;
  setsRange: string;
  rest: string;
  rpe: number;
  loadPct: string;
  exercises: BlockPlan[][];
}> = {
  HIPERTROFIA: {
    label: "Hipertrofia",
    description: "Foco em ganho de massa muscular. Volume moderado-alto, rep range de 6-12, tempo sob tensão elevado.",
    repRange: "6-12",
    setsRange: "3-5",
    rest: "60-90s",
    rpe: 8,
    loadPct: "65-80% 1RM",
    exercises: [
      [
        { exercise: "Agachamento", category: "FORCA", sets: 4, reps: "8-10", rest: "90s", rpe: 8, load: "70% 1RM" },
        { exercise: "Leg Press", category: "HIPERTROFIA", sets: 3, reps: "10-12", rest: "75s", rpe: 8, load: "75% 1RM" },
        { exercise: "Extensão de Quadril (Hip Thrust)", category: "GLUTEOS", sets: 4, reps: "10-12", rest: "75s", rpe: 8, load: "Moderado" },
        { exercise: "Cadeira Extensora", category: "HIPERTROFIA", sets: 3, reps: "12-15", rest: "60s", rpe: 8, load: "65% 1RM" },
        { exercise: "Prancha", category: "CORE", sets: 3, reps: "30-45s", rest: "45s", rpe: 7, load: "Peso corporal" },
      ],
      [
        { exercise: "Supino Reto", category: "HIPERTROFIA", sets: 4, reps: "8-10", rest: "90s", rpe: 8, load: "70% 1RM" },
        { exercise: "Remada Curvada", category: "HIPERTROFIA", sets: 4, reps: "8-10", rest: "90s", rpe: 8, load: "70% 1RM" },
        { exercise: "Desenvolvimento Militar", category: "HIPERTROFIA", sets: 3, reps: "10-12", rest: "75s", rpe: 7, load: "65% 1RM" },
        { exercise: "Rosca Direta", category: "HIPERTROFIA", sets: 3, reps: "10-12", rest: "60s", rpe: 8, load: "Moderado" },
        { exercise: "Tríceps Corda", category: "HIPERTROFIA", sets: 3, reps: "12-15", rest: "60s", rpe: 8, load: "Moderado" },
      ],
    ],
  },
  FORCA: {
    label: "Força Máxima",
    description: "Foco em força absoluta. Rep range baixo (1-5), cargas elevadas (80-95% 1RM), longos períodos de descanso.",
    repRange: "1-5",
    setsRange: "3-5",
    rest: "3-5min",
    rpe: 9,
    loadPct: "80-95% 1RM",
    exercises: [
      [
        { exercise: "Agachamento", category: "FORCA", sets: 5, reps: "3-5", rest: "3-5min", rpe: 9, load: "85% 1RM" },
        { exercise: "Levantamento Terra", category: "FORCA", sets: 4, reps: "3-4", rest: "4min", rpe: 9, load: "85% 1RM" },
        { exercise: "Lunges", category: "FORCA", sets: 3, reps: "6", rest: "90s", rpe: 7, load: "Moderado" },
        { exercise: "Prancha", category: "CORE", sets: 3, reps: "30s", rest: "60s", rpe: 7, load: "Peso corporal" },
      ],
      [
        { exercise: "Supino Reto", category: "FORCA", sets: 5, reps: "3-5", rest: "3-5min", rpe: 9, load: "85% 1RM" },
        { exercise: "Supino Inclinado", category: "FORCA", sets: 4, reps: "4-6", rest: "3min", rpe: 8, load: "80% 1RM" },
        { exercise: "Remada com Barra", category: "FORCA", sets: 5, reps: "3-5", rest: "3min", rpe: 9, load: "80% 1RM" },
        { exercise: "Desenvolvimento Militar", category: "FORCA", sets: 4, reps: "4-6", rest: "3min", rpe: 9, load: "80% 1RM" },
      ],
    ],
  },
  PERDA_GORDURA: {
    label: "Perda de Gordura",
    description: "Foco metabólico. Volume alto, rep range elevado (15-20), curtos intervalos. Estímulo calórico e manutenção de massa magra.",
    repRange: "15-20",
    setsRange: "2-4",
    rest: "30-60s",
    rpe: 7,
    loadPct: "50-65% 1RM",
    exercises: [
      [
        { exercise: "Agachamento com halteres", category: "HIPERTROFIA", sets: 3, reps: "15-20", rest: "45s", rpe: 7, load: "55% 1RM" },
        { exercise: "Afundo alternado", category: "GLUTEOS", sets: 3, reps: "15 cada", rest: "45s", rpe: 7, load: "Moderado leve" },
        { exercise: "Extensão de Quadril (Hip Thrust)", category: "GLUTEOS", sets: 3, reps: "15-20", rest: "45s", rpe: 7, load: "Leve-moderado" },
        { exercise: "Prancha lateral", category: "CORE", sets: 3, reps: "20s cada", rest: "30s", rpe: 6, load: "Peso corporal" },
        { exercise: "Mountain Climber", category: "CORE", sets: 3, reps: "20-30s", rest: "30s", rpe: 7, load: "Peso corporal" },
      ],
      [
        { exercise: "Remada com halteres", category: "HIPERTROFIA", sets: 3, reps: "15", rest: "45s", rpe: 7, load: "Leve-moderado" },
        { exercise: "Supino com halteres", category: "HIPERTROFIA", sets: 3, reps: "15", rest: "45s", rpe: 7, load: "Leve-moderado" },
        { exercise: "Elevação lateral", category: "HIPERTROFIA", sets: 3, reps: "15-20", rest: "30s", rpe: 7, load: "Leve" },
        { exercise: "Rosca alternada", category: "HIPERTROFIA", sets: 3, reps: "15 cada", rest: "45s", rpe: 7, load: "Leve-moderado" },
        { exercise: "Tríceps banco", category: "HIPERTROFIA", sets: 3, reps: "15-20", rest: "45s", rpe: 7, load: "Peso corporal" },
      ],
    ],
  },
  SUPORTE_CORRIDA: {
    label: "Suporte à Corrida",
    description: "Prevenção de lesões, força excêntrica, unilateral e core. Baixo volume, foco em padrões de movimento específicos da corrida.",
    repRange: "8-15",
    setsRange: "2-3",
    rest: "60-90s",
    rpe: 7,
    loadPct: "Peso corporal / moderado",
    exercises: [
      [
        { exercise: "Single Leg Deadlift", category: "PREVENCAO", sets: 3, reps: "8-10 cada", rest: "75s", rpe: 7, load: "Peso corporal", notes: "Excêntrico 3s" },
        { exercise: "Panturrilha excêntrica (Decline)", category: "PANTURRILHAS", sets: 3, reps: "15", rest: "60s", rpe: 7, load: "Peso corporal", notes: "Negativa 3s — Protocolo Alfredson" },
        { exercise: "Elevação de Quadril Unilateral", category: "GLUTEOS", sets: 3, reps: "12 cada", rest: "60s", rpe: 7, load: "Peso corporal" },
        { exercise: "Prancha Lateral com abdução", category: "QUADRIL", sets: 3, reps: "12 cada", rest: "60s", rpe: 6, load: "Peso corporal" },
        { exercise: "Dead Bug", category: "CORE", sets: 3, reps: "10 cada", rest: "60s", rpe: 6, load: "Peso corporal" },
      ],
      [
        { exercise: "Split Squat (Búlgaro)", category: "JOELHO", sets: 3, reps: "10 cada", rest: "90s", rpe: 7, load: "Moderado" },
        { exercise: "Step-up com carga", category: "QUADRIL", sets: 3, reps: "10 cada", rest: "75s", rpe: 7, load: "Moderado" },
        { exercise: "Chin-up", category: "FORCA", sets: 3, reps: "6-8", rest: "90s", rpe: 7, load: "Peso corporal" },
        { exercise: "Farmers Walk", category: "CORE", sets: 3, reps: "20m", rest: "60s", rpe: 7, load: "Moderado" },
        { exercise: "Mobilidade de tornozelo (CARS)", category: "TORNOZELO", sets: 3, reps: "5 cada", rest: "30s", rpe: 5, load: "Peso corporal" },
      ],
    ],
  },
};

const DAYS_OPTIONS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function generatePlan(focus: Focus, weeks: number, sessionsPerWeek: number, level: Level): Week[] {
  const params = FOCUS_PARAMS[focus];
  const plan: Week[] = [];
  const mesoLen = 4;
  const exerciseSets = params.exercises;

  const levelMult: Record<Level, number> = { INICIANTE: 0.8, INTERMEDIARIO: 1.0, AVANCADO: 1.2 };
  const mult = levelMult[level];

  for (let w = 1; w <= weeks; w++) {
    const meso = Math.ceil(w / mesoLen);
    const weekInMeso = ((w - 1) % mesoLen) + 1;
    const isDeload = weekInMeso === mesoLen;

    const progressFactor = isDeload ? 0.65 : 0.85 + ((weekInMeso - 1) * 0.05);
    const phase = isDeload ? "Deload" : meso === 1 ? "Acumulação" : meso === 2 ? "Intensificação" : "Pico";

    const sessionDays: string[][] = [];
    if (sessionsPerWeek === 2) sessionDays.push(["Seg", "Qui"], ["Ter", "Sex"]);
    else if (sessionsPerWeek === 3) sessionDays.push(["Seg"], ["Qua"], ["Sex"]);
    else sessionDays.push(["Seg"], ["Ter"], ["Qui"], ["Sex"]);

    const sessions: SessionPlan[] = [];
    for (let s = 0; s < Math.min(sessionsPerWeek, exerciseSets.length); s++) {
      const baseExercises = exerciseSets[s % exerciseSets.length];
      const blocks: BlockPlan[] = baseExercises.map((ex) => ({
        ...ex,
        sets: isDeload ? Math.max(2, Math.round(ex.sets * 0.65)) : Math.round(ex.sets * mult * progressFactor + 0.5),
        rpe: isDeload ? Math.max(5, ex.rpe - 2) : ex.rpe,
      }));

      sessions.push({
        label: `Treino ${String.fromCharCode(65 + s)}`,
        days: sessionDays[s] ?? [DAYS_OPTIONS[s * 2]],
        blocks,
      });
    }

    plan.push({ week: w, mesocycle: meso, isDeload, phase, sessions });
  }

  return plan;
}

export default function ForcaPeriodizacaoPage() {
  const [focus, setFocus] = useState<Focus>("SUPORTE_CORRIDA");
  const [duration, setDuration] = useState(8);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(2);
  const [level, setLevel] = useState<Level>("INTERMEDIARIO");
  const [plan, setPlan] = useState<Week[] | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function generate() {
    setPlan(generatePlan(focus, duration, sessionsPerWeek, level));
    setExpandedWeek(1);
    setSaved(false);
  }

  async function savePlan() {
    if (!plan) return;
    setSaving(true);
    try {
      await fetch("/api/coach/prescriptions/forca-periodizacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus, level, weeks: plan }),
      });
      setSaved(true);
    } catch {
      // silencioso
    } finally {
      setSaving(false);
    }
  }

  const params = FOCUS_PARAMS[focus];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-text">Periodização de Força</h1>
        </div>
        <p className="text-sm text-text-muted">Baseada nos princípios de Brad Schoenfeld — progressão de carga, volume e especificidade por fase.</p>
      </div>

      {/* Configuration */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Configuração</p>

        {/* Focus */}
        <div>
          <p className="mb-2 text-sm font-semibold text-text">Objetivo</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(FOCUS_PARAMS) as Focus[]).map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f)}
                className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                  focus === f ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-text-muted hover:border-primary/40 hover:text-text"
                }`}
              >
                {FOCUS_PARAMS[f].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-muted">{params.description}</p>
        </div>

        {/* Params row */}
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Duração</span>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60">
              {[4, 8, 12, 16].map((w) => <option key={w} value={w}>{w} semanas</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Sessões/semana</span>
            <select value={sessionsPerWeek} onChange={(e) => setSessionsPerWeek(Number(e.target.value))} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60">
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nível</span>
            <select value={level} onChange={(e) => setLevel(e.target.value as Level)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60">
              <option value="INICIANTE">Iniciante</option>
              <option value="INTERMEDIARIO">Intermediário</option>
              <option value="AVANCADO">Avançado</option>
            </select>
          </label>
        </div>

        {/* Reference params */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Repetições", value: params.repRange },
            { label: "Séries", value: params.setsRange },
            { label: "Descanso", value: params.rest },
            { label: "Carga alvo", value: params.loadPct },
          ].map((p) => (
            <div key={p.label} className="rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-center">
              <p className="text-[10px] text-text-muted uppercase tracking-wider">{p.label}</p>
              <p className="text-xs font-bold text-primary mt-0.5">{p.value}</p>
            </div>
          ))}
        </div>

        <button
          onClick={generate}
          className="flex w-full items-center justify-center gap-2 rounded-xl gradient-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:opacity-90"
        >
          <Dumbbell className="h-4 w-4" />
          Gerar periodização
        </button>
      </div>

      {/* Plan output */}
      {plan && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text">Plano gerado — {duration} semanas</h2>
            <button
              onClick={savePlan}
              disabled={saving || saved}
              className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
              {saved ? "Salvo!" : saving ? "Salvando…" : "Salvar plano"}
            </button>
          </div>

          {plan.map((week) => (
            <div key={week.week} className={`rounded-2xl border ${week.isDeload ? "border-yellow-500/30 bg-yellow-500/5" : "border-border bg-card"}`}>
              <button
                onClick={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${week.isDeload ? "text-yellow-400" : "text-primary"}`}>
                    Semana {week.week}
                  </span>
                  <span className="text-xs text-text-muted">Mesociclo {week.mesocycle} · {week.phase}</span>
                  {week.isDeload && <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400">DELOAD</span>}
                </div>
                {expandedWeek === week.week ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
              </button>

              {expandedWeek === week.week && (
                <div className="border-t border-border px-4 pb-4 space-y-4">
                  {week.sessions.map((session) => (
                    <div key={session.label} className="pt-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-text">{session.label}</span>
                        <span className="text-xs text-text-muted">{session.days.join(", ")}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border/50">
                              <th className="pb-1.5 text-left font-semibold text-text-muted pr-4">Exercício</th>
                              <th className="pb-1.5 text-center font-semibold text-text-muted w-12">Séries</th>
                              <th className="pb-1.5 text-center font-semibold text-text-muted w-16">Reps</th>
                              <th className="pb-1.5 text-center font-semibold text-text-muted w-16">Descanso</th>
                              <th className="pb-1.5 text-center font-semibold text-text-muted w-10">RPE</th>
                              <th className="pb-1.5 text-left font-semibold text-text-muted">Carga</th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.blocks.map((b, i) => (
                              <tr key={i} className="border-b border-border/30 last:border-0">
                                <td className="py-1.5 pr-4 text-text font-medium">
                                  {b.exercise}
                                  {b.notes && <span className="ml-1 text-text-muted/70">({b.notes})</span>}
                                </td>
                                <td className="py-1.5 text-center text-primary font-bold">{b.sets}</td>
                                <td className="py-1.5 text-center text-text">{b.reps}</td>
                                <td className="py-1.5 text-center text-text-muted">{b.rest}</td>
                                <td className="py-1.5 text-center text-text-muted">{b.rpe}</td>
                                <td className="py-1.5 text-text-muted">{b.load}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
