"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Dumbbell, Flame, ListChecks, Repeat, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StrengthBlock {
  id: string;
  order: number;
  sets: number;
  reps: string;
  restSec?: number | null;
  rpe?: number | null;
  notes?: string | null;
  exercise: {
    id: string;
    name: string;
    category: string;
    description?: string | null;
    imageUrl?: string | null;
  };
}

interface TodayWorkout {
  id: string;
  title: string;
  status: string;
  objective?: string | null;
  strengthWorkout?: {
    split: string;
    label?: string | null;
    blocks: StrengthBlock[];
  } | null;
}

interface ExerciseJsonEntry {
  id: string;
  gifUrl?: string;
  imageUrl?: string;
}

interface UpcomingWorkout {
  id: string;
  date: string;
  title: string;
  type: string;
  objective?: string;
}

export default function StrengthPage() {
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkout | null | undefined>(undefined);
  const [exerciseGifs, setExerciseGifs] = useState<Record<string, string>>({});
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<UpcomingWorkout[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

  useEffect(() => {
    fetch("/exercises.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ExerciseJsonEntry[]) => {
        const map: Record<string, string> = {};
        for (const e of data) {
          if (e.gifUrl) map[e.id] = e.gifUrl;
          else if (e.imageUrl) map[e.id] = e.imageUrl;
        }
        setExerciseGifs(map);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/atleta/forca/hoje")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TodayWorkout | null) => setTodayWorkout(data))
      .catch(() => setTodayWorkout(null));
  }, []);

  useEffect(() => {
    fetch("/api/atleta/workouts")
      .then((r) => r.ok ? r.json() : [])
      .then((data: UpcomingWorkout[]) => {
        setUpcomingWorkouts(data.filter((w) => w.type === "forca"));
      })
      .catch(() => null)
      .finally(() => setUpcomingLoading(false));
  }, []);

  const blocks = todayWorkout?.strengthWorkout?.blocks ?? [];
  const sessionLabel =
    todayWorkout?.strengthWorkout?.label ?? todayWorkout?.title ?? "Treino de força";

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Badge variant="primary" className="mb-2">Força &amp; Funcional</Badge>
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">Força — plano da semana</h1>
        <p className="mt-1 text-sm text-text-muted">Veja e acesse todos os treinos de força agendados.</p>
      </div>

      {todayWorkout === undefined ? (
        <Card>
          <CardContent className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      ) : todayWorkout === null ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            <Dumbbell className="mx-auto h-8 w-8 text-text-muted/40 mb-3" />
            <p className="text-sm font-semibold text-text">Nenhum treino de força hoje</p>
            <p className="text-xs text-text-muted mt-1">
              Seu treinador ainda não liberou um treino de força para hoje.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/12 to-card">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Dumbbell className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-muted">
                    Sessão de hoje · {todayWorkout.strengthWorkout?.split ?? "Força"}
                  </p>
                  <h2 className="font-display text-lg font-bold text-text">{sessionLabel}</h2>
                </div>
              </div>
              <Badge variant="success">Liberado pelo treinador</Badge>
            </div>

            <div className="mt-5 space-y-2.5">
              {blocks.map((block, i) => {
                const gif = exerciseGifs[block.exercise.id];
                return (
                  <Link key={block.id} href={`/atleta/forca/${block.id}`}>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card-hover/40 p-3 transition-colors hover:border-primary/40">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-sm font-bold text-text-muted">
                        {i + 1}
                      </span>
                      {gif ? (
                        <img
                          src={gif}
                          alt={block.exercise.name}
                          className="h-14 w-20 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-card-hover">
                          <Dumbbell className="h-4 w-4 text-text-muted/30" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text">{block.exercise.name}</p>
                        <p className="text-xs text-text-muted">{block.exercise.category}</p>
                      </div>
                      <div className="hidden gap-4 text-xs text-text-muted sm:flex">
                        <span className="flex items-center gap-1">
                          <Repeat className="h-3 w-3" /> {block.sets}× {block.reps}
                        </span>
                        {block.restSec && (
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" /> {block.restSec}s
                          </span>
                        )}
                        {block.rpe && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3" /> RPE {block.rpe}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
              {blocks.length === 0 && (
                <p className="py-3 text-center text-sm text-text-muted">
                  Treino sem exercícios cadastrados ainda.
                </p>
              )}
            </div>

            <Link href={`/atleta/forca/treino/${todayWorkout.id}/executar`}>
              <Button size="lg" className="mt-5 w-full sm:w-auto">
                <ListChecks className="h-4 w-4" />
                Iniciar sessão de força
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-text">Próximas sessões de força</h2>
        {upcomingLoading ? (
          <Card>
            <CardContent className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </CardContent>
          </Card>
        ) : upcomingWorkouts.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <CalendarClock className="h-8 w-8 text-text-muted/40" />
              <p className="text-sm text-text-muted">Nenhuma sessão de força agendada nos próximos dias.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingWorkouts.map((w) => {
              const d = new Date(w.date);
              const dayStr = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
              const isToday = d.toLocaleDateString("sv") === new Date().toLocaleDateString("sv");
              return (
                <Link key={w.id} href={`/atleta/forca/treino/${w.id}`}>
                  <Card className="border-border/60 cursor-pointer transition-colors hover:border-primary/40 hover:bg-card-hover">
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Dumbbell className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text">{w.title}</p>
                        {w.objective && (
                          <p className="truncate text-xs text-text-muted">{w.objective}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-text-muted capitalize">{dayStr}</p>
                        {isToday && <p className="text-[10px] font-semibold text-primary">Hoje</p>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
