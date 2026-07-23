"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronDown, ChevronLeft, ChevronRight, Search, Users, X,
  Clock, Ruler, Zap, CheckCircle2, CircleAlert, Circle,
  Flame, ShieldAlert, CalendarCheck,
  BookmarkPlus, Copy, CopyPlus, Plus, Loader2, Check,
  Clipboard, ClipboardPaste, Trash2, GripVertical,
  Bike, Waves, Dumbbell,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getWorkoutVisualConfig } from "@/lib/workout-visual-config";

// ── Workout type visual config ───────────────────────────────────────────────

const WO_CONFIG: Record<string, { label: string; short: string; bg: string; text: string }> = {
  REGENERATIVO:      { label: "Regenerativo",       short: "Z1", bg: "bg-emerald-400", text: "text-white" },
  RODAGEM_LEVE:      { label: "Rodagem Leve",        short: "Z2", bg: "bg-sky-400",     text: "text-white" },
  PROGRESSIVO:       { label: "Progressivo",         short: "P",  bg: "bg-blue-500",    text: "text-white" },
  LONGAO:            { label: "Longão",              short: "L",  bg: "bg-indigo-500",  text: "text-white" },
  FARTLEK:           { label: "Fartlek",             short: "F",  bg: "bg-amber-400",   text: "text-white" },
  TECNICA:           { label: "Técnica",             short: "T",  bg: "bg-teal-400",    text: "text-white" },
  SUBIDA:            { label: "Subida",              short: "S",  bg: "bg-orange-400",  text: "text-white" },
  TEMPO_RUN:         { label: "Tempo Run",           short: "T4", bg: "bg-orange-500",  text: "text-white" },
  INTERVALADO_LONGO: { label: "Intervalado Longo",   short: "IL", bg: "bg-rose-500",    text: "text-white" },
  INTERVALADO_CURTO: { label: "Intervalado Curto",   short: "IC", bg: "bg-red-600",     text: "text-white" },
  PROVA:             { label: "Prova/Competição",    short: "★",  bg: "bg-red-700",     text: "text-white" },
  FORCA:             { label: "Força",               short: "FC", bg: "bg-violet-500",  text: "text-white" },
  FUNCIONAL:         { label: "Funcional",           short: "FN", bg: "bg-purple-500",  text: "text-white" },
  MOBILIDADE:        { label: "Mobilidade",          short: "MB", bg: "bg-green-400",   text: "text-white" },
  RECUPERACAO:       { label: "Recuperação",         short: "RC", bg: "bg-gray-400",    text: "text-white" },
  NATACAO_TECNICA:   { label: "Natação técnica",     short: "T",  bg: "bg-teal-400",    text: "text-white" },
  NATACAO_AEROBIO:   { label: "Aeróbio contínuo",    short: "Z2", bg: "bg-sky-400",     text: "text-white" },
  NATACAO_CSS_CURTO: { label: "CSS curto",           short: "IC", bg: "bg-red-600",     text: "text-white" },
  NATACAO_CSS_LONGO: { label: "CSS longo",           short: "IL", bg: "bg-rose-500",    text: "text-white" },
  NATACAO_REGENERATIVA: { label: "Soltura regenerativa", short: "Z1", bg: "bg-emerald-400", text: "text-white" },
  FORCA_SUPERIOR:    { label: "Força superior",      short: "FC", bg: "bg-violet-500",  text: "text-white" },
  FORCA_INFERIOR:    { label: "Força inferior",      short: "FC", bg: "bg-violet-500",  text: "text-white" },
  FORCA_FULL_BODY:   { label: "Full body",            short: "FC", bg: "bg-violet-500",  text: "text-white" },
};

const WO_DEFAULT = { label: "Treino", short: "?", bg: "bg-gray-400", text: "text-white" };

function woCfg(type: string) {
  const visual = getWorkoutVisualConfig(type);
  const legacy = WO_CONFIG[type] ?? WO_DEFAULT;
  return { ...legacy, ...visual, bg: legacy.bg, text: legacy.text };
}

function WorkoutIcon({ type, className }: { type: string; className?: string }) {
  const key = type.toUpperCase();
  if (key.includes("FORCA") || key.includes("FUNCIONAL") || key.includes("MOBILIDADE")) {
    return <Dumbbell className={className} />;
  }
  if (key.includes("BIKE") || key.includes("CICL")) {
    return <Bike className={className} />;
  }
  if (key.includes("NAT") || key.includes("SWIM")) {
    return <Waves className={className} />;
  }
  return <RunIcon className={className} />;
}

function RunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="14.5" cy="4.5" r="2" />
      <path d="m13 7-3 4 4 2 2-3" />
      <path d="m10 11-4 1" />
      <path d="m14 13 3 2 2 4" />
      <path d="m12 13-2 4-4 3" />
    </svg>
  );
}

function workoutCardClass(type: string, title = "") {
  const key = `${type} ${title}`.toUpperCase();
  if (key.includes("FORCA") || key.includes("FUNCIONAL")) return "border-violet-400/40 bg-violet-500/20 text-violet-50 shadow-violet-950/20";
  if (key.includes("BIKE") || key.includes("CICL")) return "border-teal-400/40 bg-teal-500/20 text-teal-50 shadow-teal-950/20";
  if (key.includes("NAT") || key.includes("SWIM")) return "border-sky-400/40 bg-sky-500/20 text-sky-50 shadow-sky-950/20";
  if (key.includes("RECUP") || key.includes("MOBIL")) return "border-slate-300/25 bg-slate-400/20 text-slate-100 shadow-slate-950/20";
  if (key.includes("TEMPO") || key.includes("INTERVAL") || key.includes("FARTLEK")) return "border-orange-400/35 bg-orange-500/20 text-orange-50 shadow-orange-950/20";
  return "border-primary/35 bg-primary/20 text-primary-foreground shadow-primary/20";
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { variant: "success" | "danger" | "default" | "outline"; label: string }> = {
  ativo:   { variant: "success", label: "Ativo" },
  risco:   { variant: "danger",  label: "Em risco" },
  inativo: { variant: "default", label: "Inativo" },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkoutEntry {
  id: string;
  date: string;
  type: string;
  rawType?: string;
  modality?: LibraryModality;
  title: string;
  status: string;
  objective?: string | null;
  warmup?: string | null;
  mainSet?: string | null;
  cooldown?: string | null;
  targetDistanceKm: number | null;
  targetDurationMin: number | null;
  targetPaceSecPerKm: number | null;
  targetRpe: number | null;
  tss: number;
  plannedTss?: number;
  actualTss?: number | null;
  actualSource?: string | null;
  actualDistanceKm?: number | null;
  actualDurationMin?: number | null;
  actualAvgPaceSecPerKm?: number | null;
  actualAvgHr?: number | null;
  released: boolean;
}

interface AthleteWeekly {
  id: string;
  name: string;
  avatarUrl: string | null;
  status: string;
  goal: string | null;
  level: string;
  adherence: number;
  workouts: WorkoutEntry[];
}

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  athletes: AthleteWeekly[];
}

interface DragPayload {
  workoutId: string;
}

interface WorkoutClipboard {
  workout: WorkoutEntry;
}

interface WeekClipboard {
  athlete: AthleteWeekly;
  weekStart: string;
  workoutCount: number;
}

// Props passed from the server page (static athlete list for count + empty state)
export interface AthleteRow {
  id: string;
  name: string;
  avatarUrl?: string | null;
  goal: string;
  level: string;
  status: "ativo" | "risco" | "inativo";
  adherence: number;
  weeklyLoad: number;
  lastCheckIn: string;
  raceDate: string;
}

interface Props {
  athletes: AthleteRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMondayOf(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1));
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const DAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getMonthStart(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(1);
  return copy;
}

function getCalendarMonthDays(monthStart: Date) {
  const gridStart = getMondayOf(monthStart);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      iso: toISODate(date),
      dayNum: date.getDate(),
      inMonth: date.getMonth() === monthStart.getMonth(),
      isToday: toISODate(date) === toISODate(new Date()),
    };
  });
}

