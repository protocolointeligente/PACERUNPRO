"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Loader2,
  CalendarDays,
  Save,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StructuredWorkoutBuilder, type WorkoutBlock } from "@/components/workout/structured-workout-builder";
import type { AthleteListItem } from "@/lib/types";

// ── Sport config ─────────────────────────────────────────────────────────────

type SportMode = "RUN" | "BIKE" | "SWIM" | "STRENGTH" | "OTHER";

const SPORTS: { id: SportMode; label: string; emoji: string; color: string }[] = [
  { id: "RUN",      label: "Corrida",   emoji: "🏃", color: "#f97316" },
  { id: "BIKE",     label: "Ciclismo",  emoji: "🚴", color: "#3b82f6" },
  { id: "SWIM",     label: "Natação",   emoji: "🏊", color: "#06b6d4" },
  { id: "STRENGTH", label: "Força",     emoji: "💪", color: "#a855f7" },
  { id: "OTHER",    label: "Outro",     emoji: "•",  color: "#6b7280" },
];

const WORKOUT_TYPES: Record<SportMode, { value: string; label: string }[]> = {
  RUN: [
    { value: "RODAGEM_LEVE",      label: "Rodagem Leve" },
    { value: "REGENERATIVO",      label: "Regenerativo" },
    { value: "PROGRESSIVO",       label: "Progressivo" },
    { value: "TEMPO_RUN",         label: "Tempo Run" },
    { value: "FARTLEK",           label: "Fartlek" },
    { value: "INTERVALADO_LONGO", label: "Intervalado Longo" },
    { value: "INTERVALADO_CURTO", label: "Intervalado Curto" },
    { value: "LONGAO",            label: "Longão" },
    { value: "SUBIDA",            label: "Subida" },
    { value: "PROVA",             label: "Prova" },
  ],
  BIKE: [
    { value: "ENDURANCE_BIKE",  label: "Endurance / Z2 Base" },
    { value: "SWEET_SPOT",      label: "Sweet Spot" },
    { value: "TEMPO_BIKE",      label: "Tempo" },
    { value: "THRESHOLD_BIKE",  label: "Limiar" },
    { value: "VO2MAX_BIKE",     label: "VO2máx" },
    { value: "RECOVERY_BIKE",   label: "Recuperação Ativa" },
    { value: "LONG_RIDE",       label: "Saída Longa" },
  ],
  SWIM: [
    { value: "TECNICA_NATACAO",       label: "Técnica" },
    { value: "ENDURANCE_NATACAO",     label: "Endurance / Base" },
    { value: "INTERVALADO_NATACAO",   label: "Intervalados" },
    { value: "LIMIAR_NATACAO",        label: "Limiar / CSS" },
    { value: "SPRINT_NATACAO",        label: "Sprint" },
    { value: "RECUPERACAO_NATACAO",   label: "Recuperação" },
    { value: "AGUAS_ABERTAS",         label: "Águas Abertas" },
  ],
  STRENGTH: [
    { value: "FORCA",       label: "Força" },
    { value: "FUNCIONAL",   label: "Funcional" },
    { value: "MOBILIDADE",  label: "Mobilidade" },
    { value: "RECUPERACAO", label: "Recuperação" },
  ],
  OTHER: [
    { value: "RECUPERACAO", label: "Recuperação" },
    { value: "MOBILIDADE",  label: "Mobilidade" },
    { value: "PROVA",       label: "Prova / Evento" },
    { value: "FUNCIONAL",   label: "Funcional" },
  ],
};

const TYPE_COLORS: Record<string, string> = {
  RODAGEM_LEVE: "#84cc16", INTERVALADO_CURTO: "#ef4444",
  INTERVALADO_LONGO: "#FFB020", TEMPO_RUN: "#eab308", FARTLEK: "#a78bfa",
  PROGRESSIVO: "#38bdf8", LONGAO: "#22c55e", REGENERATIVO: "#94a3b8",
  SUBIDA: "#fb923c", TECNICA: "#06b6d4", PROVA: "#ec4899",
  ENDURANCE_BIKE: "#3b82f6", SWEET_SPOT: "#8b5cf6", TEMPO_BIKE: "#f59e0b",
  THRESHOLD_BIKE: "#ef4444", VO2MAX_BIKE: "#ec4899", RECOVERY_BIKE: "#10b981",
  LONG_RIDE: "#06b6d4", ANAEROBIC_BIKE: "#7c3aed",
  TECNICA_NATACAO: "#06b6d4", ENDURANCE_NATACAO: "#22c55e",
  INTERVALADO_NATACAO: "#f97316", LIMIAR_NATACAO: "#ef4444",
  SPRINT_NATACAO: "#ec4899", RECUPERACAO_NATACAO: "#94a3b8",
  AGUAS_ABERTAS: "#0ea5e9", FORCA: "#46E0C8", FUNCIONAL: "#46E0C8",
  MOBILIDADE: "#84cc16", RECUPERACAO: "#94a3b8",
  BRICK_BIKE_RUN: "#f97316", BRICK_SWIM_BIKE: "#06b6d4",
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  CONCLUIDO: { label: "Concluído", color: "text-success" },
  LIBERADO:  { label: "Programado", color: "text-text-muted" },
  AGENDADO:  { label: "Agendado",   color: "text-text-muted" },
  PERDIDO:   { label: "Perdido",    color: "text-danger" },
  AJUSTADO:  { label: "Ajustado",   color: "text-warning" },
};

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

