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
  Trophy,
  Medal,
  Target,
  Brain,
  Sparkles,
  SlidersHorizontal,
  CheckCheck,
  Ban,
  BarChart3,
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
import { IntervalsPrescribeModal } from "../../atletas/_list-client";
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
type LoadMethod = "horas" | "distancia" | "series" | "tonelagem" | "srpe";
type Modality = "corrida" | "ciclismo" | "natacao" | "triathlon" | "forca" | "hibrido";
type BuildMode = "automatica" | "manual" | "revisao";
type RecoveryCycle = "4" | "6" | "8" | "manual";
type EventPriority = "A" | "B" | "C";
type SuggestionStatus = "pending" | "accepted" | "declined";

interface SavedPlan {
  id: string;
  name: string;
  macrocycle: string | null;
  startDate: string;
  endDate: string;
  weeksCount: number;
  workoutsCount: number;
  releasedWeeksCount: number;
  athlete: {
    id: string;
    user: { name: string; avatarUrl: string | null };
  };
}

interface TrainingEvent {
  id: string;
  name: string;
  date: string;
  modality: Modality;
  priority: EventPriority;
}

interface PeriodizationSettings {
  name: string;
  startDate: string;
  endDate: string;
  loadMethod: LoadMethod;
  modality: Modality;
  buildMode: BuildMode;
  recoveryCycle: RecoveryCycle;
  fitnessMetric: string;
  minVolume: number;
  avgVolume: number;
  maxVolume: number;
  annualVolume: number;
  includeStrength: boolean;
}

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
  Iniciante:     { startPerSession: 2.5, weeklyGrowth: 0.8, maxKm: 30  },
  Intermediário: { startPerSession: 5.0, weeklyGrowth: 2.0, maxKm: 70  },
  Avançado:      { startPerSession: 8.0, weeklyGrowth: 3.5, maxKm: 115 },
};

function generatePeriodization(totalWeeks: number, sessions: number, level: Level): Week[] {
  const baseEnd = Math.round(totalWeeks * 0.35);
  const construcaoEnd = baseEnd + Math.round(totalWeeks * 0.3);
  const especificoEnd = construcaoEnd + Math.round(totalWeeks * 0.25);

  const cfg = LEVEL_KM_CONFIG[level];
  const baseWeekKm = cfg.startPerSession * Math.max(1, sessions);

  return Array.from({ length: totalWeeks }, (_, i) => {
    const week = i + 1;
    const isDeload = week % 4 === 0;

    let phase: Phase;
    if (week <= baseEnd) phase = "Base";
    else if (week <= construcaoEnd) phase = "Construção";
    else if (week <= especificoEnd) phase = "Específico";
    else phase = "Taper";

    const peakKm = Math.min(baseWeekKm + (week - 1) * cfg.weeklyGrowth, cfg.maxKm);
    const km = Math.round(isDeload ? Math.max(baseWeekKm * 0.6, peakKm * 0.6) : peakKm);

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

const loadMethodLabels: Record<LoadMethod, string> = {
  horas: "Volume em horas",
  distancia: "Volume em distancia",
  series: "Series semanais",
  tonelagem: "Tonelagem",
  srpe: "Carga sRPE",
};

const modalityLabels: Record<Modality, string> = {
  corrida: "Corrida",
  ciclismo: "Ciclismo",
  natacao: "Natacao",
  triathlon: "Triathlon",
  forca: "Forca",
  hibrido: "Endurance + forca",
};

function toCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const defaultPeriodizationSettings: PeriodizationSettings = {
  name: "Macrociclo principal",
  startDate: toCalendarDate(new Date()),
  endDate: toCalendarDate(new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000)),
  loadMethod: "horas",
  modality: "corrida",
  buildMode: "automatica",
  recoveryCycle: "4",
  fitnessMetric: "VDOT 42 / intermediario",
  minVolume: 4,
  avgVolume: 7,
  maxVolume: 10,
  annualVolume: 360,
  includeStrength: true,
};

function weeksBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  const diff = Math.max(7, end.getTime() - start.getTime());
  return Math.min(52, Math.max(4, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))));
}