function formatMonthLabel(monthStart: Date): string {
  return monthStart.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
  return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

function formatPace(secPerKm: number): string {
  return `${Math.floor(secPerKm / 60)}:${String(secPerKm % 60).padStart(2, "0")}/km`;
}

// ── Workout Detail Modal ──────────────────────────────────────────────────────

interface ModalPayload {
  athlete: AthleteWeekly;
  dayDate: string;
  workouts: WorkoutEntry[];
}

function WorkoutModal({
  payload,
  onClose,
  onCopy,
  onCopyToClipboard,
  onDelete,
  onSaveToLib,
}: {
  payload: ModalPayload;
  onClose: () => void;
  onCopy: (workout: WorkoutEntry, athlete: AthleteWeekly) => void;
  onCopyToClipboard: (workout: WorkoutEntry) => void;
  onDelete: (workout: WorkoutEntry) => void;
  onSaveToLib: (workout: WorkoutEntry) => void;
}) {
  const date = new Date(payload.dayDate + "T12:00:00");
  const dayLabel = date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Treinos de {payload.athlete.name}
            </p>
            <p className="mt-0.5 font-display text-base font-bold capitalize text-text">{dayLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-card-hover hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Workout list */}
        <div className="divide-y divide-border">
          {payload.workouts.map((wo) => {
            const cfg = woCfg(wo.type);
            const isCompleted = wo.status === "CONCLUIDO";
            const isMissed    = wo.status === "PERDIDO";

            // IF estimation: tss = h * IF^2 * 100 → IF ≈ sqrt(tss / (h * 100))
            const durationH = wo.targetDurationMin ? wo.targetDurationMin / 60 : 1;
            const ifEst = wo.tss > 0 ? Math.min(Math.sqrt(wo.tss / (durationH * 100)), 1.3) : null;

            return (
              <div key={wo.id} className="p-4 space-y-2.5">
                {/* Sport + title */}
                <div className="flex items-center gap-2.5">
                  <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold", cfg.bg, cfg.text)}>
                    {cfg.short}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{wo.title ?? cfg.label}</p>
                    <p className="text-[11px] text-text-muted">{cfg.label}</p>
                  </div>
                  <div className="ml-auto shrink-0">
                    {isCompleted ? (
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <CheckCircle2 className="h-2.5 w-2.5" />Realizado
                      </Badge>
                    ) : isMissed ? (
                      <Badge variant="danger" className="gap-1 text-[10px]">
                        <CircleAlert className="h-2.5 w-2.5" />Perdido
                      </Badge>
                    ) : wo.released ? (
                      <Badge variant="primary" className="text-[10px]">Liberado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-text-muted">Planejado</Badge>
                    )}
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-4 gap-2 rounded-xl bg-card-hover/40 p-3">
                  <MetricCell
                    icon={<Clock className="h-3 w-3" />}
                    label="Tempo"
                    value={wo.targetDurationMin ? `${wo.targetDurationMin} min` : "—"}
                  />
                  <MetricCell
                    icon={<Ruler className="h-3 w-3" />}
                    label="Distância"
                    value={wo.targetDistanceKm ? `${wo.targetDistanceKm} km` : "—"}
                  />
                  <MetricCell
                    icon={<Zap className="h-3 w-3" />}
                    label="TSS"
                    value={wo.tss > 0 ? String(wo.tss) : "—"}
                    highlight={wo.tss > 0}
                  />
                  <MetricCell
                    label="IS"
                    value={ifEst ? `${Math.round(ifEst * 100)}%` : "—"}
                  />
                </div>

                {/* Pace */}
                {wo.targetPaceSecPerKm && (
                  <p className="text-xs text-text-muted">
                    Pace alvo: <span className="font-semibold text-text">{formatPace(wo.targetPaceSecPerKm)}</span>
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onSaveToLib(wo)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    <BookmarkPlus className="h-3 w-3" />
                    Salvar na biblioteca
                  </button>
                  <button
                    onClick={() => onCopy(wo, payload.athlete)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:border-success/40 hover:bg-success/5 hover:text-success"
                  >
                    <Copy className="h-3 w-3" />
                    Copiar para...
                  </button>
                  <button
                    onClick={() => onCopyToClipboard(wo)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:border-info/40 hover:bg-info/5 hover:text-info"
                  >
                    <Clipboard className="h-3 w-3" />
                    Copiar
                  </button>
                  <button
                    onClick={() => onDelete(wo)}
                    className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:border-danger/40 hover:bg-danger/5 hover:text-danger"
                  >
                    <Trash2 className="h-3 w-3" />
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Link href={`/treinador/atletas/${payload.athlete.id}`}>
            <Button variant="secondary" size="sm" className="w-full">
              Ver perfil completo de {payload.athlete.name.split(" ")[0]}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      {icon && <div className="mb-0.5 flex justify-center text-text-muted">{icon}</div>}
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className={cn("text-xs font-bold", highlight ? "text-primary" : "text-text")}>{value}</p>
    </div>
  );
}

// ── Workout Dot (calendar cell) ───────────────────────────────────────────────

function WorkoutDot({
  workout,
  onClick,
  onCopy,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  workout: WorkoutEntry;
  onClick: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const cfg = woCfg(workout.type);
  const isCompleted = workout.status === "CONCLUIDO";
  const isMissed    = workout.status === "PERDIDO";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={`${cfg.label} - TSS ${workout.tss}`}
      className={cn(
        "calendar-workout-chip group/workout min-h-[42px] cursor-grab rounded-md border border-white/10 px-2 py-1.5 text-left shadow-sm transition active:cursor-grabbing",
        cfg.bg, cfg.text,
        isCompleted && "ring-2 ring-success ring-offset-1",
        isMissed && "opacity-45",
      )}
      data-workout-type={workout.type}
    >
      <div className="flex items-center gap-1">
        <GripVertical className="h-3 w-3 shrink-0 opacity-60" />
        <button onClick={onClick} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[11px] font-bold leading-tight">{workout.title ?? cfg.label}</span>
          <span className="text-[9px] font-semibold opacity-85">
            {workout.targetDistanceKm ? `${workout.targetDistanceKm} km` : cfg.short}
            {workout.targetDurationMin ? ` / ${workout.targetDurationMin}min` : ""}
          </span>
        </button>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover/workout:opacity-100">
          <button onClick={onCopy} title="Copiar treino" className="rounded p-0.5 hover:bg-black/15">
            <Clipboard className="h-3 w-3" />
          </button>
          <button onClick={onDelete} title="Excluir treino" className="rounded p-0.5 hover:bg-black/15">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { label: "Z1 Reg.",  bg: "bg-emerald-400" },
  { label: "Z2 Leve",  bg: "bg-sky-400" },
  { label: "T4 Limiar", bg: "bg-orange-500" },
  { label: "IL Int.",  bg: "bg-rose-500" },
  { label: "FC Força", bg: "bg-violet-500" },
  { label: "★ Prova",  bg: "bg-red-700" },
];

// ── Action Center Banner ──────────────────────────────────────────────────────

interface ActionCenterData {
  athletesWithoutWorkout: number;
  unreleasedWorkouts: number;
  missedWorkouts: number;
  flaggedCheckins: number;
}

function ActionBanner({ data }: { data: ActionCenterData }) {
  const items = [
    {
      value: data.athletesWithoutWorkout,
      label: data.athletesWithoutWorkout === 1 ? "atleta sem treino" : "atletas sem treino",
      icon: Users,
      color: "text-warning",
      bg: "bg-warning/10",
      href: "/treinador/atletas?filtro=sem-treino",
      cta: "Prescrever",
    },
    {
      value: data.unreleasedWorkouts,
      label: data.unreleasedWorkouts === 1 ? "treino aguarda liberação" : "treinos aguardam liberação",
      icon: Flame,
      color: "text-info",
      bg: "bg-info/10",
      href: "/treinador/atletas",
      cta: "Liberar",
    },
    {
      value: data.missedWorkouts,
      label: data.missedWorkouts === 1 ? "treino não realizado" : "treinos não realizados",
      icon: ShieldAlert,
      color: "text-danger",
      bg: "bg-danger/10",
      href: "/treinador/alertas",
      cta: "Ver alertas",
    },
    {
      value: data.flaggedCheckins,
      label: data.flaggedCheckins === 1 ? "check-in com atenção" : "check-ins com atenção",
      icon: CalendarCheck,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      href: "/treinador/atletas",
      cta: "Revisar",
    },
  ].filter((i) => i.value > 0);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">
        O que precisa de ação hoje
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}>
              <div className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80",
                item.bg
              )}>
                <Icon className={cn("h-3.5 w-3.5 shrink-0", item.color)} />
                <span className={cn("font-bold", item.color)}>{item.value}</span>
                <span className="text-text-muted">{item.label}</span>
                <span className={cn("ml-1 font-semibold", item.color)}>→ {item.cta}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Workout type options for quick prescribe ──────────────────────────────────

const QUICK_TYPES = [
  { value: "RODAGEM_LEVE",      label: "Rodagem leve"      },
  { value: "REGENERATIVO",      label: "Regenerativo"      },
  { value: "PROGRESSIVO",       label: "Progressivo"       },
  { value: "TEMPO_RUN",         label: "Tempo Run"         },
  { value: "FARTLEK",           label: "Fartlek"           },
  { value: "INTERVALADO_LONGO", label: "Intervalado longo" },
  { value: "INTERVALADO_CURTO", label: "Intervalado curto" },
  { value: "LONGAO",            label: "Longão"            },
  { value: "FORCA",             label: "Força"             },
  { value: "FUNCIONAL",         label: "Funcional"         },
  { value: "MOBILIDADE",        label: "Mobilidade"        },
] as const;

const QUICK_TYPES_BY_SPORT: Record<string, { value: string; label: string }[]> = {
  Corrida: [
    { value: "RODAGEM_LEVE", label: "Rodagem leve" },
    { value: "REGENERATIVO", label: "Regenerativo" },
    { value: "PROGRESSIVO", label: "Progressivo" },
    { value: "TEMPO_RUN", label: "Tempo Run" },
    { value: "FARTLEK", label: "Fartlek" },
    { value: "INTERVALADO_LONGO", label: "Intervalado longo" },
    { value: "INTERVALADO_CURTO", label: "Intervalado curto" },
    { value: "LONGAO", label: "Longao" },
  ],
  Ciclismo: [
    { value: "RODAGEM_LEVE", label: "Bike endurance" },
    { value: "TEMPO_RUN", label: "Sweet spot 88-94% FTP" },
    { value: "INTERVALADO_LONGO", label: "VO2 bike 5x4min" },
    { value: "REGENERATIVO", label: "Giro regenerativo" },
    { value: "PROGRESSIVO", label: "Cadencia progressiva" },
  ],
  Natacao: [
    { value: "NATACAO_TECNICA", label: "Natacao tecnica" },
    { value: "NATACAO_AEROBIO", label: "Aerobio continuo" },
    { value: "NATACAO_CSS_CURTO", label: "CSS curto" },
    { value: "NATACAO_CSS_LONGO", label: "CSS longo" },
    { value: "NATACAO_REGENERATIVA", label: "Soltura regenerativa" },
  ],
  Forca: [
    { value: "FORCA_FULL_BODY", label: "Forca full body" },
    { value: "FORCA_INFERIOR", label: "Forca inferior" },
    { value: "FORCA_SUPERIOR", label: "Forca superior" },
    { value: "FUNCIONAL", label: "Core funcional" },
    { value: "MOBILIDADE", label: "Mobilidade" },
  ],
  Trilha: [
    { value: "RODAGEM_LEVE", label: "Trilha leve" },
    { value: "PROGRESSIVO", label: "Subida progressiva" },
    { value: "TEMPO_RUN", label: "Subida sustentada" },
    { value: "LONGAO", label: "Longao trail" },
  ],
};

const DEFAULT_INTENSITY_BY_SPORT: Record<string, { zone: string; rpe: string; load: string; pace?: string; ftp?: string; heartRate?: string }> = {
  Corrida: { zone: "Z2 Leve", rpe: "4", load: "45", pace: "Z2 / VDOT", heartRate: "Z2 por FCmax" },
  Ciclismo: { zone: "Z2 56-75% FTP", rpe: "4", load: "50", ftp: "56-75% FTP", heartRate: "Z2 por FC" },
  Natacao: { zone: "CSS +10-15s/100m", rpe: "4", load: "40", pace: "CSS +10-15s/100m" },
  Forca: { zone: "RPE 7 / RIR 3", rpe: "7", load: "50" },
  Trilha: { zone: "Z2 subida leve", rpe: "5", load: "50", heartRate: "Z2 por FCmax" },
};

function suggestedZoneForWorkout(sport: string, workout?: WorkoutEntry) {
  if (!workout?.targetRpe) return DEFAULT_INTENSITY_BY_SPORT[sport]?.zone ?? DEFAULT_INTENSITY_BY_SPORT.Corrida.zone;
  const zones = TRAINING_ZONES[sport] ?? TRAINING_ZONES.Corrida;
  if (workout.targetRpe <= 3) return zones[0] ?? DEFAULT_INTENSITY_BY_SPORT[sport]?.zone;
  if (workout.targetRpe <= 5) return zones[1] ?? DEFAULT_INTENSITY_BY_SPORT[sport]?.zone;
  if (workout.targetRpe <= 7) return zones[2] ?? DEFAULT_INTENSITY_BY_SPORT[sport]?.zone;
  return zones[3] ?? zones[zones.length - 1] ?? DEFAULT_INTENSITY_BY_SPORT[sport]?.zone;
}

type LibraryModality = "corrida" | "ciclismo" | "natacao" | "forca";

const LIBRARY_MODALITIES: { value: LibraryModality; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: "corrida", label: "Corrida", icon: RunIcon },
  { value: "ciclismo", label: "Ciclismo", icon: Bike },
  { value: "natacao", label: "Natacao", icon: Waves },
  { value: "forca", label: "Forca", icon: Dumbbell },
];

const LIBRARY_TEMPLATES: Record<LibraryModality, { value: string; label: string }[]> = {
  corrida: [
    { value: "RODAGEM_LEVE", label: "Rodagem leve" },
    { value: "REGENERATIVO", label: "Regenerativo" },
    { value: "PROGRESSIVO", label: "Progressivo" },
    { value: "TEMPO_RUN", label: "Tempo Run" },
    { value: "FARTLEK", label: "Fartlek" },
    { value: "INTERVALADO_LONGO", label: "Intervalado longo" },
    { value: "INTERVALADO_CURTO", label: "Intervalado curto" },
    { value: "LONGAO", label: "Longao" },
  ],
  ciclismo: [
    { value: "RODAGEM_LEVE", label: "Bike endurance" },
    { value: "TEMPO_RUN", label: "Sweet spot 88-94% FTP" },
    { value: "INTERVALADO_LONGO", label: "VO2 bike 5x4min" },
    { value: "REGENERATIVO", label: "Giro regenerativo" },
    { value: "PROGRESSIVO", label: "Cadencia progressiva" },
  ],
  natacao: [
    { value: "NATACAO_TECNICA", label: "Natacao tecnica" },
    { value: "NATACAO_AEROBIO", label: "Aerobio continuo" },
    { value: "NATACAO_CSS_CURTO", label: "CSS curto" },
    { value: "NATACAO_CSS_LONGO", label: "CSS longo" },
    { value: "NATACAO_REGENERATIVA", label: "Soltura regenerativa" },
  ],
  forca: [
    { value: "FORCA_SUPERIOR", label: "Forca superior" },
    { value: "FORCA_INFERIOR", label: "Forca inferior" },
    { value: "FORCA_FULL_BODY", label: "Full body" },
    { value: "FUNCIONAL", label: "Core funcional" },
    { value: "MOBILIDADE", label: "Mobilidade" },
  ],
};

function sportFromModality(modality?: string | null) {
  if (modality === "ciclismo") return "Ciclismo";
  if (modality === "natacao") return "Natacao";
  if (modality === "forca") return "Forca";
  return "Corrida";
}

function modalityFromWorkout(workout?: WorkoutEntry | null): LibraryModality {
  const key = `${workout?.modality ?? ""} ${workout?.type ?? ""} ${workout?.title ?? ""}`.toLowerCase();
  if (key.includes("forca") || key.includes("funcional") || key.includes("mobil")) return "forca";
  if (key.includes("natacao") || key.includes("nata") || key.includes("swim")) return "natacao";
  if (key.includes("ciclismo") || key.includes("bike") || key.includes("ftp")) return "ciclismo";
  return "corrida";
}

function rawWorkoutType(type: string) {
  if (type === "NATACAO_TECNICA" || type === "NATACAO_AEROBIO" || type === "NATACAO_REGENERATIVA") return "RODAGEM_LEVE";
  if (type === "NATACAO_CSS_CURTO") return "INTERVALADO_CURTO";
  if (type === "NATACAO_CSS_LONGO") return "INTERVALADO_LONGO";
  if (type.startsWith("FORCA_")) return "FORCA";
  return type.replace(/^(CICLISMO|NATACAO|TRIATHLON|TRIATLO)_/, "");
}

const STRENGTH_LIBRARY = [
  "Agachamento livre",
  "Levantamento terra",
  "Supino reto",
  "Remada curvada",
  "Avanco",
  "Leg press",
  "Desenvolvimento",
  "Puxada alta",
  "Stiff",
  "Panturrilha",
  "Prancha",
];

const TRAINING_ZONES: Record<string, string[]> = {
  Corrida: ["Z1 Recuperacao", "Z2 Leve", "Z3 Moderado", "Z4 Limiar", "Z5 VO2 max", "RPE livre"],
  Ciclismo: ["Z1 <55% FTP", "Z2 56-75% FTP", "Z3 76-90% FTP", "Sweet spot 88-94% FTP", "Z4 91-105% FTP", "Z5 106-120% FTP"],
  Natacao: ["Tecnica leve", "CSS +10-15s/100m", "CSS +5s/100m", "CSS", "CSS -3s/100m", "Sprint"],
  Forca: ["RPE 5-6 / RIR 4", "RPE 7 / RIR 3", "RPE 8 / RIR 2", "RPE 9 / RIR 1", "Potencia", "Mobilidade"],
  Trilha: ["Z1 Recuperacao", "Z2 subida leve", "Z3 sustentado", "Z4 subida forte", "Tecnico"],
};

const FALLBACK_STRENGTH_EXERCISES: StrengthExerciseOption[] = STRENGTH_LIBRARY.map((name, index) => ({
  id: `fallback-${index}`,
  name,
  category: "Forca",
}));

const CATEGORY_FOR_TYPE: Record<string, string> = {
  FORCA: "FORCA", FUNCIONAL: "FORCA", MOBILIDADE: "MOBILIDADE",
};

// ── QuickPrescribeModal ───────────────────────────────────────────────────────

interface QuickPrescribePayload {
  athleteId: string;
  athleteName: string;
  date: string;
  workout?: WorkoutEntry;
}

interface SavedWorkoutResponse {
  id: string;
  date?: string;
  type?: string;
  rawType?: string;
  modality?: LibraryModality;
  title?: string;
  status?: string;
  targetDistanceKm?: number | null;
  targetDurationMin?: number | null;
  targetPaceSecPerKm?: number | null;
  targetRpe?: number | null;
  tss?: number;
  plannedTss?: number;
  actualTss?: number | null;
  released?: boolean;
}

interface StrengthExerciseOption {
  id: string;
  name: string;
  category: string;
  gifUrl?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  description?: string;
}

interface StrengthExerciseDraft {
  line: string;
  libraryId: string;
  name: string;
  category?: string;
  gifUrl?: string;
  imageUrl?: string;
  youtubeUrl?: string;
  sets: number;
  reps: string;
  rest: string;
  rpe: number;
}

// eslint-disable-next-line no-unused-vars
function LegacyDisabledPrescriptionForm({
  payload,
  onClose,
  onSaved,
}: {
  payload: QuickPrescribePayload;
  onClose: () => void;
  onSaved: (workout?: SavedWorkoutResponse | null) => void;
}) {
  return null;
  const [type, setType] = useState("RODAGEM_LEVE");
  const [title, setTitle] = useState("Rodagem leve");
  const [durationMin, setDurationMin] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [rpe, setRpe] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

    const dateLabel = new Date(payload.date + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });

  function handleTypeChange(v: string) {
    setType(v);
    const t = QUICK_TYPES.find((q) => q.value === v);
    if (t) setTitle(t.label);
  }

  async function handleSave() {
    if (!title.trim()) { setError("Informe o nome do treino."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/coach/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: payload.athleteId,
          date: payload.date,
          title: title.trim(),
          type,
          ...(durationMin ? { targetDurationMin: parseInt(durationMin) } : {}),
          ...(distanceKm ? { targetDistanceKm: parseFloat(distanceKm) } : {}),
          ...(rpe ? { targetRpe: parseInt(rpe) } : {}),
        }),
      });
      if (!res.ok) { setError("Erro ao salvar treino."); return; }
      onSaved();
      onClose();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Nova prescrição — {payload.athleteName.split(" ")[0]}
            </p>
            <p className="mt-0.5 font-display text-base font-bold capitalize text-text">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Tipo</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
            >
              {QUICK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nome</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">Min</label>
              <input
                type="number"
                min={1}
                placeholder="—"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">km</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                placeholder="—"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">RPE</label>
              <input
                type="number"
                min={1}
                max={10}
                placeholder="—"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
              />
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Salvando…" : "Salvar e liberar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── CopyWorkoutModal ──────────────────────────────────────────────────────────

export function IntervalsPrescribeModal({
  payload,
  onClose,
  onSaved,
}: {
  payload: QuickPrescribePayload;
  onClose: () => void;
  onSaved: (workout?: SavedWorkoutResponse | null) => void;
}) {
    const seedWorkout = payload.workout;
    const editingWorkout = seedWorkout && !seedWorkout.id.startsWith("periodizacao-") ? seedWorkout : undefined;
  const [category, setCategory] = useState("Treino");
  const initialSport = sportFromModality(modalityFromWorkout(seedWorkout));
  const seedRawType = seedWorkout?.rawType ?? rawWorkoutType(seedWorkout?.type ?? "RODAGEM_LEVE");
  const seedStructuredSteps = [
    seedWorkout?.warmup,
    seedWorkout?.mainSet,
    seedWorkout?.cooldown,
  ].filter(Boolean).join("\n");
  const [sport, setSport] = useState(initialSport);
  const [type, setType] = useState(seedRawType);
  const [title, setTitle] = useState(seedWorkout?.title ?? "Rodagem leve");
  const [durationMin, setDurationMin] = useState(seedWorkout?.targetDurationMin ? String(seedWorkout.targetDurationMin) : "");
  const [distanceKm, setDistanceKm] = useState(seedWorkout?.targetDistanceKm ? String(seedWorkout.targetDistanceKm) : "");
  const [load, setLoad] = useState("");
  const [rpe, setRpe] = useState(seedWorkout?.targetRpe ? String(seedWorkout.targetRpe) : "");
  const [ftp, setFtp] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [pace, setPace] = useState("");
  const [trainingZone, setTrainingZone] = useState(suggestedZoneForWorkout(initialSport, seedWorkout));
  const [poolDistance, setPoolDistance] = useState("25");
  const [strengthExercise, setStrengthExercise] = useState("Agachamento");
  const [exerciseQuery, setExerciseQuery] = useState("Agachamento");
  const [exerciseDb, setExerciseDb] = useState<StrengthExerciseOption[]>([]);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [loadKg, setLoadKg] = useState("");
  const [rir, setRir] = useState("");
  const [restSec, setRestSec] = useState("90");
  const [description, setDescription] = useState(seedWorkout?.objective ?? "");
  const [strengthExercises, setStrengthExercises] = useState<StrengthExerciseDraft[]>([]);
  const [steps, setSteps] = useState(
    seedStructuredSteps ||
    (rawWorkoutType(seedRawType) === "FORCA"
      ? "Agachamento 3x10 carga moderada RPE 7 descanso 90s\nRemada 3x12 RIR 2 descanso 75s"
      : "Aquecimento 10min Z1\nPrincipal 30min Z2\nVolta a calma 5min")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass = "w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-950 shadow-inner shadow-slate-100 outline-none transition-colors placeholder:text-slate-400 focus:border-[#5b2df5] focus:ring-2 focus:ring-[#5b2df5]/15 dark:border-border dark:bg-[#07111c] dark:text-text dark:shadow-none dark:placeholder:text-text-muted dark:focus:border-info";
  const optionClass = "bg-white text-slate-950 dark:bg-[#07111c] dark:text-text";
  const modalityPanelClass = "mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50/90 p-3 shadow-inner shadow-slate-100 sm:grid-cols-3 dark:border-border dark:bg-[#07100d] dark:shadow-none";
  const dateLabel = new Date(payload.date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
    const exerciseSuggestions = exerciseDb
      .filter((exercise) => exercise.name.toLowerCase().includes(exerciseQuery.toLowerCase()))
      .slice(0, 5);
    const selectedExercise = exerciseDb.find((exercise) => exercise.name === strengthExercise);
    const typeOptions = QUICK_TYPES_BY_SPORT[sport] ?? QUICK_TYPES_BY_SPORT.Corrida;
    const periodizationWeekMatch = seedWorkout?.id.match(/^periodizacao-(\d+)-/);
    const periodizationWeek = periodizationWeekMatch ? Number(periodizationWeekMatch[1]) : null;
    const showPeriodizationChart = periodizationWeek !== null;

  useEffect(() => {
    fetch("/exercises.json")
      .then((response) => response.ok ? response.json() : [])
      .then((data: StrengthExerciseOption[]) => {
        if (Array.isArray(data)) setExerciseDb(data);
      })
      .catch(() => null);
  }, []);

  function handleTypeChange(value: string) {
    setType(value);
    const selected = typeOptions.find((item) => item.value === value) ?? QUICK_TYPES.find((item) => item.value === value);
    if (selected) setTitle(selected.label);
  }

  function handleSportChange(value: string) {
    setSport(value);
    const suggested = DEFAULT_INTENSITY_BY_SPORT[value] ?? DEFAULT_INTENSITY_BY_SPORT.Corrida;
    const options = QUICK_TYPES_BY_SPORT[value] ?? QUICK_TYPES_BY_SPORT.Corrida;
    const firstType = options[0];
    setType(firstType.value);
    setTitle(firstType.label);
    setTrainingZone(suggested.zone);
    setRpe(suggested.rpe);
    setLoad(suggested.load);
    setPace(suggested.pace ?? "");
    setFtp(suggested.ftp ?? "");
    setHeartRate(suggested.heartRate ?? "");
  }

  function addStrengthExercise() {
    const line = `${strengthExercise} ${sets}x${reps}${loadKg ? ` x ${loadKg}kg` : ""}${rpe ? ` RPE ${rpe}` : ""}${rir ? ` RIR ${rir}` : ""} descanso ${restSec}s`;
    setStrengthExercises((prev) => [...prev, {
      line,
      libraryId: selectedExercise?.id ?? `manual-${strengthExercise.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: strengthExercise,
      category: selectedExercise?.category,
      gifUrl: selectedExercise?.gifUrl,
      imageUrl: selectedExercise?.imageUrl,
      youtubeUrl: selectedExercise?.youtubeUrl,
      sets: Number(sets) || 1,
      reps: reps || "—",
      rest: restSec,
      rpe: Number(rpe) || 0,
    }]);
    setSteps((prev) => `${prev}${prev ? "\n" : ""}${line}`);
  }

  function removeStrengthExercise(index: number) {
    setStrengthExercises((prev) => {
      const removed = prev[index]?.line;
      setSteps((current) => current.split("\n").filter((line) => line !== removed).join("\n"));
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Informe o nome do treino.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const strengthSummary = strengthExercises.length > 0
        ? strengthExercises.map((exercise) => exercise.line).join("\n")
        : `${strengthExercise}: ${sets}x${reps}${loadKg ? ` x ${loadKg}kg` : ""}${rpe ? ` RPE ${rpe}` : ""}${rir ? ` RIR ${rir}` : ""} / descanso ${restSec}s`;
      if (sport === "Forca" && !editingWorkout) {
        const monday = new Date(`${payload.date}T12:00:00`);
        const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
        const dayLabel = dayLabels[monday.getDay()];
        monday.setDate(monday.getDate() - (monday.getDay() === 0 ? 6 : monday.getDay() - 1));
        const fallbackExercise: StrengthExerciseDraft = {
          line: strengthSummary,
          libraryId: selectedExercise?.id ?? `manual-${strengthExercise.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          name: strengthExercise,
          category: selectedExercise?.category,
          gifUrl: selectedExercise?.gifUrl,
          imageUrl: selectedExercise?.imageUrl,
          youtubeUrl: selectedExercise?.youtubeUrl,
          sets: Number(sets) || 1,
          reps: reps || "—",
          rest: restSec,
          rpe: Number(rpe) || 0,
        };
        const exercises = strengthExercises.length > 0 ? strengthExercises : [fallbackExercise];
        const res = await fetch("/api/coach/prescriptions/forca", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            athleteId: payload.athleteId,
            startDate: monday.toISOString().slice(0, 10),
            division: "Personalizada",
            sessions: [{ label: title.trim(), dayLabels: [dayLabel], exercises }],
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error ?? "Erro ao salvar treino de força.");
          return;
        }
        onSaved(null);
        onClose();
        return;
      }
      const structuredSteps = sport === "Forca"
        ? (strengthExercises.length > 0 ? steps : `${strengthSummary}\n${steps}`)
        : steps;
      const res = await fetch(editingWorkout ? `/api/coach/workouts/${editingWorkout.id}` : "/api/coach/workouts", {
        method: editingWorkout ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: payload.athleteId,
          date: payload.date,
          title: title.trim(),
          type: rawWorkoutType(type),
          sport,
            objective: [
              description,
              trainingZone ? `Zona: ${trainingZone}` : "",
              sport === "Corrida" && (pace || heartRate || load) ? `Pace ${pace || "-"} / FC ${heartRate || "-"}${load ? ` / carga ${load}` : ""}` : "",
            sport === "Ciclismo" && (ftp || heartRate) ? `FTP ${ftp || "-"} / FC ${heartRate || "-"}` : "",
            sport === "Natacao" ? `Piscina ${poolDistance}m${pace ? ` / ritmo ${pace}` : ""}` : "",
            sport === "Forca" ? strengthSummary : "",
          ].filter(Boolean).join("\n"),
          structured: Boolean(structuredSteps.trim()),
          blocks: structuredSteps.trim()
            ? structuredSteps.split("\n").filter(Boolean).map((line, index) => ({ order: index + 1, text: line }))
            : undefined,
          ...(durationMin ? { targetDurationMin: parseInt(durationMin, 10) } : {}),
          ...(distanceKm ? { targetDistanceKm: parseFloat(distanceKm) } : {}),
          ...(rpe ? { targetRpe: parseInt(rpe, 10) } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Erro ao salvar treino.");
        return;
      }
      const savedWorkout = await res.json().catch(() => null) as SavedWorkoutResponse | null;
      onSaved(savedWorkout);
      onClose();
    } catch {
      setError("Erro de conexao.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm dark:bg-black/60" />
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-border dark:bg-[#07111c] dark:shadow-black/45"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-[#0A0C0F] px-4 py-3 text-text">
          <div>
            <p className="text-sm font-semibold">{editingWorkout ? "Editar Entrada no Calendario" : "Adicionar Entrada no Calendario"}</p>
            <p className="text-[11px] text-white/75">{payload.athleteName} • {dateLabel}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-text-muted hover:bg-card-hover hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4 dark:bg-[#07111c]">
          <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Categoria</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={inputClass}>
                {["Treino", "Atividade Manual", "Nota", "Temporada", "Lesionado", "Definir FTP"].map((item) => (
                  <option key={item} value={item} className={optionClass}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Nome</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Esporte</span>
              <select value={sport} onChange={(event) => handleSportChange(event.target.value)} className={inputClass}>
                {["Corrida", "Ciclismo", "Natacao", "Forca", "Trilha"].map((item) => (
                  <option key={item} value={item} className={optionClass}>{item}</option>
                ))}
              </select>
            </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Tipo de treino</span>
                <select value={type} onChange={(event) => handleTypeChange(event.target.value)} className={inputClass}>
                {typeOptions.map((item) => <option key={`${item.value}-${item.label}`} value={item.value} className={optionClass}>{item.label}</option>)}
                </select>
              </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Data</span>
              <input value={dateLabel} readOnly className={cn(inputClass, "text-text-muted")} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Atleta</span>
              <input value={payload.athleteName} readOnly className={cn(inputClass, "text-text-muted")} />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <label className="col-span-2 block space-y-1 sm:col-span-2">
              <span className="text-[11px] font-medium text-text-muted">Zona / intensidade sugerida</span>
              <select value={trainingZone} onChange={(event) => setTrainingZone(event.target.value)} className={inputClass}>
                {(TRAINING_ZONES[sport] ?? TRAINING_ZONES.Corrida).map((zone) => (
                  <option key={zone} value={zone} className={optionClass}>{zone}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Duracao</span>
              <input type="number" min={1} placeholder="min" value={durationMin} onChange={(event) => setDurationMin(event.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Distancia(km)</span>
              <input type="number" min={0.1} step={0.1} placeholder="km" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Carga</span>
              <input type="number" min={1} placeholder="TSS" value={load} onChange={(event) => setLoad(event.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">Subtipo</span>
              <input value={type.replaceAll("_", " ")} readOnly className={cn(inputClass, "text-text-muted")} />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-muted">RPE</span>
              <input type="number" min={1} max={10} placeholder="-" value={rpe} onChange={(event) => setRpe(event.target.value)} className={inputClass} />
            </label>
          </div>

          {sport === "Corrida" && (
            <div className={modalityPanelClass}>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Pace alvo</span>
                <input placeholder="5:20/km" value={pace} onChange={(event) => setPace(event.target.value)} className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">FC alvo</span>
                <input placeholder="Z2 / 145-155" value={heartRate} onChange={(event) => setHeartRate(event.target.value)} className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Controle</span>
                <input value="Pace + FC + RPE" readOnly className={cn(inputClass, "text-text-muted")} />
              </label>
            </div>
          )}

          {sport === "Ciclismo" && (
            <div className={modalityPanelClass}>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">FTP / watts</span>
                <input placeholder="FTP 240 / 180-210w" value={ftp} onChange={(event) => setFtp(event.target.value)} className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">FC alvo</span>
                <input placeholder="Z3 / 150-165" value={heartRate} onChange={(event) => setHeartRate(event.target.value)} className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Cadencia</span>
                <input placeholder="85-95 rpm" className={inputClass} />
              </label>
            </div>
          )}

          {sport === "Natacao" && (
            <div className={modalityPanelClass}>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Piscina</span>
                <select value={poolDistance} onChange={(event) => setPoolDistance(event.target.value)} className={inputClass}>
                  {["25", "50"].map((item) => <option key={item} value={item} className={optionClass}>{item} m</option>)}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Ritmo alvo</span>
                <input placeholder="1:55/100m" value={pace} onChange={(event) => setPace(event.target.value)} className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Intervalo</span>
                <input placeholder="20s entre tiros" value={restSec} onChange={(event) => setRestSec(event.target.value)} className={inputClass} />
              </label>
            </div>
          )}

          {sport === "Forca" && (
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/90 p-3 shadow-inner shadow-slate-100 lg:grid-cols-7 dark:border-border dark:bg-[#07100d] dark:shadow-none">
              <label className="col-span-2 block space-y-1 lg:col-span-2">
                <span className="text-[11px] font-medium text-text-muted">Exercicio da biblioteca</span>
                <input
                  value={exerciseQuery}
                  onChange={(event) => {
                    setExerciseQuery(event.target.value);
                    setStrengthExercise(event.target.value);
                  }}
                  placeholder="Digite para buscar..."
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Series</span>
                <input value={sets} onChange={(event) => setSets(event.target.value)} className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Reps</span>
                <input value={reps} onChange={(event) => setReps(event.target.value)} className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Carga</span>
                <input placeholder="kg" value={loadKg} onChange={(event) => setLoadKg(event.target.value)} className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">RPE/RIR</span>
                <input placeholder="RPE 7 ou RIR 2" value={rir || rpe} onChange={(event) => { setRir(event.target.value); setRpe(event.target.value.replace(/\D/g, "")); }} className={inputClass} />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] font-medium text-text-muted">Descanso</span>
                <input placeholder="90s" value={restSec} onChange={(event) => setRestSec(event.target.value)} className={inputClass} />
              </label>
              <div className="col-span-2 flex flex-col justify-end gap-2 lg:col-span-7">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(exerciseSuggestions.length > 0 ? exerciseSuggestions : FALLBACK_STRENGTH_EXERCISES).map((exercise) => (
                    <button
                      key={exercise.id}
                      type="button"
                      onClick={() => {
                        setStrengthExercise(exercise.name);
                        setExerciseQuery(exercise.name);
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs transition-colors",
                        strengthExercise === exercise.name
                          ? "border-[#5b2df5]/50 bg-[#5b2df5]/10 text-[#5b2df5] dark:border-info/50 dark:bg-info/10 dark:text-info"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#5b2df5]/40 dark:border-border dark:bg-background/50 dark:text-text"
                      )}
                    >
                      {(exercise.gifUrl || exercise.imageUrl) ? (
                        <img src={exercise.gifUrl ?? exercise.imageUrl} alt="" className="h-10 w-14 shrink-0 rounded-md border border-border object-cover" />
                      ) : (
                        <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md border border-border bg-card-hover/40">
                          <Dumbbell className="h-4 w-4" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{exercise.name}</span>
                        <span className="block truncate text-[10px] opacity-70">{exercise.category}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {selectedExercise?.description && (
                  <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 dark:border-border dark:bg-background/40 dark:text-text-muted">
                    {selectedExercise.description}
                  </p>
                )}
                <button
                  type="button"
                  onClick={addStrengthExercise}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#5b2df5]/30 bg-[#5b2df5]/10 px-3 py-2 text-xs font-semibold text-[#5b2df5] transition-colors hover:bg-[#5b2df5]/15 dark:border-info/40 dark:bg-info/10 dark:text-info"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar exercicio ao treino
                </button>
                {strengthExercises.length > 0 && (
                  <div className="grid gap-1">
                    {strengthExercises.map((exercise, index) => (
                      <div key={`${exercise}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 dark:border-border dark:bg-background/50 dark:text-text">
                        <span className="truncate">{exercise.line}</span>
                        <button
                          type="button"
                          onClick={() => removeStrengthExercise(index)}
                          className="ml-2 rounded p-1 text-text-muted hover:bg-danger/10 hover:text-danger"
                          title="Remover exercicio"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <label className="mt-4 block space-y-1">
            <span className="text-[11px] font-medium text-text-muted">Descricao</span>
            <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-inner shadow-slate-100 outline-none transition-colors placeholder:text-slate-400 focus:border-[#5b2df5] focus:ring-2 focus:ring-[#5b2df5]/15 dark:border-border dark:bg-[#07111c] dark:text-text dark:shadow-none dark:focus:border-info" />
          </label>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 shadow-sm dark:border-border dark:bg-background/35 dark:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-border">
              <p className="text-xs font-semibold text-slate-950 dark:text-text">Etapas estruturadas</p>
              <button
                type="button"
                onClick={() => setSteps((prev) => `${prev}${prev ? "\n" : ""}Novo bloco 5min Z2`)}
                className="text-xs font-semibold text-[#5b2df5] hover:text-[#ff6b1a] dark:text-info dark:hover:text-primary"
              >
                ADICIONAR ETAPA
              </button>
            </div>
            <textarea
              rows={5}
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              className="w-full resize-none bg-transparent px-3 py-2 font-mono text-xs text-slate-900 outline-none dark:text-text"
            />
            {showPeriodizationChart && (
              <div className="border-t border-slate-200 px-3 py-2 dark:border-border">
                <div className="mb-2 flex items-center justify-between text-[10px] text-text-muted">
                  <span>Periodizacao planejada</span>
                  <span>Semana {periodizationWeek}</span>
                </div>
                <div className="grid h-20 items-end gap-1" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
                  {Array.from({ length: 16 }, (_, index) => {
                    const week = index + 1;
                    const highlighted = week === periodizationWeek;
                    return (
                      <span
                        key={week}
                        className={cn(
                          "rounded-t transition-all",
                          highlighted
                            ? "bg-gradient-to-t from-[#ff6b1a] to-[#5b2df5] ring-2 ring-[#ff6b1a]/40"
                            : "bg-slate-300/70 dark:bg-white/15"
                        )}
                        style={{ height: `${22 + ((index % 4) + Number(rpe || 3)) * 5}px` }}
                        title={`Semana ${week}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-border dark:bg-[#07111c]">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Salvando..." : "OK"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CopyWorkoutPayload {
  workout: WorkoutEntry;
  athlete: AthleteWeekly;
}

function CopyWorkoutModal({
  payload,
  allAthletes,
  onClose,
  onCopied,
}: {
  payload: CopyWorkoutPayload;
  allAthletes: AthleteRow[];
  onClose: () => void;
  onCopied: () => void;
}) {
  const others = allAthletes.filter((a) => a.id !== payload.athlete.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copying, setCopying] = useState(false);
  const [done, setDone] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(others.map((a) => a.id)));
  }

  async function handleCopy() {
    if (selected.size === 0) return;
    setCopying(true);
    try {
      await fetch("/api/coach/workouts/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutId: payload.workout.id, targetAthleteIds: [...selected] }),
      });
      setDone(true);
      setTimeout(() => { onCopied(); onClose(); }, 800);
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Copiar treino</p>
            <p className="mt-0.5 font-display text-base font-bold text-text">{payload.workout.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-text-muted">Selecionar atletas</p>
            {others.length > 1 && (
              <button onClick={selectAll} className="text-xs font-medium text-primary hover:underline">
                Todos
              </button>
            )}
          </div>
          <div className="max-h-52 space-y-1.5 overflow-y-auto">
            {others.map((a) => (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  selected.has(a.id)
                    ? "border-success/40 bg-success/8 text-text"
                    : "border-border bg-card hover:bg-card-hover text-text-muted"
                )}
              >
                <span className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md border text-[10px]",
                  selected.has(a.id) ? "border-success bg-success text-white" : "border-border"
                )}>
                  {selected.has(a.id) && <Check className="h-3 w-3" />}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card-hover text-xs font-bold text-text">
                  {a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </span>
                <span className="text-sm font-medium text-text">{a.name}</span>
              </button>
            ))}
            {others.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">Nenhum outro atleta cadastrado.</p>
            )}
          </div>

          <Button
            onClick={handleCopy}
            disabled={selected.size === 0 || copying || done}
            className="mt-4 w-full gap-2"
          >
            {done ? (
              <><Check className="h-4 w-4" /> Copiado!</>
            ) : copying ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Copiando…</>
            ) : (
              <><Copy className="h-4 w-4" /> Copiar para {selected.size > 0 ? selected.size : ""} atleta{selected.size !== 1 ? "s" : ""}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── CopyWeekModal ─────────────────────────────────────────────────────────────

interface CopyWeekPayload {
  athlete: AthleteWeekly;
  weekStart: string;
  workoutCount: number;
}

function CopyWeekModal({
  payload,
  allAthletes,
  onClose,
  onCopied,
}: {
  payload: CopyWeekPayload;
  allAthletes: AthleteRow[];
  onClose: () => void;
  onCopied: () => void;
}) {
  const others = allAthletes.filter((a) => a.id !== payload.athlete.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copying, setCopying] = useState(false);
  const [done, setDone] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleCopy() {
    if (selected.size === 0) return;
    setCopying(true);
    try {
      await fetch("/api/coach/workouts/copy-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceAthleteId: payload.athlete.id,
          weekStart: payload.weekStart,
          targetAthleteIds: [...selected],
        }),
      });
      setDone(true);
      setTimeout(() => { onCopied(); onClose(); }, 800);
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Copiar semana</p>
            <p className="mt-0.5 font-display text-base font-bold text-text">
              {payload.workoutCount} treino{payload.workoutCount !== 1 ? "s" : ""} de {payload.athlete.name.split(" ")[0]}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-card-hover hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-text-muted">Aplicar para</p>
            {others.length > 1 && (
              <button
                onClick={() => setSelected(new Set(others.map((a) => a.id)))}
                className="text-xs font-medium text-primary hover:underline"
              >
                Todos
              </button>
            )}
          </div>
          <div className="max-h-52 space-y-1.5 overflow-y-auto">
            {others.map((a) => (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  selected.has(a.id)
                    ? "border-success/40 bg-success/8 text-text"
                    : "border-border bg-card hover:bg-card-hover text-text-muted"
                )}
              >
                <span className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-md border text-[10px]",
                  selected.has(a.id) ? "border-success bg-success text-white" : "border-border"
                )}>
                  {selected.has(a.id) && <Check className="h-3 w-3" />}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card-hover text-xs font-bold text-text">
                  {a.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </span>
                <span className="text-sm font-medium text-text">{a.name}</span>
              </button>
            ))}
            {others.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">Nenhum outro atleta cadastrado.</p>
            )}
          </div>

          <Button
            onClick={handleCopy}
            disabled={selected.size === 0 || copying || done}
            className="mt-4 w-full gap-2"
          >
            {done ? (
              <><Check className="h-4 w-4" /> Semana copiada!</>
            ) : copying ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Copiando…</>
            ) : (
              <><CopyPlus className="h-4 w-4" /> Aplicar para {selected.size > 0 ? selected.size : ""} atleta{selected.size !== 1 ? "s" : ""}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const TABS = ["Todos", "Com treino", "Sem plano", "Em risco"] as const;
type Tab = (typeof TABS)[number];

export default function AthleteListClient({ athletes: staticAthletes }: Props) {
  const [monthStart, setMonthStart] = useState<Date>(() => getMonthStart(new Date()));
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("Todos");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(staticAthletes[0]?.id ?? null);
  const [modal, setModal] = useState<ModalPayload | null>(null);
  const [actionCenter, setActionCenter] = useState<ActionCenterData | null>(null);
  const [quickPrescribe, setQuickPrescribe] = useState<QuickPrescribePayload | null>(null);
  const [copyWorkout, setCopyWorkout] = useState<CopyWorkoutPayload | null>(null);
  const [copyWeek, setCopyWeek] = useState<CopyWeekPayload | null>(null);
  const [workoutClipboard, setWorkoutClipboard] = useState<WorkoutClipboard | null>(null);
  const [weekClipboard, setWeekClipboard] = useState<WeekClipboard | null>(null);
  const [draggingWorkout, setDraggingWorkout] = useState<DragPayload | null>(null);
  const [busyCell, setBusyCell] = useState<string | null>(null);
  const [savingLibrary, setSavingLibrary] = useState<string | null>(null); // workoutId being saved
    const [savedLibrary, setSavedLibrary] = useState<Set<string>>(new Set());
    const [libraryModality, setLibraryModality] = useState<LibraryModality>("corrida");
  const [calendarView, setCalendarView] = useState<"Semana" | "Mes" | "Lista">("Mes");
  const [athletePickerOpen, setAthletePickerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/coach/action-center")
      .then((r) => r.ok ? r.json() : null)
      .then((d: ActionCenterData | null) => setActionCenter(d))
      .catch(() => null);
  }, []);

  async function handleSaveToLib(workout: WorkoutEntry) {
    if (savingLibrary === workout.id || savedLibrary.has(workout.id)) return;
    setSavingLibrary(workout.id);
    const category = CATEGORY_FOR_TYPE[workout.type] ?? "CORRIDA";
    try {
      await fetch("/api/coach/biblioteca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workout.title,
          workoutType: workout.type,
          category,
          targetDurationMin: workout.targetDurationMin,
          targetDistanceKm: workout.targetDistanceKm,
          targetPaceSecPerKm: workout.targetPaceSecPerKm,
          targetRpe: workout.targetRpe,
        }),
      });
      setSavedLibrary((prev) => new Set([...prev, workout.id]));
    } finally {
      setSavingLibrary(null);
    }
  }

  async function handleDeleteWorkout(workout: WorkoutEntry) {
    if (!confirm(`Excluir "${workout.title}"?`)) return;
    setBusyCell(workout.id);
    try {
      const res = await fetch(`/api/coach/workouts/${workout.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Nao foi possivel excluir o treino.");
      fetchWeek(monthStart);
      setModal(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Nao foi possivel excluir o treino.");
    } finally {
      setBusyCell(null);
    }
  }

  async function handleMoveWorkout(workoutId: string, targetAthleteId: string, date: string) {
    setBusyCell(`${targetAthleteId}:${date}`);
    try {
      const res = await fetch(`/api/coach/workouts/${workoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteId: targetAthleteId, date }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Nao foi possivel mover o treino.");
      }
      fetchWeek(monthStart);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Nao foi possivel mover o treino.");
    } finally {
      setBusyCell(null);
      setDraggingWorkout(null);
    }
  }

  async function handlePasteWorkout(athlete: AthleteWeekly, date: string) {
    if (!workoutClipboard) return;
    const { workout } = workoutClipboard;
    setBusyCell(`${athlete.id}:${date}`);
    try {
      const res = await fetch("/api/coach/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: athlete.id,
          date,
          title: workout.title,
          type: workout.rawType ?? workout.type,
          sport: sportFromModality(workout.modality ?? libraryModality),
          targetDistanceKm: workout.targetDistanceKm,
          targetDurationMin: workout.targetDurationMin,
          targetPaceSecPerKm: workout.targetPaceSecPerKm,
          targetRpe: workout.targetRpe,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Nao foi possivel colar o treino.");
      }
      fetchWeek(monthStart);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Nao foi possivel colar o treino.");
    } finally {
      setBusyCell(null);
    }
  }

  async function handlePasteWeek(athlete: AthleteWeekly, targetWeekStart?: string) {
    if (!weekClipboard) return;
    setBusyCell(`week:${athlete.id}`);
    try {
      const res = await fetch("/api/coach/workouts/copy-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceAthleteId: weekClipboard.athlete.id,
            weekStart: weekClipboard.weekStart,
            targetWeekStart: targetWeekStart ?? toISODate(weekStart),
            targetAthleteIds: [athlete.id],
          }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Nao foi possivel colar a semana.");
      }
      fetchWeek(monthStart);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Nao foi possivel colar a semana.");
    } finally {
      setBusyCell(null);
    }
  }

  async function handleDeleteWeek(athlete: AthleteWeekly, targetWeekStart: string, workoutCount: number) {
    if (workoutCount === 0) return;
    if (!confirm(`Excluir todos os ${workoutCount} treino(s) desta semana de ${athlete.name}?`)) return;
    setBusyCell(`week:${athlete.id}:${targetWeekStart}`);
    try {
      const res = await fetch(`/api/coach/athletes/${athlete.id}/weeks?weekStart=${targetWeekStart}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Nao foi possivel excluir a semana.");
      }
      fetchWeek(monthStart);
      setWeekClipboard((prev) => prev?.athlete.id === athlete.id && prev.weekStart === targetWeekStart ? null : prev);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Nao foi possivel excluir a semana.");
    } finally {
      setBusyCell(null);
    }
  }

  async function handleDeletePeriodization(athlete: AthleteWeekly) {
    const ok = confirm(
      `Excluir a periodizacao de ${athlete.name}?\n\nIsso remove os planos e treinos gerados para este atleta. Use quando precisar refazer a periodizacao do zero.`
    );
    if (!ok) return;
    setBusyCell(`periodization:${athlete.id}`);
    try {
      const res = await fetch(`/api/coach/athletes/${athlete.id}/periodization`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Nao foi possivel excluir a periodizacao.");
      }
      fetchWeek(monthStart);
      setWeekClipboard((prev) => prev?.athlete.id === athlete.id ? null : prev);
      setWorkoutClipboard(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Nao foi possivel excluir a periodizacao.");
    } finally {
      setBusyCell(null);
    }
  }

  function mergeSavedWorkoutIntoCalendar(payload: QuickPrescribePayload | null, saved: SavedWorkoutResponse | null) {
    if (!payload || !saved?.id) return;

    const rawType = saved.rawType ?? rawWorkoutType(saved.type ?? payload.workout?.rawType ?? payload.workout?.type ?? "RODAGEM_LEVE");
    const modality = saved.modality ?? payload.workout?.modality ?? modalityFromWorkout({
      id: saved.id,
      date: saved.date ?? payload.date,
      type: rawType,
      title: saved.title ?? payload.workout?.title ?? "Treino",
      status: saved.status ?? "LIBERADO",
      targetDistanceKm: saved.targetDistanceKm ?? null,
      targetDurationMin: saved.targetDurationMin ?? null,
      targetPaceSecPerKm: saved.targetPaceSecPerKm ?? null,
      targetRpe: saved.targetRpe ?? null,
      tss: saved.tss ?? 0,
      released: saved.released ?? true,
    });
    const workout: WorkoutEntry = {
      id: saved.id,
      date: (saved.date ?? payload.date).slice(0, 10),
      type: saved.type ?? rawType,
      rawType,
      modality,
      title: saved.title ?? payload.workout?.title ?? "Treino",
      status: saved.status ?? "LIBERADO",
      targetDistanceKm: saved.targetDistanceKm ?? payload.workout?.targetDistanceKm ?? null,
      targetDurationMin: saved.targetDurationMin ?? payload.workout?.targetDurationMin ?? null,
      targetPaceSecPerKm: saved.targetPaceSecPerKm ?? payload.workout?.targetPaceSecPerKm ?? null,
      targetRpe: saved.targetRpe ?? payload.workout?.targetRpe ?? null,
      tss: saved.tss ?? saved.plannedTss ?? payload.workout?.tss ?? 0,
      plannedTss: saved.plannedTss ?? payload.workout?.plannedTss ?? 0,
      actualTss: saved.actualTss ?? null,
      released: saved.released ?? true,
    };

    setWeeklyData((prev) => {
      const baseAthletes = prev?.athletes ?? staticAthletes.map((athlete) => ({
        id: athlete.id,
        name: athlete.name,
        avatarUrl: athlete.avatarUrl ?? null,
        status: athlete.status,
        goal: athlete.goal,
        level: athlete.level,
        adherence: athlete.adherence,
        workouts: [],
      }));
      let foundAthlete = false;
      const athletesWithWorkout = baseAthletes.map((athlete) => {
        if (athlete.id !== payload.athleteId) return athlete;
        foundAthlete = true;
        return {
          ...athlete,
          workouts: [
            ...athlete.workouts.filter((item) => item.id !== workout.id),
            workout,
          ].sort((a, b) => a.date.localeCompare(b.date)),
        };
      });
      if (!foundAthlete) {
        athletesWithWorkout.push({
          id: payload.athleteId,
          name: payload.athleteName,
          avatarUrl: null,
          status: "ativo",
          goal: null,
          level: "",
          adherence: 0,
          workouts: [workout],
        });
      }

      return {
        weekStart: prev?.weekStart ?? toISODate(getMondayOf(monthStart)),
        weekEnd: prev?.weekEnd ?? toISODate(addDays(getMondayOf(monthStart), 41)),
        athletes: athletesWithWorkout,
      };
    });
    setSelectedAthleteId(payload.athleteId);
  }

  const fetchWeek = useCallback((month: Date) => {
    setLoading(true);
    const calendarDays = getCalendarMonthDays(month);
    const from = calendarDays[0].iso;
    const to = calendarDays[calendarDays.length - 1].iso;
    fetch(`/api/coach/athletes/week?from=${from}&to=${to}&t=${Date.now()}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => null) as { error?: string } | null;
          throw new Error(data?.error ?? "Nao foi possivel carregar o calendario.");
        }
        return r.json() as Promise<WeeklyData>;
      })
      .then((d) => {
        setCalendarError(null);
        setWeeklyData(d);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Nao foi possivel carregar o calendario.";
        console.error("[calendar] fetchWeek failed", error);
        setCalendarError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchWeek(monthStart); }, [monthStart, fetchWeek]);

  useEffect(() => {
    if (!selectedAthleteId && staticAthletes[0]) setSelectedAthleteId(staticAthletes[0].id);
  }, [selectedAthleteId, staticAthletes]);

  const prevWeek = () => setMonthStart((d) => {
    const next = new Date(d);
    next.setMonth(next.getMonth() - 1);
    return getMonthStart(next);
  });
  const nextWeek = () => setMonthStart((d) => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return getMonthStart(next);
  });

  // Days in the current week (Mon → Sun)
  const weekStart = getMondayOf(monthStart);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { date: toISODate(d), dayLabel: DAYS_PT[i], dayNum: d.getDate() };
  });
  const monthDays = getCalendarMonthDays(monthStart);
  const calendarGridDays = calendarView === "Semana"
    ? weekDays.map((day) => ({
        iso: day.date,
        dayNum: day.dayNum,
        inMonth: true,
        isToday: day.date === toISODate(new Date()),
      }))
    : monthDays;
  const calendarRows = Array.from(
    { length: Math.ceil(calendarGridDays.length / 7) },
    (_, rowIndex) => calendarGridDays.slice(rowIndex * 7, rowIndex * 7 + 7)
  );

  // Use weekly API data if loaded, fall back to static athletes for empty state
  const athletes: AthleteWeekly[] = weeklyData?.athletes ?? staticAthletes.map((a) => ({
    id: a.id, name: a.name, avatarUrl: a.avatarUrl ?? null,
    status: a.status, goal: a.goal, level: a.level,
    adherence: a.adherence, workouts: [],
  }));

  const normalizedQuery = query.trim().toLowerCase();
  const athleteMatchesQuery = (athlete: AthleteWeekly) =>
    !normalizedQuery ||
    athlete.name.toLowerCase().includes(normalizedQuery) ||
    (athlete.goal ?? "").toLowerCase().includes(normalizedQuery);
  const athletePickerOptions = athletes.filter(athleteMatchesQuery);

  const filtered = athletes.filter((a) => {
    const matchQuery = athleteMatchesQuery(a);
    if (!matchQuery) return false;
    if (tab === "Em risco") return a.status === "risco";
    if (tab === "Com treino") return a.workouts.length > 0;
    if (tab === "Sem plano") return a.workouts.length === 0;
    return true;
  });
  const selectedAthlete =
    athletePickerOptions.find((athlete) => athlete.id === selectedAthleteId) ??
    filtered[0] ??
    athletePickerOptions[0] ??
    athletes[0] ??
    null;
  const selectedWorkouts = selectedAthlete?.workouts ?? [];
  const visibleWorkouts = selectedWorkouts;
  const listWorkouts = [...visibleWorkouts].sort((a, b) => a.date.localeCompare(b.date));
  const visibleTss = visibleWorkouts.reduce((sum, workout) => sum + workout.tss, 0);
  const plannedTss = visibleWorkouts.reduce((sum, workout) => sum + (workout.plannedTss ?? workout.tss), 0);
  const actualTss = visibleWorkouts.reduce((sum, workout) => sum + (workout.actualTss ?? 0), 0);
  const visibleDistance = visibleWorkouts.reduce((sum, workout) => sum + (workout.targetDistanceKm ?? 0), 0);
  const completedWorkouts = visibleWorkouts.filter((workout) => workout.status === "CONCLUIDO").length;
  const plannedWorkouts = visibleWorkouts.filter((workout) => workout.status !== "CONCLUIDO").length;
  const modalityDistribution: { key: LibraryModality; label: string; color: string }[] = [
    { key: "corrida", label: "Corrida", color: "#f97316" },
    { key: "ciclismo", label: "Ciclismo", color: "#0f766e" },
    { key: "natacao", label: "Natacao", color: "#0ea5e9" },
    { key: "forca", label: "Forca", color: "#8b5cf6" },
  ];
  const distributionRows = modalityDistribution.map((item) => {
    const count = visibleWorkouts.filter((workout) => modalityFromWorkout(workout) === item.key).length;
    return {
      ...item,
      count,
      percent: visibleWorkouts.length > 0 ? Math.round((count / visibleWorkouts.length) * 100) : 0,
    };
  });
  const maxDistributionCount = Math.max(1, ...distributionRows.map((item) => item.count));
  const libraryTemplates = LIBRARY_TEMPLATES[libraryModality];

  const isThisWeek = toISODate(monthStart) === toISODate(getMonthStart(new Date()));

  // Empty state
  if (staticAthletes.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Header total={0} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-lg font-bold text-text">Nenhum atleta ainda</h2>
          <p className="mt-2 max-w-xs text-sm text-text-muted">
            Compartilhe seu link de convite para que atletas se cadastrem sob sua orientação.
          </p>
          <Link href="/treinador/atletas/convidar" className="mt-6">
            <Button variant="primary">Convidar atleta</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-none space-y-4">
      <Header total={staticAthletes.length} />

      {actionCenter && <ActionBanner data={actionCenter} />}
      {calendarError && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Nao foi possivel atualizar o calendario agora. O treino recem-criado foi mantido na tela; atualize novamente em instantes.
        </div>
      )}

      {/* Week navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setAthletePickerOpen((open) => !open)}
            className="flex min-h-10 min-w-[230px] items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-left text-sm font-semibold text-text outline-none transition-colors hover:border-primary/50"
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-[10px]">
                {(selectedAthlete?.name ?? "Atleta").split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </AvatarFallback>
              {selectedAthlete?.avatarUrl && <AvatarImage src={selectedAthlete.avatarUrl} alt="" />}
            </Avatar>
            <span className="min-w-0 flex-1 truncate">{selectedAthlete?.name ?? "Selecionar atleta"}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
          </button>
          {athletePickerOpen && (
            <div className="absolute left-0 top-full z-40 mt-2 max-h-72 w-72 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-2xl shadow-black/30">
              {athletePickerOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-text-muted">Nenhum atleta encontrado.</div>
              ) : athletePickerOptions.map((athlete) => {
                const statusCfg = STATUS_BADGE[athlete.status] ?? STATUS_BADGE.ativo;
                return (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => {
                      setSelectedAthleteId(athlete.id);
                      setAthletePickerOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                      athlete.id === selectedAthlete?.id ? "bg-primary/15 text-primary" : "text-text hover:bg-card-hover"
                    )}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs">
                        {athlete.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </AvatarFallback>
                      {athlete.avatarUrl && <AvatarImage src={athlete.avatarUrl} alt="" />}
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{athlete.name}</span>
                      <span className="flex items-center gap-1 text-[10px] text-text-muted">
                        <Badge variant={statusCfg.variant} className="px-1.5 py-0 text-[9px]">{statusCfg.label}</Badge>
                        {athlete.workouts.length} treinos
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {selectedAthlete && (
          <Link href={`/treinador/atletas/${selectedAthlete.id}`}>
            <Button variant="secondary" size="sm">
              <Activity className="h-4 w-4" />
              Metricas
            </Button>
          </Link>
        )}
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-1.5">
          <button
            onClick={prevWeek}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card-hover hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[190px] text-center text-sm font-semibold text-text">
            {formatMonthLabel(monthStart)}
          </span>
          <button
            onClick={nextWeek}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card-hover hover:text-text"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {!isThisWeek && (
            <button
              onClick={() => setMonthStart(getMonthStart(new Date()))}
              className="ml-1 rounded-lg px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
            >
              Hoje
            </button>
          )}
        </div>
        <div className="flex rounded-xl border border-border bg-card p-1">
          {(["Semana", "Mes", "Lista"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setCalendarView(view)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                calendarView === view ? "bg-primary text-white" : "text-text-muted hover:bg-card-hover hover:text-text"
              )}
            >
              {view}
            </button>
          ))}
        </div>
        </div>

        {/* Legend */}
        <div className="hidden items-center gap-2 xl:flex">
          {LEGEND_ITEMS.map((l) => (
            <span key={l.label} className="flex items-center gap-1 text-[10px] text-text-muted">
              <span className={cn("h-3 w-3 rounded-full", l.bg)} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {TABS.map((t) => {
            const count =
              t === "Todos" ? athletes.length
              : t === "Em risco" ? athletes.filter((a) => a.status === "risco").length
              : t === "Com treino" ? athletes.filter((a) => a.workouts.length > 0).length
              : athletes.filter((a) => a.workouts.length === 0).length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === t
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-card-hover hover:text-text"
                )}
              >
                {t}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  tab === t ? "bg-white/20 text-white" : "bg-card-hover text-text-muted"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 sm:ml-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar atleta…"
            className="w-full bg-transparent text-sm text-text placeholder:text-text-muted/60 outline-none"
          />
        </div>
      </div>

      {(workoutClipboard || weekClipboard) && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/8 px-3 py-2 text-xs text-text">
          {workoutClipboard && (
            <span className="flex items-center gap-1.5">
              <Clipboard className="h-3.5 w-3.5 text-primary" />
              Treino copiado: <strong>{workoutClipboard.workout.title}</strong>
            </span>
          )}
          {weekClipboard && (
            <span className="flex items-center gap-1.5">
              <CopyPlus className="h-3.5 w-3.5 text-primary" />
              Semana copiada: <strong>{weekClipboard.athlete.name}</strong> ({weekClipboard.workoutCount} treinos)
            </span>
          )}
          <button
            onClick={() => { setWorkoutClipboard(null); setWeekClipboard(null); }}
            className="ml-auto rounded-md px-2 py-1 font-semibold text-text-muted hover:bg-card-hover hover:text-text"
          >
            Limpar
          </button>
        </div>
      )}

      <div className="grid gap-3 xl:grid-cols-[260px_minmax(0,1fr)_240px]">
        <aside className="overflow-hidden rounded-xl border border-white/10 bg-[#07111c]/85 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="hidden border-b border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-xs font-semibold text-text">Atletas</p>
            <p className="text-[11px] text-text-muted">Selecione um atleta para abrir o mes</p>
          </div>
          <div className="hidden max-h-[460px] space-y-1 overflow-y-auto p-2">
            {filtered.map((athlete) => {
              const selected = athlete.id === selectedAthlete?.id;
              const statusCfg = STATUS_BADGE[athlete.status] ?? STATUS_BADGE.ativo;
              return (
                <button
                  key={athlete.id}
                  onClick={() => setSelectedAthleteId(athlete.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left transition-all",
                    selected ? "border-primary/60 bg-primary/15 shadow-lg shadow-primary/10" : "border-transparent hover:bg-white/5"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {athlete.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                    {athlete.avatarUrl && <AvatarImage src={athlete.avatarUrl} alt="" />}
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text">{athlete.name}</span>
                    <span className="flex items-center gap-1 text-[10px] text-text-muted">
                      <Badge variant={statusCfg.variant} className="px-1.5 py-0 text-[9px]">{statusCfg.label}</Badge>
                      {athlete.workouts.length} treinos
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="px-3 py-2">
            <p className="mb-2 text-xs font-semibold text-text">Biblioteca</p>
            <div className="mb-2 grid grid-cols-2 gap-1">
              {LIBRARY_MODALITIES.map((modality) => {
                const Icon = modality.icon;
                const selected = libraryModality === modality.value;
                return (
                  <button
                    key={modality.value}
                    type="button"
                    onClick={() => setLibraryModality(modality.value)}
                    className={cn(
                      "flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-colors",
                      selected
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-white/10 bg-white/[0.03] text-text-muted hover:border-primary/40 hover:text-text"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {modality.label}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1">
              {libraryTemplates.map((template) => {
                const cfg = woCfg(template.value);
                return (
                  <button
                    key={`${template.value}-${template.label}`}
                    type="button"
                    onClick={() => setWorkoutClipboard({
                      workout: {
                        id: `template-${template.value}`,
                        date: toISODate(monthStart),
                        type: template.value,
                        rawType: template.value,
                        modality: libraryModality,
                        title: template.label,
                        status: "PLANEJADO",
                        targetDistanceKm: null,
                        targetDurationMin: null,
                        targetPaceSecPerKm: null,
                        targetRpe: null,
                        tss: 0,
                        released: false,
                      },
                    })}
                    className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/10"
                  >
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold", cfg.bg, cfg.text)}>{cfg.short}</span>
                    <span className="truncate font-semibold text-text">{template.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <Card className="overflow-hidden border-white/10 bg-[#07111c]/78 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-white/[0.06] via-primary/10 to-transparent px-4 py-3">
            <div>
              <p className="text-sm font-semibold capitalize text-text">{formatMonthLabel(monthStart)}</p>
              <p className="text-xs text-text-muted">{selectedAthlete?.name ?? "Selecione um atleta"} · Visualizacao {calendarView}</p>
            </div>
            {selectedAthlete && (
              <div className="flex flex-wrap justify-end gap-2">
                <Link href={`/treinador/atletas/${selectedAthlete.id}`}>
                  <Button variant="secondary" size="sm">
                    <Activity className="h-4 w-4" />
                    Metricas
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyCell === `periodization:${selectedAthlete.id}`}
                  onClick={() => handleDeletePeriodization(selectedAthlete)}
                  title="Excluir periodizacao e treinos gerados deste atleta"
                >
                  {busyCell === `periodization:${selectedAthlete.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Periodizacao
                </Button>
                <Button
                  size="sm"
                  onClick={() => setQuickPrescribe({
                    athleteId: selectedAthlete.id,
                    athleteName: selectedAthlete.name,
                    date: toISODate(new Date()),
                  })}
                >
                  <Plus className="h-4 w-4" />
                  Novo treino
                </Button>
              </div>
            )}
          </div>
          <div className={cn("grid grid-cols-[repeat(7,minmax(0,1fr))_48px] border-b border-white/10 bg-white/[0.03]", calendarView === "Lista" && "hidden")}>
            {DAYS_PT.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase text-text-muted">
                {day}
              </div>
            ))}
            <div className="px-1 py-2 text-center text-[10px] font-semibold uppercase text-text-muted">
              Acoes
            </div>
          </div>
          <div className={cn(calendarView === "Lista" && "hidden")}>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : !selectedAthlete ? (
              <div className="py-16 text-center text-sm text-text-muted">Selecione um atleta.</div>
            ) : (
              calendarRows.map((row, rowIndex) => {
                const rowWeekStart = row[0]?.iso ?? toISODate(weekStart);
                const rowWorkoutCount = selectedWorkouts.filter((workout) => row.some((day) => day.iso === workout.date)).length;
                const canPasteWeek = Boolean(weekClipboard);
                const rowBusy = busyCell === `week:${selectedAthlete.id}`;
                const rowDeleteBusy = busyCell === `week:${selectedAthlete.id}:${rowWeekStart}`;
                return (
                  <div
                    key={`${rowWeekStart}-${rowIndex}`}
                    className="grid grid-cols-[repeat(7,minmax(0,1fr))_48px]"
                  >
                    {row.map((day) => {
                      const dayWorkouts = selectedWorkouts.filter((workout) => workout.date === day.iso);
                      const isBusy = busyCell === `${selectedAthlete.id}:${day.iso}`;
                      return (
                        <div
                          key={day.iso}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (draggingWorkout) handleMoveWorkout(draggingWorkout.workoutId, selectedAthlete.id, day.iso);
                          }}
                          className={cn(
                            "min-h-[132px] border-b border-r border-white/10 bg-white/[0.025] p-1.5 transition-colors",
                            !day.inMonth && "bg-black/15 opacity-50",
                            day.isToday && "bg-primary/10 ring-1 ring-inset ring-primary/35",
                            draggingWorkout && "bg-primary/10"
                          )}
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className={cn("text-xs font-bold", day.isToday ? "text-primary" : "text-text-muted")}>{day.dayNum}</span>
                            <button
                              onClick={() => setQuickPrescribe({ athleteId: selectedAthlete.id, athleteName: selectedAthlete.name, date: day.iso })}
                              className="rounded p-0.5 text-text-muted transition-colors hover:bg-card-hover hover:text-primary"
                              title="Prescrever"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="space-y-1">
                            {isBusy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            {dayWorkouts.map((workout) => {
                        return (
                          <div
                            key={workout.id}
                            draggable
                            onDragStart={() => setDraggingWorkout({ workoutId: workout.id })}
                            onDragEnd={() => setDraggingWorkout(null)}
                            onClick={() => setQuickPrescribe({
                              athleteId: selectedAthlete.id,
                              athleteName: selectedAthlete.name,
                              date: day.iso,
                              workout,
                            })}
                            className={cn("group flex w-full cursor-pointer items-center gap-1 rounded-lg border px-1.5 py-1.5 text-left text-[10px] font-semibold shadow-lg backdrop-blur-sm transition-transform hover:-translate-y-0.5", workoutCardClass(workout.type, workout.title))}
                          >
                            <WorkoutIcon type={`${workout.type} ${workout.title}`} className="h-3 w-3 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{workout.title}</span>
                            {workout.targetDurationMin && <span className="shrink-0 opacity-80">{workout.targetDurationMin}m</span>}
                            {workout.actualTss != null && <span className="shrink-0 rounded bg-white/15 px-1 text-[9px] uppercase">real</span>}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setWorkoutClipboard({ workout });
                              }}
                              className="rounded p-0.5 opacity-0 transition-opacity hover:bg-white/15 group-hover:opacity-100"
                              title="Copiar treino"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteWorkout(workout);
                              }}
                              className="rounded p-0.5 opacity-0 transition-opacity hover:bg-white/15 group-hover:opacity-100"
                              title="Excluir treino"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                            })}
                            {workoutClipboard && (
                              <button
                                onClick={() => handlePasteWorkout(selectedAthlete, day.iso)}
                                disabled={isBusy}
                                className={cn(
                                  "flex w-full items-center justify-center gap-1 rounded border border-dashed border-success/40 px-2 text-[11px] font-semibold text-success hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-50",
                                  dayWorkouts.length === 0 ? "py-4" : "py-1.5"
                                )}
                                title={`Colar ${workoutClipboard.workout.title} em ${day.iso}`}
                              >
                                <ClipboardPaste className="h-3 w-3" />
                                Colar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex min-h-[132px] flex-col items-center justify-center gap-2 border-b border-white/10 bg-white/[0.035] px-1">
                      <button
                        type="button"
                        disabled={rowWorkoutCount === 0}
                        onClick={() => setWeekClipboard({
                          athlete: selectedAthlete,
                          weekStart: rowWeekStart,
                          workoutCount: rowWorkoutCount,
                        })}
                        title={rowWorkoutCount > 0 ? `Copiar semana (${rowWorkoutCount} treino${rowWorkoutCount !== 1 ? "s" : ""})` : "Semana sem treinos"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-text-muted transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={!canPasteWeek || rowBusy}
                        onClick={() => handlePasteWeek(selectedAthlete, rowWeekStart)}
                        title={weekClipboard ? `Colar semana de ${weekClipboard.athlete.name}` : "Copie uma semana primeiro"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-text-muted transition-colors hover:border-success/50 hover:bg-success/10 hover:text-success disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {rowBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ClipboardPaste className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={rowWorkoutCount === 0 || rowDeleteBusy}
                        onClick={() => handleDeleteWeek(selectedAthlete, rowWeekStart, rowWorkoutCount)}
                        title={rowWorkoutCount > 0 ? `Excluir semana (${rowWorkoutCount} treino${rowWorkoutCount !== 1 ? "s" : ""})` : "Semana sem treinos"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-text-muted transition-colors hover:border-danger/50 hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {rowDeleteBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {calendarView === "Lista" && (
            <div className="divide-y divide-white/10">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : !selectedAthlete ? (
                <div className="py-16 text-center text-sm text-text-muted">Selecione um atleta.</div>
              ) : listWorkouts.length === 0 ? (
                <div className="py-16 text-center text-sm text-text-muted">Nenhum treino neste periodo.</div>
              ) : (
                listWorkouts.map((workout) => (
                  <div key={workout.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setQuickPrescribe({
                        athleteId: selectedAthlete.id,
                        athleteName: selectedAthlete.name,
                        date: workout.date,
                        workout,
                      })}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", workoutCardClass(workout.type, workout.title))}>
                        <WorkoutIcon type={`${workout.type} ${workout.title}`} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-text">{workout.title}</span>
                        <span className="block text-xs text-text-muted">
                          {new Date(`${workout.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                          {workout.targetDurationMin ? ` · ${workout.targetDurationMin} min` : ""}
                          {workout.targetDistanceKm ? ` · ${workout.targetDistanceKm} km` : ""}
                        </span>
                        <span className="mt-1 block text-[11px] text-text-muted">
                          Previsto {Math.round(workout.plannedTss ?? workout.tss)} TSS
                          {workout.actualTss != null ? ` · Realizado ${Math.round(workout.actualTss)} TSS (${workout.actualSource ?? "real"})` : ""}
                        </span>
                      </span>
                    </button>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setWorkoutClipboard({ workout })}>
                        <Copy className="h-4 w-4" />
                        Copiar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteWorkout(workout)}>
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        <aside className="overflow-hidden rounded-xl border border-white/10 bg-[#07111c]/85 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-xs font-semibold text-text">Resumo</p>
            <p className="text-[11px] text-text-muted">{selectedAthlete?.name ?? "Atleta"}</p>
          </div>
          <div className="space-y-3 p-3">
            <SummaryMetric label="Treinos" value={String(visibleWorkouts.length)} />
            <SummaryMetric label="Planejados" value={String(plannedWorkouts)} />
            <SummaryMetric label="Concluidos" value={String(completedWorkouts)} />
            <SummaryMetric label="TSS previsto" value={String(Math.round(plannedTss || visibleTss))} />
            <SummaryMetric label="TSS realizado" value={actualTss > 0 ? String(Math.round(actualTss)) : "-"} />
            <SummaryMetric label="Distancia" value={`${visibleDistance.toFixed(1)} km`} />
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Distribuicao</p>
              <div className="space-y-2">
                {distributionRows.map((item) => (
                  <div key={item.key} className="space-y-1 text-[11px] text-text-muted">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span className="font-semibold text-text">{item.count} · {item.percent}%</span>
                    </div>
                    <span className="block h-1.5 rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full transition-all"
                        style={{
                          backgroundColor: item.color,
                          width: item.count > 0 ? `${Math.max(8, (item.count / maxDistributionCount) * 100)}%` : "0%",
                        }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="hidden" aria-label={formatWeekRange(getMondayOf(monthStart))}>
        <aside className="hidden rounded-md border border-border bg-card xl:block">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-text">Biblioteca de Treinos</p>
            <p className="text-[11px] text-text-muted">Arraste modelos para a semana</p>
          </div>
          <div className="space-y-1 p-2">
            {libraryTemplates.map((template) => {
              const cfg = woCfg(template.value);
              return (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => {
                    setWorkoutClipboard({
                      workout: {
                        id: `template-${template.value}`,
                        date: toISODate(monthStart),
                        type: template.value,
                        rawType: template.value,
                        modality: libraryModality,
                        title: template.label,
                        status: "PLANEJADO",
                        targetDistanceKm: null,
                        targetDurationMin: null,
                        targetPaceSecPerKm: null,
                        targetRpe: null,
                        tss: 0,
                        released: false,
                      },
                    });
                  }}
                  className="flex w-full items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-2 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className={cn("flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold", cfg.bg, cfg.text)}>
                    {cfg.short}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text">{template.label}</span>
                    <span className="text-[10px] text-text-muted">copiar para colar</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Calendar grid */}
        <Card className="overflow-x-auto">
        {/* Column headers */}
        <div className="grid min-w-[1280px] border-b border-border bg-card-hover/40 px-4 py-2"
          style={{ gridTemplateColumns: "minmax(220px, 1.35fr) repeat(7, minmax(132px, 1fr)) 64px 72px" }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Atleta</div>
          {weekDays.map((d) => {
            const isToday = d.date === toISODate(new Date());
            return (
              <div key={d.date} className="text-center">
                <p className={cn("text-[9px] font-semibold uppercase", isToday ? "text-primary" : "text-text-muted")}>{d.dayLabel}</p>
                <p className={cn("text-[11px] font-bold leading-none", isToday ? "text-primary" : "text-text-muted")}>{d.dayNum}</p>
              </div>
            );
          })}
          <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-text-muted">TSS</div>
          <div className="text-center text-[11px] font-semibold uppercase tracking-wider text-text-muted">Adesão</div>
        </div>

        {/* Athlete rows */}
        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-muted">
              Nenhum atleta encontrado para esses filtros.
            </div>
          ) : (
            filtered.map((athlete) => {
              const weekTss = athlete.workouts.reduce((s, w) => s + w.tss, 0);
              const statusCfg = STATUS_BADGE[athlete.status] ?? STATUS_BADGE.ativo;
              const workoutsByDay = new Map<string, WorkoutEntry[]>();
              for (const wo of athlete.workouts) {
                if (!workoutsByDay.has(wo.date)) workoutsByDay.set(wo.date, []);
                workoutsByDay.get(wo.date)!.push(wo);
              }

              return (
                <div
                  key={athlete.id}
                  className="grid min-w-[1280px] items-stretch gap-x-2 px-4 py-2.5 transition-colors hover:bg-card-hover/30"
                  style={{ gridTemplateColumns: "minmax(220px, 1.35fr) repeat(7, minmax(132px, 1fr)) 64px 72px" }}
                >
                  {/* Athlete info */}
                  <div className="group/row flex min-w-0 items-center gap-1.5">
                    <Link href={`/treinador/atletas/${athlete.id}`} className="flex min-w-0 flex-1 items-center gap-2">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {athlete.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </AvatarFallback>
                        {athlete.avatarUrl && <img src={athlete.avatarUrl} alt="" />}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text">{athlete.name}</p>
                        <div className="flex items-center gap-1">
                          <Badge variant={statusCfg.variant} className="px-1.5 py-0 text-[9px]">
                            {statusCfg.label}
                          </Badge>
                          {athlete.status === "risco" && (
                            <CircleAlert className="h-3 w-3 text-danger" />
                          )}
                        </div>
                      </div>
                    </Link>
                    {athlete.workouts.length > 0 && (
                      <div className="flex shrink-0 gap-1 opacity-0 transition-all group-hover/row:opacity-100">
                        <button
                          onClick={() => setWeekClipboard({
                            athlete,
                            weekStart: toISODate(getMondayOf(monthStart)),
                            workoutCount: athlete.workouts.length,
                          })}
                          title="Copiar semana"
                          className="rounded-lg p-1 text-text-muted hover:bg-card-hover hover:text-primary"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setCopyWeek({
                            athlete,
                            weekStart: toISODate(getMondayOf(monthStart)),
                            workoutCount: athlete.workouts.length,
                          })}
                          title="Copiar semana para varios atletas"
                          className="rounded-lg p-1 text-text-muted hover:bg-card-hover hover:text-primary"
                        >
                          <CopyPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {weekClipboard && weekClipboard.athlete.id !== athlete.id && (
                      <button
                        onClick={() => handlePasteWeek(athlete)}
                        disabled={busyCell === `week:${athlete.id}`}
                        title={`Colar semana de ${weekClipboard.athlete.name}`}
                        className="shrink-0 rounded-lg p-1 text-text-muted transition-colors hover:bg-card-hover hover:text-success disabled:opacity-50"
                      >
                        {busyCell === `week:${athlete.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardPaste className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* 7-day calendar cells */}
                  {weekDays.map((d) => {
                    const dayWorkouts = workoutsByDay.get(d.date) ?? [];
                    const isToday = d.date === toISODate(new Date());
                    const isBusy = busyCell === `${athlete.id}:${d.date}`;
                    return (
                      <div
                        key={d.date}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggingWorkout) {
                            handleMoveWorkout(draggingWorkout.workoutId, athlete.id, d.date);
                          }
                        }}
                        className={cn(
                          "flex min-h-[74px] flex-col gap-1 rounded-lg border border-transparent p-1 transition-colors",
                          isToday && "border-primary/20 bg-primary/5",
                          draggingWorkout && "border-dashed border-primary/40 bg-primary/8",
                        )}
                      >
                        {dayWorkouts.length === 0 ? (
                          <div className="flex h-full min-h-[58px] flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border/80 bg-background/25">
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : workoutClipboard ? (
                              <button
                                onClick={() => handlePasteWorkout(athlete, d.date)}
                                title={`Colar ${workoutClipboard.workout.title}`}
                                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-success hover:bg-success/10"
                              >
                                <ClipboardPaste className="h-3 w-3" />
                                Colar
                              </button>
                            ) : (
                              <button
                                onClick={() => setQuickPrescribe({
                                  athleteId: athlete.id,
                                  athleteName: athlete.name,
                                  date: d.date,
                                })}
                                title={`Prescrever treino para ${athlete.name.split(" ")[0]}`}
                                className="group/cell flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                              >
                                <Circle className="h-3 w-3 text-border transition-colors group-hover/cell:hidden" />
                                <Plus className="hidden h-3 w-3 group-hover/cell:block" />
                                Prescrever
                              </button>
                            )}
                          </div>
                        ) : (
                          dayWorkouts.slice(0, 2).map((wo) => (
                            <WorkoutDot
                              key={wo.id}
                              workout={wo}
                              onClick={() => setModal({ athlete, dayDate: d.date, workouts: dayWorkouts })}
                              onCopy={() => setWorkoutClipboard({ workout: wo })}
                              onDelete={() => handleDeleteWorkout(wo)}
                              onDragStart={() => setDraggingWorkout({ workoutId: wo.id })}
                              onDragEnd={() => setDraggingWorkout(null)}
                            />
                          ))
                        )}
                        {dayWorkouts.length > 2 && (
                          <span className="text-[9px] text-text-muted">+{dayWorkouts.length - 2}</span>
                        )}
                      </div>
                    );
                  })}

                  {/* Weekly TSS */}
                  <div className="text-center">
                    {weekTss > 0 ? (
                      <span className="text-xs font-bold text-primary">{Math.round(weekTss)}</span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </div>

                  {/* Adherence */}
                  <div className="text-center">
                    <span className={cn(
                      "text-xs font-semibold",
                      athlete.adherence >= 0.8 ? "text-success" : athlete.adherence >= 0.5 ? "text-warning" : "text-danger"
                    )}>
                      {Math.round(athlete.adherence * 100)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </Card>

        <aside className="hidden rounded-md border border-border bg-card xl:block">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-text">Resumo</p>
            <p className="text-[11px] text-text-muted">{filtered.length} atletas visiveis</p>
          </div>
          <div className="space-y-3 p-3">
            <SummaryMetric label="Treinos" value={String(visibleWorkouts.length)} />
            <SummaryMetric label="Planejados" value={String(plannedWorkouts)} />
            <SummaryMetric label="Concluidos" value={String(completedWorkouts)} />
            <SummaryMetric label="TSS" value={String(Math.round(visibleTss))} />
            <SummaryMetric label="Distancia" value={`${visibleDistance.toFixed(1)} km`} />
            <div className="rounded-md border border-border bg-background/40 p-2">
              <p className="mb-2 text-[11px] font-semibold text-text-muted">Distribuicao semanal</p>
              <div className="space-y-1">
                {weekDays.map((day) => {
                  const count = visibleWorkouts.filter((workout) => workout.date === day.date).length;
                  return (
                    <div key={day.date} className="flex items-center gap-2 text-[11px]">
                      <span className="w-8 text-text-muted">{day.dayLabel}</span>
                      <span className="h-1.5 flex-1 rounded bg-border">
                        <span className="block h-full rounded bg-primary" style={{ width: `${Math.min(100, count * 24)}%` }} />
                      </span>
                      <span className="w-4 text-right font-semibold text-text">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Workout detail modal */}
      {modal && (
        <WorkoutModal
          payload={modal}
          onClose={() => setModal(null)}
          onCopy={(workout, athlete) => { setModal(null); setCopyWorkout({ workout, athlete }); }}
          onCopyToClipboard={(workout) => setWorkoutClipboard({ workout })}
          onDelete={handleDeleteWorkout}
          onSaveToLib={handleSaveToLib}
        />
      )}

      {/* Quick prescribe from calendar cell */}
      {quickPrescribe && (
        <IntervalsPrescribeModal
          payload={quickPrescribe}
          onClose={() => setQuickPrescribe(null)}
          onSaved={(savedWorkout) => {
            if (savedWorkout?.id) {
              mergeSavedWorkoutIntoCalendar(quickPrescribe, savedWorkout);
              return;
            }
            fetchWeek(monthStart);
          }}
        />
      )}

      {/* Copy single workout to other athletes */}
      {copyWorkout && (
        <CopyWorkoutModal
          payload={copyWorkout}
          allAthletes={staticAthletes}
          onClose={() => setCopyWorkout(null)}
          onCopied={() => fetchWeek(monthStart)}
        />
      )}

      {/* Copy full week to other athletes */}
      {copyWeek && (
        <CopyWeekModal
          payload={copyWeek}
          allAthletes={staticAthletes}
          onClose={() => setCopyWeek(null)}
          onCopied={() => fetchWeek(monthStart)}
        />
      )}
    </div>
  );
}

function Header({ total }: { total: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <Badge variant="primary" className="mb-2">Atletas & metricas</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Atletas e calendario</h1>
        <p className="mt-1 text-sm text-text-muted">
          Selecione um atleta para prescrever, revisar calendario e abrir metricas de performance. {total} {total === 1 ? "atleta" : "atletas"} nesta semana.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/treinador/atletas/convidar">
          <Button variant="secondary">Convidar atleta</Button>
        </Link>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className="text-sm font-bold text-text">{value}</span>
    </div>
  );
}
