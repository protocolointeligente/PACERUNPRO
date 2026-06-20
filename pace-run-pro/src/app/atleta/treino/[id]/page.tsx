import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Flame,
  Gauge,
  HeartPulse,
  MapPin,
  PlayCircle,
  Target,
  Thermometer,
  Wind,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPace } from "@/lib/utils";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
};

const WORKOUT_TYPE_COLORS: Record<string, string> = {
  RODAGEM_LEVE: "#84cc16",
  INTERVALADO_CURTO: "#ef4444",
  INTERVALADO_LONGO: "#f97316",
  TEMPO_RUN: "#eab308",
  FARTLEK: "#a78bfa",
  PROGRESSIVO: "#38bdf8",
  LONGAO: "#22c55e",
  REGENERATIVO: "#94a3b8",
  SUBIDA: "#fb923c",
  TECNICA: "#06b6d4",
  PROVA: "#ec4899",
  FORCA: "#8b5cf6",
  FUNCIONAL: "#a855f7",
  MOBILIDADE: "#84cc16",
  RECUPERACAO: "#94a3b8",
};

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
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
      title: true,
      status: true,
      objective: true,
      warmup: true,
      mainSet: true,
      cooldown: true,
      targetPaceSecPerKm: true,
      targetDistanceKm: true,
      targetDurationMin: true,
      targetRpe: true,
      targetHrZone: true,
      notes: true,
      videoUrl: true,
      imageUrl: true,
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
    { title: "Objetivo", icon: Target, text: workout.objective, color: "text-primary" },
    { title: "Aquecimento", icon: Flame, text: workout.warmup, color: "text-warning" },
    { title: "Parte principal", icon: Gauge, text: workout.mainSet, color: "text-info" },
    { title: "Volta à calma", icon: Wind, text: workout.cooldown, color: "text-success" },
  ].filter((s) => s.text);

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
        <div className="relative h-52 sm:h-64">
          {workout.imageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${workout.imageUrl}')` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
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
            <Metric icon={MapPin} label="Distância" value={`${workout.targetDistanceKm} km`} />
          )}
          {workout.targetDurationMin != null && (
            <Metric icon={Clock} label="Tempo estimado" value={`${workout.targetDurationMin} min`} />
          )}
          {workout.targetPaceSecPerKm != null && (
            <Metric icon={Gauge} label="Pace alvo" value={formatPace(workout.targetPaceSecPerKm)} />
          )}
          {workout.targetHrZone && (
            <Metric icon={HeartPulse} label="FC alvo" value={workout.targetHrZone} />
          )}
          {workout.targetRpe != null && (
            <Metric icon={Thermometer} label="RPE alvo" value={`${workout.targetRpe} / 10`} />
          )}
        </CardContent>
      </Card>

      {/* Sections */}
      {sections.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((s) => (
            <Card key={s.title}>
              <CardContent className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
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

      {/* CTA */}
      <div className="sticky bottom-20 z-10 flex justify-center lg:bottom-6">
        <Link href={`/atleta/treino/${workout.id}/executar`} className="w-full sm:w-auto">
          <Button size="lg" className="w-full px-10 shadow-2xl shadow-primary/40 sm:w-auto">
            <PlayCircle className="h-5 w-5" />
            INICIAR TREINO
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card-hover/40 p-3 text-center sm:text-left">
      <div className="flex items-center justify-center gap-1.5 text-text-muted sm:justify-start">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 font-display text-base font-bold text-text">{value}</p>
    </div>
  );
}
