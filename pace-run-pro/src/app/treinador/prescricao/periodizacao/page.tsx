"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Wand2,
  Save,
  FileDown,
  TrendingDown,
  ChevronDown,
  Info,
  CalendarDays,
  Dumbbell,
  ChevronRight,
  Pencil,
  Check,
  RefreshCw,
  Zap,
  Send,
  CheckCircle2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AthleteListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  generateWorkoutsForWeek,
  formatPaceSec,
  ZONE_COLORS,
  type GeneratedWorkout,
  type GoalType,
  type LevelType,
  type PhaseType,
  type WorkoutSubtype,
} from "@/lib/workout-generator";
import { calculateVDOT, getTrainingPaces, parseRaceTime, RACE_DISTANCES, TRAINING_ZONES } from "@/lib/vdot";
import { formatPace } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type SportMode = "RUN" | "BIKE" | "SWIM" | "TRIATHLON";

const SPORT_LABELS: Record<SportMode, string> = {
  RUN: "Corrida",
  BIKE: "Ciclismo",
  SWIM: "Natação",
  TRIATHLON: "Triathlon",
};

const SPORT_EMOJIS: Record<SportMode, string> = {
  RUN: "🏃",
  BIKE: "🚴",
  SWIM: "🏊",
  TRIATHLON: "🏅",
};

// Volume unit labels per sport
const SPORT_VOLUME_LABEL: Record<SportMode, string> = {
  RUN: "km/sem",
  BIKE: "km/sem",
  SWIM: "m/sem",
  TRIATHLON: "h/sem",
};

const SPORT_VOLUME_UNIT: Record<SportMode, string> = {
  RUN: "km",
  BIKE: "km",
  SWIM: "m",
  TRIATHLON: "h",
};

// Default weekly volume per level for non-run sports
const SPORT_LEVEL_DEFAULTS: Record<SportMode, Record<Level, { start: number; growth: number; max: number }>> = {
  RUN: {
    Iniciante:     { start: 25,   growth: 2.0, max: 50  },
    Intermediário: { start: 48,   growth: 3.5, max: 90  },
    Avançado:      { start: 96,   growth: 5.0, max: 150 },
  },
  BIKE: {
    Iniciante:     { start: 80,   growth: 10,  max: 200  },
    Intermediário: { start: 150,  growth: 15,  max: 400  },
    Avançado:      { start: 250,  growth: 20,  max: 600  },
  },
  SWIM: {
    Iniciante:     { start: 5000,  growth: 500,  max: 15000  },
    Intermediário: { start: 10000, growth: 800,  max: 25000  },
    Avançado:      { start: 18000, growth: 1200, max: 40000  },
  },
  TRIATHLON: {
    Iniciante:     { start: 5,  growth: 0.5, max: 12 },
    Intermediário: { start: 9,  growth: 0.8, max: 18 },
    Avançado:      { start: 14, growth: 1.0, max: 25 },
  },
};

type Phase = "Base" | "Construção" | "Específico" | "Taper";

interface Week {
  week: number;
  phase: Phase;
  mesocycle: number;
  isDeload: boolean;
  volume: number;
  intensity: number;
  notes: string;
  km: number;
  sessions: number;
}

type Goal = "5k" | "10k" | "Meia-maratona" | "Maratona" | "Trail" | "Personalizado";
type Level = "Iniciante" | "Intermediário" | "Avançado";
type ViewTab = "macro" | "treinos";

// ── Days of the week ─────────────────────────────────────────────────────────

const ALL_DAYS = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
] as const;

const DAY_ABBR: Record<string, string> = {
  "Segunda-feira": "SEG",
  "Terça-feira":   "TER",
  "Quarta-feira":  "QUA",
  "Quinta-feira":  "QUI",
  "Sexta-feira":   "SEX",
  Sábado:          "SAB",
  Domingo:         "DOM",
};

// ── Periodization generator ───────────────────────────────────────────────────

// km-per-session at week 1, weekly growth, and peak cap — tuned per level
const LEVEL_KM_CONFIG: Record<Level, { startPerSession: number; weeklyGrowth: number; maxKm: number }> = {
  Iniciante:     { startPerSession: 5.0, weeklyGrowth: 2.0, maxKm: 50  },
  Intermediário: { startPerSession: 8.0, weeklyGrowth: 3.5, maxKm: 90  },
  Avançado:      { startPerSession: 12.0, weeklyGrowth: 5.0, maxKm: 150 },
};

function generatePeriodization(totalWeeks: number, sessions: number, level: Level, sport: SportMode = "RUN"): Week[] {
  const baseEnd = Math.round(totalWeeks * 0.35);
  const construcaoEnd = baseEnd + Math.round(totalWeeks * 0.3);
  const especificoEnd = construcaoEnd + Math.round(totalWeeks * 0.25);

  const cfg = sport === "RUN"
    ? { startPerSession: LEVEL_KM_CONFIG[level].startPerSession, weeklyGrowth: LEVEL_KM_CONFIG[level].weeklyGrowth, maxKm: LEVEL_KM_CONFIG[level].maxKm }
    : null;

  const sportCfg = SPORT_LEVEL_DEFAULTS[sport][level];
  const baseWeekVolume = cfg
    ? cfg.startPerSession * Math.max(1, sessions)
    : sportCfg.start;

  return Array.from({ length: totalWeeks }, (_, i) => {
    const week = i + 1;
    const isDeload = week % 4 === 0;

    let phase: Phase;
    if (week <= baseEnd) phase = "Base";
    else if (week <= construcaoEnd) phase = "Construção";
    else if (week <= especificoEnd) phase = "Específico";
    else phase = "Taper";

    const peakVolume = Math.min(
      baseWeekVolume + (week - 1) * sportCfg.growth,
      sportCfg.max
    );
    const km = Math.round(isDeload ? Math.max(baseWeekVolume * 0.6, peakVolume * 0.6) : peakVolume);

    const baseVolume = isDeload ? 60 : 70 + Math.min(week * 1.5, 25);
    const volume = Math.round(Math.min(baseVolume, 100));
    const intensity = isDeload ? 50 : Math.round(40 + week * 2.5);

    return {
      week,
      phase,
      mesocycle: Math.ceil(week / 4),
      isDeload,
      volume,
      intensity: Math.min(intensity, 95),
      notes: "",
      km,
      sessions: isDeload ? Math.max(1, sessions - 1) : sessions,
    };
  });
}

// ── Constants ────────────────────────────────────────────────────────────────

