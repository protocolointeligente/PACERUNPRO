"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  X,
  Check,
  Loader2,
  Pencil,
  PanelRight,
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  EyeOff,
  Eye,
  Lock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────

type SportKey = "RUN" | "BIKE" | "SWIM" | "STRENGTH" | "TRIATHLON" | "BRICK" | "MOBILITY" | "REST";

interface CalendarWorkout {
  id: string;
  date: string;
  type: string;
  title: string;
  status: string;
  objective?: string | null;
  warmup?: string | null;
  mainSet?: string | null;
  cooldown?: string | null;
  notes?: string | null;
  targetDistanceKm?: number | null;
  targetDurationMin?: number | null;
  targetPaceSecPerKm?: number | null;
  targetPacePer100m?: number | null;
  targetPowerWatts?: number | null;
  targetRpe?: number | null;
}

interface CalendarWorkoutLog {
  id: string;
  workoutId: string | null;
  distanceKm?: number | null;
  durationSec?: number | null;
  avgPaceSecPerKm?: number | null;
  avgWatts?: number | null;
  avgPacePer100m?: number | null;
  rpe?: number | null;
  actualLoad?: number | null;
  tss?: number | null;
  feeling?: string | null;
}

interface AthleteDetail {
  name: string;
  avatarUrl?: string | null;
  adherenceRate?: number | null;
  status?: string | null;
  goal?: string | null;
  level?: string | null;
  raceDate?: string | null;
}

interface AthleteOption {
  id: string;
  name: string;
}

interface Props {
  athleteId: string;
  athletes: AthleteOption[];
  initialWorkouts: CalendarWorkout[];
  initialLogs: CalendarWorkoutLog[];
  initialYear: number;
  initialMonth: number;
  athleteDetail: AthleteDetail | null;
  addSport?: string | null;
}

// ── Constants ─────────────────────────────────────────────────────

const SPORT_TYPES: { key: SportKey; label: string; emoji: string; bgClass: string }[] = [
  { key: "RUN",       label: "Corrida",    emoji: "🏃", bgClass: "bg-orange-500/20 hover:bg-orange-500/30" },
  { key: "BIKE",      label: "Ciclismo",   emoji: "🚴", bgClass: "bg-yellow-500/20 hover:bg-yellow-500/30" },
  { key: "SWIM",      label: "Natação",    emoji: "🏊", bgClass: "bg-blue-500/20 hover:bg-blue-500/30"     },
  { key: "STRENGTH",  label: "Força",      emoji: "💪", bgClass: "bg-red-500/20 hover:bg-red-500/30"       },
  { key: "TRIATHLON", label: "Triathlon",  emoji: "🏅", bgClass: "bg-purple-500/20 hover:bg-purple-500/30" },
  { key: "BRICK",     label: "Brick",      emoji: "🧱", bgClass: "bg-rose-500/20 hover:bg-rose-500/30"     },
  { key: "MOBILITY",  label: "Mobilidade", emoji: "🧘", bgClass: "bg-green-500/20 hover:bg-green-500/30"   },
  { key: "REST",      label: "Folga",      emoji: "💤", bgClass: "bg-gray-500/20 hover:bg-gray-500/30"     },
];

const SPORT_WORKOUT_TYPES: Record<SportKey, { value: string; label: string }[]> = {
  RUN: [
    { value: "RODAGEM_LEVE",        label: "Rodagem leve"       },
    { value: "INTERVALADO_CURTO",   label: "Intervalado curto"  },
    { value: "INTERVALADO_LONGO",   label: "Intervalado longo"  },
    { value: "TEMPO_RUN",           label: "Tempo Run"          },
    { value: "FARTLEK",             label: "Fartlek"            },
    { value: "PROGRESSIVO",         label: "Progressivo"        },
    { value: "LONGAO",              label: "Longão"             },
    { value: "REGENERATIVO",        label: "Regenerativo"       },
    { value: "SUBIDA",              label: "Subida"             },
    { value: "TECNICA",             label: "Técnica"            },
    { value: "PROVA",               label: "Prova"              },
  ],
  BIKE: [
    { value: "ENDURANCE_BIKE",      label: "Endurance"          },
    { value: "RECOVERY_BIKE",       label: "Recuperação"        },
    { value: "TEMPO_BIKE",          label: "Tempo"              },
    { value: "SWEET_SPOT",          label: "Sweet Spot"         },
    { value: "THRESHOLD_BIKE",      label: "Limiar"             },
    { value: "VO2MAX_BIKE",         label: "VO2 Máx"            },
    { value: "ANAEROBIC_BIKE",      label: "Anaeróbico"         },
    { value: "SPRINT_BIKE",         label: "Sprint"             },
    { value: "LONG_RIDE",           label: "Long Ride"          },
  ],
  SWIM: [
    { value: "TECNICA_NATACAO",     label: "Técnica"            },
    { value: "ENDURANCE_NATACAO",   label: "Endurance"          },
    { value: "INTERVALADO_NATACAO", label: "Intervalado"        },
    { value: "LIMIAR_NATACAO",      label: "Limiar"             },
    { value: "SPRINT_NATACAO",      label: "Sprint"             },
    { value: "RECUPERACAO_NATACAO", label: "Recuperação"        },
    { value: "AGUAS_ABERTAS",       label: "Águas abertas"      },
  ],
  STRENGTH: [
    { value: "FORCA",               label: "Força"              },
    { value: "FUNCIONAL",           label: "Funcional"          },
  ],
  TRIATHLON: [
    { value: "SIMULADO_TRIATHLON",  label: "Simulado"           },
    { value: "TREINO_COMBINADO",    label: "Combinado"          },
    { value: "TRANSICAO",           label: "Transição"          },
  ],
  BRICK: [
    { value: "BRICK_BIKE_RUN",      label: "Bike + Corrida"     },
    { value: "BRICK_SWIM_BIKE",     label: "Natação + Bike"     },
  ],
  MOBILITY: [
    { value: "MOBILIDADE",          label: "Mobilidade"         },
  ],
  REST: [
    { value: "RECUPERACAO",         label: "Folga / Recuperação" },
  ],
};

const WORKOUT_SPORT_MAP: Record<string, SportKey> = Object.fromEntries(
  Object.entries(SPORT_WORKOUT_TYPES).flatMap(([sport, types]) =>
    types.map(({ value }) => [value, sport as SportKey])
  )
);

// Per workout-type color (mirrors prescricao/page.tsx TYPE_COLORS)
const TYPE_COLORS: Record<string, string> = {
  RODAGEM_LEVE: "#84cc16", INTERVALADO_CURTO: "#ef4444",
  INTERVALADO_LONGO: "#FFB020", TEMPO_RUN: "#eab308", FARTLEK: "#a78bfa",
  PROGRESSIVO: "#38bdf8", LONGAO: "#22c55e", REGENERATIVO: "#94a3b8",
  SUBIDA: "#fb923c", PROVA: "#ec4899", TECNICA: "#22c55e",
  ENDURANCE_BIKE: "#3b82f6", SWEET_SPOT: "#8b5cf6", TEMPO_BIKE: "#f59e0b",
  THRESHOLD_BIKE: "#ef4444", VO2MAX_BIKE: "#ec4899", RECOVERY_BIKE: "#10b981",
  LONG_RIDE: "#06b6d4", ANAEROBIC_BIKE: "#ef4444", SPRINT_BIKE: "#ec4899",
  TECNICA_NATACAO: "#06b6d4", ENDURANCE_NATACAO: "#22c55e",
  INTERVALADO_NATACAO: "#f97316", LIMIAR_NATACAO: "#ef4444",
  SPRINT_NATACAO: "#ec4899", RECUPERACAO_NATACAO: "#94a3b8",
  AGUAS_ABERTAS: "#0ea5e9", FORCA: "#46E0C8", FUNCIONAL: "#46E0C8",
  MOBILIDADE: "#84cc16", RECUPERACAO: "#94a3b8",
  SIMULADO_TRIATHLON: "#8b5cf6", TREINO_COMBINADO: "#38bdf8", TRANSICAO: "#94a3b8",
  BRICK_BIKE_RUN: "#f97316", BRICK_SWIM_BIKE: "#06b6d4",
};