function weekIndexForDate(startDate: string, date: string): number {
  const start = new Date(startDate + "T12:00:00");
  const target = new Date(date + "T12:00:00");
  return Math.max(1, Math.floor((target.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function generateScientificPeriodization(
  settings: PeriodizationSettings,
  events: TrainingEvent[],
  sessions: number,
  athleteLevel: Level
): Week[] {
  const total = weeksBetween(settings.startDate, settings.endDate);
  const base = generatePeriodization(total, sessions, athleteLevel);
  const recoveryEvery = settings.recoveryCycle === "manual" ? 4 : Number(settings.recoveryCycle);
  const priorityAWeeks = new Set(
    events.filter((event) => event.priority === "A").map((event) => weekIndexForDate(settings.startDate, event.date))
  );
  const taperWeeks = new Set(Array.from(priorityAWeeks).map((week) => Math.max(1, week - 1)));

  return base.map((week) => {
    const isRaceWeek = priorityAWeeks.has(week.week);
    const isTaper = taperWeeks.has(week.week);
    const isRecovery = !isRaceWeek && !isTaper && week.week % recoveryEvery === 0;
    const volumeRange = settings.maxVolume - settings.minVolume;
    const progression = week.week / Math.max(1, total);
    const plannedVolume = settings.minVolume + volumeRange * Math.min(1, progression * 1.15);
    const volumeScale = settings.loadMethod === "distancia" ? 6 : settings.loadMethod === "srpe" ? 90 : settings.loadMethod === "series" ? 3 : settings.loadMethod === "tonelagem" ? 140 : 1;
    const km = Math.max(1, Math.round(plannedVolume * volumeScale * (isRecovery ? 0.72 : isTaper ? 0.55 : isRaceWeek ? 0.35 : 1)));
    const phase: Phase = isTaper || isRaceWeek ? "Taper" : week.phase;
    const intensity = isRaceWeek ? 58 : isTaper ? 45 : Math.min(95, Math.round(week.intensity + (settings.buildMode === "manual" ? 0 : 4)));
    const volume = isRaceWeek ? 38 : isTaper ? 48 : isRecovery ? 62 : Math.min(100, Math.round(68 + progression * 28));
    return {
      ...week,
      phase,
      isDeload: isRecovery || isTaper,
      volume,
      intensity,
      km,
      sessions: isRaceWeek ? Math.max(1, sessions - 2) : isRecovery ? Math.max(1, sessions - 1) : sessions,
      notes: isRaceWeek
        ? "Semana de prova principal: reduzir volume e preservar prontidao."
        : isTaper
        ? "Tapering para prova A: reduzir volume, manter ativacao curta."
        : isRecovery
        ? "Microciclo de recuperacao planejado."
        : week.notes,
    };
  });
}

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
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [goal, setGoal] = useState<Goal>("Meia-maratona");
  const [level, setLevel] = useState<Level>("Intermediário");
  const [totalWeeks, setTotalWeeks] = useState(16);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [periodizationSettings, setPeriodizationSettings] = useState<PeriodizationSettings>(defaultPeriodizationSettings);
  const [trainingEvents, setTrainingEvents] = useState<TrainingEvent[]>([
    {
      id: "event-a",
      name: "Prova-alvo",
      date: defaultPeriodizationSettings.endDate,
      modality: "corrida",
      priority: "A",
    },
  ]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [suggestionStatus, setSuggestionStatus] = useState<Record<string, SuggestionStatus>>({});
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);

  async function refreshSavedPlans() {
    try {
      const response = await fetch("/api/planos", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { plans?: SavedPlan[] };
      setSavedPlans(data.plans ?? []);
    } catch {
      // Keep periodization usable even if history cannot be loaded.
    }
  }

  useEffect(() => {
    refreshSavedPlans();
  }, []);

  useEffect(() => {
    if (selectedAthletes.length === 0 && athletes[0]?.id) {
      setSelectedAthletes([athletes[0].id]);
    }
  }, [athletes, selectedAthletes.length]);
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
  const [prescriptionModal, setPrescriptionModal] = useState<{
    athleteId: string;
    athleteName: string;
    date: string;
    workout?: {
      id: string;
      date: string;
      type: string;
      title: string;
      status: string;
      targetDistanceKm: number | null;
      targetDurationMin: number | null;
      targetPaceSecPerKm: number | null;
      targetRpe: number | null;
      tss: number;
      released: boolean;
    };
  } | null>(null);
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
    const result = generateScientificPeriodization(
      periodizationSettings,
      trainingEvents,
      trainingDays.length || 3,
      level
    );
    setWeeks(result);
    setTotalWeeks(result.length);
    setGenerated(true);
    setSaved(false);
    const nextWorkouts = buildWorkoutsMapFromWeeks(result);
    setWorkoutsMap(nextWorkouts);
    setSuggestionStatus({});
    setView("macro");
    setSelectedWeek(1);
    setBuilderOpen(false);
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

  function handleWeekChange(weekNum: number, field: keyof Week, value: string | number | boolean) {
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

  function buildWorkoutsMapFromWeeks(sourceWeeks: Week[]): Record<number, GeneratedWorkout[]> {
    const map: Record<number, GeneratedWorkout[]> = {};
    for (const w of sourceWeeks) {
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

  function buildWorkoutsMap(): Record<number, GeneratedWorkout[]> {
    return buildWorkoutsMapFromWeeks(weeks);
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
        selectedAthletes.map(async (athleteId) => {
          const response = await fetch("/api/planos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              athleteId,
              periodizationName: periodizationSettings.name,
              startDate: periodizationSettings.startDate,
              endDate: periodizationSettings.endDate,
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
          });
          if (!response.ok) {
            const data = await response.json().catch(() => null) as { error?: string } | null;
            throw new Error(data?.error ?? "Nao foi possivel liberar a periodizacao.");
          }
        })
      );
      setLiberated(true);
      await refreshSavedPlans();
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
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

  function dateForSuggestedWorkout(weekNum: number, dayLabel: string) {
    const start = new Date(`${periodizationSettings.startDate}T12:00:00`);
    const dayIndex = ALL_DAYS.includes(dayLabel as (typeof ALL_DAYS)[number])
      ? ALL_DAYS.indexOf(dayLabel as (typeof ALL_DAYS)[number])
      : 0;
    start.setDate(start.getDate() + ((weekNum - 1) * 7) + dayIndex);
    return toCalendarDate(start);
  }

  function openPrescriptionModal(weekNum: number, workout: GeneratedWorkout, sessionIdx: number) {
    const athleteId = selectedAthletes[0] ?? athletes[0]?.id;
    if (!athleteId) return;
    const athleteName = athletes.find((athlete) => athlete.id === athleteId)?.name ?? "Atleta";
    const date = dateForSuggestedWorkout(weekNum, workout.dayLabel);
    setPrescriptionModal({
      athleteId,
      athleteName,
      date,
      workout: {
        id: `periodizacao-${weekNum}-${sessionIdx}`,
        date,
        type: "RODAGEM_LEVE",
        title: workout.title,
        status: "PLANEJADO",
        targetDistanceKm: workout.distanceKm,
        targetDurationMin: workout.durationMin,
        targetPaceSecPerKm: workout.targetPaceSecPerKm,
        targetRpe: workout.targetRpe,
        tss: Math.round(workout.durationMin * workout.targetRpe),
        released: false,
      },
    });
  }

  function setSuggestion(key: string, status: SuggestionStatus) {
    setSuggestionStatus((prev) => ({ ...prev, [key]: status }));
  }

  function setWeekSuggestions(weekNum: number, status: SuggestionStatus) {
    const workouts = workoutsMap[weekNum] ?? [];
    setSuggestionStatus((prev) => {
      const next = { ...prev };
      workouts.forEach((_, index) => {
        next[`${weekNum}-${index}`] = status;
      });
      return next;
    });
  }

  function setMesoSuggestions(mesocycle: number, status: SuggestionStatus) {
    setSuggestionStatus((prev) => {
      const next = { ...prev };
      weeks.filter((week) => week.mesocycle === mesocycle).forEach((week) => {
        (workoutsMap[week.week] ?? []).forEach((_, index) => {
          next[`${week.week}-${index}`] = status;
        });
      });
      return next;
    });
  }

  function setAllSuggestions(status: SuggestionStatus) {
    setSuggestionStatus((prev) => {
      const next = { ...prev };
      weeks.forEach((week) => {
        (workoutsMap[week.week] ?? []).forEach((_, index) => {
          next[`${week.week}-${index}`] = status;
        });
      });
      return next;
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
  const acceptedSuggestions = weeks.reduce((sum, week) => {
    const workouts = workoutsMap[week.week] ?? [];
    return sum + workouts.filter((_, index) => suggestionStatus[`${week.week}-${index}`] === "accepted").length;
  }, 0);
  const allSuggestionsAccepted = totalWorkouts > 0 && acceptedSuggestions === totalWorkouts;

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
        <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm print:hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h1 className="font-display text-xl font-bold text-text">Periodizacao Intelligence</h1>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                Crie o macrociclo com ATR/blocos, tapering automatico, provas A/B/C e sugestoes de sessoes baseadas em ciencia do treinamento.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {athletes.slice(0, 8).map((athlete) => {
                  const selected = selectedAthletes.includes(athlete.id);
                  return (
                    <button
                      key={athlete.id}
                      type="button"
                      onClick={() => toggleAthlete(athlete.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                        selected
                          ? "border-primary/60 bg-primary/15 text-primary"
                          : "border-border bg-background/60 text-text-muted hover:border-primary/40 hover:text-text"
                      )}
                    >
                      {athlete.name}
                    </button>
                  );
                })}
              </div>
              {generated && (
                <p className="mt-2 text-xs text-text-muted">
                  {periodizationSettings.name} · {modalityLabels[periodizationSettings.modality]} · {loadMethodLabels[periodizationSettings.loadMethod]} · {periodizationSettings.startDate} a {periodizationSettings.endDate}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setBuilderOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
                {generated ? "Editar configuracao" : "Criar periodizacao"}
              </Button>
              {generated && (
                <Button variant={allSuggestionsAccepted ? "success" : "primary"} size="sm" onClick={() => setAllSuggestions("accepted")}>
                  <CheckCheck className="h-4 w-4" />
                  {allSuggestionsAccepted ? "Sugestões aceitas" : "Aceitar Intelligence"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {savedPlans.length > 0 && (
          <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm print:hidden">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">Periodizacoes salvas</p>
                <p className="text-xs text-text-muted">Ultimos macrociclos gerados e enviados para consulta do treinador.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={refreshSavedPlans}>
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {savedPlans.slice(0, 6).map((plan) => (
                <div key={plan.id} className="rounded-xl border border-border bg-background/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">{plan.name}</p>
                      <p className="truncate text-xs text-text-muted">{plan.athlete.user.name}</p>
                    </div>
                    <Badge variant={plan.releasedWeeksCount > 0 ? "success" : "outline"}>
                      {plan.releasedWeeksCount > 0 ? "Liberado" : "Rascunho"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg bg-card-hover/50 p-2">
                      <p className="text-text-muted">Semanas</p>
                      <p className="font-semibold text-text">{plan.weeksCount}</p>
                    </div>
                    <div className="rounded-lg bg-card-hover/50 p-2">
                      <p className="text-text-muted">Treinos</p>
                      <p className="font-semibold text-text">{plan.workoutsCount}</p>
                    </div>
                    <div className="rounded-lg bg-card-hover/50 p-2">
                      <p className="text-text-muted">Periodo</p>
                      <p className="truncate font-semibold text-text">{new Date(plan.startDate).toLocaleDateString("pt-BR", { month: "short", day: "2-digit" })}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <PeriodizationBuilderModal
          open={builderOpen}
          settings={periodizationSettings}
          events={trainingEvents}
          trainingDays={trainingDays}
          onClose={() => setBuilderOpen(false)}
          onSettingsChange={setPeriodizationSettings}
          onEventsChange={setTrainingEvents}
          onToggleDay={toggleDay}
          onGenerate={handleGenerate}
        />

        <div className="block">
          {/* ── Left sidebar ── */}
          <aside className="hidden">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  Gerador automático
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {/* Goal */}
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

            {/* VDOT + workout generation */}
            {generated && (
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
          <div className="min-w-0 space-y-4">
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
                <Button variant="primary" className="mt-6" onClick={() => setBuilderOpen(true)}>
                  <Sparkles className="h-4 w-4" />
                  Criar periodizacao
                </Button>
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
                        Macrociclo — {totalWeeks} semanas
                      </h2>
                      <p className="text-sm text-text-muted mt-0.5">
                        {goal} · {level} · {trainingDays.length}×/semana
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
                      {totalWorkouts > 0 && (
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
                        athleteName={selectedAthletes.length === 1 ? (athletes.find((a) => a.id === selectedAthletes[0])?.name) : selectedAthletes.length > 1 ? `${selectedAthletes.length} atletas` : undefined}
                      />
                      <div className="space-y-4 print:hidden">
                        <MacrocycleScienceChart
                          weeks={weeks}
                          events={trainingEvents}
                          settings={periodizationSettings}
                          selectedWeek={selectedWeek}
                          onSelectWeek={setSelectedWeek}
                        />
                        <IntelligencePanel
                          weeks={weeks}
                          selectedWeek={selectedWeek}
                          workoutsMap={workoutsMap}
                          suggestionStatus={suggestionStatus}
                          onAccept={(key) => setSuggestion(key, "accepted")}
                          onDecline={(key) => setSuggestion(key, "declined")}
                          onAcceptWeek={(weekNum) => setWeekSuggestions(weekNum, "accepted")}
                          onDeclineWeek={(weekNum) => setWeekSuggestions(weekNum, "declined")}
                          onAcceptMeso={(meso) => setMesoSuggestions(meso, "accepted")}
                          onAcceptAll={() => setAllSuggestions("accepted")}
                          onEditWeek={(weekNum) => {
                            setView("treinos");
                            setExpandedWeek(weekNum);
                          }}
                        />
                        <Card className="hidden overflow-hidden">
                          <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-text">Plano de periodizacao</p>
                              <p className="text-xs text-text-muted">Visao por fase, mesociclo, carga e semanas de descarga</p>
                            </div>
                            <div className="hidden items-center gap-2 text-[11px] text-text-muted sm:flex">
                              <span>{totalWeeks} semanas</span>
                              <span>{Object.keys(mesocycles).length} mesociclos</span>
                              <span>{deloadWeeks} descargas</span>
                            </div>
                          </div>
                          <div className="overflow-x-auto p-3">
                            <div
                              className="grid min-w-[900px] gap-1"
                              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(42px, 1fr))` }}
                            >
                              {weeks.map((week) => (
                                <button
                                  key={week.week}
                                  type="button"
                                  onClick={() => handleWeekChange(week.week, "isDeload", !week.isDeload)}
                                  className={cn(
                                    "group relative min-h-[116px] rounded-md border p-1.5 text-left transition-colors hover:border-primary/60",
                                    PHASE_BG[week.phase],
                                    week.isDeload && "ring-1 ring-warning/60"
                                  )}
                                  title="Clique para alternar descarga"
                                >
                                  <span className="block text-[10px] font-bold text-text-muted">S{week.week}</span>
                                  <span className="mt-1 block truncate text-[10px] font-semibold text-text">{week.phase}</span>
                                  <span className="absolute bottom-1.5 left-1.5 right-1.5 h-12 rounded bg-background/40">
                                    <span
                                      className={cn("absolute bottom-0 left-0 right-0 rounded", PHASE_BAR[week.phase])}
                                      style={{ height: `${Math.max(12, week.volume / 2)}%` }}
                                    />
                                  </span>
                                  {week.isDeload && (
                                    <span className="absolute right-1.5 top-1.5 rounded bg-warning px-1 text-[9px] font-bold text-background">
                                      D
                                    </span>
                                  )}
                                  <span className="absolute bottom-14 left-1.5 text-[10px] font-semibold text-text">
                                    {week.km}km
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </Card>
                        <div className="hidden">
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
                                      <span>km/sem</span>
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
                        </div>
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
                              onUpdateWorkout={handleUpdateWorkout}
                              onOpenPrescription={openPrescriptionModal}
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
            <aside className="hidden">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <SummaryRow label="Total de semanas" value={`${totalWeeks} sem`} />
                  <SummaryRow
                    label="Frequência"
                    value={`${trainingDays.length}×/semana`}
                  />
                  {totalWorkouts > 0 && (
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
                      <div className="overflow-hidden rounded-lg border border-border">
                        <table className="w-full text-[11px]">
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
      {prescriptionModal && (
        <IntervalsPrescribeModal
          payload={prescriptionModal}
          onClose={() => setPrescriptionModal(null)}
          onSaved={() => setPrescriptionModal(null)}
        />
      )}
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
  onUpdateWorkout,
  onOpenPrescription,
}: {
  week: Week;
  workouts: GeneratedWorkout[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  editingKey: string | null;
  onUpdateWorkout: (
    weekNum: number,
    sessionIdx: number,
    field: keyof GeneratedWorkout,
    value: string | number
  ) => void;
  onOpenPrescription: (weekNum: number, workout: GeneratedWorkout, sessionIdx: number) => void;
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
                  onEdit={() => onOpenPrescription(week.week, wo, idx)}
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

function PeriodizationBuilderModal({
  open,
  settings,
  events,
  trainingDays,
  onClose,
  onSettingsChange,
  onEventsChange,
  onToggleDay,
  onGenerate,
}: {
  open: boolean;
  settings: PeriodizationSettings;
  events: TrainingEvent[];
  trainingDays: string[];
  onClose: () => void;
  onSettingsChange: (settings: PeriodizationSettings) => void;
  onEventsChange: (events: TrainingEvent[]) => void;
  onToggleDay: (day: string) => void;
  onGenerate: () => void;
}) {
  if (!open) return null;
  const update = <K extends keyof PeriodizationSettings,>(key: K, value: PeriodizationSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  const updateEvent = (id: string, patch: Partial<TrainingEvent>) => {
    onEventsChange(events.map((event) => event.id === id ? { ...event, ...patch } : event));
  };
  const volumeLabel =
    settings.loadMethod === "horas" ? "horas/sem" :
    settings.loadMethod === "distancia" ? "km ou metros/sem" :
    settings.loadMethod === "series" ? "series/sem" :
    settings.loadMethod === "tonelagem" ? "kg totais/sem" :
    "sRPE/sem";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-4 text-text">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">PACE RUN PRO Intelligence</p>
            <h2 className="font-display text-xl font-bold">Criar periodizacao cientifica</h2>
            <p className="mt-1 max-w-2xl text-sm text-text-muted">ATR/blocos, tapering, provas A/B/C, controle de carga por modalidade e sugestao automatica de sessoes.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><SlidersHorizontal className="h-4 w-4 text-primary" />Estrutura do ciclo</CardTitle></CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1"><span className="text-xs font-medium text-text-muted">Metodo de controle de carga</span><select className={selectClass} value={settings.loadMethod} onChange={(e) => update("loadMethod", e.target.value as LoadMethod)}>{Object.entries(loadMethodLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                  <label className="space-y-1"><span className="text-xs font-medium text-text-muted">Modalidade principal</span><select className={selectClass} value={settings.modality} onChange={(e) => update("modality", e.target.value as Modality)}>{Object.entries(modalityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                  <label className="space-y-1 sm:col-span-2"><span className="text-xs font-medium text-text-muted">Nome do ciclo / periodizacao</span><input className={inputClass} value={settings.name} onChange={(e) => update("name", e.target.value)} /></label>
                  <label className="space-y-1"><span className="text-xs font-medium text-text-muted">Data de inicio</span><input type="date" className={inputClass} value={settings.startDate} onChange={(e) => update("startDate", e.target.value)} /></label>
                  <label className="space-y-1"><span className="text-xs font-medium text-text-muted">Data de fim</span><input type="date" className={inputClass} value={settings.endDate} onChange={(e) => update("endDate", e.target.value)} /></label>
                  <label className="space-y-1"><span className="text-xs font-medium text-text-muted">Construcao</span><select className={selectClass} value={settings.buildMode} onChange={(e) => update("buildMode", e.target.value as BuildMode)}><option value="automatica">Automatica</option><option value="revisao">Automatica com revisao</option><option value="manual">Manual</option></select></label>
                    <label className="space-y-1"><span className="text-xs font-medium text-text-muted">Ciclo de recuperacao</span><select className={selectClass} value={settings.recoveryCycle} onChange={(e) => update("recoveryCycle", e.target.value as RecoveryCycle)}><option value="4">A cada 4 semanas</option><option value="6">A cada 6 semanas</option><option value="8">A cada 8 semanas</option><option value="manual">Manual</option></select></label>
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-text-muted">Dias de treino por semana</span>
                        <span className="text-xs font-semibold text-primary">{trainingDays.length}x/semana</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {ALL_DAYS.map((day) => {
                          const selected = trainingDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => onToggleDay(day)}
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
                      {trainingDays.length === 0 ? (
                        <p className="text-[11px] text-warning">Selecione pelo menos 1 dia para gerar sessoes.</p>
                      ) : (
                        <p className="text-[10px] leading-relaxed text-text-muted">{trainingDays.join(", ")}</p>
                      )}
                    </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Target className="h-4 w-4 text-primary" />Condicionamento e volume</CardTitle></CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-4">
                  <label className="space-y-1 sm:col-span-4"><span className="text-xs font-medium text-text-muted">Condicionamento fisico atual</span><select className={selectClass} value={settings.fitnessMetric} onChange={(e) => update("fitnessMetric", e.target.value)}><option>VDOT 42 / intermediario</option><option>FTP 240w / zonas por potencia</option><option>CSS 1:55/100m / tecnica media</option><option>Forca iniciante / RIR 2-3</option><option>Forca intermediario / e1RM conhecido</option><option>Forca avancado / bloco de especializacao</option></select></label>
                  {(["minVolume", "avgVolume", "maxVolume", "annualVolume"] as const).map((key) => <label key={key} className="space-y-1"><span className="text-xs font-medium text-text-muted">{key === "minVolume" ? "Semana facil" : key === "avgVolume" ? "Media" : key === "maxVolume" ? "Semana dificil" : "Total anual"}</span><input type="number" className={inputClass} value={settings[key]} onChange={(e) => update(key, Number(e.target.value))} /></label>)}
                  <p className="rounded-xl border border-info/25 bg-info/10 p-3 text-xs leading-relaxed text-text-muted sm:col-span-4">Unidade atual: <span className="font-semibold text-text">{volumeLabel}</span>. Para musculacao, use series ou tonelagem; para endurance, horas, distancia ou sRPE.</p>
                  <label className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm text-text sm:col-span-4"><input type="checkbox" checked={settings.includeStrength} onChange={(e) => update("includeStrength", e.target.checked)} className="accent-primary" />Inserir sugestoes de treino de forca nas modalidades de endurance</label>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Trophy className="h-4 w-4 text-warning" />Provas e eventos</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {events.map((event) => <div key={event.id} className="rounded-xl border border-border bg-background/50 p-3"><div className="grid gap-2 sm:grid-cols-2"><input className={inputClass} value={event.name} onChange={(e) => updateEvent(event.id, { name: e.target.value })} /><input type="date" className={inputClass} value={event.date} onChange={(e) => updateEvent(event.id, { date: e.target.value })} /><select className={selectClass} value={event.modality} onChange={(e) => updateEvent(event.id, { modality: e.target.value as Modality })}>{Object.entries(modalityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select className={selectClass} value={event.priority} onChange={(e) => updateEvent(event.id, { priority: e.target.value as EventPriority })}><option value="A">Prioridade A</option><option value="B">Prioridade B</option><option value="C">Prioridade C</option></select></div></div>)}
                <Button variant="outline" size="sm" className="w-full" onClick={() => onEventsChange([...events, { id: `event-${Date.now()}`, name: "Novo evento", date: settings.endDate, modality: settings.modality, priority: "B" }])}><CalendarDays className="h-4 w-4" />Adicionar prova/evento</Button>
                <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-xs leading-relaxed text-text-muted"><p className="font-semibold text-text">Base cientifica aplicada</p><p className="mt-1">Forca: volume, RPE/RIR e progressao inspirados em Schoenfeld. Endurance: blocos ATR, tapering e especificidade por modalidade.</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={onGenerate}><Sparkles className="h-4 w-4" />Gerar periodizacao + Intelligence</Button></div>
      </div>
    </div>
  );
}

function MacrocycleScienceChart({ weeks, events, settings, selectedWeek, onSelectWeek }: { weeks: Week[]; events: TrainingEvent[]; settings: PeriodizationSettings; selectedWeek: number | null; onSelectWeek: (week: number) => void }) {
  const points = weeks.map((week, index) => `${weeks.length <= 1 ? 0 : (index / (weeks.length - 1)) * 100},${100 - week.intensity}`).join(" ");
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="flex items-center gap-2 text-sm font-semibold text-text"><BarChart3 className="h-4 w-4 text-primary" />Macrociclo completo</p><p className="text-xs text-text-muted">{settings.name} · colunas = volume · linha = intensidade · {loadMethodLabels[settings.loadMethod]}</p></div><div className="flex flex-wrap gap-2 text-[10px] text-text-muted">{(["Base", "Construção", "Específico", "Taper"] as Phase[]).map((phase) => <span key={phase} className="flex items-center gap-1"><span className={cn("h-2.5 w-2.5 rounded-full", PHASE_BAR[phase])} />{phase}</span>)}</div></div>
      <div className="relative overflow-x-auto p-4"><div className="relative min-w-[980px]"><svg className="pointer-events-none absolute inset-x-0 top-4 h-56 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={points} fill="none" stroke="#ff6b1a" strokeWidth="1.8" vectorEffect="non-scaling-stroke" /></svg><div className="grid h-64 items-end gap-1" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(34px, 1fr))` }}>{weeks.map((week) => { const event = events.find((item) => weekIndexForDate(settings.startDate, item.date) === week.week); const selected = selectedWeek === week.week; return <button key={week.week} type="button" onClick={() => onSelectWeek(week.week)} className={cn("group relative flex h-full flex-col justify-end rounded-lg border px-1.5 pb-2 transition-all hover:border-primary/70", selected ? "border-primary bg-primary/10" : "border-border bg-background/35")}><span className="absolute left-1 top-1 text-[9px] font-bold text-text-muted">S{week.week}</span>{event && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning text-background" title={event.name}>{event.priority === "A" ? <Trophy className="h-3 w-3" /> : <Medal className="h-3 w-3" />}</span>}<span className={cn("mx-auto w-full rounded-t-md", PHASE_BAR[week.phase], week.isDeload && "opacity-60")} style={{ height: `${Math.max(14, week.volume * 1.75)}px` }} /><span className="mt-1 truncate text-center text-[9px] font-semibold text-text">{week.km}</span></button>; })}</div></div></div>
    </Card>
  );
}

function IntelligencePanel({ weeks, selectedWeek, workoutsMap, suggestionStatus, onAccept, onDecline, onAcceptWeek, onDeclineWeek, onAcceptMeso, onAcceptAll, onEditWeek }: { weeks: Week[]; selectedWeek: number | null; workoutsMap: Record<number, GeneratedWorkout[]>; suggestionStatus: Record<string, SuggestionStatus>; onAccept: (key: string) => void; onDecline: (key: string) => void; onAcceptWeek: (week: number) => void; onDeclineWeek: (week: number) => void; onAcceptMeso: (mesocycle: number) => void; onAcceptAll: () => void; onEditWeek: (week: number) => void }) {
  const week = weeks.find((item) => item.week === selectedWeek) ?? weeks[0];
  const workouts = week ? workoutsMap[week.week] ?? [] : [];
  const totalSuggestions = weeks.reduce((sum, item) => sum + (workoutsMap[item.week]?.length ?? 0), 0);
  const acceptedSuggestions = weeks.reduce((sum, item) => {
    const list = workoutsMap[item.week] ?? [];
    return sum + list.filter((_, index) => suggestionStatus[`${item.week}-${index}`] === "accepted").length;
  }, 0);
  const allAccepted = totalSuggestions > 0 && acceptedSuggestions === totalSuggestions;
  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="flex items-center gap-2 text-sm font-semibold text-text"><Brain className="h-4 w-4 text-primary" />Intelligence de sessoes</p><p className="text-xs text-text-muted">Aceite, recuse ou edite as sugestoes sem perder o macrociclo de vista.</p></div>{week && <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => onEditWeek(week.week)}><Pencil className="h-4 w-4" />Editar semana {week.week}</Button><Button variant="secondary" size="sm" onClick={() => onAcceptWeek(week.week)}><CheckCheck className="h-4 w-4" />Aceitar semana</Button><Button variant="outline" size="sm" onClick={() => onAcceptMeso(week.mesocycle)}>Aceitar mesociclo</Button><Button variant={allAccepted ? "success" : "primary"} size="sm" onClick={onAcceptAll}>{allAccepted ? "Tudo aceito" : "Aceitar tudo"}</Button></div>}</div>
      <CardContent className="grid gap-3 pt-4 lg:grid-cols-[1fr_260px]"><div className="space-y-2">{workouts.length === 0 ? <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-text-muted">Selecione uma semana no grafico.</p> : workouts.map((workout, index) => { const key = `${week.week}-${index}`; const status = suggestionStatus[key] ?? "pending"; return <div key={key} className={cn("rounded-xl border p-3", status === "accepted" ? "border-success/40 bg-success/10" : status === "declined" ? "border-danger/40 bg-danger/10 opacity-70" : "border-border bg-background/50")}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-text">{workout.dayLabel} · {workout.title}</p><p className="mt-1 text-xs text-text-muted">{workout.objective}</p><p className="mt-1 text-[11px] text-text-muted">Zona {workout.zone} · {workout.distanceKm} km · {workout.durationMin} min · RPE {workout.targetRpe}</p></div><div className="flex gap-1.5"><button onClick={() => onAccept(key)} className="rounded-lg border border-success/40 px-2 py-1 text-xs font-semibold text-success hover:bg-success/10"><Check className="inline h-3 w-3" /> Aceitar</button><button onClick={() => onDecline(key)} className="rounded-lg border border-danger/40 px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10"><Ban className="inline h-3 w-3" /> Recusar</button></div></div></div>; })}</div><div className="rounded-xl border border-primary/25 bg-primary/10 p-3"><p className="flex items-center gap-2 text-sm font-semibold text-text"><Sparkles className="h-4 w-4 text-primary" />Racional cientifico</p><p className="mt-2 text-xs leading-relaxed text-text-muted">As sessoes foram distribuidas pelo foco do microciclo, fase do mesociclo, volume alvo e intensidade. Em tapering, o volume cai e a intensidade vira ativacao curta.</p>{week && <button onClick={() => onDeclineWeek(week.week)} className="mt-3 w-full rounded-lg border border-danger/30 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/10">Recusar sugestoes da semana</button>}</div></CardContent>
    </Card>
  );
}

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
  athleteName,
}: {
  weeks: Week[];
  goal: Goal;
  level: Level;
  totalWeeks: number;
  athleteName?: string;
}) {
  return (
    <div className="hidden print:block">
      <h1 className="text-xl font-bold text-black">Pace Run Pro — Periodização</h1>
      <p className="mb-4 text-sm text-black">
        {athleteName ? `Atleta: ${athleteName} · ` : ""}
        Objetivo: {goal} · Nível: {level} · {totalWeeks} semanas
      </p>
      <table className="w-full border-collapse text-xs text-black">
        <thead>
          <tr>
            <th className="border border-black px-2 py-1 text-left">Sem.</th>
            <th className="border border-black px-2 py-1 text-left">Mesociclo</th>
            <th className="border border-black px-2 py-1 text-left">Fase</th>
            <th className="border border-black px-2 py-1 text-left">Volume</th>
            <th className="border border-black px-2 py-1 text-left">Intensidade</th>
            <th className="border border-black px-2 py-1 text-left">km/sem</th>
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
