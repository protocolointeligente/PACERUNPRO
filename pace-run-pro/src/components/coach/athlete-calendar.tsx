"use client";

import { useCallback, useState } from "react";
import {
  ChevronLeft, ChevronRight, X, Clock, Ruler, Zap, CheckCircle2, CircleAlert,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// ── Workout type config ───────────────────────────────────────────────────────

const WO_CONFIG: Record<string, { label: string; short: string; bg: string; dot: string }> = {
  // ── Corrida ──
  REGENERATIVO:        { label: "Regenerativo",        short: "Z1", bg: "bg-emerald-400",  dot: "#4ade80" },
  RODAGEM_LEVE:        { label: "Rodagem Leve",         short: "Z2", bg: "bg-sky-400",      dot: "#38bdf8" },
  PROGRESSIVO:         { label: "Progressivo",          short: "P",  bg: "bg-blue-500",     dot: "#3b82f6" },
  LONGAO:              { label: "Longão",               short: "L",  bg: "bg-info/80",      dot: "#3FA7FF" },
  FARTLEK:             { label: "Fartlek",              short: "F",  bg: "bg-amber-400",    dot: "#fbbf24" },
  TECNICA:             { label: "Técnica",              short: "T",  bg: "bg-teal-400",     dot: "#2dd4bf" },
  SUBIDA:              { label: "Subida",               short: "S",  bg: "bg-orange-400",   dot: "#fb923c" },
  TEMPO_RUN:           { label: "Tempo Run",            short: "T4", bg: "bg-warning/80",   dot: "#FFB020" },
  INTERVALADO_LONGO:   { label: "Intervalado Longo",    short: "IL", bg: "bg-rose-500",     dot: "#f43f5e" },
  INTERVALADO_CURTO:   { label: "Intervalado Curto",    short: "IC", bg: "bg-red-600",      dot: "#dc2626" },
  PROVA:               { label: "Prova",                short: "★",  bg: "bg-red-700",      dot: "#b91c1c" },
  // ── Ciclismo ──
  ENDURANCE_BIKE:      { label: "Endurance Bike",       short: "Z2", bg: "bg-orange-300",   dot: "#fdba74" },
  RECOVERY_BIKE:       { label: "Recuperação Bike",     short: "RC", bg: "bg-orange-200",   dot: "#fed7aa" },
  SWEET_SPOT:          { label: "Sweet Spot",           short: "SS", bg: "bg-orange-400",   dot: "#fb923c" },
  TEMPO_BIKE:          { label: "Tempo Bike",           short: "T",  bg: "bg-orange-500",   dot: "#f97316" },
  THRESHOLD_BIKE:      { label: "Limiar Bike",          short: "L",  bg: "bg-orange-600",   dot: "#ea580c" },
  VO2MAX_BIKE:         { label: "VO2máx Bike",          short: "V",  bg: "bg-red-500",      dot: "#ef4444" },
  ANAEROBIC_BIKE:      { label: "Anaeróbico",           short: "AN", bg: "bg-red-700",      dot: "#b91c1c" },
  SPRINT_BIKE:         { label: "Sprint Bike",          short: "SP", bg: "bg-red-800",      dot: "#991b1b" },
  LONG_RIDE:           { label: "Saída Longa",          short: "LR", bg: "bg-amber-500",    dot: "#f59e0b" },
  // ── Natação ──
  TECNICA_NATACAO:     { label: "Técnica Natação",      short: "TN", bg: "bg-cyan-400",     dot: "#22d3ee" },
  ENDURANCE_NATACAO:   { label: "Endurance Natação",    short: "Z2", bg: "bg-cyan-500",     dot: "#06b6d4" },
  INTERVALADO_NATACAO: { label: "Intervalados Natação", short: "IN", bg: "bg-blue-500",     dot: "#3b82f6" },
  LIMIAR_NATACAO:      { label: "Limiar / CSS",         short: "CS", bg: "bg-blue-600",     dot: "#2563eb" },
  SPRINT_NATACAO:      { label: "Sprint Natação",       short: "SP", bg: "bg-blue-700",     dot: "#1d4ed8" },
  RECUPERACAO_NATACAO: { label: "Recuperação Natação",  short: "RC", bg: "bg-cyan-300",     dot: "#67e8f9" },
  AGUAS_ABERTAS:       { label: "Águas Abertas",        short: "AA", bg: "bg-teal-500",     dot: "#14b8a6" },
  // ── Triathlon / Brick ──
  BRICK_BIKE_RUN:      { label: "Brick Bike+Corrida",   short: "BR", bg: "bg-yellow-500",   dot: "#eab308" },
  BRICK_SWIM_BIKE:     { label: "Brick Nat+Bike",       short: "BS", bg: "bg-yellow-600",   dot: "#ca8a04" },
  TRANSICAO:           { label: "Transição",            short: "T",  bg: "bg-yellow-400",   dot: "#facc15" },
  SIMULADO_TRIATHLON:  { label: "Simulado Triathlon",   short: "ST", bg: "bg-amber-600",    dot: "#d97706" },
  TREINO_COMBINADO:    { label: "Treino Combinado",     short: "TC", bg: "bg-amber-500",    dot: "#f59e0b" },
  // ── Força / Mobilidade ──
  FORCA:               { label: "Força",                short: "FC", bg: "bg-purple-500",   dot: "#a855f7" },
  FUNCIONAL:           { label: "Funcional",            short: "FN", bg: "bg-purple-400",   dot: "#c084fc" },
  MOBILIDADE:          { label: "Mobilidade",           short: "MB", bg: "bg-green-400",    dot: "#4ade80" },
  RECUPERACAO:         { label: "Recuperação",          short: "RC", bg: "bg-gray-400",     dot: "#9ca3af" },
};

function woCfg(type: string) {
  return WO_CONFIG[type] ?? { label: "Treino", short: "?", bg: "bg-gray-400", dot: "#9ca3af" };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CalWorkout {
  id: string;
  date: string;             // YYYY-MM-DD
  type: string;
  sport?: string | null;
  title: string | null;
  status: string;
  targetDistanceKm: number | null;
  targetDurationMin: number | null;
  targetPaceSecPerKm?: number | null;
  targetPacePer100m?: number | null;
  targetPowerPctFtp?: number | null;
  targetRpe?: number | null;
  structured?: boolean;
}

const SPORT_EMOJI: Record<string, string> = {
  RUN: "🏃", BIKE: "🚴", SWIM: "🏊", STRENGTH: "🏋️",
  MOBILITY: "🧘", TRIATHLON: "🏅", BRICK: "⚡",
};

interface Props {
  athleteId: string;
  initialWorkouts: CalWorkout[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS_PT  = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatPace(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}/km`;
}

// ── Workout Detail Modal ──────────────────────────────────────────────────────

function WorkoutModal({ wo, onClose }: { wo: CalWorkout; onClose: () => void }) {
  const cfg = woCfg(wo.type);
  const date = new Date(wo.date + "T12:00:00");
  const isCompleted = wo.status === "CONCLUIDO";
  const isMissed    = wo.status === "PERDIDO";

  const durationH = wo.targetDurationMin ? wo.targetDurationMin / 60 : 1;
  // Rough IF from zone type
  const IF_ROUGH: Record<string, number> = {
    REGENERATIVO: 0.65, RODAGEM_LEVE: 0.70, PROGRESSIVO: 0.78, LONGAO: 0.78,
    FARTLEK: 0.85, TECNICA: 0.85, SUBIDA: 0.88, TEMPO_RUN: 0.91,
    INTERVALADO_LONGO: 0.97, INTERVALADO_CURTO: 1.04, PROVA: 1.05,
    FORCA: 0.65, FUNCIONAL: 0.68, MOBILIDADE: 0.45, RECUPERACAO: 0.55,
  };
  const ifEst = IF_ROUGH[wo.type] ?? 0.75;
  const tss = Math.round(durationH * ifEst * ifEst * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold text-white", cfg.bg)}>
                {cfg.short}
              </span>
              <p className="text-xs font-semibold text-text-muted">{cfg.label}</p>
            </div>
            <p className="font-display text-base font-bold text-text">
              {wo.title ?? cfg.label}
            </p>
            <p className="mt-0.5 text-xs text-text-muted capitalize">
              {date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* Status */}
          <div>
            {isCompleted ? (
              <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />Realizado</Badge>
            ) : isMissed ? (
              <Badge variant="danger" className="gap-1"><CircleAlert className="h-3 w-3" />Perdido</Badge>
            ) : wo.status === "LIBERADO" ? (
              <Badge variant="primary">Liberado</Badge>
            ) : (
              <Badge variant="outline" className="text-text-muted">Agendado</Badge>
            )}
            {wo.structured && (
              <Badge variant="info" className="ml-1.5">Estruturado</Badge>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-card-hover/40 p-3">
            <div className="text-center">
              <p className="text-[10px] text-text-muted flex justify-center mb-0.5"><Clock className="h-3 w-3" /></p>
              <p className="text-xs text-text-muted">Tempo</p>
              <p className="text-sm font-bold text-text">{wo.targetDurationMin ? `${wo.targetDurationMin}min` : "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-text-muted flex justify-center mb-0.5"><Ruler className="h-3 w-3" /></p>
              <p className="text-xs text-text-muted">Distância</p>
              <p className="text-sm font-bold text-text">{wo.targetDistanceKm ? `${wo.targetDistanceKm}km` : "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-text-muted flex justify-center mb-0.5"><Zap className="h-3 w-3" /></p>
              <p className="text-xs text-text-muted">TSS</p>
              <p className="text-sm font-bold text-primary">~{tss}</p>
            </div>
          </div>

          {wo.targetPaceSecPerKm && wo.sport !== "SWIM" && (
            <p className="text-xs text-text-muted">
              Pace: <span className="font-semibold text-text">{formatPace(wo.targetPaceSecPerKm)}</span>
            </p>
          )}
          {wo.targetPacePer100m && (
            <p className="text-xs text-text-muted">
              Pace: <span className="font-semibold text-text">
                {Math.floor(wo.targetPacePer100m / 60)}:{String(wo.targetPacePer100m % 60).padStart(2, "0")}/100m
              </span>
            </p>
          )}
          {wo.targetPowerPctFtp && (
            <p className="text-xs text-text-muted">
              Potência alvo: <span className="font-semibold text-text">{wo.targetPowerPctFtp}% FTP</span>
            </p>
          )}
          {wo.targetRpe && (
            <p className="text-xs text-text-muted">
              RPE alvo: <span className="font-semibold text-text">{wo.targetRpe}/10</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Calendar Grid ─────────────────────────────────────────────────────────────

export function AthleteCalendar({ athleteId, initialWorkouts }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [workouts, setWorkouts] = useState<CalWorkout[]>(initialWorkouts);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [selectedWo, setSelectedWo] = useState<CalWorkout | null>(null);
  const [saving, setSaving] = useState(false);

  // Build calendar grid
  const firstDay = startOfMonth(year, month);
  const numDays  = daysInMonth(year, month);
  const startCol = firstDay.getDay(); // 0=Sun

  // Grid cells: blanks + days
  const cells: (number | null)[] = [
    ...Array(startCol).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  // Group workouts by date
  const byDate = new Map<string, CalWorkout[]>();
  for (const wo of workouts) {
    if (!byDate.has(wo.date)) byDate.set(wo.date, []);
    byDate.get(wo.date)!.push(wo);
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const handleDrop = useCallback(async (targetDate: string) => {
    if (!draggingId || targetDate === dragOverDate) return;
    const wo = workouts.find((w) => w.id === draggingId);
    if (!wo || wo.date === targetDate) { setDraggingId(null); setDragOverDate(null); return; }

    // Optimistic update
    setWorkouts((prev) => prev.map((w) => w.id === draggingId ? { ...w, date: targetDate } : w));
    setDraggingId(null);
    setDragOverDate(null);

    setSaving(true);
    try {
      await fetch(`/api/coach/workouts/${draggingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: `${targetDate}T12:00:00.000Z` }),
      });
    } catch {
      // Rollback on error
      setWorkouts((prev) => prev.map((w) => w.id === draggingId ? { ...w, date: wo.date } : w));
    } finally {
      setSaving(false);
    }
  }, [draggingId, dragOverDate, workouts]);

  return (
    <div className="space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted hover:bg-card-hover hover:text-text transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-display text-base font-semibold text-text">
          {MONTHS_PT[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-text-muted hover:bg-card-hover hover:text-text transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {saving && (
        <p className="text-center text-xs text-text-muted animate-pulse">Reagendando treino…</p>
      )}

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {DAYS_PT.map((d) => (
          <div key={d} className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-border bg-border">
        {cells.map((day, i) => {
          if (!day) return <div key={`blank-${i}`} className="bg-card min-h-[80px]" />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === toISODate(today);
          const isDragOver = dragOverDate === dateStr;
          const dayWorkouts = byDate.get(dateStr) ?? [];

          return (
            <div
              key={dateStr}
              className={cn(
                "bg-card min-h-[80px] p-1.5 transition-colors",
                isDragOver && "bg-primary/10 ring-2 ring-inset ring-primary/30",
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOverDate(dateStr); }}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={() => handleDrop(dateStr)}
            >
              {/* Day number */}
              <div className={cn(
                "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                isToday
                  ? "bg-primary text-white"
                  : "text-text-muted",
              )}>
                {day}
              </div>

              {/* Workout chips */}
              <div className="space-y-0.5">
                {dayWorkouts.map((wo) => {
                  const cfg = woCfg(wo.type);
                  const isCompleted = wo.status === "CONCLUIDO";
                  const isMissed    = wo.status === "PERDIDO";

                  return (
                    <div
                      key={wo.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(wo.id);
                      }}
                      onDragEnd={() => { setDraggingId(null); setDragOverDate(null); }}
                      onClick={() => setSelectedWo(wo)}
                      title={wo.title ?? cfg.label}
                      className={cn(
                        "flex cursor-grab items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white transition-opacity active:cursor-grabbing",
                        cfg.bg,
                        isMissed && "opacity-40",
                        isCompleted && "ring-1 ring-white/50",
                        draggingId === wo.id && "opacity-50 scale-95",
                      )}
                    >
                      <GripVertical className="h-2.5 w-2.5 shrink-0 opacity-60" />
                      {wo.sport && wo.sport !== "RUN" && (
                        <span className="shrink-0 text-[10px]" aria-hidden="true">
                          {SPORT_EMOJI[wo.sport] ?? ""}
                        </span>
                      )}
                      <span className="truncate">{wo.title ?? cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        {[
          { label: "🏃 Corrida",   bg: "bg-sky-400" },
          { label: "🚴 Ciclismo",  bg: "bg-orange-400" },
          { label: "🏊 Natação",   bg: "bg-cyan-500" },
          { label: "⚡ Brick",     bg: "bg-yellow-500" },
          { label: "🏋️ Força",     bg: "bg-purple-500" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1 text-[10px] text-text-muted">
            <span className={cn("h-2.5 w-2.5 rounded-sm", l.bg)} />
            {l.label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[10px] text-text-muted">
          <GripVertical className="h-3 w-3" />
          Arraste para reagendar
        </span>
      </div>

      {/* Workout detail modal */}
      {selectedWo && (
        <WorkoutModal wo={selectedWo} onClose={() => setSelectedWo(null)} />
      )}
    </div>
  );
}
