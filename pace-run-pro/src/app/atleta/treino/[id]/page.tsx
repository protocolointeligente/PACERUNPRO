import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Flame,
  Gauge,
  HeartPulse,
  MapPin,
  Maximize2,
  PlayCircle,
  Target,
  Thermometer,
  Wind,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TYPE_LABELS, getWorkoutDetail, getSubtypeColor } from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workout = getWorkoutDetail(id);
  if (!workout) notFound();

  const date = new Date(workout.date);
  const dateLabel = date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  const sections = [
    { title: "Objetivo", icon: Target, text: workout.objective, color: "text-primary" },
    { title: "Aquecimento", icon: Flame, text: workout.warmup, color: "text-warning" },
    { title: "Parte principal", icon: Gauge, text: workout.mainSet, color: "text-info" },
    { title: "Volta à calma", icon: Wind, text: workout.cooldown, color: "text-success" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/atleta/calendario" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="relative h-52 sm:h-64">
          {workout.imageUrl && (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${workout.imageUrl}')` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge style={{ borderColor: `${workout.color}66`, color: workout.color, backgroundColor: `${workout.color}22` }} className="border">
                  {TYPE_LABELS[workout.type]}
                </Badge>
                {workout.subtype && (() => {
                  const subtypeColor = getSubtypeColor(workout.type, workout.subtype);
                  return (
                    <Badge style={{ borderColor: `${subtypeColor}66`, color: subtypeColor, backgroundColor: `${subtypeColor}22` }} className="border">
                      {workout.subtype}
                    </Badge>
                  );
                })()}
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold text-text sm:text-3xl">{workout.title}</h1>
              <p className="mt-0.5 text-sm capitalize text-text-muted">{dateLabel}</p>
            </div>
            {workout.videoUrl && (
              <Button variant="secondary" size="sm" className="shrink-0">
                <Maximize2 className="h-3.5 w-3.5" />
                Vídeo demonstrativo
              </Button>
            )}
          </div>
        </div>

        <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          {workout.distanceKm != null && <Metric icon={MapPin} label="Distância" value={`${workout.distanceKm} km`} />}
          {workout.durationMin != null && <Metric icon={Clock} label="Tempo estimado" value={`${workout.durationMin} min`} />}
          {workout.targetPaceSecPerKm != null && <Metric icon={Gauge} label="Pace alvo" value={formatPace(workout.targetPaceSecPerKm)} />}
          {workout.targetHrZone && <Metric icon={HeartPulse} label="FC alvo" value={workout.targetHrZone} />}
          {workout.targetRpe != null && <Metric icon={Thermometer} label="RPE alvo" value={`${workout.targetRpe} / 10`} />}
        </CardContent>
      </Card>

      {/* Sections */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-text">{s.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-text-muted">{s.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {workout.notes && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-start gap-3 p-5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <Target className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-sm font-semibold text-text">Observações do treinador</h3>
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

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
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