// ── Date helpers ─────────────────────────────────────────────────────────────

function getMondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtWeek(monday: Date): string {
  const sunday = addDays(monday, 6);
  return `${monday.getDate()} – ${sunday.getDate()} de ${sunday.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalendarWorkout {
  id: string;
  date: string;
  type: string;
  title: string;
  status: string;
  targetDurationMin?: number | null;
  targetDistanceKm?: number | null;
  targetRpe?: number | null;
  sport?: string | null;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PrescricaoPage() {
  const [athletes, setAthletes] = useState<AthleteListItem[]>([]);
  const [athleteId, setAthleteId] = useState("");
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOf(new Date()));
  const [workouts, setWorkouts] = useState<CalendarWorkout[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(false);

  // Panel state
  const [showPanel, setShowPanel] = useState(false);
  const [sport, setSport] = useState<SportMode>("RUN");
  const [workoutType, setWorkoutType] = useState("RODAGEM_LEVE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toISO(new Date()));
  const [rpe, setRpe] = useState("6");
  const [durationMin, setDurationMin] = useState("60");
  const [mainSet, setMainSet] = useState("");
  const [useStructured, setUseStructured] = useState(false);
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Load athletes
  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AthleteListItem[]) => {
        setAthletes(data);
        if (data.length > 0) setAthleteId(data[0].id);
      })
      .catch(() => null);
  }, []);

  // Load week workouts
  const loadWeek = useCallback(async (ws: Date) => {
    setLoadingWeek(true);
    try {
      const res = await fetch(`/api/coach/athletes/week?weekStart=${toISO(ws)}`);
      if (!res.ok) return;
      const data = await res.json() as { athletes: { id: string; workouts: CalendarWorkout[] }[] };
      const athleteData = data.athletes.find((a) => a.id === athleteId);
      setWorkouts(athleteData?.workouts ?? []);
    } catch { /* ignore */ }
    finally { setLoadingWeek(false); }
  }, [athleteId]);

  useEffect(() => {
    if (athleteId) loadWeek(weekStart);
  }, [athleteId, weekStart, loadWeek]);

  function prevWeek() { setWeekStart((w) => addDays(w, -7)); }
  function nextWeek() { setWeekStart((w) => addDays(w, 7)); }
  function goToday() { setWeekStart(getMondayOf(new Date())); }

  // When sport changes, reset workout type and title
  function changeSport(s: SportMode) {
    setSport(s);
    const firstType = WORKOUT_TYPES[s][0].value;
    setWorkoutType(firstType);
    setTitle(WORKOUT_TYPES[s][0].label);
    setBlocks([]);
  }

  function changeWorkoutType(t: string) {
    setWorkoutType(t);
    const found = WORKOUT_TYPES[sport].find((w) => w.value === t);
    if (found && !title) setTitle(found.label);
  }

  // Estimated load from blocks or manual
  const estimatedDuration = useStructured
    ? blocks.reduce((s, b) => s + Math.round(b.durationSeconds / 60) * b.repeatCount, 0)
    : Number(durationMin) || 0;
  const estimatedLoad = Math.round(estimatedDuration * (Number(rpe) || 6));

  async function handleSubmit() {
    if (!athleteId || !date || !workoutType) {
      setError("Preencha atleta, data e tipo.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const body = {
        athleteId,
        date,
        type: workoutType,
        sport: sport === "OTHER" ? undefined : sport,
        title: title || WORKOUT_TYPES[sport].find((t) => t.value === workoutType)?.label || workoutType,
        objective: description || mainSet || undefined,
        structured: useStructured,
        blocks: useStructured && blocks.length > 0 ? blocks : undefined,
        targetDurationMin: estimatedDuration || undefined,
        targetRpe: Number(rpe) || undefined,
      };
      const res = await fetch("/api/coach/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? `Erro ${res.status}`);
      }
      setSaved(true);
      loadWeek(weekStart);
      setTimeout(() => {
        setSaved(false);
        setShowPanel(false);
        setTitle("");
        setDescription("");
        setMainSet("");
        setBlocks([]);
        setUseStructured(false);
        setSaveAsTemplate(false);
        setDurationMin("60");
        setRpe("6");
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  // Build day cells
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const iso = toISO(d);
    const dayWorkouts = workouts.filter((w) => w.date === iso);
    const isToday = iso === toISO(new Date());
    return { date: d, iso, dayWorkouts, isToday };
  });

  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((s, w) => s + (w.targetDurationMin ?? 0), 0);
  const completed = workouts.filter((w) => w.status === "CONCLUIDO").length;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CalendarDays className="h-4 w-4 text-primary shrink-0" />
            <span className="font-display text-sm font-bold text-text">Prescrição</span>
            <span className="text-border hidden sm:block">·</span>
            <span className="text-xs text-text-muted hidden sm:block">Monte e organize os treinos dos seus atletas</span>
          </div>

          {/* Athlete selector */}
          <div className="flex items-center gap-2">
            <select
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-text outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 min-w-[160px]"
            >
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => {
              setDate(toISO(new Date()));
              setShowPanel(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo treino
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 flex gap-6">
        {/* ── Main calendar area ─────────────────────────────────────────── */}
        <div className={cn("flex-1 min-w-0 transition-all", showPanel && "lg:mr-[26rem]")}>
          {/* Week nav */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <button onClick={prevWeek} className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-card-hover transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={goToday} className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-text hover:bg-card-hover transition-colors">
                Hoje
              </button>
              <button onClick={nextWeek} className="rounded-lg p-1.5 text-text-muted hover:text-text hover:bg-card-hover transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <span className="font-display text-sm font-semibold text-text flex-1">{fmtWeek(weekStart)}</span>
            {loadingWeek && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
          </div>

          {/* Calendar grid */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <div className="min-w-[640px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {days.map(({ date: d, isToday }, i) => (
                  <div key={i} className={cn(
                    "px-3 py-2.5 text-center border-r border-border/50 last:border-r-0",
                    isToday && "bg-primary/5"
                  )}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{DAYS[i]}</p>
                    <p className={cn(
                      "mt-0.5 text-lg font-bold font-display",
                      isToday ? "text-primary" : "text-text"
                    )}>{d.getDate()}</p>
                  </div>
                ))}
              </div>

              {/* Workout cells */}
              <div className="grid grid-cols-7 min-h-[320px]">
                {days.map(({ iso, dayWorkouts, isToday }, i) => (
                  <div key={i} className={cn(
                    "border-r border-border/50 last:border-r-0 p-2 space-y-1.5",
                    isToday && "bg-primary/[0.02]"
                  )}>
                    {dayWorkouts.map((wo) => {
                      const color = TYPE_COLORS[wo.type] ?? "#6b7280";
                      const status = STATUS_BADGE[wo.status];
                      return (
                        <Link
                          key={wo.id}
                          href={`/treinador/atletas/${athleteId}`}
                          className="block rounded-xl p-2.5 border transition-all hover:shadow-md hover:scale-[1.02]"
                          style={{ borderColor: `${color}40`, backgroundColor: `${color}12` }}
                        >
                          <p className="text-[11px] font-semibold leading-tight truncate" style={{ color }}>
                            {wo.title}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {wo.targetDurationMin && (
                              <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                                <Clock className="h-2.5 w-2.5" />
                                {wo.targetDurationMin} min
                              </span>
                            )}
                            {wo.targetDistanceKm && (
                              <span className="text-[10px] text-text-muted">{wo.targetDistanceKm} km</span>
                            )}
                          </div>
                          {status && (
                            <p className={cn("mt-0.5 text-[10px] font-medium", status.color)}>
                              {wo.status === "CONCLUIDO" && <CheckCircle2 className="inline h-2.5 w-2.5 mr-0.5" />}
                              {status.label}
                            </p>
                          )}
                        </Link>
                      );
                    })}

                    <button
                      onClick={() => { setDate(iso); setShowPanel(true); }}
                      className="w-full rounded-lg border border-dashed border-border/50 py-2 text-[10px] text-text-muted/50 hover:border-primary/40 hover:text-primary/60 transition-colors hidden group-hover:block"
                      aria-label={`Adicionar treino em ${iso}`}
                    >
                      + treino
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly summary */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard label="Treinos" value={String(totalWorkouts)} />
            <SummaryCard label="Concluídos" value={`${completed}/${totalWorkouts}`} highlight={completed === totalWorkouts && totalWorkouts > 0} />
            <SummaryCard label="Volume" value={totalMinutes >= 60 ? `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}min` : `${totalMinutes} min`} />
            <div className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-2">
              <span className="text-xs text-text-muted">Outros modos</span>
              <div className="flex gap-1.5">
                <Link href="/treinador/prescricao/corrida" className="text-[10px] text-primary hover:underline">VDOT</Link>
                <span className="text-border">·</span>
                <Link href="/treinador/prescricao/periodizacao" className="text-[10px] text-primary hover:underline">Macro</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── New workout panel ──────────────────────────────────────────── */}
        <AnimatePresence>
          {showPanel && (
            <motion.aside
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.22 }}
              className="fixed right-0 top-0 z-30 h-full w-full max-w-sm overflow-y-auto bg-card border-l border-border shadow-2xl lg:sticky lg:top-20 lg:h-auto lg:max-h-[calc(100vh-6rem)] lg:w-96 lg:rounded-2xl lg:shadow-none"
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-base font-bold text-text">Novo treino</h2>
                  <button onClick={() => setShowPanel(false)} className="text-text-muted hover:text-text" aria-label="Fechar">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modality */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Modalidade</label>
                  <div className="flex gap-2 flex-wrap">
                    {SPORTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => changeSport(s.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border p-2.5 w-14 transition-all",
                          sport === s.id
                            ? "border-primary/60 bg-primary/10"
                            : "border-border bg-background hover:border-primary/30"
                        )}
                      >
                        <span className="text-xl">{s.emoji}</span>
                        <span className={cn("text-[9px] font-semibold", sport === s.id ? "text-primary" : "text-text-muted")}>
                          {s.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Workout type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Tipo de treino</label>
                  <select
                    value={workoutType}
                    onChange={(e) => changeWorkoutType(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    {WORKOUT_TYPES[sport].map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Nome do treino</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: 6x800m @ pace 5K"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Date + athlete */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Data</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Atleta</label>
                    <select
                      value={athleteId}
                      onChange={(e) => setAthleteId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60 appearance-none"
                    >
                      {athletes.map((a) => (
                        <option key={a.id} value={a.id}>{a.name.split(" ")[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Descrição (opcional)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objetivo do treino…"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                {/* Structured toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-text">Estrutura do treino</p>
                    <p className="text-[11px] text-text-muted">Blocos visuais para o player</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseStructured((v) => !v)}
                    className="text-text-muted hover:text-primary transition-colors"
                    aria-label={useStructured ? "Desativar modo estruturado" : "Ativar modo estruturado"}
                  >
                    {useStructured
                      ? <ToggleRight className="h-7 w-7 text-primary" />
                      : <ToggleLeft className="h-7 w-7" />
                    }
                  </button>
                </div>

                {/* Structure builder or simple textarea */}
                <AnimatePresence mode="wait">
                  {useStructured ? (
                    <motion.div
                      key="structured"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <StructuredWorkoutBuilder
                        sport={sport === "OTHER" ? "RUN" : sport === "STRENGTH" ? "STRENGTH" : sport as "RUN" | "BIKE" | "SWIM" | "STRENGTH"}
                        onChange={setBlocks}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="simple"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-2"
                    >
                      <textarea
                        rows={4}
                        value={mainSet}
                        onChange={(e) => setMainSet(e.target.value)}
                        placeholder="Descreva aquecimento, parte principal e volta à calma…"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Duração (min)</label>
                          <input
                            type="number"
                            min={1}
                            value={durationMin}
                            onChange={(e) => setDurationMin(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary/60 text-center"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">RPE (1–10)</label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={rpe}
                            onChange={(e) => setRpe(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-text outline-none focus:border-primary/60 text-center"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Estimated load */}
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card-hover/30 p-3">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Carga estimada</p>
                    <p className="text-base font-bold font-display text-text">{estimatedLoad} <span className="text-xs font-normal text-text-muted">sRPE</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">Duração estimada</p>
                    <p className="text-base font-bold font-display text-text">
                      {estimatedDuration >= 60
                        ? `${Math.floor(estimatedDuration / 60)}h ${estimatedDuration % 60}min`
                        : `${estimatedDuration} min`}
                    </p>
                  </div>
                </div>

                {/* Save as template */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="saveTemplate"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="accent-primary h-4 w-4"
                  />
                  <label htmlFor="saveTemplate" className="text-sm text-text cursor-pointer flex items-center gap-1.5">
                    <Save className="h-3.5 w-3.5 text-text-muted" />
                    Salvar como template
                  </label>
                </div>

                {/* Error */}
                {error && (
                  <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowPanel(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant={saved ? "success" : "primary"}
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={handleSubmit}
                    disabled={submitting || saved}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saved ? (
                      <><CheckCircle2 className="h-4 w-4" /> Salvo!</>
                    ) : (
                      "Salvar treino"
                    )}
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── SummaryCard ───────────────────────────────────────────────────────────────

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border bg-card p-3 text-center",
      highlight ? "border-primary/30 bg-primary/5" : "border-border"
    )}>
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={cn("mt-0.5 font-display text-xl font-bold", highlight ? "text-primary" : "text-text")}>{value}</p>
    </div>
  );
}
