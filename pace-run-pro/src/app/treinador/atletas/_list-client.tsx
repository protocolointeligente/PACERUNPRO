"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Search, Users, X,
  Clock, Ruler, Zap, CheckCircle2, CircleAlert, Circle,
  Flame, ShieldAlert, CalendarCheck,
  BookmarkPlus, Copy, CopyPlus, Plus, Loader2, Check,
  Clipboard, ClipboardPaste, Trash2, GripVertical,
  Bike, Waves, Dumbbell, Footprints,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
};

const WO_DEFAULT = { label: "Treino", short: "?", bg: "bg-gray-400", text: "text-white" };

function woCfg(type: string) {
  return WO_CONFIG[type] ?? WO_DEFAULT;
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
  return <Footprints className={className} />;
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
  title: string;
  status: string;
  targetDistanceKm: number | null;
  targetDurationMin: number | null;
  targetPaceSecPerKm: number | null;
  targetRpe: number | null;
  tss: number;
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
  return d.toISOString().slice(0, 10);
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
        "group/workout min-h-[42px] cursor-grab rounded-md border border-white/10 px-2 py-1.5 text-left shadow-sm transition active:cursor-grabbing",
        cfg.bg, cfg.text,
        isCompleted && "ring-2 ring-success ring-offset-1",
        isMissed && "opacity-45",
      )}
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

