"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Flame, ListChecks, Loader2, Repeat, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveExerciseMedia } from "@/lib/exercise-media";

interface StrengthBlock {
  id: string;
  order: number;
  sets: number;
  reps: string;
  load?: string | null;
  restSec?: number | null;
  rpe?: number | null;
  notes?: string | null;
  exercise: {
    id: string;
    name: string;
    category: string;
    imageUrl?: string | null;
    videos?: Array<{ url?: string | null; title?: string | null }> | null;
  };
}

interface WorkoutData {
  id: string;
  title: string;
  date: string;
  objective?: string | null;
  strengthWorkout?: {
    split: string;
    label?: string | null;
    blocks: StrengthBlock[];
  } | null;
}

function normName(n: string) {
  return n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function StrengthTreinoPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutData | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/atleta/forca/${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then(setWorkout)
      .catch(() => setWorkout(null));
  }, [id]);


  if (workout === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <Dumbbell className="mx-auto h-8 w-8 text-text-muted/40" />
        <p className="text-sm text-text-muted">Treino não encontrado.</p>
        <Link href="/atleta/forca">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  const blocks = workout.strengthWorkout?.blocks ?? [];
  const sessionLabel = workout.strengthWorkout?.label ?? workout.title;
  const d = new Date(workout.date);
  const dateStr = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/atleta/forca" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Força
      </Link>

      <div>
        <Badge variant="primary" className="mb-2">Força &amp; Funcional</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">{sessionLabel}</h1>
        {workout.objective && <p className="mt-1 text-sm text-text-muted">{workout.objective}</p>}
        <p className="mt-1 text-xs capitalize text-text-muted">{dateStr}</p>
      </div>

      {blocks.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-text-muted">
            <span className="font-semibold text-text">{blocks.length}</span> exercícios
          </span>
          <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-text-muted">
            <span className="font-semibold text-text">
              {blocks.reduce((s, b) => s + b.sets, 0)}
            </span>{" "}
            séries totais
          </span>
          {workout.strengthWorkout?.split && (
            <span className="rounded-xl border border-border bg-card px-3 py-2 text-xs">
              {workout.strengthWorkout.split}
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {blocks.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-text-muted">Treino sem exercícios cadastrados.</p>
            </CardContent>
          </Card>
        ) : (
          blocks.map((block, i) => {
            const media = resolveExerciseMedia({
              imageUrl: block.exercise.imageUrl,
              videos: block.exercise.videos,
            });
            return (
              <Card key={block.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="h-28 w-36 shrink-0 bg-card-hover">
                      {media.kind !== "none" ? (
                        media.kind === "embed" ? (
                          <iframe
                            src={media.url}
                            title={`Vídeo demonstrativo de ${block.exercise.name}`}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : media.kind === "video" ? (
                          <video
                            src={media.url}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            autoPlay
                            loop
                          />
                        ) : (
                          <img
                            src={media.url}
                            alt={block.exercise.name}
                            className="h-full w-full object-cover"
                          />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Dumbbell className="h-6 w-6 text-text-muted/20" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-text">
                          <span className="mr-1.5 text-xs font-bold text-text-muted">{i + 1}.</span>
                          {block.exercise.name}
                        </p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {block.exercise.category}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          {block.sets}× {block.reps}
                        </span>
                        {block.restSec && (
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {block.restSec}s descanso
                          </span>
                        )}
                        {block.load && <span>carga {block.load}</span>}
                        {block.rpe && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            RPE {block.rpe}
                          </span>
                        )}
                      </div>
                      {block.notes && (
                        <p className="mt-1.5 text-xs text-text-muted/70">{block.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {blocks.length > 0 && (
        <Link href={`/atleta/forca/treino/${id}/executar`}>
          <Button size="lg" className="w-full">
            <ListChecks className="h-4 w-4" />
            Iniciar treino
          </Button>
        </Link>
      )}
    </div>
  );
}