const PHASE_BADGE: Record<Phase, "info" | "primary" | "warning" | "success"> = {
  Base: "info",
  Construção: "primary",
  Específico: "warning",
  Taper: "success",
};

const PHASE_BG: Record<Phase, string> = {
  Base: "bg-info/5 border-info/20",
  Construção: "bg-primary/5 border-primary/20",
  Específico: "bg-warning/5 border-warning/20",
  Taper: "bg-success/5 border-success/20",
};

const PHASE_BAR: Record<Phase, string> = {
  Base: "bg-info",
  Construção: "bg-primary",
  Específico: "bg-warning",
  Taper: "bg-success",
};

const goals: Goal[] = ["5k", "10k", "Meia-maratona", "Maratona", "Trail", "Personalizado"];
const levels: Level[] = ["Iniciante", "Intermediário", "Avançado"];

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted/50 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

const selectClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer";

const smallInput =
  "rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-xs text-text outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-colors";

function parsePaceStr(str: string): number {
  const parts = str.trim().split(":");
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    if (!isNaN(min) && !isNaN(sec) && sec >= 0 && sec < 60 && min >= 2) {
      return min * 60 + sec;
    }
  }
  return 0;
}

// ── Draft persistence ─────────────────────────────────────────────────────────

const DRAFT_KEY = "periodizacao-draft-v1";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PeriodizacaoPage() {
  const [athletes, setAthletes] = useState<AthleteListItem[]>([]);
  useEffect(() => {
    fetch("/api/coach/athletes")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AthleteListItem[]) => setAthletes(data))
      .catch(() => null);
  }, []);

  // Macro state
  const [sportMode, setSportMode] = useState<SportMode>("RUN");
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [goal, setGoal] = useState<Goal>("Meia-maratona");
  const [level, setLevel] = useState<Level>("Intermediário");
  const [totalWeeks, setTotalWeeks] = useState(16);
  // Training days — default Mon/Wed/Sat
  const [trainingDays, setTrainingDays] = useState<string[]>([
    "Segunda-feira",
    "Quarta-feira",
    "Sábado",
  ]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState(false);

  // Treinos state
  const [view, setView] = useState<ViewTab>("macro");
  const [vdotValue, setVdotValue] = useState("");
  const [raceDistId, setRaceDistId] = useState("5000");
  const [raceTime, setRaceTime] = useState("");
  const [workoutsMap, setWorkoutsMap] = useState<Record<number, GeneratedWorkout[]>>({});
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [liberating, setLiberating] = useState(false);
  const [liberated, setLiberated] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Computed VDOT from race result
  const raceDistMeters = RACE_DISTANCES.find((d) => d.id === raceDistId)?.meters ?? 5000;
  const raceTimeSec = parseRaceTime(raceTime);
  const computedVdot =
    raceTimeSec > 0 ? Math.round(calculateVDOT(raceDistMeters, raceTimeSec) * 10) / 10 : null;
  const vdotNum = vdotValue ? Number(vdotValue) : (computedVdot ?? null);

  function toggleDay(day: string) {
    setTrainingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleGenerate() {
    const result = generatePeriodization(totalWeeks, trainingDays.length || 3, level, sportMode);
    setWeeks(result);
    setGenerated(true);
    setSaved(false);
    setWorkoutsMap({});
    setView("macro");
  }

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        goal?: Goal; level?: Level; totalWeeks?: number; trainingDays?: string[];
        weeks?: Week[]; vdotValue?: string; raceDistId?: string; raceTime?: string;
        workoutsMap?: Record<number, GeneratedWorkout[]>;
      };
      if (!draft.weeks?.length) return;
      setGoal(draft.goal ?? "Meia-maratona");
      setLevel(draft.level ?? "Intermediário");
      setTotalWeeks(draft.totalWeeks ?? 16);
      setTrainingDays(draft.trainingDays ?? ["Segunda-feira", "Quarta-feira", "Sábado"]);
      setWeeks(draft.weeks);
      setGenerated(true);
      setSaved(false);
      setVdotValue(draft.vdotValue ?? "");
      setRaceDistId(draft.raceDistId ?? "5000");
      setRaceTime(draft.raceTime ?? "");
      if (draft.workoutsMap && Object.keys(draft.workoutsMap).length > 0) {
        setWorkoutsMap(draft.workoutsMap);
      }
      setDraftRestored(true);
    } catch { /* storage unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft whenever key state changes (1.5s debounce)
  useEffect(() => {
    if (!generated || weeks.length === 0) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          goal, level, totalWeeks, trainingDays, weeks, vdotValue, raceDistId, raceTime, workoutsMap,
        }));
      } catch { /* storage unavailable */ }
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weeks, workoutsMap, goal, level, totalWeeks, trainingDays, vdotValue, raceDistId, raceTime, generated]);

  function handleWeekChange(weekNum: number, field: keyof Week, value: string | number) {
    setWeeks((prev) => prev.map((w) => (w.week === weekNum ? { ...w, [field]: value } : w)));
    setSaved(false);
  }

  function handleSave() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        goal, level, totalWeeks, trainingDays, weeks, vdotValue, raceDistId, raceTime, workoutsMap,
      }));
    } catch { /* storage unavailable */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleDiscardDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setWeeks([]);
    setGenerated(false);
    setSaved(false);
    setWorkoutsMap({});
    setView("macro");
    setDraftRestored(false);
    setExpandedWeek(null);
    setEditingKey(null);
    setLiberated(false);
  }

  function buildWorkoutsMap(): Record<number, GeneratedWorkout[]> {
    const map: Record<number, GeneratedWorkout[]> = {};
    for (const w of weeks) {
      map[w.week] = generateWorkoutsForWeek({
        phase: w.phase as PhaseType,
        sessionsPerWeek: w.sessions,
        trainingDays,
        targetKm: w.km,
        vdot: vdotNum,
        goal: goal as GoalType,
        level: level as LevelType,
        isDeload: w.isDeload,
      });
    }
    return map;
  }

  function handleGenerateWorkouts() {
    setWorkoutsMap(buildWorkoutsMap());
    setView("treinos");
    setExpandedWeek(1);
    setEditingKey(null);
  }

  function handleRecalcPaces() {
    setWorkoutsMap(buildWorkoutsMap());
  }

  function toggleAthlete(id: string) {
    setSelectedAthletes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleLiberar() {
    if (selectedAthletes.length === 0 || totalWorkouts === 0) return;
    setLiberating(true);
    try {
      await Promise.all(
        selectedAthletes.map((athleteId) =>
          fetch("/api/planos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              athleteId,
              goal,
              level,
              totalWeeks,
              trainingDays,
              liberar: true,
              weeks,
              workoutsMap: Object.fromEntries(
                Object.entries(workoutsMap).map(([k, v]) => [k, v])
              ),
            }),
          })
        )
      );
      setLiberated(true);
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      setTimeout(() => setLiberated(false), 4000);
    } finally {
      setLiberating(false);
    }
  }

  function handleUpdateWorkout(
    weekNum: number,
    sessionIdx: number,
    field: keyof GeneratedWorkout,
    value: string | number
  ) {
    setWorkoutsMap((prev) => {
      const weekArr = [...(prev[weekNum] ?? [])];
      weekArr[sessionIdx] = { ...weekArr[sessionIdx], [field]: value };
      return { ...prev, [weekNum]: weekArr };
    });
  }

  // Summary stats
  const phaseCounts = weeks.reduce((acc, w) => {
    acc[w.phase] = (acc[w.phase] ?? 0) + 1;
    return acc;
  }, {} as Record<Phase, number>);

  const peakVolumeWeek = weeks.reduce(
    (best, w) => (w.volume > (best?.volume ?? 0) ? w : best),
    null as Week | null
  );
  const taperWeeks = weeks.filter((w) => w.phase === "Taper").length;
  const deloadWeeks = weeks.filter((w) => w.isDeload).length;
  const totalWorkouts = Object.values(workoutsMap).reduce((s, arr) => s + arr.length, 0);

  const mesocycles = weeks.reduce((acc, w) => {
    if (!acc[w.mesocycle]) acc[w.mesocycle] = [];
    acc[w.mesocycle].push(w);
    return acc;
  }, {} as Record<number, Week[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-md print:hidden">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link
            href="/treinador/prescricao/corrida"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="text-border">·</span>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold text-text">Planejamento Periodização</span>
          </div>
          {generated && (
            <>
              <span className="text-border">·</span>
              <div className="flex items-center rounded-lg border border-border bg-card p-0.5 gap-0.5">
                <button
                  onClick={() => setView("macro")}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-all",
                    view === "macro" ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text"
                  )}
                >
                  Macro
                </button>
                <button
                  onClick={() => { if (totalWorkouts > 0) setView("treinos"); }}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-all",
                    view === "treinos"
                      ? "bg-primary text-white shadow-sm"
                      : totalWorkouts > 0
                      ? "text-text-muted hover:text-text"
                      : "text-text-muted/40 cursor-not-allowed"
                  )}
                >
                  <Dumbbell className="h-3 w-3" />
                  Treinos
                  {totalWorkouts > 0 && (
                    <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">
                      {totalWorkouts}
                    </span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left sidebar ── */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 print:hidden">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  Gerador automático
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sport selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Modalidade</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["RUN", "BIKE", "SWIM", "TRIATHLON"] as SportMode[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSportMode(s);
                          setGenerated(false);
                          setWeeks([]);
                          setWorkoutsMap({});
                        }}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all",
                          sportMode === s
                            ? "border-primary/60 bg-primary/15 text-primary"
                            : "border-border bg-background text-text-muted hover:border-primary/30 hover:text-text"
                        )}
                      >
                        <span>{SPORT_EMOJIS[s]}</span>
                        <span>{SPORT_LABELS[s]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Athletes — multi-select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-muted">Atletas</label>
                    {selectedAthletes.length > 0 && (
                      <span className="text-[11px] text-primary">{selectedAthletes.length} selecionado{selectedAthletes.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <div className="space-y-1 rounded-xl border border-border bg-background/60 p-2">
                    {athletes.map((a) => {
                      const selected = selectedAthletes.includes(a.id);
                      return (
                        <label
                          key={a.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                            selected ? "bg-primary/10 text-primary" : "hover:bg-card-hover text-text"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleAthlete(a.id)}
                            className="accent-primary h-3.5 w-3.5"
                          />
                          <span className="text-xs font-medium">{a.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Goal — running only */}
                {sportMode === "RUN" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted">Objetivo</label>
                    <div className="relative">
                      <select
                        className={selectClass}
                        value={goal}
                        onChange={(e) => setGoal(e.target.value as Goal)}
                      >
                        {goals.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    </div>
                  </div>
                )}

                {/* Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-muted">Nível</label>
                  <div className="flex gap-2">
                    {levels.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={cn(
                          "flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                          level === l
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border bg-background text-text-muted hover:border-primary/30 hover:text-text"
                        )}
                      >
                        {l === "Intermediário" ? "Inter." : l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Training days picker */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-muted">
                      Dias de treino
                    </label>
                    <span className="text-[11px] text-text-muted">
                      {trainingDays.length}×/semana
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {ALL_DAYS.map((day) => {
                      const selected = trainingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          title={day}
                          className={cn(
                            "rounded-lg border py-2 text-[10px] font-bold transition-all",
                            selected
                              ? "border-primary/60 bg-primary/15 text-primary"
                              : "border-border bg-background text-text-muted hover:border-primary/30 hover:text-text"
                          )}
                        >
                          {DAY_ABBR[day]}
                        </button>
                      );
                    })}
                  </div>
                  {trainingDays.length === 0 && (
                    <p className="text-[11px] text-warning">Selecione pelo menos 1 dia.</p>
                  )}
                  {trainingDays.length > 0 && (
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      {trainingDays.join(", ")}
                    </p>
                  )}
                </div>

                {/* Weeks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-text-muted">Semanas totais</label>
                    <span className="text-sm font-semibold text-text">{totalWeeks}</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={52}
                    value={totalWeeks}
                    onChange={(e) => setTotalWeeks(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>4 sem</span>
                    <span>52 sem</span>
                  </div>
                  <input
                    type="number"
                    min={4}
                    max={52}
                    value={totalWeeks}
                    onChange={(e) =>
                      setTotalWeeks(Math.min(52, Math.max(4, Number(e.target.value))))
                    }
                    className={cn(inputClass, "text-center")}
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={trainingDays.length === 0}
                >
                  <Wand2 className="h-4 w-4" />
                  Gerar periodização
                </Button>
              </CardContent>
            </Card>

            {/* VDOT + workout generation — running only */}
            {generated && sportMode === "RUN" && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-primary" />
                    VDOT & Treinos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Informe o VDOT para calcular os paces. Sem VDOT, usa paces por nível.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-text-muted">VDOT direto</label>
                    <input
                      type="number"
                      min={20}
                      max={85}
                      step={0.5}
                      placeholder="Ex.: 42.5"
                      value={vdotValue}
                      onChange={(e) => setVdotValue(e.target.value)}
                      className={cn(inputClass, "text-sm py-2")}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <div className="flex-1 h-px bg-border" />
                    ou calcule pelo resultado
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-text-muted">Distância</label>
                    <div className="relative">
                      <select
                        className={cn(selectClass, "py-2 text-sm")}
                        value={raceDistId}
                        onChange={(e) => setRaceDistId(e.target.value)}
                      >
                        {RACE_DISTANCES.map((d) => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-text-muted">
                      Tempo (MM:SS ou H:MM:SS)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex.: 22:30"
                      value={raceTime}
                      onChange={(e) => setRaceTime(e.target.value)}
                      className={cn(inputClass, "text-sm py-2")}
                    />
                  </div>
                  {computedVdot && !vdotValue && (
                    <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary font-semibold">
                      VDOT calculado: {computedVdot}
                    </div>
                  )}

                  <Button variant="primary" size="sm" className="w-full" onClick={handleGenerateWorkouts}>
                    <Dumbbell className="h-3.5 w-3.5" />
                    Gerar {totalWeeks} semanas de treinos
                  </Button>

                  {totalWorkouts > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1.5"
                      onClick={handleRecalcPaces}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Recalcular paces
                    </Button>
                  )}

                  {totalWorkouts > 0 && (
                    <p className="text-[10px] text-text-muted text-center">
                      {totalWorkouts} treinos · {trainingDays.length}×/semana ·{" "}
                      {vdotNum ? `VDOT ${vdotNum}` : "pace por nível"}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Phase legend */}
            <Card>
              <CardContent className="py-4 space-y-2">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
                  Fases
                </p>
                {(["Base", "Construção", "Específico", "Taper"] as Phase[]).map((p) => (
                  <div key={p} className="flex items-center gap-2">
                    <Badge variant={PHASE_BADGE[p]} className="w-24 justify-center text-[11px]">
                      {p}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {p === "Base" && "Aeróbico e adaptação"}
                      {p === "Construção" && "Volume e limiar"}
                      {p === "Específico" && "Intensidade e prova"}
                      {p === "Taper" && "Redução e descanso"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* ── Main area ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Draft restored banner */}
            {draftRestored && (
              <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-primary print:hidden">
                <RefreshCw className="h-4 w-4 shrink-0" />
                <span className="flex-1">Rascunho restaurado — continue de onde parou.</span>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="text-xs underline opacity-70 hover:opacity-100 transition-opacity"
                >
                  Novo plano
                </button>
                <button
                  type="button"
                  onClick={() => setDraftRestored(false)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {!generated ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20 text-center px-6"
              >
                <CalendarDays className="h-12 w-12 text-primary/30 mb-4" />
                <p className="font-display text-lg font-semibold text-text">
                  Nenhuma periodização gerada
                </p>
                <p className="mt-1 text-sm text-text-muted max-w-xs">
                  Configure os parâmetros e clique em{" "}
                  <span className="text-primary font-medium">Gerar periodização</span>
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-text-muted">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card font-bold text-primary">1</span>
                  <span>Configurar</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card font-bold text-primary">2</span>
                  <span>Gerar</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card font-bold text-primary">3</span>
                  <span>Salvar</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card font-bold text-primary">4</span>
                  <span>Liberar</span>
                </div>
                <p className="mt-3 text-[11px] text-text-muted">
                  O rascunho é salvo automaticamente — não perca seu trabalho ao sair da página.
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${view}-${totalWeeks}-${goal}-${level}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Title row */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="font-display text-xl font-bold text-text">
                        {SPORT_EMOJIS[sportMode]} Macrociclo {SPORT_LABELS[sportMode]} — {totalWeeks} semanas
                      </h2>
                      <p className="text-sm text-text-muted mt-0.5">
                        {sportMode === "RUN" ? `${goal} · ` : ""}{level} · {trainingDays.length}×/semana
                        {selectedAthletes.length > 0
                          ? ` · ${selectedAthletes.map((id) => athletes.find((a) => a.id === id)?.name ?? "").filter(Boolean).join(", ")}`
                          : ""}
                        {vdotNum ? ` · VDOT ${vdotNum}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap print:hidden">
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <FileDown className="h-4 w-4" />
                        Exportar PDF
                      </Button>
                      {view === "macro" && (
                        <Button
                          variant={saved ? "success" : "secondary"}
                          size="sm"
                          onClick={handleSave}
                        >
                          <Save className="h-4 w-4" />
                          {saved ? "Rascunho salvo!" : "Salvar rascunho"}
                        </Button>
                      )}
                      {view === "treinos" && totalWorkouts > 0 && (
                        <Button
                          variant={liberated ? "success" : "primary"}
                          size="sm"
                          disabled={selectedAthletes.length === 0 || liberating}
                          onClick={handleLiberar}
                          title={selectedAthletes.length === 0 ? "Selecione pelo menos um atleta" : ""}
                        >
                          {liberated ? (
                            <><CheckCircle2 className="h-4 w-4" /> Liberado!</>
                          ) : (
                            <><Send className="h-4 w-4" /> {liberating ? "Liberando…" : `Liberar para ${selectedAthletes.length > 1 ? `${selectedAthletes.length} atletas` : "atleta"}`}</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* ── MACRO VIEW ── */}
                  {view === "macro" && (
                    <>
                      <PeriodizacaoPrintTable
                        weeks={weeks}
                        goal={goal}
                        level={level}
                        totalWeeks={totalWeeks}
                        sport={sportMode}
                        athleteName={selectedAthletes.length === 1 ? (athletes.find((a) => a.id === selectedAthletes[0])?.name) : selectedAthletes.length > 1 ? `${selectedAthletes.length} atletas` : undefined}
                      />
                      <PeriodizacaoCharts weeks={weeks} sport={sportMode} />
                      <div className="space-y-4 print:hidden">
                        {Object.entries(mesocycles).map(([meso, mesoWeeks]) => {
                          const dominantPhase = mesoWeeks.reduce((acc, w) => {
                            acc[w.phase] = (acc[w.phase] ?? 0) + 1;
                            return acc;
                          }, {} as Record<Phase, number>);
                          const topPhase = (
                            Object.entries(dominantPhase) as [Phase, number][]
                          ).sort((a, b) => b[1] - a[1])[0][0];

                          return (
                            <div key={meso} className="space-y-1">
                              <div className="flex items-center gap-2 px-1">
                                <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">
                                  Mesociclo {meso}
                                </span>
                                <div className="flex-1 h-px bg-border" />
                                <Badge variant={PHASE_BADGE[topPhase]} className="text-[10px]">
                                  {topPhase}
                                </Badge>
                              </div>
                              <div
                                className={cn(
                                  "rounded-2xl border overflow-hidden",
                                  PHASE_BG[topPhase]
                                )}
                              >
                                <div className="overflow-x-auto">
                                  <div className="min-w-[38rem]">
                                    <div className="grid grid-cols-[3rem_7rem_5rem_6rem_6rem_4rem_4rem_1fr] gap-x-2 border-b border-border/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                                      <span>Sem.</span>
                                      <span>Fase</span>
                                      <span>Volume</span>
                                      <span>Inten. %</span>
                                      <span>{SPORT_VOLUME_LABEL[sportMode]}</span>
                                      <span>Sessões</span>
                                      <span>Descarga</span>
                                      <span>Notas</span>
                                    </div>
                                    {mesoWeeks.map((w) => (
                                      <WeekRow key={w.week} week={w} onChange={handleWeekChange} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" size="sm" onClick={() => window.print()}>
                            <FileDown className="h-4 w-4" />
                            Exportar PDF
                          </Button>
                          <Button
                            variant={saved ? "success" : "secondary"}
                            size="sm"
                            onClick={handleSave}
                          >
                            <Save className="h-4 w-4" />
                            {saved ? "Rascunho salvo!" : "Salvar rascunho"}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── TREINOS VIEW ── */}
                  {view === "treinos" && (
                    <div className="space-y-3 print:hidden">
                      {totalWorkouts === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                          <Dumbbell className="h-10 w-10 text-primary/30 mb-3" />
                          <p className="font-display text-base font-semibold text-text">
                            Treinos não gerados ainda
                          </p>
                          <p className="mt-1 text-sm text-text-muted">
                            Clique em{" "}
                            <span className="text-primary">
                              &ldquo;Gerar semanas de treinos&rdquo;
                            </span>{" "}
                            no painel lateral
                          </p>
                        </div>
                      ) : sportMode !== "RUN" ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center px-6">
                          <span className="text-4xl mb-3">{SPORT_EMOJIS[sportMode]}</span>
                          <p className="font-display text-base font-semibold text-text">
                            Gerador de treinos {SPORT_LABELS[sportMode]} em breve
                          </p>
                          <p className="mt-1 text-sm text-text-muted max-w-sm">
                            Use a aba de prescrição de {SPORT_LABELS[sportMode].toLowerCase()} para criar
                            treinos individualmente e atribuir às semanas do plano.
                          </p>
                          <Link
                            href={`/treinador/prescricao/${sportMode === "BIKE" ? "ciclismo" : sportMode === "SWIM" ? "natacao" : "triatlo"}`}
                            className="mt-4 text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                          >
                            Ir para prescrição de {SPORT_LABELS[sportMode].toLowerCase()} →
                          </Link>
                        </div>
                      ) : (
                        weeks.map((w) => {
                          const workouts = workoutsMap[w.week] ?? [];
                          const isExpanded = expandedWeek === w.week;
                          return (
                            <WeekWorkoutsCard
                              key={w.week}
                              week={w}
                              workouts={workouts}
                              isExpanded={isExpanded}
                              onToggleExpand={() =>
                                setExpandedWeek(isExpanded ? null : w.week)
                              }
                              editingKey={editingKey}
                              onEdit={(key) =>
                                setEditingKey(editingKey === key ? null : key)
                              }
                              onUpdateWorkout={handleUpdateWorkout}
                            />
                          );
                        })
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── Right sidebar ── */}
          {generated && (
            <aside className="w-full lg:w-60 xl:w-64 shrink-0 space-y-4 print:hidden">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <SummaryRow label="Total de semanas" value={`${totalWeeks} sem`} />
                  <SummaryRow label="Modalidade" value={`${SPORT_EMOJIS[sportMode]} ${SPORT_LABELS[sportMode]}`} />
                  <SummaryRow
                    label="Frequência"
                    value={`${trainingDays.length}×/semana`}
                  />
                  {totalWorkouts > 0 && sportMode === "RUN" && (
                    <SummaryRow label="Total de treinos" value={`${totalWorkouts}`} />
                  )}
                  <div className="space-y-1.5">
                    <span className="text-xs text-text-muted">Fases</span>
                    {(["Base", "Construção", "Específico", "Taper"] as Phase[]).map((p) => (
                      <div key={p} className="flex items-center justify-between">
                        <Badge variant={PHASE_BADGE[p]} className="text-[10px]">
                          {p}
                        </Badge>
                        <span className="text-text font-medium text-xs">
                          {phaseCounts[p] ?? 0} sem
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-border" />
                  <SummaryRow
                    label="Pico de volume"
                    value={
                      peakVolumeWeek
                        ? `Sem. ${peakVolumeWeek.week} — ${peakVolumeWeek.volume}%`
                        : "—"
                    }
                  />
                  <SummaryRow label="Semanas taper" value={`${taperWeeks} sem`} />
                  <SummaryRow label="Semanas descarga" value={`${deloadWeeks} sem`} />
                </CardContent>
              </Card>

              <Card className="border-info/30 bg-info/5">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center gap-2 text-info">
                    <Info className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold">
                      {view === "macro" ? "Sobre periodização" : "Sobre os treinos"}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {view === "macro"
                      ? "Edite volume, intensidade e notas de cada semana. Os dias selecionados no gerador definem quais dias aparecem nos treinos."
                      : "Treinos gerados nos dias de disponibilidade do atleta. Clique em ✎ Editar para ajustar qualquer sessão. Use \"Recalcular paces\" ao atualizar o VDOT."}
                  </p>
                </CardContent>
              </Card>

              {/* VDOT intensity reference table */}
              {vdotNum && (() => {
                const paces = getTrainingPaces(vdotNum);
                return (
                  <Card>
                    <CardContent className="py-4 space-y-2">
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-widest">
                        Tabela de intensidade · VDOT {vdotNum}
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full min-w-[36rem] text-[11px]">
                          <thead>
                            <tr className="bg-card-hover/40 text-text-muted">
                              <th className="px-2 py-1.5 text-left font-medium">Zona</th>
                              <th className="px-2 py-1.5 text-right font-medium">Pace</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {TRAINING_ZONES.map((z) => {
                              const r = paces[z.id];
                              return (
                                <tr key={z.id}>
                                  <td className="px-2 py-1.5">
                                    <span className="flex items-center gap-1.5 font-semibold" style={{ color: z.color }}>
                                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: z.color }} />
                                      {z.label}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1.5 text-right font-mono text-text">
                                    {formatPace(r.fastSecPerKm).replace("/km","")}–{formatPace(r.slowSecPerKm)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

// ── WeekRow ───────────────────────────────────────────────────────────────────

function WeekRow({
  week,
  onChange,
}: {
  week: Week;
  onChange: (weekNum: number, field: keyof Week, value: string | number) => void;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[3rem_7rem_5rem_6rem_6rem_4rem_4rem_1fr] gap-x-2 items-center px-4 py-2.5 border-b border-border/30 last:border-0 transition-colors hover:bg-white/[0.02]",
        week.isDeload && "bg-warning/[0.04]"
      )}
    >
      <span className="text-xs font-semibold text-text">{week.week}</span>
      <Badge variant={PHASE_BADGE[week.phase]} className="w-fit text-[10px] px-2">
        {week.phase}
      </Badge>
      <div className="space-y-0.5">
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", PHASE_BAR[week.phase])}
            style={{ width: `${week.volume}%` }}
          />
        </div>
        <input
          type="number"
          min={10}
          max={100}
          value={week.volume}
          onChange={(e) =>
            onChange(week.week, "volume", Math.min(100, Math.max(10, Number(e.target.value))))
          }
          className="w-full rounded-md border border-border bg-background px-1.5 py-0.5 text-[11px] text-text text-center outline-none focus:border-primary/60"
        />
      </div>
      <input
        type="number"
        min={10}
        max={100}
        value={week.intensity}
        onChange={(e) =>
          onChange(week.week, "intensity", Math.min(100, Math.max(10, Number(e.target.value))))
        }
        className="w-full rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-text text-center outline-none focus:border-primary/60"
      />
      <input
        type="number"
        min={0}
        value={week.km}
        onChange={(e) => onChange(week.week, "km", Number(e.target.value))}
        className="w-full rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-text text-center outline-none focus:border-primary/60"
      />
      <input
        type="number"
        min={1}
        max={7}
        value={week.sessions}
        onChange={(e) =>
          onChange(week.week, "sessions", Math.min(7, Math.max(1, Number(e.target.value))))
        }
        className="w-full rounded-md border border-border bg-background px-1.5 py-1 text-[11px] text-text text-center outline-none focus:border-primary/60"
      />
      <div className="flex justify-center">
        {week.isDeload ? (
          <span className="flex items-center gap-0.5 text-warning text-[11px] font-semibold">
            <TrendingDown className="h-3.5 w-3.5" />↓
          </span>
        ) : (
          <span className="text-text-muted text-[11px]">—</span>
        )}
      </div>
      <input
        type="text"
        placeholder="Adicionar nota…"
        value={week.notes}
        onChange={(e) => onChange(week.week, "notes", e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] text-text placeholder:text-text-muted/40 outline-none focus:border-primary/60 transition-colors"
      />
    </div>
  );
}

// ── WeekWorkoutsCard ──────────────────────────────────────────────────────────

function WeekWorkoutsCard({
  week,
  workouts,
  isExpanded,
  onToggleExpand,
  editingKey,
  onEdit,
  onUpdateWorkout,
}: {
  week: Week;
  workouts: GeneratedWorkout[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  editingKey: string | null;
  onEdit: (key: string) => void;
  onUpdateWorkout: (
    weekNum: number,
    sessionIdx: number,
    field: keyof GeneratedWorkout,
    value: string | number
  ) => void;
}) {
  const totalKm = workouts.reduce((s, w) => s + w.distanceKm, 0);

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-all",
        PHASE_BG[week.phase],
        week.isDeload && "border-warning/30"
      )}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 text-text-muted transition-transform shrink-0",
            isExpanded && "rotate-90"
          )}
        />
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-bold text-text-muted shrink-0">S{week.week}</span>
          <Badge variant={PHASE_BADGE[week.phase]} className="text-[10px] shrink-0">
            {week.phase}
          </Badge>
          {week.isDeload && (
            <Badge variant="warning" className="text-[10px] shrink-0">
              <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
              Descarga
            </Badge>
          )}
          <span className="text-xs text-text truncate">
            Meso {week.mesocycle} · {workouts.length} sessões · {totalKm.toFixed(1)} km
          </span>
        </div>
        <span className="text-[10px] text-text-muted hidden sm:block shrink-0">
          Vol. {week.volume}% · Int. {week.intensity}%
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/30"
          >
            {workouts.map((wo, idx) => {
              const key = `${week.week}-${idx}`;
              return (
                <WorkoutSessionRow
                  key={key}
                  workout={wo}
                  isEditing={editingKey === key}
                  onEdit={() => onEdit(key)}
                  onChange={(field, value) => onUpdateWorkout(week.week, idx, field, value)}
                  isLast={idx === workouts.length - 1}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── WorkoutSessionRow ─────────────────────────────────────────────────────────

function WorkoutSessionRow({
  workout,
  isEditing,
  onEdit,
  onChange,
  isLast,
}: {
  workout: GeneratedWorkout;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (field: keyof GeneratedWorkout, value: string | number) => void;
  isLast: boolean;
}) {
  const [paceStr, setPaceStr] = useState(() => formatPaceSec(workout.targetPaceSecPerKm));

  useEffect(() => {
    setPaceStr(formatPaceSec(workout.targetPaceSecPerKm));
  }, [workout.targetPaceSecPerKm]);

  function commitPace() {
    const sec = parsePaceStr(paceStr);
    if (sec > 0) {
      onChange("targetPaceSecPerKm", sec);
    } else {
      setPaceStr(formatPaceSec(workout.targetPaceSecPerKm));
    }
  }

  const zoneColor = ZONE_COLORS[workout.zone];
  const dayAbbr =
    DAY_ABBR[workout.dayLabel] ?? workout.dayLabel.slice(0, 3).toUpperCase();

  return (
    <div className={cn("bg-background/30", !isLast && "border-b border-border/20")}>
      {/* Compact row */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-[10px] font-bold text-text-muted w-8 shrink-0">{dayAbbr}</span>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: zoneColor }} />
          <span className="text-xs font-semibold text-text truncate">{workout.subtype}</span>
          <span className="text-[10px] text-text-muted shrink-0 hidden sm:block">
            {workout.distanceKm} km
          </span>
          <span
            className="text-[10px] font-mono font-semibold shrink-0 hidden md:block"
            style={{ color: zoneColor }}
          >
            {formatPaceSec(workout.targetPaceSecPerKm)}/km
          </span>
          <span className="text-[10px] text-text-muted shrink-0 hidden lg:block">
            {workout.durationMin} min
          </span>
          <span className="text-[10px] text-text-muted shrink-0 hidden lg:block">
            RPE {workout.targetRpe}
          </span>
          <span
            className="ml-auto text-[10px] font-bold shrink-0 hidden sm:block"
            style={{ color: zoneColor }}
          >
            Zona {workout.zone}
          </span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition-all shrink-0",
            isEditing
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border text-text-muted hover:border-primary/30 hover:text-text"
          )}
        >
          {isEditing ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
          {isEditing ? "Fechar" : "Editar"}
        </button>
      </div>

      {/* Expanded editor */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-border/20 bg-background/50"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Tipo + Título + métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr_6rem_8rem_6rem] gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Tipo de treino
                  </label>
                  <select
                    value={workout.subtype}
                    onChange={(e) => onChange("subtype", e.target.value as WorkoutSubtype)}
                    className={cn(smallInput, "w-full cursor-pointer")}
                  >
                    {(["Rodagem leve","Intervalado curto","Intervalado longo","Tempo Run","Fartlek","Progressivo","Longão","Regenerativo"] as WorkoutSubtype[]).map((s) => (
                      <option key={s} value={s} className="bg-card text-text">{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Título
                  </label>
                  <input
                    type="text"
                    value={workout.title}
                    onChange={(e) => onChange("title", e.target.value)}
                    className={cn(smallInput, "w-full")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Distância (km)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    step={0.5}
                    value={workout.distanceKm}
                    onChange={(e) => onChange("distanceKm", Number(e.target.value))}
                    className={cn(smallInput, "w-full text-center")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Pace (min:seg/km)
                  </label>
                  <input
                    type="text"
                    value={paceStr}
                    onChange={(e) => setPaceStr(e.target.value)}
                    onBlur={commitPace}
                    onKeyDown={(e) => { if (e.key === "Enter") commitPace(); }}
                    placeholder="6:50"
                    className={cn(smallInput, "w-full text-center font-mono")}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    RPE (1–10)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={workout.targetRpe}
                    onChange={(e) => onChange("targetRpe", Number(e.target.value))}
                    className={cn(smallInput, "w-full text-center")}
                  />
                </div>
              </div>

              {/* Objetivo */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Objetivo do treino
                </label>
                <input
                  type="text"
                  value={workout.objective}
                  onChange={(e) => onChange("objective", e.target.value)}
                  className={cn(smallInput, "w-full")}
                />
              </div>

              {/* Aquecimento */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Aquecimento
                </label>
                <textarea
                  rows={2}
                  value={workout.warmup}
                  onChange={(e) => onChange("warmup", e.target.value)}
                  className={cn(smallInput, "w-full resize-none leading-relaxed")}
                />
              </div>

              {/* Parte principal */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Parte principal
                </label>
                <textarea
                  rows={3}
                  value={workout.mainSet}
                  onChange={(e) => onChange("mainSet", e.target.value)}
                  className={cn(smallInput, "w-full resize-none leading-relaxed")}
                />
              </div>

              {/* Volta à calma */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Volta à calma
                </label>
                <textarea
                  rows={2}
                  value={workout.cooldown}
                  onChange={(e) => onChange("cooldown", e.target.value)}
                  className={cn(smallInput, "w-full resize-none leading-relaxed")}
                />
              </div>

              <p className="text-[10px] text-text-muted">
                Faixa de pace:{" "}
                <span className="font-mono text-text">{workout.paceRangeStr}</span> · Zona{" "}
                <span className="font-semibold" style={{ color: ZONE_COLORS[workout.zone] }}>
                  {workout.zone}
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SummaryRow ────────────────────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xs font-semibold text-text">{value}</span>
    </div>
  );
}

// ── PeriodizacaoPrintTable ────────────────────────────────────────────────────

function PeriodizacaoPrintTable({
  weeks,
  goal,
  level,
  totalWeeks,
  sport,
  athleteName,
}: {
  weeks: Week[];
  goal: Goal;
  level: Level;
  totalWeeks: number;
  sport: SportMode;
  athleteName?: string;
}) {
  return (
    <div className="hidden print:block">
      <h1 className="text-xl font-bold text-black">Pace Run Pro — Periodização {SPORT_LABELS[sport]}</h1>
      <p className="mb-4 text-sm text-black">
        {athleteName ? `Atleta: ${athleteName} · ` : ""}
        {sport === "RUN" ? `Objetivo: ${goal} · ` : ""}Nível: {level} · {totalWeeks} semanas
      </p>
      <table className="w-full border-collapse text-xs text-black">
        <thead>
          <tr>
            <th className="border border-black px-2 py-1 text-left">Sem.</th>
            <th className="border border-black px-2 py-1 text-left">Mesociclo</th>
            <th className="border border-black px-2 py-1 text-left">Fase</th>
            <th className="border border-black px-2 py-1 text-left">Volume</th>
            <th className="border border-black px-2 py-1 text-left">Intensidade</th>
            <th className="border border-black px-2 py-1 text-left">{SPORT_VOLUME_LABEL[sport]}</th>
            <th className="border border-black px-2 py-1 text-left">Sessões</th>
            <th className="border border-black px-2 py-1 text-left">Descarga</th>
            <th className="border border-black px-2 py-1 text-left">Notas</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.week}>
              <td className="border border-black px-2 py-1">{w.week}</td>
              <td className="border border-black px-2 py-1">{w.mesocycle}</td>
              <td className="border border-black px-2 py-1">{w.phase}</td>
              <td className="border border-black px-2 py-1">{w.volume}%</td>
              <td className="border border-black px-2 py-1">{w.intensity}%</td>
              <td className="border border-black px-2 py-1">{w.km} km</td>
              <td className="border border-black px-2 py-1">{w.sessions}</td>
              <td className="border border-black px-2 py-1">{w.isDeload ? "Sim" : "—"}</td>
              <td className="border border-black px-2 py-1">{w.notes || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── PeriodizacaoCharts ────────────────────────────────────────────────────────

const PHASE_HEX: Record<Phase, string> = {
  Base:       "#38bdf8",
  Construção: "#6366f1",
  Específico: "#f59e0b",
  Taper:      "#22c55e",
};

function computeTrainingLoad(weeks: Week[]): { ctl: number; atl: number; tsb: number }[] {
  const dailyTss: number[] = [];
  for (const w of weeks) {
    const weeklyTss = (w.volume / 100) * (w.intensity / 100) * w.sessions * 80;
    const daily = weeklyTss / 7;
    for (let d = 0; d < 7; d++) dailyTss.push(daily);
  }
  let ctl = 0, atl = 0;
  return weeks.map((_, wi) => {
    for (let d = 0; d < 7; d++) {
      const tss = dailyTss[wi * 7 + d] ?? 0;
      ctl = ctl + (tss - ctl) * (1 - Math.exp(-1 / 42));
      atl = atl + (tss - atl) * (1 - Math.exp(-1 / 7));
    }
    return { ctl: Math.round(ctl * 10) / 10, atl: Math.round(atl * 10) / 10, tsb: Math.round((ctl - atl) * 10) / 10 };
  });
}

function PeriodizacaoCharts({ weeks, sport }: { weeks: Week[]; sport: SportMode }) {
  if (weeks.length === 0) return null;

  const W = 800;
  const H_VOL = 120;
  const H_TL = 110;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 24;
  const barW = Math.max(4, (W - PAD_L - PAD_R) / weeks.length - 2);
  const maxKm = Math.max(...weeks.map((w) => w.km));

  const tl = computeTrainingLoad(weeks);
  const maxCtl = Math.max(...tl.map((t) => t.ctl), 1);
  const minTsb = Math.min(...tl.map((t) => t.tsb));
  const maxTsb = Math.max(...tl.map((t) => t.tsb));
  const tlMin = Math.min(minTsb, 0) - 5;
  const tlMax = Math.max(maxCtl, maxTsb) + 5;
  const tlRange = tlMax - tlMin;

  function xPos(i: number) {
    return PAD_L + i * ((W - PAD_L - PAD_R) / weeks.length) + barW / 2;
  }
  function tlY(v: number) {
    return PAD_T + (1 - (v - tlMin) / tlRange) * (H_TL - PAD_T - PAD_B);
  }

  const ctlPoints = tl.map((t, i) => `${xPos(i)},${tlY(t.ctl)}`).join(" ");
  const atlPoints = tl.map((t, i) => `${xPos(i)},${tlY(t.atl)}`).join(" ");
  const tsbPoints = tl.map((t, i) => `${xPos(i)},${tlY(t.tsb)}`).join(" ");
  const zeroY = tlY(0);

  return (
    <div className="space-y-3 print:hidden">
      {/* ── Volume chart ── */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Volume por semana ({SPORT_VOLUME_UNIT[sport]})
        </p>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H_VOL}`} className="w-full" style={{ minWidth: Math.max(300, weeks.length * 20) }}>
            {/* Y-axis labels */}
            {[0, 50, 100].map((pct) => {
              const y = PAD_T + (1 - pct / 100) * (H_VOL - PAD_T - PAD_B);
              return (
                <g key={pct}>
                  <text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize={8} fill="currentColor" className="text-text-muted" opacity={0.5}>
                    {Math.round(maxKm * pct / 100)}
                  </text>
                  <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="currentColor" strokeWidth={0.5} opacity={0.15} />
                </g>
              );
            })}
            {/* Bars */}
            {weeks.map((w, i) => {
              const barH = Math.max(2, ((w.km / maxKm) * (H_VOL - PAD_T - PAD_B)));
              const bx = PAD_L + i * ((W - PAD_L - PAD_R) / weeks.length);
              const by = H_VOL - PAD_B - barH;
              const color = PHASE_HEX[w.phase];
              return (
                <g key={w.week}>
                  <rect
                    x={bx + 1} y={by} width={Math.max(2, barW - 2)} height={barH}
                    fill={color} rx={2} opacity={w.isDeload ? 0.4 : 0.85}
                  />
                  {weeks.length <= 20 && (
                    <text x={bx + barW / 2} y={H_VOL - PAD_B + 10} textAnchor="middle" fontSize={7} fill="currentColor" className="text-text-muted" opacity={0.5}>
                      {w.week}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Deload markers */}
            {weeks.filter((w) => w.isDeload).map((w, i) => {
              const bx = PAD_L + (w.week - 1) * ((W - PAD_L - PAD_R) / weeks.length) + barW / 2;
              return (
                <text key={`dl-${i}`} x={bx} y={PAD_T + 8} textAnchor="middle" fontSize={7} fill="#f59e0b" opacity={0.8}>↓</text>
              );
            })}
          </svg>
        </div>
        {/* Phase legend */}
        <div className="mt-2 flex flex-wrap gap-3">
          {(["Base", "Construção", "Específico", "Taper"] as Phase[]).map((p) => (
            <span key={p} className="flex items-center gap-1 text-[10px] text-text-muted">
              <span className="h-2 w-3 rounded-sm inline-block" style={{ backgroundColor: PHASE_HEX[p] }} />
              {p}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[10px] text-text-muted">
            <span className="text-warning">↓</span>
            Semana descarga
          </span>
        </div>
      </div>

      {/* ── Training Load chart (CTL / ATL / TSB) ── */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Carga de treino estimada
        </p>
        <p className="mb-3 text-[10px] text-text-muted">CTL (forma) · ATL (fadiga) · TSB (equilíbrio) — valores simulados a partir do plano</p>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H_TL}`} className="w-full" style={{ minWidth: Math.max(300, weeks.length * 20) }}>
            {/* Zero line (TSB = 0) */}
            <line x1={PAD_L} y1={zeroY} x2={W - PAD_R} y2={zeroY} stroke="#6366f1" strokeWidth={0.5} strokeDasharray="3,3" opacity={0.4} />
            <text x={PAD_L - 4} y={zeroY + 3} textAnchor="end" fontSize={7} fill="#6366f1" opacity={0.6}>0</text>
            {/* ATL area */}
            <polyline points={atlPoints} fill="none" stroke="#fb923c" strokeWidth={1.5} opacity={0.7} />
            {/* CTL line */}
            <polyline points={ctlPoints} fill="none" stroke="#38bdf8" strokeWidth={2} opacity={0.9} />
            {/* TSB line */}
            <polyline points={tsbPoints} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4,2" opacity={0.8} />
            {/* Axis */}
            <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H_TL - PAD_B} stroke="currentColor" strokeWidth={0.5} opacity={0.2} />
          </svg>
        </div>
        <div className="mt-2 flex flex-wrap gap-4">
          {[
            { label: "CTL (Forma crônica)", color: "#38bdf8", dash: false },
            { label: "ATL (Fadiga aguda)", color: "#fb923c", dash: false },
            { label: "TSB (Equilíbrio)", color: "#22c55e", dash: true },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-text-muted">
              <svg width={20} height={8}><line x1={0} y1={4} x2={20} y2={4} stroke={item.color} strokeWidth={2} strokeDasharray={item.dash ? "4,2" : undefined} /></svg>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
