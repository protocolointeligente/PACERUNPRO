"use client";

import { useState, useCallback, useEffect } from "react";
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

interface AthleteOption {
  id: string;
  name: string;
}

interface Props {
  athleteId: string;
  athletes: AthleteOption[];
  initialWorkouts: CalendarWorkout[];
  initialYear: number;
  initialMonth: number;
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

// hex + rgb for inline style (avoids Tailwind JIT purging dynamic classes)
const SPORT_COLORS: Record<SportKey, { hex: string; rgb: string }> = {
  RUN:       { hex: "#F97316", rgb: "249,115,22"   },
  BIKE:      { hex: "#3B82F6", rgb: "59,130,246"   },
  SWIM:      { hex: "#06B6D4", rgb: "6,182,212"    },
  STRENGTH:  { hex: "#A855F7", rgb: "168,85,247"   },
  TRIATHLON: { hex: "#10B981", rgb: "16,185,129"   },
  BRICK:     { hex: "#F43F5E", rgb: "244,63,94"    },
  MOBILITY:  { hex: "#22C55E", rgb: "34,197,94"    },
  REST:      { hex: "#94A3B8", rgb: "148,163,184"  },
};

// Workout subtype → intensity level (1 = easy, 5 = max)
const WORKOUT_INTENSITY: Record<string, number> = {
  REGENERATIVO: 1, RECOVERY_BIKE: 1, RECUPERACAO_NATACAO: 1, RECUPERACAO: 1, MOBILIDADE: 1,
  RODAGEM_LEVE: 2, TECNICA: 2, ENDURANCE_BIKE: 2, TECNICA_NATACAO: 2, ENDURANCE_NATACAO: 2, LONG_RIDE: 2,
  FARTLEK: 3, PROGRESSIVO: 3, LONGAO: 3, SWEET_SPOT: 3, TEMPO_BIKE: 3, LIMIAR_NATACAO: 3, AGUAS_ABERTAS: 3,
  TREINO_COMBINADO: 3, TRANSICAO: 3, SIMULADO_TRIATHLON: 3, FUNCIONAL: 3, FORCA: 3, BRICK_SWIM_BIKE: 3,
  SUBIDA: 4, TEMPO_RUN: 4, INTERVALADO_LONGO: 4, THRESHOLD_BIKE: 4, INTERVALADO_NATACAO: 4, BRICK_BIKE_RUN: 4,
  INTERVALADO_CURTO: 5, PROVA: 5, VO2MAX_BIKE: 5, ANAEROBIC_BIKE: 5, SPRINT_BIKE: 5, SPRINT_NATACAO: 5,
};

function getWorkoutStyle(sport: SportKey, workoutType: string, rpe?: number | null) {
  const colors = SPORT_COLORS[sport];
  const intensityLevel = rpe ? Math.ceil(rpe / 2) : (WORKOUT_INTENSITY[workoutType] ?? 2);
  // bg opacity: 0.08 (easy) → 0.22 (max)
  const bgOpacity = (0.06 + (intensityLevel / 5) * 0.16).toFixed(2);
  return {
    borderLeft: `3px solid ${colors.hex}`,
    backgroundColor: `rgba(${colors.rgb},${bgOpacity})`,
  };
}

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
  };
}

function workoutToForm(w: CalendarWorkout): FormState {
  const pMin = w.targetPaceSecPerKm != null ? Math.floor(w.targetPaceSecPerKm / 60) : "";
  const pSec = w.targetPaceSecPerKm != null ? w.targetPaceSecPerKm % 60 : "";
  const p100Min = w.targetPacePer100m != null ? Math.floor(w.targetPacePer100m / 60) : "";
  const p100Sec = w.targetPacePer100m != null ? w.targetPacePer100m % 60 : "";
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
  initialYear,
  initialMonth,
}: Props) {
  const router = useRouter();

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [workouts, setWorkouts] = useState<CalendarWorkout[]>(initialWorkouts);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>({ kind: "closed" });
  const [form, setForm] = useState<FormState>(emptyForm("RUN"));
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; workout: CalendarWorkout } | null>(null);
  const [clipboard, setClipboard] = useState<{ action: "cut" | "copy"; workout: CalendarWorkout } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  // ── Grid ────────────────────────────────────────────────────────

  const days = buildGridDays(year, month);

  const workoutsByDay = new Map<string, CalendarWorkout[]>();
  for (const w of workouts) {
    const k = dateKey(toUTCDate(w.date));
    const arr = workoutsByDay.get(k);
    if (arr) arr.push(w);
    else workoutsByDay.set(k, [w]);
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
      if (res.ok) setWorkouts(await res.json());
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

  // ── Close context menu on outside click ──────────────────────────

  useEffect(() => {
    const close = () => setCtxMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // ── Render ───────────────────────────────────────────────────────

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
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto p-2">

        {/* Day header */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-white/30 py-1.5 tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
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
                  // only clear if leaving to outside this cell
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
                  const sport = getSportForType(w.type);
                  const sportCfg = getSport(sport);
                  const chipStyle = getWorkoutStyle(sport, w.type, w.targetRpe);
                  const borderColor = SPORT_COLORS[sport].hex;
                  const isCut = clipboard?.action === "cut" && clipboard.workout.id === w.id;

                  const meta: string[] = [];
                  if (w.targetDurationMin) meta.push(`${w.targetDurationMin}min`);
                  if (w.targetDistanceKm) meta.push(`${w.targetDistanceKm}km`);
                  if (w.targetPaceSecPerKm) meta.push(formatPacePerKm(w.targetPaceSecPerKm));
                  if (w.targetPowerWatts) meta.push(`${w.targetPowerWatts}W`);

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
                      style={chipStyle}
                      className={[
                        "flex items-start gap-1 px-1.5 py-1 rounded-r-md cursor-pointer group transition-opacity",
                        isCut ? "opacity-40 outline outline-1 outline-orange-400" : "hover:opacity-90",
                        dragId === w.id ? "opacity-50" : "",
                      ].join(" ")}
                    >
                      <span className="text-[11px] flex-shrink-0 mt-[1px]">{sportCfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[11px] font-semibold truncate"
                          style={{ color: borderColor }}
                        >
                          {w.title}
                        </div>
                        {meta.length > 0 && (
                          <div className="text-[10px] text-white/55 truncate">{meta.join(" · ")}</div>
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
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Context menu ───────────────────────────────────────────── */}
      {ctxMenu && (
        <div
          className="fixed z-50 bg-[#1e2130] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[164px]"
          style={{ left: Math.min(ctxMenu.x, window.innerWidth - 180), top: Math.min(ctxMenu.y, window.innerHeight - 200) }}
          onClick={(e) => e.stopPropagation()}
        >
          <CtxItem icon={<Pencil size={13} />}       label="Editar"  onClick={() => openEdit(ctxMenu.workout)} />
          <CtxItem icon={<Scissors size={13} />}     label="Cortar"  onClick={() => handleCut(ctxMenu.workout)} />
          <CtxItem icon={<Copy size={13} />}         label="Copiar"  onClick={() => handleCopy(ctxMenu.workout)} />
          <div className="my-1 border-t border-white/10" />
          <CtxItem icon={<Trash2 size={13} />}       label="Excluir" onClick={() => deleteWorkout(ctxMenu.workout.id)} danger />
        </div>
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
