import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Flame,
  Gauge,
  HeartPulse,
  MapPin,
  Target,
  Thermometer,
  Wind,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPace } from "@/lib/utils";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { WorkoutActions } from "@/components/workout/workout-actions";
import { WorkoutLogSection } from "@/components/workout/workout-log-section";
import type { WorkoutBlock } from "@/lib/workout-blocks";

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  RODAGEM_LEVE: "Rodagem Leve",
  INTERVALADO_CURTO: "Intervalado Curto",
  INTERVALADO_LONGO: "Intervalado Longo",
  TEMPO_RUN: "Tempo Run",
  FARTLEK: "Fartlek",
  PROGRESSIVO: "Progressivo",
  LONGAO: "Longão",
  REGENERATIVO: "Regenerativo",
  SUBIDA: "Subida",
  TECNICA: "Técnica",
  PROVA: "Prova",
  FORCA: "Força",
  FUNCIONAL: "Funcional",
  MOBILIDADE: "Mobilidade",
  RECUPERACAO: "Recuperação",
  ENDURANCE_BIKE: "Endurance",
  SWEET_SPOT: "Sweet Spot",
  TEMPO_BIKE: "Tempo",
  THRESHOLD_BIKE: "Limiar",
  VO2MAX_BIKE: "VO2máx",
  RECOVERY_BIKE: "Recuperação Ativa",
  LONG_RIDE: "Saída Longa",
  TECNICA_NATACAO: "Técnica",
  ENDURANCE_NATACAO: "Endurance",
  INTERVALADO_NATACAO: "Intervalados",
  LIMIAR_NATACAO: "Limiar",
  SPRINT_NATACAO: "Sprint",
  RECUPERACAO_NATACAO: "Recuperação",
  AGUAS_ABERTAS: "Águas Abertas",
};

const WORKOUT_TYPE_COLORS: Record<string, string> = {
  RODAGEM_LEVE: "#84cc16",
  INTERVALADO_CURTO: "#ef4444",
  INTERVALADO_LONGO: "#FFB020",
  TEMPO_RUN: "#eab308",
  FARTLEK: "#a78bfa",
  PROGRESSIVO: "#38bdf8",
  LONGAO: "#22c55e",
  REGENERATIVO: "#94a3b8",
  SUBIDA: "#fb923c",
  TECNICA: "#06b6d4",
  PROVA: "#ec4899",
  FORCA: "#46E0C8",
  FUNCIONAL: "#46E0C8",
  MOBILIDADE: "#84cc16",
  RECUPERACAO: "#94a3b8",
  ENDURANCE_BIKE: "#3b82f6",
  SWEET_SPOT: "#8b5cf6",
  TEMPO_BIKE: "#f59e0b",
  THRESHOLD_BIKE: "#ef4444",
  VO2MAX_BIKE: "#ec4899",
  RECOVERY_BIKE: "#10b981",
  LONG_RIDE: "#06b6d4",
  TECNICA_NATACAO: "#06b6d4",
  ENDURANCE_NATACAO: "#22c55e",
  INTERVALADO_NATACAO: "#f97316",
  LIMIAR_NATACAO: "#ef4444",
  SPRINT_NATACAO: "#ec4899",
  RECUPERACAO_NATACAO: "#94a3b8",
  AGUAS_ABERTAS: "#0ea5e9",
};

// RPE levels → color + label
const RPE_BANDS = [
  { min: 0,  max: 3,  color: "#4ade80", bg: "#4ade8022", label: "Muito leve" },
  { min: 4,  max: 5,  color: "#38bdf8", bg: "#38bdf822", label: "Leve" },
  { min: 6,  max: 7,  color: "#a78bfa", bg: "#a78bfa22", label: "Moderado" },
  { min: 8,  max: 9,  color: "#fb923c", bg: "#fb923c22", label: "Intenso" },
  { min: 10, max: 10, color: "#f87171", bg: "#f8717122", label: "Máximo" },
];

function getRpeBand(rpe: number) {
  return RPE_BANDS.find((b) => rpe >= b.min && rpe <= b.max) ?? RPE_BANDS[2];
}