const STATUS_BADGE: Record<string, { label: string; dot: string }> = {
  CONCLUIDO: { label: "Concluído", dot: "#22c55e" },
  LIBERADO:  { label: "Prog.",     dot: "#94a3b8" },
  AGENDADO:  { label: "Agendado",  dot: "#94a3b8" },
  PERDIDO:   { label: "Perdido",   dot: "#ef4444" },
  AJUSTADO:  { label: "Ajustado",  dot: "#f59e0b" },
};

function getTypeColor(workoutType: string): string {
  return TYPE_COLORS[workoutType] ?? "#94a3b8";
}

// ── Intensity ─────────────────────────────────────────────────────

type IntensityMethod = "VDOT" | "ZONES" | "FTP" | "CSS" | "RPE" | "1RM_PCT";

const SPORT_METHODS: Record<SportKey, { id: IntensityMethod; label: string }[]> = {
  RUN:       [{ id: "VDOT", label: "VDOT" }, { id: "ZONES", label: "Zonas FC" }, { id: "RPE", label: "RPE" }],
  BIKE:      [{ id: "FTP", label: "Zonas FTP" }, { id: "ZONES", label: "Zonas FC" }, { id: "RPE", label: "RPE" }],
  SWIM:      [{ id: "CSS", label: "CSS" }, { id: "ZONES", label: "Zonas FC" }, { id: "RPE", label: "RPE" }],
  STRENGTH:  [{ id: "1RM_PCT", label: "% de 1RM" }, { id: "RPE", label: "RPE" }],
  TRIATHLON: [{ id: "RPE", label: "RPE" }],
  BRICK:     [{ id: "RPE", label: "RPE" }],
  MOBILITY:  [{ id: "RPE", label: "RPE" }],
  REST:      [{ id: "RPE", label: "RPE" }],
};

const VDOT_PACES: Record<number, { E: string; M: string; T: string; I: string; R: string }> = {
  30: { E: "8:19", M: "7:25", T: "7:00", I: "6:38", R: "6:19" },
  35: { E: "7:20", M: "6:33", T: "6:09", I: "5:52", R: "5:36" },
  40: { E: "6:33", M: "5:50", T: "5:29", I: "5:12", R: "4:58" },
  45: { E: "5:56", M: "5:19", T: "4:59", I: "4:44", R: "4:31" },
  50: { E: "5:27", M: "4:54", T: "4:35", I: "4:21", R: "4:09" },
  55: { E: "5:04", M: "4:32", T: "4:15", I: "4:01", R: "3:50" },
  60: { E: "4:44", M: "4:14", T: "3:58", I: "3:45", R: "3:35" },
  65: { E: "4:27", M: "3:59", T: "3:43", I: "3:31", R: "3:22" },
  70: { E: "4:13", M: "3:46", T: "3:31", I: "3:19", R: "3:11" },
  75: { E: "4:00", M: "3:34", T: "3:20", I: "3:08", R: "3:00" },
};

function lookupVdot(v: number) {
  const keys = Object.keys(VDOT_PACES).map(Number).sort((a, b) => a - b);
  const low = keys.filter((k) => k <= v).at(-1);
  const high = keys.filter((k) => k > v)[0];
  if (!low && !high) return null;
  if (!low) return VDOT_PACES[high!];
  if (!high) return VDOT_PACES[low];
  const t = (v - low) / (high - low);
  const lerp = (a: string, b: string) => {
    const toSec = (s: string) => { const [m, sec] = s.split(":").map(Number); return m * 60 + sec; };
    const fromSec = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
    return fromSec(toSec(a) + t * (toSec(b) - toSec(a)));
  };
  return {
    E: lerp(VDOT_PACES[low].E, VDOT_PACES[high].E),
    M: lerp(VDOT_PACES[low].M, VDOT_PACES[high].M),
    T: lerp(VDOT_PACES[low].T, VDOT_PACES[high].T),
    I: lerp(VDOT_PACES[low].I, VDOT_PACES[high].I),
    R: lerp(VDOT_PACES[low].R, VDOT_PACES[high].R),
  };
}

const FC_ZONES = [
  { zone: "Z1", label: "Recuperação Ativa",  fcPct: "<60%",    rpe: "1–3",  color: "#94a3b8" },
  { zone: "Z2", label: "Aeróbico Base",       fcPct: "60–70%",  rpe: "4–5",  color: "#22c55e" },
  { zone: "Z3", label: "Tempo / Aeróbico+",  fcPct: "71–80%",  rpe: "6–7",  color: "#eab308" },
  { zone: "Z4", label: "Limiar Anaeróbico",  fcPct: "81–90%",  rpe: "8",    color: "#f97316" },
  { zone: "Z5", label: "VO₂máx",             fcPct: ">90%",    rpe: "9–10", color: "#ef4444" },
];

const FTP_ZONES = [
  { zone: "Z1", label: "Recuperação",         ftpPct: "<55%",     color: "#94a3b8" },
  { zone: "Z2", label: "Endurance",           ftpPct: "56–75%",   color: "#22c55e" },
  { zone: "Z3", label: "Tempo",               ftpPct: "76–90%",   color: "#38bdf8" },
  { zone: "Z4", label: "Limiar (Sweet Spot)", ftpPct: "91–105%",  color: "#eab308" },
  { zone: "Z5", label: "VO₂máx",             ftpPct: "106–120%", color: "#f97316" },
  { zone: "Z6", label: "Anaeróbico",          ftpPct: ">121%",    color: "#ef4444" },
];

const CSS_ZONES = [
  { zone: "T1", label: "Volume / Base",     cssOffset: "+15s",   color: "#22c55e" },
  { zone: "T2", label: "Aeróbico",          cssOffset: "+10s",   color: "#38bdf8" },
  { zone: "T3", label: "Limiar CSS−",       cssOffset: "+5s",    color: "#eab308" },
  { zone: "T4", label: "Ritmo CSS",         cssOffset: "CSS",    color: "#f97316" },
  { zone: "T5", label: "Sprint / Potência", cssOffset: "Abaixo", color: "#ef4444" },
];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const DAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

// ── Helpers ───────────────────────────────────────────────────────