// eslint-disable-next-line no-unused-vars
function QuickPrescribeModal({
  payload,
  onClose,
  onSaved,
}: {
  payload: QuickPrescribePayload;
  onClose: () => void;
  onSaved: () => void;
}) {
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

function IntervalsPrescribeModal({
  payload,
  onClose,
  onSaved,
}: {
  payload: QuickPrescribePayload;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editingWorkout = payload.workout;
  const [category, setCategory] = useState("Treino");
  const [sport, setSport] = useState(
    editingWorkout?.type === "FORCA" ? "Forca" : "Corrida"
  );
  const [type, setType] = useState(editingWorkout?.type ?? "RODAGEM_LEVE");
  const [title, setTitle] = useState(editingWorkout?.title ?? "Rodagem leve");
  const [durationMin, setDurationMin] = useState(editingWorkout?.targetDurationMin ? String(editingWorkout.targetDurationMin) : "");
  const [distanceKm, setDistanceKm] = useState(editingWorkout?.targetDistanceKm ? String(editingWorkout.targetDistanceKm) : "");
  const [load, setLoad] = useState("");
  const [rpe, setRpe] = useState(editingWorkout?.targetRpe ? String(editingWorkout.targetRpe) : "");
  const [ftp, setFtp] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [pace, setPace] = useState("");
  const [poolDistance, setPoolDistance] = useState("25");
  const [strengthExercise, setStrengthExercise] = useState("Agachamento");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [loadKg, setLoadKg] = useState("");
  const [rir, setRir] = useState("");
  const [restSec, setRestSec] = useState("90");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState(
    editingWorkout?.type === "FORCA"
      ? "Agachamento 3x10 carga moderada RPE 7 descanso 90s\nRemada 3x12 RIR 2 descanso 75s"
      : "Aquecimento 10min Z1\nPrincipal 30min Z2\nVolta a calma 5min"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass = "w-full rounded-md border border-border bg-[#0b1511] px-2.5 py-2 text-sm text-text outline-none focus:border-info";
  const optionClass = "bg-[#0b1511] text-text";
  const dateLabel = new Date(payload.date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  function handleTypeChange(value: string) {
    setType(value);
    const selected = QUICK_TYPES.find((item) => item.value === value);
    if (selected) setTitle(selected.label);
  }

  function handleSportChange(value: string) {
    setSport(value);
    if (value === "Forca") {
      setType("FORCA");
      setTitle("Treino de forca");
    } else if (value === "Ciclismo") {
      setType("RODAGEM_LEVE");
      setTitle("Bike endurance");
    } else if (value === "Natacao") {
      setType("TECNICA");
      setTitle("Natacao tecnica");
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Informe o nome do treino.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const structuredSteps = sport === "Forca"
        ? `${strengthExercise} ${sets}x${reps}${loadKg ? ` ${loadKg}kg` : ""}${rpe ? ` RPE ${rpe}` : ""}${rir ? ` RIR ${rir}` : ""} descanso ${restSec}s\n${steps}`
        : steps;
      const res = await fetch(editingWorkout ? `/api/coach/workouts/${editingWorkout.id}` : "/api/coach/workouts", {
        method: editingWorkout ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: payload.athleteId,
          date: payload.date,
          title: title.trim(),
          type,
          objective: [
            description,
            sport === "Corrida" && (pace || heartRate || load) ? `Pace ${pace || "-"} / FC ${heartRate || "-"}${load ? ` / carga ${load}` : ""}` : "",
            sport === "Ciclismo" && (ftp || heartRate) ? `FTP ${ftp || "-"} / FC ${heartRate || "-"}` : "",
            sport === "Natacao" ? `Piscina ${poolDistance}m${pace ? ` / ritmo ${pace}` : ""}` : "",
            sport === "Forca" ? `${strengthExercise}: ${sets}x${reps}${loadKg ? ` x ${loadKg}kg` : ""}${rpe ? ` RPE ${rpe}` : ""}${rir ? ` RIR ${rir}` : ""} / descanso ${restSec}s` : "",
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
      onSaved();
      onClose();
    } catch {
      setError("Erro de conexao.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-info px-4 py-2.5 text-white">
          <p className="text-sm font-semibold">{editingWorkout ? "Editar Entrada no Calendario" : "Adicionar Entrada no Calendario"}</p>
          <button onClick={onClose} className="rounded p-1 text-white/80 hover:bg-white/15 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
                {QUICK_TYPES.map((item) => <option key={item.value} value={item.value} className={optionClass}>{item.label}</option>)}
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
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-md border border-border bg-[#07100d] p-3 sm:grid-cols-3">
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
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-md border border-border bg-[#07100d] p-3 sm:grid-cols-3">
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
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-md border border-border bg-[#07100d] p-3 sm:grid-cols-3">
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
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-md border border-border bg-[#07100d] p-3 lg:grid-cols-7">
              <label className="col-span-2 block space-y-1 lg:col-span-2">
                <span className="text-[11px] font-medium text-text-muted">Exercicio da biblioteca</span>
                <select value={strengthExercise} onChange={(event) => setStrengthExercise(event.target.value)} className={inputClass}>
                  {["Agachamento", "Levantamento terra", "Supino", "Remada", "Avanco", "Prancha", "Panturrilha"].map((item) => (
                    <option key={item} value={item} className={optionClass}>{item}</option>
                  ))}
                </select>
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
            </div>
          )}

          <label className="mt-4 block space-y-1">
            <span className="text-[11px] font-medium text-text-muted">Descricao</span>
            <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full resize-none border-0 border-b border-border bg-transparent px-0 py-2 text-sm text-text outline-none focus:border-info" />
          </label>

          <div className="mt-4 rounded-md border border-border bg-background/35">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-xs font-semibold text-text">Etapas estruturadas</p>
              <button
                type="button"
                onClick={() => setSteps((prev) => `${prev}${prev ? "\n" : ""}Novo bloco 5min Z2`)}
                className="text-xs font-semibold text-info hover:text-primary"
              >
                ADICIONAR ETAPA
              </button>
            </div>
            <textarea
              rows={5}
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              className="w-full resize-none bg-transparent px-3 py-2 font-mono text-xs text-text outline-none"
            />
            <div className="grid h-20 grid-cols-12 items-end gap-1 border-t border-border px-3 py-2">
              {Array.from({ length: 12 }, (_, index) => (
                <span
                  key={index}
                  className="rounded-t bg-info/50"
                  style={{ height: `${18 + ((index % 5) + Number(rpe || 3)) * 5}px` }}
                />
              ))}
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
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
          type: workout.type,
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

  async function handlePasteWeek(athlete: AthleteWeekly) {
    if (!weekClipboard || weekClipboard.athlete.id === athlete.id) return;
    setBusyCell(`week:${athlete.id}`);
    try {
      const res = await fetch("/api/coach/workouts/copy-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceAthleteId: weekClipboard.athlete.id,
          weekStart: weekClipboard.weekStart,
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

  const fetchWeek = useCallback((month: Date) => {
    setLoading(true);
    const calendarDays = getCalendarMonthDays(month);
    const from = calendarDays[0].iso;
    const to = calendarDays[calendarDays.length - 1].iso;
    fetch(`/api/coach/athletes/week?from=${from}&to=${to}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d: WeeklyData | null) => setWeeklyData(d))
      .catch(() => null)
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
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(getMondayOf(new Date()), i);
    return { date: toISODate(d), dayLabel: DAYS_PT[i], dayNum: d.getDate() };
  });
  const monthDays = getCalendarMonthDays(monthStart);

  // Use weekly API data if loaded, fall back to static athletes for empty state
  const athletes: AthleteWeekly[] = weeklyData?.athletes ?? staticAthletes.map((a) => ({
    id: a.id, name: a.name, avatarUrl: a.avatarUrl ?? null,
    status: a.status, goal: a.goal, level: a.level,
    adherence: a.adherence, workouts: [],
  }));

  const filtered = athletes.filter((a) => {
    const matchQuery = a.name.toLowerCase().includes(query.toLowerCase());
    if (!matchQuery) return false;
    if (tab === "Em risco") return a.status === "risco";
    if (tab === "Com treino") return a.workouts.length > 0;
    if (tab === "Sem plano") return a.workouts.length === 0;
    return true;
  });
  const selectedAthlete = athletes.find((athlete) => athlete.id === selectedAthleteId) ?? filtered[0] ?? athletes[0] ?? null;
  const selectedWorkouts = selectedAthlete?.workouts ?? [];
  const visibleWorkouts = selectedWorkouts;
  const visibleTss = visibleWorkouts.reduce((sum, workout) => sum + workout.tss, 0);
  const visibleDistance = visibleWorkouts.reduce((sum, workout) => sum + (workout.targetDistanceKm ?? 0), 0);
  const completedWorkouts = visibleWorkouts.filter((workout) => workout.status === "CONCLUIDO").length;
  const plannedWorkouts = visibleWorkouts.filter((workout) => workout.status !== "CONCLUIDO").length;
  const libraryTemplates = QUICK_TYPES.slice(0, 8);

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

      {/* Week navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            disabled={isThisWeek}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-card-hover hover:text-text disabled:opacity-30"
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

      <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)_220px]">
        <aside className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-text">Atletas</p>
            <p className="text-[11px] text-text-muted">Selecione um atleta para abrir o mes</p>
          </div>
          <div className="max-h-[460px] space-y-1 overflow-y-auto p-2">
            {filtered.map((athlete) => {
              const selected = athlete.id === selectedAthlete?.id;
              const statusCfg = STATUS_BADGE[athlete.status] ?? STATUS_BADGE.ativo;
              return (
                <button
                  key={athlete.id}
                  onClick={() => setSelectedAthleteId(athlete.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md border px-2 py-2 text-left transition-colors",
                    selected ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-card-hover"
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
          <div className="border-t border-border px-3 py-2">
            <p className="mb-2 text-xs font-semibold text-text">Biblioteca</p>
            <div className="space-y-1">
              {libraryTemplates.map((template) => {
                const cfg = woCfg(template.value);
                return (
                  <button
                    key={template.value}
                    type="button"
                    onClick={() => setWorkoutClipboard({
                      workout: {
                        id: `template-${template.value}`,
                        date: toISODate(monthStart),
                        type: template.value,
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
                    className="flex w-full items-center gap-2 rounded-md border border-border bg-background/40 px-2 py-2 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold", cfg.bg, cfg.text)}>{cfg.short}</span>
                    <span className="truncate font-semibold text-text">{template.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold capitalize text-text">{formatMonthLabel(monthStart)}</p>
              <p className="text-xs text-text-muted">{selectedAthlete?.name ?? "Selecione um atleta"}</p>
            </div>
            {selectedAthlete && (
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
            )}
          </div>
          <div className="grid grid-cols-7 border-b border-border bg-card-hover/40">
            {DAYS_PT.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-[11px] font-semibold uppercase text-text-muted">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {loading ? (
              <div className="col-span-7 flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : !selectedAthlete ? (
              <div className="col-span-7 py-16 text-center text-sm text-text-muted">Selecione um atleta.</div>
            ) : (
              monthDays.map((day) => {
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
                      "min-h-[132px] border-b border-r border-border/70 p-1.5 transition-colors",
                      !day.inMonth && "bg-background/35 opacity-55",
                      day.isToday && "bg-primary/5",
                      draggingWorkout && "bg-primary/8"
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
                        const cfg = woCfg(workout.type);
                        return (
                          <button
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
                            className={cn("flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[10px] font-semibold shadow-sm", cfg.bg, cfg.text)}
                          >
                            <WorkoutIcon type={`${workout.type} ${workout.title}`} className="h-3 w-3 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{workout.title}</span>
                            {workout.targetDurationMin && <span className="shrink-0 opacity-80">{workout.targetDurationMin}m</span>}
                          </button>
                        );
                      })}
                      {dayWorkouts.length === 0 && workoutClipboard && (
                        <button
                          onClick={() => handlePasteWorkout(selectedAthlete, day.iso)}
                          className="flex w-full items-center justify-center gap-1 rounded border border-dashed border-success/40 px-2 py-4 text-[11px] font-semibold text-success hover:bg-success/10"
                        >
                          <ClipboardPaste className="h-3 w-3" />
                          Colar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <aside className="rounded-md border border-border bg-card">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-text">Resumo</p>
            <p className="text-[11px] text-text-muted">{selectedAthlete?.name ?? "Atleta"}</p>
          </div>
          <div className="space-y-3 p-3">
            <SummaryMetric label="Treinos" value={String(visibleWorkouts.length)} />
            <SummaryMetric label="Planejados" value={String(plannedWorkouts)} />
            <SummaryMetric label="Concluidos" value={String(completedWorkouts)} />
            <SummaryMetric label="TSS" value={String(Math.round(visibleTss))} />
            <SummaryMetric label="Distancia" value={`${visibleDistance.toFixed(1)} km`} />
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
          onSaved={() => fetchWeek(monthStart)}
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
        <Badge variant="primary" className="mb-2">Prescricao principal</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Calendario de prescricao</h1>
        <p className="mt-1 text-sm text-text-muted">
          Clique em qualquer dia vazio para prescrever. {total} {total === 1 ? "atleta" : "atletas"} nesta semana.
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