// HR zone zones (Z1–Z5)
const HR_ZONES = [
  { key: "Z1", label: "Z1", color: "#4ade80", title: "Regenerativo" },
  { key: "Z2", label: "Z2", color: "#38bdf8", title: "Aeróbico" },
  { key: "Z3", label: "Z3", color: "#a78bfa", title: "Moderado" },
  { key: "Z4", label: "Z4", color: "#fb923c", title: "Limiar" },
  { key: "Z5", label: "Z5", color: "#f87171", title: "VO2máx" },
];

// Block phase colors
const BLOCK_PHASE_COLOR: Record<string, string> = {
  warmup:   "#22c55e",
  main:     "#f97316",
  cooldown: "#38bdf8",
  other:    "#a78bfa",
};

const ZONE_COLORS: Record<string, string> = {
  Z1: "#4ade80", Z2: "#38bdf8", Z3: "#a78bfa",
  Z4: "#fb923c", Z5: "#f87171", LIVRE: "#9ca3af",
};

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!athlete) notFound();

  const workout = await prisma.workout.findFirst({
    where: { id, week: { plan: { athleteId: athlete.id } } },
    select: {
      id: true,
      date: true,
      type: true,
      sport: true,
      title: true,
      status: true,
      objective: true,
      warmup: true,
      mainSet: true,
      cooldown: true,
      targetPaceSecPerKm: true,
      targetPacePer100m: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      targetRpe: true,
      targetHrZone: true,
      notes: true,
      videoUrl: true,
      imageUrl: true,
      structured: true,
      blocks: true,
    },
  });

  if (!workout) notFound();

  const typeLabel = WORKOUT_TYPE_LABELS[workout.type] ?? workout.type;
  const color = WORKOUT_TYPE_COLORS[workout.type] ?? "#38bdf8";
  const date = new Date(workout.date);
  const dateLabel = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const sections = [
    { title: "Objetivo", icon: Target, text: workout.objective, borderColor: "border-primary/30", iconClass: "text-primary" },
    { title: "Aquecimento", icon: Flame, text: workout.warmup, borderColor: "border-warning/30", iconClass: "text-warning" },
    { title: "Parte principal", icon: Gauge, text: workout.mainSet, borderColor: "border-info/30", iconClass: "text-info" },
    { title: "Volta à calma", icon: Wind, text: workout.cooldown, borderColor: "border-success/30", iconClass: "text-success" },
  ].filter((s) => s.text);

  // Parse structured blocks
  let parsedBlocks: WorkoutBlock[] | null = null;
  if (workout.structured && workout.blocks) {
    try {
      parsedBlocks = workout.blocks as unknown as WorkoutBlock[];
    } catch { /* ignore */ }
  }

  // Total structured duration
  const structuredTotal = parsedBlocks
    ? parsedBlocks.reduce((s, b) => s + (b.durationMin ?? 0) + (b.isInterval ? ((b.repDurationMin ?? 0) + (b.recoveryDurationMin ?? 0)) * (b.reps ?? 1) : 0), 0)
    : 0;

  const rpeBand = workout.targetRpe != null ? getRpeBand(workout.targetRpe) : null;
  const targetZoneKey = workout.targetHrZone?.toUpperCase().replace("ZONA ", "Z").replace("ZONE ", "Z") ?? null;

  const isCompleted = workout.status === "CONCLUIDO";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/atleta/calendario"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      {/* Hero */}
      <Card className="overflow-hidden">
        {/* Colored accent strip */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

        <div className="relative h-48 sm:h-60">
          {workout.imageUrl && workout.imageUrl.startsWith("https://") && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${workout.imageUrl}')` }}
            />
          )}
          {/* Colored gradient overlay using workout type color */}
          <div
            className="absolute inset-0"
            style={{
              background: workout.imageUrl
                ? `linear-gradient(to top, color-mix(in srgb, ${color} 30%, var(--color-card)) 0%, transparent 60%)`
                : `linear-gradient(135deg, ${color}18 0%, transparent 60%), linear-gradient(to top, var(--color-card) 0%, transparent 60%)`,
            }}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  style={{
                    borderColor: `${color}66`,
                    color,
                    backgroundColor: `${color}22`,
                  }}
                  className="border"
                >
                  {typeLabel}
                </Badge>
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                    <CheckCircle2 className="h-3 w-3" />
                    Concluído
                  </span>
                )}
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold text-text sm:text-3xl">
                {workout.title}
              </h1>
              <p className="mt-0.5 text-sm capitalize text-text-muted">{dateLabel}</p>
            </div>
          </div>
        </div>

        <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {workout.targetDistanceKm != null && (
            <Metric
              icon={MapPin}
              label="Distância"
              value={
                workout.sport === "SWIM"
                  ? `${Math.round(workout.targetDistanceKm * 1000)} m`
                  : `${workout.targetDistanceKm} km`
              }
              color={color}
            />
          )}
          {workout.targetDurationMin != null && (
            <Metric icon={Clock} label="Tempo estimado" value={`${workout.targetDurationMin} min`} color={color} />
          )}
          {workout.sport === "SWIM" && workout.targetPacePer100m != null && (
            <Metric icon={Gauge} label="Pace alvo" value={`${formatPace(workout.targetPacePer100m)} /100m`} color={color} />
          )}
          {workout.sport !== "SWIM" && workout.targetPaceSecPerKm != null && (
            <Metric icon={Gauge} label="Pace alvo" value={formatPace(workout.targetPaceSecPerKm)} color={color} />
          )}
          {workout.targetHrZone && (
            <Metric icon={HeartPulse} label="FC alvo" value={workout.targetHrZone} color={color} />
          )}
          {workout.targetRpe != null && (
            <Metric icon={Thermometer} label="RPE alvo" value={`${workout.targetRpe} / 10`} color={rpeBand?.color ?? color} />
          )}
        </CardContent>
      </Card>

      {/* Intensity visualization */}
      {(workout.targetRpe != null || targetZoneKey) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* RPE Meter */}
          {workout.targetRpe != null && rpeBand && (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-text-muted" />
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text">
                      Intensidade percebida
                    </h3>
                  </div>
                  <span
                    className="rounded-lg px-2.5 py-1 font-display text-sm font-bold"
                    style={{ color: rpeBand.color, background: rpeBand.bg }}
                  >
                    RPE {workout.targetRpe}/10
                  </span>
                </div>

                {/* Bar */}
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-card-hover">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{
                      width: `${(workout.targetRpe / 10) * 100}%`,
                      background: `linear-gradient(90deg, #4ade80, #38bdf8 30%, #a78bfa 55%, #fb923c 75%, #f87171)`,
                    }}
                  />
                </div>

                {/* Labels */}
                <div className="mt-2 flex justify-between text-[10px] text-text-muted">
                  {RPE_BANDS.map((b) => (
                    <span
                      key={b.min}
                      style={workout.targetRpe != null && workout.targetRpe >= b.min && workout.targetRpe <= b.max ? { color: b.color, fontWeight: 700 } : {}}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* HR Zone indicator */}
          {targetZoneKey && (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-text-muted" />
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text">
                    Zona de frequência cardíaca
                  </h3>
                </div>
                <div className="flex gap-1.5">
                  {HR_ZONES.map((z) => {
                    const isTarget = targetZoneKey === z.key || workout.targetHrZone === z.key;
                    return (
                      <div key={z.key} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-lg transition-all"
                          style={{
                            height: isTarget ? "2.5rem" : "1.5rem",
                            background: isTarget ? z.color : `${z.color}44`,
                            border: isTarget ? `2px solid ${z.color}` : "2px solid transparent",
                          }}
                        />
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: isTarget ? z.color : "var(--color-text-muted)" }}
                        >
                          {z.label}
                        </span>
                        {isTarget && (
                          <span className="text-[9px] text-center leading-tight" style={{ color: z.color }}>
                            {z.title}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Structured workout block timeline */}
      {parsedBlocks && parsedBlocks.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-info" />
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text">
                Estrutura do treino
              </h3>
              {structuredTotal > 0 && (
                <span className="ml-auto text-xs text-text-muted">{structuredTotal} min total</span>
              )}
            </div>

            {/* Proportional bar */}
            <div className="flex h-6 w-full overflow-hidden rounded-lg">
              {parsedBlocks.map((block, i) => {
                const blockDuration = block.durationMin ?? (block.isInterval
                  ? ((block.repDurationMin ?? 1) + (block.recoveryDurationMin ?? 0)) * (block.reps ?? 1)
                  : 1);
                const pct = structuredTotal > 0 ? (blockDuration / structuredTotal) * 100 : 100 / parsedBlocks!.length;
                const blockColor = block.zone ? (ZONE_COLORS[block.zone] ?? BLOCK_PHASE_COLOR[block.type] ?? "#a78bfa") : (BLOCK_PHASE_COLOR[block.type] ?? "#a78bfa");
                return (
                  <div
                    key={block.id ?? i}
                    className="flex items-center justify-center text-[9px] font-bold text-white/90 transition-all hover:brightness-110"
                    style={{
                      width: `${pct}%`,
                      background: blockColor,
                      minWidth: "4px",
                    }}
                    title={`${block.label} — ${blockDuration} min`}
                  >
                    {pct > 8 ? `${blockDuration}min` : ""}
                  </div>
                );
              })}
            </div>

            {/* Block cards */}
            <div className="mt-4 space-y-2">
              {parsedBlocks.map((block, i) => {
                const blockColor = block.zone ? (ZONE_COLORS[block.zone] ?? BLOCK_PHASE_COLOR[block.type] ?? "#a78bfa") : (BLOCK_PHASE_COLOR[block.type] ?? "#a78bfa");
                const blockDuration = block.durationMin ?? 0;
                return (
                  <div
                    key={block.id ?? i}
                    className="flex items-start gap-3 rounded-xl p-3"
                    style={{ background: `${blockColor}14`, borderLeft: `3px solid ${blockColor}` }}
                  >
                    <div
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                      style={{ background: blockColor }}
                    >
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-text">{block.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {block.zone && block.zone !== "LIVRE" && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${blockColor}30`, color: blockColor }}>
                              {block.zone}
                            </span>
                          )}
                          {blockDuration > 0 && (
                            <span className="text-xs text-text-muted">{blockDuration} min</span>
                          )}
                        </div>
                      </div>
                      {block.isInterval && block.reps && (
                        <p className="mt-0.5 text-xs text-text-muted">
                          {block.reps}× {block.repDurationMin ? `${block.repDurationMin} min` : block.repDistanceM ? `${block.repDistanceM}m` : ""}
                          {block.recoveryDurationMin ? ` · rec ${block.recoveryDurationMin} min` : ""}
                        </p>
                      )}
                      {block.notes && (
                        <p className="mt-0.5 text-xs text-text-muted">{block.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      {sections.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((s) => (
            <Card key={s.title} className={`border-l-2 ${s.borderColor}`}>
              <CardContent className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.iconClass}`} />
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text">
                    {s.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-text-muted">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {workout.notes && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-sm font-semibold text-text">
                Observações do treinador
              </h3>
              <p className="mt-1 text-sm text-text-muted">{workout.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planned vs actual log */}
      <WorkoutLogSection
        workoutId={workout.id}
        status={workout.status}
        plannedDistanceKm={workout.targetDistanceKm}
        plannedDurationMin={workout.targetDurationMin}
        plannedRpe={workout.targetRpe}
      />

      {/* CTA */}
      <WorkoutActions workoutId={workout.id} sport={workout.sport ?? "RUN"} />
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card-hover/40 p-3 text-center sm:text-left"
      style={color ? { borderColor: `${color}33` } : undefined}
    >
      <div className="flex items-center justify-center gap-1.5 text-text-muted sm:justify-start">
        <span style={color ? { color } : undefined}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-display text-base font-bold text-text">{value}</p>
    </div>
  );
}