function toUTCDate(iso: string): Date {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dateKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildGridDays(year: number, month: number): Date[] {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const firstDow = firstDay.getUTCDay();
  const offsetMon = firstDow === 0 ? 6 : firstDow - 1;
  const gridStart = new Date(Date.UTC(year, month, 1 - offsetMon));

  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const lastDow = lastDay.getUTCDay();
  const remainAfterLast = lastDow === 0 ? 0 : 7 - lastDow;
  const gridEnd = new Date(Date.UTC(year, month + 1, remainAfterLast));

  const days: Date[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    days.push(new Date(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

function formatPacePerKm(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = secPerKm % 60;
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

function getSportForType(workoutType: string): SportKey {
  return WORKOUT_SPORT_MAP[workoutType] ?? "RUN";
}

function getSport(key: SportKey) {
  return SPORT_TYPES.find((s) => s.key === key) ?? SPORT_TYPES[0];
}

function groupByWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

const TYPE_DEFAULT_RPE: Record<string, number> = {
  RECUPERACAO: 2, RECUPERACAO_NATACAO: 2, RECOVERY_BIKE: 2, MOBILIDADE: 2,
  REGENERATIVO: 3, TECNICA: 3, TECNICA_NATACAO: 3, TRANSICAO: 3,
  RODAGEM_LEVE: 5, ENDURANCE_BIKE: 5, ENDURANCE_NATACAO: 5,
  PROGRESSIVO: 6, FARTLEK: 6, LONGAO: 6, SWEET_SPOT: 6, AGUAS_ABERTAS: 6, TREINO_COMBINADO: 6,
  SUBIDA: 7, TEMPO_RUN: 7, INTERVALADO_LONGO: 7, THRESHOLD_BIKE: 7, LONG_RIDE: 7,
  LIMIAR_NATACAO: 7, FUNCIONAL: 7, FORCA: 7, BRICK_SWIM_BIKE: 7, SIMULADO_TRIATHLON: 7,
  INTERVALADO_CURTO: 8, VO2MAX_BIKE: 8, ANAEROBIC_BIKE: 8, SPRINT_BIKE: 8, SPRINT_NATACAO: 8, BRICK_BIKE_RUN: 8,
  PROVA: 9, TEMPO_BIKE: 6,
};

interface WeekLoad {
  sRpe: number;          // planned sRPE (durationMin × rpe)
  actualSRpe: number;    // actual sRPE from logs
  runKm: number;
  bikeKm: number;
  swimM: number;         // stored as targetDistanceKm but represents meters for swim
  strengthMin: number;
  count: number;         // number of planned workouts
  countDone: number;
}

function computeWeekLoad(
  weekDays: Date[],
  workoutsByDay: Map<string, CalendarWorkout[]>,
  logsByWorkout: Map<string, CalendarWorkoutLog>
): WeekLoad {
  let sRpe = 0, actualSRpe = 0, runKm = 0, bikeKm = 0, swimM = 0, strengthMin = 0, count = 0, countDone = 0;
  for (const day of weekDays) {
    const ws = workoutsByDay.get(dateKey(day)) ?? [];
    for (const w of ws) {
      count++;
      if (w.status === "CONCLUIDO") countDone++;
      const dur = w.targetDurationMin ?? 0;
      const rpe = w.targetRpe ?? TYPE_DEFAULT_RPE[w.type] ?? 5;
      sRpe += dur * rpe;
      const sport = getSportForType(w.type);
      if (sport === "RUN") runKm += w.targetDistanceKm ?? 0;
      else if (sport === "BIKE") bikeKm += w.targetDistanceKm ?? 0;
      else if (sport === "SWIM") swimM += w.targetDistanceKm ?? 0;
      else if (sport === "STRENGTH") strengthMin += dur;
      const log = logsByWorkout.get(w.id);
      if (log?.actualLoad) actualSRpe += log.actualLoad;
    }
  }
  return { sRpe: Math.round(sRpe), actualSRpe: Math.round(actualSRpe), runKm, bikeKm, swimM, strengthMin, count, countDone };
}

function fmtDurationMin(min: number): string {
  if (min < 60) return `${Math.round(min)}min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// ── Form state type ───────────────────────────────────────────────

interface FormState {
  title: string;
  workoutType: string;
  objective: string;
  warmup: string;
  mainSet: string;
  cooldown: string;
  targetRpe: string;
  targetDurationMin: string;
  targetDistanceKm: string;
  targetPaceMin: string;
  targetPaceSec: string;
  targetPacePer100mMin: string;
  targetPacePer100mSec: string;
  targetPowerWatts: string;
  // Intensity method
  intensityMethod: IntensityMethod;
  vdotValue: string;
  ftpValue: string;
  cssValue: string;
  targetZone: string;
  oneRmPct: string;
}

function defaultMethod(sport: SportKey): IntensityMethod {
  if (sport === "RUN") return "VDOT";
  if (sport === "BIKE") return "FTP";
  if (sport === "SWIM") return "CSS";
  if (sport === "STRENGTH") return "1RM_PCT";
  return "RPE";
}

function emptyForm(sport: SportKey): FormState {
  return {
    title: "",
    workoutType: SPORT_WORKOUT_TYPES[sport][0]?.value ?? "",
    objective: "",
    warmup: "",
    mainSet: "",
    cooldown: "",
    targetRpe: "",
    targetDurationMin: "",
    targetDistanceKm: "",
    targetPaceMin: "",
    targetPaceSec: "",
    targetPacePer100mMin: "",
    targetPacePer100mSec: "",
    targetPowerWatts: "",
    intensityMethod: defaultMethod(sport),
    vdotValue: "50",
    ftpValue: "250",
    cssValue: "1:45",
    targetZone: "Z2",
    oneRmPct: "75",
  };
}

function workoutToForm(w: CalendarWorkout): FormState {
  const pMin = w.targetPaceSecPerKm != null ? Math.floor(w.targetPaceSecPerKm / 60) : "";
  const pSec = w.targetPaceSecPerKm != null ? w.targetPaceSecPerKm % 60 : "";
  const p100Min = w.targetPacePer100m != null ? Math.floor(w.targetPacePer100m / 60) : "";
  const p100Sec = w.targetPacePer100m != null ? w.targetPacePer100m % 60 : "";
  const sport = getSportForType(w.type);
  return {
    title: w.title,
    workoutType: w.type,
    objective: w.objective ?? "",
    warmup: w.warmup ?? "",
    mainSet: w.mainSet ?? "",
    cooldown: w.cooldown ?? "",
    targetRpe: w.targetRpe != null ? String(w.targetRpe) : "",
    targetDurationMin: w.targetDurationMin != null ? String(w.targetDurationMin) : "",
    targetDistanceKm: w.targetDistanceKm != null ? String(w.targetDistanceKm) : "",
    targetPaceMin: pMin !== "" ? String(pMin) : "",
    targetPaceSec: pSec !== "" ? String(pSec) : "",
    targetPacePer100mMin: p100Min !== "" ? String(p100Min) : "",
    targetPacePer100mSec: p100Sec !== "" ? String(p100Sec) : "",
    targetPowerWatts: w.targetPowerWatts != null ? String(w.targetPowerWatts) : "",
    intensityMethod: defaultMethod(sport),
    vdotValue: "50",
    ftpValue: w.targetPowerWatts != null ? String(w.targetPowerWatts) : "250",
    cssValue: "1:45",
    targetZone: "Z2",
    oneRmPct: "75",
  };
}

function formToPayload(form: FormState) {
  const paceSecPerKm =
    form.targetPaceMin !== "" || form.targetPaceSec !== ""
      ? Number(form.targetPaceMin || 0) * 60 + Number(form.targetPaceSec || 0)
      : undefined;
  const pacePer100m =
    form.targetPacePer100mMin !== "" || form.targetPacePer100mSec !== ""
      ? Number(form.targetPacePer100mMin || 0) * 60 + Number(form.targetPacePer100mSec || 0)
      : undefined;
  return {
    title: form.title.trim(),
    type: form.workoutType,
    objective: form.objective || undefined,
    warmup: form.warmup || undefined,
    mainSet: form.mainSet || undefined,
    cooldown: form.cooldown || undefined,
    targetRpe: form.targetRpe !== "" ? Number(form.targetRpe) : undefined,
    targetDurationMin: form.targetDurationMin !== "" ? Number(form.targetDurationMin) : undefined,
    targetDistanceKm: form.targetDistanceKm !== "" ? Number(form.targetDistanceKm) : undefined,
    targetPaceSecPerKm: paceSecPerKm && paceSecPerKm > 0 ? paceSecPerKm : undefined,
    targetPacePer100m: pacePer100m && pacePer100m > 0 ? pacePer100m : undefined,
    targetPowerWatts: form.targetPowerWatts !== "" ? Number(form.targetPowerWatts) : undefined,
  };
}

// ── Modal state ───────────────────────────────────────────────────

type ModalState =
  | { kind: "closed" }
  | { kind: "sport-picker"; date: string }
  | { kind: "form"; date: string; sport: SportKey; workoutId?: string };

// ── Main component ────────────────────────────────────────────────

export default function CalendarClient({
  athleteId,
  athletes,
  initialWorkouts,
  initialLogs,
  initialYear,
  initialMonth,
  athleteDetail,
  addSport,
}: Props) {
  const router = useRouter();

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [workouts, setWorkouts] = useState<CalendarWorkout[]>(initialWorkouts);
  const [logs, setLogs] = useState<CalendarWorkoutLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const [form, setForm] = useState<FormState>(emptyForm("RUN"));
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; workout: CalendarWorkout } | null>(null);
  const [clipboard, setClipboard] = useState<{ action: "cut" | "copy"; workout: CalendarWorkout } | null>(null);
  const [weekClipboard, setWeekClipboard] = useState<{ sourceMondayKey: string; workouts: CalendarWorkout[] } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [autoOpened, setAutoOpened] = useState(false);

  // Auto-open prescription modal when addSport URL param is present
  useEffect(() => {
    if (!autoOpened && addSport) {
      const sport = addSport as SportKey;
      if (SPORT_TYPES.find((s) => s.key === sport)) {
        setAutoOpened(true);
        setForm(emptyForm(sport));
        setModal({ kind: "form", date: dateKey(new Date()), sport });
      }
    }
  }, [addSport, autoOpened]);

  // ── Grid ────────────────────────────────────────────────────────

  const days = buildGridDays(year, month);
  const weeks = groupByWeeks(days);

  const workoutsByDay = new Map<string, CalendarWorkout[]>();
  for (const w of workouts) {
    const k = dateKey(toUTCDate(w.date));
    const arr = workoutsByDay.get(k);
    if (arr) arr.push(w);
    else workoutsByDay.set(k, [w]);
  }

  const logsByWorkout = new Map<string, CalendarWorkoutLog>();
  for (const l of logs) {
    if (l.workoutId) logsByWorkout.set(l.workoutId, l);
  }

  const todayKey = dateKey(new Date());

  // ── Fetch ────────────────────────────────────────────────────────

  const refreshMonth = useCallback(async (y: number, m: number, aid: string) => {
    setLoading(true);
    const gridDays = buildGridDays(y, m);
    const from = dateKey(gridDays[0]);
    const to = dateKey(gridDays[gridDays.length - 1]);
    try {
      const res = await fetch(`/api/coach/calendar/${aid}?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        setWorkouts(data.workouts ?? data);
        setLogs(data.logs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Navigation ───────────────────────────────────────────────────

  function changeMonth(delta: number) {
    let nm = month + delta;
    let ny = year;
    if (nm < 0) { nm = 11; ny -= 1; }
    if (nm > 11) { nm = 0; ny += 1; }
    setMonth(nm);
    setYear(ny);
    refreshMonth(ny, nm, athleteId);
  }

  function goToday() {
    const now = new Date();
    const ny = now.getUTCFullYear();
    const nm = now.getUTCMonth();
    setYear(ny);
    setMonth(nm);
    refreshMonth(ny, nm, athleteId);
  }

  // ── Sport picker ─────────────────────────────────────────────────

  function openSportPicker(dayStr: string) {
    setModal({ kind: "sport-picker", date: dayStr });
  }

  function pickSport(sport: SportKey) {
    if (modal.kind !== "sport-picker") return;
    setForm(emptyForm(sport));
    setModal({ kind: "form", date: modal.date, sport });
  }

  // ── Edit ─────────────────────────────────────────────────────────

  function openEdit(w: CalendarWorkout) {
    setCtxMenu(null);
    const sport = getSportForType(w.type);
    setForm(workoutToForm(w));
    setModal({ kind: "form", date: dateKey(toUTCDate(w.date)), sport, workoutId: w.id });
  }

  // ── Save ─────────────────────────────────────────────────────────

  async function saveWorkout() {
    if (modal.kind !== "form") return;
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (modal.workoutId) {
        await fetch(`/api/coach/workouts/${modal.workoutId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/coach/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ athleteId, date: modal.date, ...payload }),
        });
      }
      setModal({ kind: "closed" });
      await refreshMonth(year, month, athleteId);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────

  async function deleteWorkout(id: string) {
    setCtxMenu(null);
    setSaving(true);
    try {
      await fetch(`/api/coach/workouts/${id}`, { method: "DELETE" });
      await refreshMonth(year, month, athleteId);
    } finally {
      setSaving(false);
    }
  }

  // ── Cut / Copy / Paste ───────────────────────────────────────────

  function handleCut(w: CalendarWorkout) {
    setClipboard({ action: "cut", workout: w });
    setCtxMenu(null);
  }

  function handleCopy(w: CalendarWorkout) {
    setClipboard({ action: "copy", workout: w });
    setCtxMenu(null);
  }

  async function handlePaste(targetDate: string) {
    if (!clipboard) return;
    setSaving(true);
    try {
      if (clipboard.action === "cut") {
        await fetch(`/api/coach/workouts/${clipboard.workout.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: targetDate }),
        });
        setClipboard(null);
      } else {
        const w = clipboard.workout;
        await fetch("/api/coach/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            athleteId,
            date: targetDate,
            title: w.title,
            type: w.type,
            objective: w.objective,
            warmup: w.warmup,
            mainSet: w.mainSet,
            cooldown: w.cooldown,
            targetRpe: w.targetRpe,
            targetDurationMin: w.targetDurationMin,
            targetDistanceKm: w.targetDistanceKm,
            targetPaceSecPerKm: w.targetPaceSecPerKm,
            targetPacePer100m: w.targetPacePer100m,
            targetPowerWatts: w.targetPowerWatts,
          }),
        });
      }
      await refreshMonth(year, month, athleteId);
    } finally {
      setSaving(false);
    }
  }

  // ── Copy / Paste entire week ─────────────────────────────────────

  function handleCopyWeek(weekDays: Date[]) {
    const mondayKey = dateKey(weekDays[0]);
    const weekWorkouts = weekDays.flatMap((d) => workoutsByDay.get(dateKey(d)) ?? []);
    setWeekClipboard({ sourceMondayKey: mondayKey, workouts: weekWorkouts });
  }

  async function handlePasteWeek(targetMonday: Date) {
    if (!weekClipboard || !weekClipboard.workouts.length) return;
    const sourceMonday = new Date(weekClipboard.sourceMondayKey);
    const offsetMs = targetMonday.getTime() - sourceMonday.getTime();
    const offsetDays = Math.round(offsetMs / 86400000);
    setSaving(true);
    try {
      for (const w of weekClipboard.workouts) {
        const wDate = toUTCDate(w.date);
        const newDate = new Date(Date.UTC(
          wDate.getUTCFullYear(), wDate.getUTCMonth(), wDate.getUTCDate() + offsetDays
        ));
        await fetch("/api/coach/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            athleteId,
            date: dateKey(newDate),
            title: w.title,
            type: w.type,
            objective: w.objective,
            warmup: w.warmup,
            mainSet: w.mainSet,
            cooldown: w.cooldown,
            targetRpe: w.targetRpe,
            targetDurationMin: w.targetDurationMin,
            targetDistanceKm: w.targetDistanceKm,
            targetPaceSecPerKm: w.targetPaceSecPerKm,
            targetPacePer100m: w.targetPacePer100m,
            targetPowerWatts: w.targetPowerWatts,
          }),
        });
      }
      setWeekClipboard(null);
      await refreshMonth(year, month, athleteId);
    } finally {
      setSaving(false);
    }
  }

  // ── Drag and drop ────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, workoutId: string) {
    setDragId(workoutId);
    e.dataTransfer.effectAllowed = "move";
  }

  async function handleDrop(e: React.DragEvent, targetDate: string) {
    e.preventDefault();
    setDragOver(null);
    if (!dragId) return;
    setSaving(true);
    try {
      await fetch(`/api/coach/workouts/${dragId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: targetDate }),
      });
      await refreshMonth(year, month, athleteId);
    } finally {
      setSaving(false);
      setDragId(null);
    }
  }

  // ── Status update (Ocultar / Bloquear) ───────────────────────────

  async function handleUpdateStatus(id: string, status: string) {
    setCtxMenu(null);
    setSaving(true);
    try {
      await fetch(`/api/coach/workouts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refreshMonth(year, month, athleteId);
    } finally {
      setSaving(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────

  // ── Monthly stats for sidebar ────────────────────────────────────

  const monthStats = (() => {
    let runKm = 0, bikeKm = 0, swimM = 0, strengthMin = 0, planned = 0, done = 0, missed = 0, sRpe = 0;
    for (const w of workouts) {
      planned++;
      if (w.status === "CONCLUIDO") done++;
      if (w.status === "PERDIDO") missed++;
      const dur = w.targetDurationMin ?? 0;
      const rpe = w.targetRpe ?? TYPE_DEFAULT_RPE[w.type] ?? 5;
      sRpe += dur * rpe;
      const sport = getSportForType(w.type);
      if (sport === "RUN") runKm += w.targetDistanceKm ?? 0;
      else if (sport === "BIKE") bikeKm += w.targetDistanceKm ?? 0;
      else if (sport === "SWIM") swimM += w.targetDistanceKm ?? 0;
      else if (sport === "STRENGTH") strengthMin += dur;
    }
    return { runKm, bikeKm, swimM, strengthMin, planned, done, missed, sRpe: Math.round(sRpe) };
  })();

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1117] text-white select-none">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-wrap">
        <select
          style={{ colorScheme: "dark" }}
          className="bg-[#1e2130] border border-white/10 text-white text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-orange-500"
          value={athleteId}
          onChange={(e) => router.push(`/treinador/calendario/${e.target.value}`)}
        >
          {athletes.map((a) => (
            <option key={a.id} value={a.id} style={{ background: "#1e2130", color: "#fff" }}>{a.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          {saving && <Loader2 size={14} className="animate-spin text-orange-400" />}
          <button
            onClick={goToday}
            className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => changeMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold min-w-[130px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          {loading && <Loader2 size={14} className="animate-spin text-white/40" />}
          <button
            onClick={() => setShowSidebar((v) => !v)}
            title="Painel do atleta"
            className={[
              "p-1.5 rounded-lg transition-colors",
              showSidebar ? "bg-orange-500/20 text-orange-400" : "hover:bg-white/10 text-white/40",
            ].join(" ")}
          >
            <PanelRight size={16} />
          </button>
        </div>
      </div>

      {/* Body: calendar + optional sidebar */}
      <div className="flex flex-1 overflow-hidden">

      {/* Calendar */}
      <div className="flex-1 overflow-auto p-2">

        {/* Day header */}
        <div className="grid grid-cols-7 mb-1 pl-[48px]">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-white/30 py-1.5 tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks grid */}
        {weeks.map((week, wi) => {
          const weekLoad = computeWeekLoad(week, workoutsByDay, logsByWorkout);
          const mondayKey = dateKey(week[0]);
          const isSourceWeek = weekClipboard?.sourceMondayKey === mondayKey;
          const canPaste = !!weekClipboard && !isSourceWeek;
          const weekNum = getISOWeekNumber(week[0]);

          return (
            <div key={wi} className="flex gap-1 mb-1">
              {/* Week gutter */}
              <div className="w-[44px] flex-shrink-0 flex flex-col items-center justify-between py-1 px-0.5 rounded-lg bg-white/2">
                <span className="text-[9px] text-white/25 font-bold">{weekNum}</span>
                <div className="flex flex-col gap-0.5 items-center">
                  {weekLoad.count > 0 && (
                    <span className="text-[9px] text-white/35 text-center">
                      {weekLoad.sRpe > 0 ? (
                        <span title="sRPE planificado" className="text-orange-400/70">{weekLoad.sRpe}</span>
                      ) : null}
                    </span>
                  )}
                  {canPaste && (
                    <button
                      onClick={() => handlePasteWeek(week[0])}
                      title="Colar semana aqui"
                      className="p-0.5 rounded hover:bg-white/10 text-orange-400 opacity-70 hover:opacity-100"
                    >
                      <ClipboardPaste size={10} />
                    </button>
                  )}
                  {weekLoad.count > 0 && (
                    <button
                      onClick={() => handleCopyWeek(week)}
                      title="Copiar semana"
                      className={[
                        "p-0.5 rounded hover:bg-white/10 transition-colors",
                        isSourceWeek ? "text-orange-400" : "text-white/25 hover:text-white/60",
                      ].join(" ")}
                    >
                      <Copy size={10} />
                    </button>
                  )}
                </div>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 flex-1">
                {week.map((day) => {
                const key = dateKey(day);
                const isCurrentMonth = day.getUTCMonth() === month;
                const isToday = key === todayKey;
                const dayWorkouts = workoutsByDay.get(key) ?? [];
                const isDragTarget = dragOver === key;
                const hasClipboard = !!clipboard && isCurrentMonth;

                return (
                  <div
                    key={key}
                    className={[
                      "min-h-[100px] rounded-lg p-1.5 flex flex-col gap-1 transition-all",
                      isCurrentMonth ? "bg-[#1a1d2e]" : "bg-[#13151e]",
                      isDragTarget ? "ring-2 ring-orange-400 bg-orange-500/5" : "",
                      dragId ? "cursor-copy" : "",
                    ].join(" ")}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(key); }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
                    }}
                    onDrop={(e) => handleDrop(e, key)}
                  >
                    {/* Date number row */}
                    <div className="flex items-center justify-between">
                      <span
                        className={[
                          "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full leading-none",
                          isToday
                            ? "bg-orange-500 text-white"
                            : isCurrentMonth
                            ? "text-white/70"
                            : "text-white/20",
                        ].join(" ")}
                      >
                        {day.getUTCDate()}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {hasClipboard && (
                          <button
                            onClick={() => handlePaste(key)}
                            title="Colar"
                            className="p-0.5 rounded hover:bg-white/10 text-orange-400 opacity-60 hover:opacity-100"
                          >
                            <ClipboardPaste size={11} />
                          </button>
                        )}
                        {isCurrentMonth && (
                          <button
                            onClick={() => openSportPicker(key)}
                            className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/80"
                          >
                            <Plus size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                {/* Workout chips */}
                {dayWorkouts.map((w) => {
                  const color = getTypeColor(w.type);
                  const sportCfg = getSport(getSportForType(w.type));
                  const isCut = clipboard?.action === "cut" && clipboard.workout.id === w.id;
                  const statusInfo = STATUS_BADGE[w.status];

                  const log = logsByWorkout.get(w.id);
                  const meta: string[] = [];
                  if (log) {
                    // Show actual data when log exists
                    if (log.durationSec) meta.push(`${Math.round(log.durationSec / 60)}min ✓`);
                    if (log.distanceKm) meta.push(`${log.distanceKm.toFixed(1)}km ✓`);
                    if (log.avgPaceSecPerKm) meta.push(formatPacePerKm(log.avgPaceSecPerKm));
                    if (log.avgWatts) meta.push(`${Math.round(log.avgWatts)}W`);
                  } else {
                    if (w.targetDurationMin) meta.push(`${w.targetDurationMin}min`);
                    if (w.targetDistanceKm) meta.push(`${w.targetDistanceKm}km`);
                    if (w.targetPaceSecPerKm) meta.push(formatPacePerKm(w.targetPaceSecPerKm));
                    if (w.targetPowerWatts) meta.push(`${w.targetPowerWatts}W`);
                  }

                  return (
                    <div
                      key={w.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, w.id)}
                      onDragEnd={() => setDragId(null)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCtxMenu({ x: e.clientX, y: e.clientY, workout: w });
                      }}
                      onClick={() => openEdit(w)}
                      style={{
                        borderColor: `${color}40`,
                        backgroundColor: `${color}12`,
                      }}
                      className={[
                        "rounded-xl p-1.5 border flex flex-col gap-0.5 cursor-pointer group transition-opacity",
                        isCut ? "opacity-40 outline outline-1 outline-orange-400" : "hover:opacity-90",
                        dragId === w.id ? "opacity-50" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-1">
                        <span className="text-[10px] flex-shrink-0 mt-[1px]">{sportCfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-[11px] font-semibold truncate leading-tight"
                            style={{ color }}
                          >
                            {w.title}
                          </div>
                          {meta.length > 0 && (
                            <div className="text-[10px] text-white/50 truncate">{meta.join(" · ")}</div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCtxMenu({ x: e.clientX, y: e.clientY, workout: w });
                          }}
                          className="opacity-0 group-hover:opacity-60 p-0.5 rounded hover:bg-white/10 flex-shrink-0"
                        >
                          <MoreVertical size={10} />
                        </button>
                      </div>
                      {statusInfo && w.status !== "LIBERADO" && (
                        <div className="flex items-center gap-1">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: statusInfo.dot }}
                          />
                          <span className="text-[9px]" style={{ color: statusInfo.dot }}>
                            {statusInfo.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                  </div>
                );
              })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Athlete sidebar ─────────────────────────────────────────── */}
      {showSidebar && (
        <AthleteSidebar
          athleteDetail={athleteDetail}
          monthStats={monthStats}
          monthName={MONTH_NAMES[month]}
        />
      )}

      </div>{/* end body flex */}

      {/* ── Context menu ───────────────────────────────────────────── */}
      {ctxMenu && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setCtxMenu(null)} />
          <div
            className="fixed z-50 bg-[#1e2130] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[172px]"
            style={{ left: Math.min(ctxMenu.x, window.innerWidth - 190), top: Math.min(ctxMenu.y, window.innerHeight - 240) }}
          >
            <CtxItem icon={<Pencil size={13} />}   label="Editar"  onClick={() => openEdit(ctxMenu.workout)} />
            <CtxItem icon={<Copy size={13} />}     label="Copiar"  onClick={() => handleCopy(ctxMenu.workout)} />
            <CtxItem icon={<Scissors size={13} />} label="Recortar" onClick={() => handleCut(ctxMenu.workout)} />
            <div className="my-1 border-t border-white/10" />
            <CtxItem
              icon={ctxMenu.workout.status === "AGENDADO" ? <Eye size={13} /> : <EyeOff size={13} />}
              label={ctxMenu.workout.status === "AGENDADO" ? "Mostrar" : "Ocultar"}
              onClick={() => handleUpdateStatus(
                ctxMenu.workout.id,
                ctxMenu.workout.status === "AGENDADO" ? "LIBERADO" : "AGENDADO"
              )}
            />
            <CtxItem
              icon={<Lock size={13} />}
              label="Bloquear"
              onClick={() => handleUpdateStatus(ctxMenu.workout.id, "AGENDADO")}
            />
            <div className="my-1 border-t border-white/10" />
            <CtxItem icon={<Trash2 size={13} />}   label="Excluir" onClick={() => deleteWorkout(ctxMenu.workout.id)} danger />
          </div>
        </>
      )}

      {/* ── Sport picker modal ──────────────────────────────────────── */}
      {modal.kind === "sport-picker" && (
        <Overlay onClose={() => setModal({ kind: "closed" })}>
          <ModalBox title="Escolha a modalidade" onClose={() => setModal({ kind: "closed" })}>
            <div className="grid grid-cols-4 gap-3 p-4">
              {SPORT_TYPES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => pickSport(s.key)}
                  className={[
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                    s.bgClass,
                  ].join(" ")}
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="text-xs text-white/70 font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </ModalBox>
        </Overlay>
      )}

      {/* ── Prescription / edit form modal ─────────────────────────── */}
      {modal.kind === "form" && (
        <Overlay onClose={() => setModal({ kind: "closed" })}>
          <ModalBox
            title={
              modal.workoutId
                ? `Editar treino`
                : `Novo treino — ${getSport(modal.sport).emoji} ${getSport(modal.sport).label}`
            }
            onClose={() => setModal({ kind: "closed" })}
            wide
          >
            <PrescriptionForm
              sport={modal.sport}
              form={form}
              setForm={setForm}
              onSave={saveWorkout}
              onCancel={() => setModal({ kind: "closed" })}
              saving={saving}
              isEdit={!!modal.workoutId}
            />
          </ModalBox>
        </Overlay>
      )}

      {/* ── Clipboard pill ──────────────────────────────────────────── */}
      {clipboard && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#1e2130] border border-orange-500/30 rounded-full px-4 py-2 flex items-center gap-3 text-sm shadow-xl">
          <span className="text-white/60">
            {clipboard.action === "cut" ? "✂️" : "📋"}{" "}
            <span className="text-white font-medium">{clipboard.workout.title}</span>
            {" "}— clique no dia para colar
          </span>
          <button onClick={() => setClipboard(null)} className="text-white/30 hover:text-white ml-1">
            <X size={13} />
          </button>
        </div>
      )}
      {weekClipboard && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#1e2130] border border-orange-500/30 rounded-full px-4 py-2 flex items-center gap-3 text-sm shadow-xl">
          <span className="text-white/60">
            📋{" "}
            <span className="text-white font-medium">{weekClipboard.workouts.length} treinos copiados</span>
            {" "}— clique no ícone de colar na semana destino
          </span>
          <button onClick={() => setWeekClipboard(null)} className="text-white/30 hover:text-white ml-1">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Athlete Sidebar ───────────────────────────────────────────────

interface MonthStats {
  runKm: number; bikeKm: number; swimM: number; strengthMin: number;
  planned: number; done: number; missed: number; sRpe: number;
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Iniciante", INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado", ELITE: "Elite",
};

function AthleteSidebar({
  athleteDetail,
  monthStats,
  monthName,
}: {
  athleteDetail: AthleteDetail | null;
  monthStats: MonthStats;
  monthName: string;
}) {
  const adherence = athleteDetail?.adherenceRate != null
    ? Math.round(athleteDetail.adherenceRate * 100)
    : monthStats.planned > 0
    ? Math.round((monthStats.done / monthStats.planned) * 100)
    : null;

  const alerts: { text: string; color: string }[] = [];
  if (monthStats.missed > 0)
    alerts.push({ text: `${monthStats.missed} treino${monthStats.missed > 1 ? "s" : ""} perdido${monthStats.missed > 1 ? "s" : ""}`, color: "#ef4444" });
  if (adherence != null && adherence < 70)
    alerts.push({ text: "Adesão abaixo de 70%", color: "#f59e0b" });

  const initials = athleteDetail?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "?";

  return (
    <div className="w-[220px] flex-shrink-0 border-l border-white/10 bg-[#13151e] overflow-y-auto flex flex-col gap-0">

      {/* Athlete identity */}
      <div className="p-3 border-b border-white/8">
        <div className="flex items-center gap-2 mb-2">
          {athleteDetail?.avatarUrl ? (
            <img src={athleteDetail.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{athleteDetail?.name ?? "—"}</div>
            <div className="text-[10px] text-white/40 truncate">
              {athleteDetail?.level ? LEVEL_LABELS[athleteDetail.level] ?? athleteDetail.level : ""}
            </div>
          </div>
        </div>
        {athleteDetail?.goal && (
          <div className="text-[11px] text-white/50 truncate">🎯 {athleteDetail.goal}</div>
        )}
        {athleteDetail?.raceDate && (
          <div className="text-[11px] text-white/50 mt-0.5">
            🏁 {new Date(athleteDetail.raceDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </div>
        )}
      </div>

      {/* Monthly volume */}
      <div className="p-3 border-b border-white/8">
        <div className="flex items-center gap-1.5 mb-2">
          <TrendingUp size={11} className="text-white/40" />
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{monthName}</span>
        </div>
        <div className="flex flex-col gap-1">
          {monthStats.runKm > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-white/60">🏃 Corrida</span>
              <span className="text-[11px] font-semibold text-white">{monthStats.runKm.toFixed(1)} km</span>
            </div>
          )}
          {monthStats.bikeKm > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-white/60">🚴 Bike</span>
              <span className="text-[11px] font-semibold text-white">{monthStats.bikeKm.toFixed(1)} km</span>
            </div>
          )}
          {monthStats.swimM > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-white/60">🏊 Natação</span>
              <span className="text-[11px] font-semibold text-white">{monthStats.swimM.toFixed(1)} km</span>
            </div>
          )}
          {monthStats.strengthMin > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-white/60">💪 Força</span>
              <span className="text-[11px] font-semibold text-white">{fmtDurationMin(monthStats.strengthMin)}</span>
            </div>
          )}
          {monthStats.runKm === 0 && monthStats.bikeKm === 0 && monthStats.swimM === 0 && monthStats.strengthMin === 0 && (
            <span className="text-[11px] text-white/25 italic">Sem treinos planejados</span>
          )}
        </div>
      </div>

      {/* Load */}
      {monthStats.sRpe > 0 && (
        <div className="p-3 border-b border-white/8">
          <div className="flex items-center gap-1.5 mb-1">
            <CalendarDays size={11} className="text-white/40" />
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Carga Mensal</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-white/60">sRPE planificado</span>
            <span className="text-[11px] font-semibold text-orange-400">{monthStats.sRpe.toLocaleString("pt-BR")}</span>
          </div>
        </div>
      )}

      {/* Adherence */}
      {adherence != null && monthStats.planned > 0 && (
        <div className="p-3 border-b border-white/8">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Adesão</span>
            <span
              className="text-[11px] font-bold"
              style={{ color: adherence >= 80 ? "#22c55e" : adherence >= 60 ? "#f59e0b" : "#ef4444" }}
            >
              {adherence}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, adherence)}%`,
                backgroundColor: adherence >= 80 ? "#22c55e" : adherence >= 60 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
          <div className="text-[10px] text-white/35 mt-1">{monthStats.done}/{monthStats.planned} treinos</div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle size={11} className="text-yellow-400" />
            <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Alertas</span>
          </div>
          <div className="flex flex-col gap-1">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                <span className="text-[11px]" style={{ color: a.color }}>{a.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {children}
    </div>
  );
}

function ModalBox({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={[
        "bg-[#1a1d2e] rounded-2xl shadow-2xl border border-white/10 flex flex-col w-full",
        wide ? "max-w-2xl" : "max-w-sm",
      ].join(" ")}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="font-semibold text-sm">{title}</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white">
          <X size={15} />
        </button>
      </div>
      {children}
    </div>
  );
}

function CtxItem({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
        danger ? "text-red-400 hover:bg-red-500/10" : "text-white/75 hover:bg-white/5",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function IntensitySection({
  sport,
  form,
  set,
}: {
  sport: SportKey;
  form: FormState;
  set: (field: keyof FormState, value: string) => void;
}) {
  const methods = SPORT_METHODS[sport];
  const method = form.intensityMethod;

  const vdotNum = Number(form.vdotValue) || 50;
  const vdotPaces = lookupVdot(Math.max(30, Math.min(75, vdotNum)));

  const INPUT_CLS =
    "bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors";

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-white/40 font-medium mr-1">Intensidade</span>
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => set("intensityMethod", m.id)}
            className={[
              "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border",
              method === m.id
                ? "bg-orange-500 border-orange-500 text-white"
                : "border-white/10 text-white/50 hover:text-white hover:border-white/30",
            ].join(" ")}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* VDOT */}
      {method === "VDOT" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-white/40 w-12 flex-shrink-0">VDOT</label>
            <input
              type="number"
              min="30"
              max="75"
              className={`w-20 ${INPUT_CLS}`}
              value={form.vdotValue}
              onChange={(e) => set("vdotValue", e.target.value)}
            />
            <input
              type="range"
              min="30"
              max="75"
              className="flex-1 accent-orange-500"
              value={form.vdotValue}
              onChange={(e) => set("vdotValue", e.target.value)}
            />
          </div>
          {vdotPaces && (
            <div className="grid grid-cols-5 gap-1">
              {(["E", "M", "T", "I", "R"] as const).map((zone) => (
                <div key={zone} className="flex flex-col items-center gap-0.5 bg-white/5 rounded-lg p-1.5">
                  <span className="text-[9px] text-white/40 font-bold">{zone}</span>
                  <span className="text-[11px] text-white font-mono">{vdotPaces[zone]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zonas FC */}
      {method === "ZONES" && (
        <div className="grid grid-cols-1 gap-1">
          {FC_ZONES.map((z) => (
            <button
              key={z.zone}
              type="button"
              onClick={() => set("targetZone", z.zone)}
              className={[
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors",
                form.targetZone === z.zone
                  ? "border-opacity-60 bg-opacity-20"
                  : "border-white/8 bg-transparent hover:bg-white/5",
              ].join(" ")}
              style={
                form.targetZone === z.zone
                  ? { borderColor: `${z.color}80`, backgroundColor: `${z.color}18` }
                  : undefined
              }
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: z.color }}
              />
              <span className="text-[11px] font-semibold w-5" style={{ color: z.color }}>{z.zone}</span>
              <span className="text-[11px] text-white/70 flex-1">{z.label}</span>
              <span className="text-[10px] text-white/35">{z.fcPct}</span>
              <span className="text-[10px] text-white/35 ml-1">RPE {z.rpe}</span>
            </button>
          ))}
        </div>
      )}

      {/* Zonas FTP */}
      {method === "FTP" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-white/40 w-20 flex-shrink-0">FTP (W)</label>
            <input
              type="number"
              min="0"
              className={`w-24 ${INPUT_CLS}`}
              value={form.ftpValue}
              onChange={(e) => set("ftpValue", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-1">
            {FTP_ZONES.map((z) => (
              <button
                key={z.zone}
                type="button"
                onClick={() => set("targetZone", z.zone)}
                className={[
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors",
                  form.targetZone === z.zone ? "" : "border-white/8 bg-transparent hover:bg-white/5",
                ].join(" ")}
                style={
                  form.targetZone === z.zone
                    ? { borderColor: `${z.color}80`, backgroundColor: `${z.color}18` }
                    : undefined
                }
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
                <span className="text-[11px] font-semibold w-5" style={{ color: z.color }}>{z.zone}</span>
                <span className="text-[11px] text-white/70 flex-1">{z.label}</span>
                <span className="text-[10px] text-white/35">{z.ftpPct}</span>
                {form.ftpValue && (
                  <span className="text-[10px] text-white/50 ml-1 font-mono">
                    {
                      (() => {
                        const ftp = Number(form.ftpValue);
                        const [lo, hi] = z.ftpPct.replace(">", "").replace("<", "").split("–").map(Number);
                        if (!ftp) return "";
                        if (z.ftpPct.startsWith("<")) return `<${Math.round(ftp * lo / 100)}W`;
                        if (z.ftpPct.startsWith(">")) return `>${Math.round(ftp * lo / 100)}W`;
                        return `${Math.round(ftp * lo / 100)}–${Math.round(ftp * hi / 100)}W`;
                      })()
                    }
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CSS */}
      {method === "CSS" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-white/40 w-24 flex-shrink-0">CSS /100m</label>
            <input
              type="text"
              className={`w-24 ${INPUT_CLS}`}
              placeholder="1:45"
              value={form.cssValue}
              onChange={(e) => set("cssValue", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-1">
            {CSS_ZONES.map((z) => (
              <button
                key={z.zone}
                type="button"
                onClick={() => set("targetZone", z.zone)}
                className={[
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors",
                  form.targetZone === z.zone ? "" : "border-white/8 bg-transparent hover:bg-white/5",
                ].join(" ")}
                style={
                  form.targetZone === z.zone
                    ? { borderColor: `${z.color}80`, backgroundColor: `${z.color}18` }
                    : undefined
                }
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
                <span className="text-[11px] font-semibold w-5" style={{ color: z.color }}>{z.zone}</span>
                <span className="text-[11px] text-white/70 flex-1">{z.label}</span>
                <span className="text-[10px] text-white/35">{z.cssOffset}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RPE */}
      {method === "RPE" && (
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-white/40">RPE alvo (1–10)</label>
          <div className="flex gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => {
              const rpeColor =
                r <= 3 ? "#22c55e" : r <= 5 ? "#84cc16" : r <= 7 ? "#eab308" : r <= 9 ? "#f97316" : "#ef4444";
              const selected = form.targetRpe === String(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("targetRpe", String(r))}
                  className="w-8 h-8 rounded-lg text-xs font-semibold border transition-colors"
                  style={
                    selected
                      ? { borderColor: rpeColor, backgroundColor: `${rpeColor}30`, color: rpeColor }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* % 1RM */}
      {method === "1RM_PCT" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <label className="text-[11px] text-white/40 w-16 flex-shrink-0">% de 1RM</label>
            <input
              type="number"
              min="0"
              max="100"
              className={`w-20 ${INPUT_CLS}`}
              placeholder="75"
              value={form.oneRmPct}
              onChange={(e) => set("oneRmPct", e.target.value)}
            />
            <input
              type="range"
              min="0"
              max="100"
              className="flex-1 accent-orange-500"
              value={form.oneRmPct}
              onChange={(e) => set("oneRmPct", e.target.value)}
            />
            <span className="text-sm font-semibold text-white/70 w-10">{form.oneRmPct}%</span>
          </div>
          <div className="text-[11px] text-white/40 mt-1">
            {Number(form.oneRmPct) < 60 && "Resistência / Volume (baixa carga)"}
            {Number(form.oneRmPct) >= 60 && Number(form.oneRmPct) < 70 && "Hipertrofia — fase volume"}
            {Number(form.oneRmPct) >= 70 && Number(form.oneRmPct) < 80 && "Hipertrofia — intensidade moderada"}
            {Number(form.oneRmPct) >= 80 && Number(form.oneRmPct) < 90 && "Força — alta intensidade"}
            {Number(form.oneRmPct) >= 90 && "Força máxima / 1RM"}
          </div>
        </div>
      )}
    </div>
  );
}

function PrescriptionForm({
  sport,
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  isEdit,
}: {
  sport: SportKey;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  const set = (field: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const showDistance = sport === "RUN" || sport === "BIKE" || sport === "SWIM";
  const showPaceKm = sport === "RUN";
  const showPace100m = sport === "SWIM";
  const showPower = sport === "BIKE";

  return (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto max-h-[76vh]">

      {/* Title + subtype */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-[11px] text-white/40 mb-1">Título *</label>
          <input
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="Ex: Rodagem aeróbica"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && form.title.trim() && onSave()}
          />
        </div>
        <div className="w-44">
          <label className="block text-[11px] text-white/40 mb-1">Subtipo</label>
          <select
            style={{ colorScheme: "dark" }}
            className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            value={form.workoutType}
            onChange={(e) => set("workoutType", e.target.value)}
          >
            {SPORT_WORKOUT_TYPES[sport].map((t) => (
              <option key={t.value} value={t.value} style={{ background: "#1a1d2e", color: "#fff" }}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-[11px] text-white/40 mb-1">Duração (min)</label>
          <input
            type="number"
            min="1"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="60"
            value={form.targetDurationMin}
            onChange={(e) => set("targetDurationMin", e.target.value)}
          />
        </div>

        {showDistance && (
          <div>
            <label className="block text-[11px] text-white/40 mb-1">
              Distância ({sport === "SWIM" ? "m" : "km"})
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder={sport === "SWIM" ? "2000" : "10"}
              value={form.targetDistanceKm}
              onChange={(e) => set("targetDistanceKm", e.target.value)}
            />
          </div>
        )}

        {showPaceKm && (
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Pace alvo /km</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="20"
                className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="5"
                value={form.targetPaceMin}
                onChange={(e) => set("targetPaceMin", e.target.value)}
              />
              <span className="text-white/30 text-sm">:</span>
              <input
                type="number"
                min="0"
                max="59"
                className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="00"
                value={form.targetPaceSec}
                onChange={(e) => set("targetPaceSec", e.target.value)}
              />
            </div>
          </div>
        )}

        {showPace100m && (
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Pace alvo /100m</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="10"
                className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="2"
                value={form.targetPacePer100mMin}
                onChange={(e) => set("targetPacePer100mMin", e.target.value)}
              />
              <span className="text-white/30 text-sm">:</span>
              <input
                type="number"
                min="0"
                max="59"
                className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="00"
                value={form.targetPacePer100mSec}
                onChange={(e) => set("targetPacePer100mSec", e.target.value)}
              />
            </div>
          </div>
        )}

        {showPower && (
          <div>
            <label className="block text-[11px] text-white/40 mb-1">Potência (W)</label>
            <input
              type="number"
              min="0"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="220"
              value={form.targetPowerWatts}
              onChange={(e) => set("targetPowerWatts", e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] text-white/40 mb-1">RPE alvo (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
            placeholder="7"
            value={form.targetRpe}
            onChange={(e) => set("targetRpe", e.target.value)}
          />
        </div>
      </div>

      {/* Intensity method */}
      {SPORT_METHODS[sport].length > 0 && (
        <IntensitySection sport={sport} form={form} set={set} />
      )}

      {/* Objective */}
      <div>
        <label className="block text-[11px] text-white/40 mb-1">Objetivo</label>
        <input
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500 transition-colors"
          placeholder="Ex: Desenvolver base aeróbica"
          value={form.objective}
          onChange={(e) => set("objective", e.target.value)}
        />
      </div>

      {/* Warmup */}
      <div>
        <label className="block text-[11px] text-white/40 mb-1">Aquecimento</label>
        <textarea
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500 transition-colors resize-none"
          placeholder="Ex: 10 min rodagem leve + 4x strides de 20s"
          value={form.warmup}
          onChange={(e) => set("warmup", e.target.value)}
        />
      </div>

      {/* Main set */}
      <div>
        <label className="block text-[11px] text-white/40 mb-1">Série principal</label>
        <textarea
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500 transition-colors resize-none"
          placeholder="Ex: 6x 1km em ritmo de limiar com 2 min de recuperação"
          value={form.mainSet}
          onChange={(e) => set("mainSet", e.target.value)}
        />
      </div>

      {/* Cooldown */}
      <div>
        <label className="block text-[11px] text-white/40 mb-1">Volta à calma</label>
        <textarea
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500 transition-colors resize-none"
          placeholder="Ex: 10 min regenerativo + alongamento"
          value={form.cooldown}
          onChange={(e) => set("cooldown", e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={!form.title.trim() || saving}
          className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          {isEdit ? "Salvar" : "Criar treino"}
        </button>
      </div>
    </div>
  );
}
