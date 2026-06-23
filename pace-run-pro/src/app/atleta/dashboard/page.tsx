"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarCheck2,
  CalendarClock,
  Dumbbell,
  Footprints,
  TrendingUp,
  UserCircle,
} from "lucide-react";
import { formStatus, FORM_LABELS } from "@/lib/training-load";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" as const },
  }),
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

interface WorkoutEntry {
  id: string;
  date: string;
  title: string;
  type: string;
  objective?: string;
  targetPaceSecPerKm?: number;
  distanceKm?: number;
  durationMin?: number;
  targetRpe?: number;
}

export default function AthleteDashboard() {
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState("Atleta");
  const [todayWorkout, setTodayWorkout] = useState<WorkoutEntry | null>(null);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<WorkoutEntry[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [loadTsb, setLoadTsb] = useState<number | null>(null);
  const [loadCtl, setLoadCtl] = useState<number | null>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    fetch("/api/atleta/perfil")
      .then((r) => r.ok ? r.json() : null)
      .then((data: { name?: string } | null) => {
        if (data?.name) setFirstName(data.name.split(" ")[0]);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/athlete/training-load")
      .then((r) => r.ok ? r.json() : null)
      .then((d: { latest?: { tsb: number; ctl: number } | null } | null) => {
        if (d?.latest) {
          setLoadTsb(d.latest.tsb);
          setLoadCtl(d.latest.ctl);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetch("/api/athlete/workouts")
      .then((r) => r.ok ? r.json() : [])
      .then((data: WorkoutEntry[]) => {
        const todayLocal = new Date().toLocaleDateString("sv");
        setTodayWorkout(data.find((w) => w.date.slice(0, 10) === todayLocal) ?? null);
        setUpcomingWorkouts(data.filter((w) => w.date.slice(0, 10) > todayLocal).slice(0, 6));
      })
      .catch(() => null)
      .finally(() => setWorkoutsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">{greeting}, {firstName} 👋</p>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Bem-vindo ao Pace Run Pro!
          </h1>
        </div>
        <Badge variant="primary" className="px-3 py-1.5 text-xs">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          Início do programa
        </Badge>
      </motion.div>

      {/* Treino do dia */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        {workoutsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : todayWorkout ? (
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
            <CardContent className="flex flex-col gap-5 p-6">
              <div>
                <Badge variant="primary">Treino de hoje</Badge>
                <Badge variant="success" className="ml-2">Liberado</Badge>
                <h2 className="mt-3 font-display text-xl font-bold text-text">{todayWorkout.title}</h2>
                {todayWorkout.objective && (
                  <p className="mt-1.5 text-sm text-text-muted">{todayWorkout.objective}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {todayWorkout.distanceKm && (
                  <div className="rounded-xl border border-border bg-background/40 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">Distância</p>
                    <p className="font-display font-bold text-text">{todayWorkout.distanceKm} km</p>
                  </div>
                )}
                {todayWorkout.durationMin && (
                  <div className="rounded-xl border border-border bg-background/40 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">Duração</p>
                    <p className="font-display font-bold text-text">{todayWorkout.durationMin} min</p>
                  </div>
                )}
                {todayWorkout.targetRpe && (
                  <div className="rounded-xl border border-border bg-background/40 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-text-muted">RPE alvo</p>
                    <p className="font-display font-bold text-text">{todayWorkout.targetRpe}/10</p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Link href={`/atleta/treino/${todayWorkout.id}`}>
                  <Button size="lg">Ver detalhes do treino</Button>
                </Link>
                <Link href={`/atleta/treino/${todayWorkout.id}/executar`}>
                  <Button size="lg" variant="secondary">Iniciar treino</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card">
            <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <CalendarClock className="h-8 w-8" />
              </div>
              <div>
                <Badge variant="primary" className="mb-3">Treino de hoje</Badge>
                <h2 className="font-display text-xl font-bold text-text">
                  Aguardando prescrição do treinador
                </h2>
                <p className="mt-2 max-w-md text-sm text-text-muted">
                  Seu treinador ainda está preparando seu plano de treinamento personalizado.
                  Fique de olho — você receberá uma notificação assim que os treinos forem liberados.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Check-in */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="space-y-5">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-text">Check-in diário</h3>
                  <p className="text-xs text-text-muted">Leva menos de 1 minuto</p>
                </div>
              </div>
              <p className="text-sm text-text-muted">
                Registre como você está se sentindo hoje. Seu treinador usa essas informações para ajustar seus treinos.
              </p>
              <Link href="/atleta/checkin">
                <Button className="w-full">Fazer check-in agora</Button>
              </Link>
            </CardContent>
          </Card>

          {loadTsb !== null ? (() => {
            const status = formStatus(loadTsb);
            const info = FORM_LABELS[status];
            return (
              <Card className={cn("border-border", info.bg)}>
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card-hover text-text-muted">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                    <h3 className="font-display text-sm font-semibold text-text">Forma atual</h3>
                  </div>
                  <p className={cn("font-display text-xl font-bold", info.color)}>{info.label}</p>
                  <div className="flex gap-3 text-xs text-text-muted">
                    <span>CTL {loadCtl?.toFixed(0)}</span>
                    <span>TSB {loadTsb >= 0 ? "+" : ""}{loadTsb.toFixed(0)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })() : (
            <Card>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-card-hover text-text-muted">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-sm font-semibold text-text">Carga de treino</h3>
                </div>
                <p className="text-sm text-text-muted">
                  Sua forma, fitness e fadiga aparecerão aqui conforme os treinos forem registrados.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Próximas sessões */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-5 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold text-text">Próximas sessões</h3>
              {workoutsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : upcomingWorkouts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card-hover text-text-muted">
                    <CalendarClock className="h-6 w-6" />
                  </div>
                  <p className="text-sm text-text-muted">Nenhuma sessão agendada para os próximos dias.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingWorkouts.map((w) => {
                    const d = new Date(w.date);
                    const dayStr = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
                    const isForca = w.type === "forca" || w.type === "funcional";
                    return (
                      <div key={w.id} className="flex items-center gap-3 rounded-xl border border-border bg-card-hover/30 px-4 py-3">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isForca ? "bg-violet-500/15 text-violet-500" : "bg-sky-500/15 text-sky-500"}`}>
                          {isForca ? <Dumbbell className="h-4 w-4" /> : <Footprints className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text">{w.title}</p>
                          {w.objective && <p className="truncate text-xs text-text-muted">{w.objective}</p>}
                        </div>
                        <span className="shrink-0 text-xs capitalize text-text-muted">{dayStr}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 font-display text-base font-semibold text-text">Complete seu perfil</h3>
              <p className="mb-4 text-sm text-text-muted">
                Mantenha seu perfil atualizado para que seu treinador possa personalizar melhor seus treinos.
              </p>
              <Link href="/atleta/perfil">
                <Button variant="secondary" className="gap-2">
                  <UserCircle className="h-4 w-4" />
                  Ver meu perfil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
