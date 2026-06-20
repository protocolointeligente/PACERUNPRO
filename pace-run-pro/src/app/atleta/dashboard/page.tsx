"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarCheck2,
  Clock,
  Flame,
  Gauge,
  MapPin,
  PlayCircle,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { WorkoutCard } from "@/components/dashboard/workout-card";
import {
  currentAthlete,
  recentSessions,
  todayWorkout,
  upcomingSessions,
  weekSummary,
  macrocycle,
} from "@/lib/mock-data";
import { formatPace } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" as const },
  }),
};

// Score de prontidão baseado no último check-in (0–100)
function calcReadiness(recovery: number, adherence: number): { score: number; label: string; color: string; hint: string } {
  const score = Math.round(recovery * 70 + adherence * 30);
  if (score >= 80) return { score, label: "Pronto para treinar", color: "text-success", hint: "Recuperação boa. Pode dar tudo hoje." };
  if (score >= 55) return { score, label: "Moderado — treine com atenção", color: "text-warning", hint: "Recuperação parcial. Respeite os limites do corpo." };
  return { score, label: "Recuperação baixa", color: "text-danger", hint: "Considere um treino leve ou descanso ativo." };
}

export default function AthleteDashboard() {
  const greeting = getGreeting();
  const cycleProgress = Math.round((macrocycle.currentWeek / macrocycle.totalWeeks) * 100);
  const readiness = calcReadiness(weekSummary.recovery, weekSummary.adherence);
  const weeksLeft = macrocycle.totalWeeks - macrocycle.currentWeek;

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">{greeting}, {currentAthlete.firstName} 👋</p>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            Vamos evoluir mais um dia?
          </h1>
        </div>
        <Badge variant="primary" className="px-3 py-1.5 text-xs">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          {weekSummary.weekLabel}
        </Badge>
      </motion.div>

      {/* Status do dia */}
      <motion.div custom={0.5} variants={fadeUp} initial="hidden" animate="show">
        <Card className="overflow-hidden border-border">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-border)" strokeWidth="5" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke={readiness.score >= 80 ? "var(--color-success)" : readiness.score >= 55 ? "var(--color-warning)" : "var(--color-danger)"}
                      strokeWidth="5"
                      strokeDasharray={`${(readiness.score / 100) * 175.9} 175.9`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="font-display text-lg font-extrabold text-text">{readiness.score}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-text-muted" />
                    <span className="text-xs uppercase tracking-widest text-text-muted">Status do dia</span>
                  </div>
                  <p className={`font-display text-lg font-bold ${readiness.color}`}>{readiness.label}</p>
                  <p className="text-xs text-text-muted">{readiness.hint}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="rounded-xl bg-card-hover px-3 py-2">
                  <span className="text-xs text-text-muted">Adesão</span>
                  <p className="font-display font-bold text-text">{Math.round(weekSummary.adherence * 100)}%</p>
                </div>
                <div className="rounded-xl bg-card-hover px-3 py-2">
                  <span className="text-xs text-text-muted">Semanas p/ prova</span>
                  <p className="font-display font-bold text-text">{weeksLeft}</p>
                </div>
                <div className="rounded-xl bg-card-hover px-3 py-2">
                  <span className="text-xs text-text-muted">Progresso</span>
                  <p className="font-display font-bold text-text">{cycleProgress}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Treino do dia — destaque */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show">
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
          <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
            <CardContent className="flex flex-col justify-between gap-5 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">Treino de hoje</Badge>
                  <Badge variant="success">Liberado</Badge>
                </div>
                <h2 className="mt-3 font-display text-xl font-bold text-text sm:text-2xl">{todayWorkout.title}</h2>
                <p className="mt-1.5 max-w-md text-sm text-text-muted">{todayWorkout.objective}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat icon={<MapPin className="h-4 w-4" />} label="Distância" value={`${todayWorkout.distanceKm} km`} />
                <MiniStat icon={<Clock className="h-4 w-4" />} label="Duração" value={`${todayWorkout.durationMin} min`} />
                <MiniStat icon={<Gauge className="h-4 w-4" />} label="Pace alvo" value={formatPace(todayWorkout.targetPaceSecPerKm!)} />
                <MiniStat icon={<Activity className="h-4 w-4" />} label="RPE alvo" value={`${todayWorkout.targetRpe}/10`} />
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href={`/atleta/treino/${todayWorkout.id}`}>
                  <Button size="lg">Ver detalhes do treino</Button>
                </Link>
                <Link href={`/atleta/treino/${todayWorkout.id}/executar`}>
                  <Button size="lg" variant="secondary">
                    <PlayCircle className="h-4 w-4" />
                    Iniciar treino
                  </Button>
                </Link>
              </div>
            </CardContent>
            <div className="relative hidden min-h-[260px] lg:block">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${todayWorkout.imageUrl}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-card/40 to-card" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Resumo da semana */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show">
        <SectionHeader title="Resumo da semana" subtitle="Volume, tempo total e carga acumulada até agora" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Volume semanal"
            value={`${weekSummary.doneKm}`}
            unit={`/ ${weekSummary.plannedKm} km`}
            icon={MapPin}
            accent="info"
            hint={`${weekSummary.doneSessions} de ${weekSummary.plannedSessions} sessões`}
          />
          <StatCard
            label="Tempo total"
            value={`${Math.floor(weekSummary.totalTimeMin / 60)}h${(weekSummary.totalTimeMin % 60).toString().padStart(2, "0")}`}
            unit="treinados"
            icon={Clock}
            accent="primary"
          />
          <StatCard
            label="Carga semanal"
            value={`${weekSummary.weeklyLoad}`}
            unit="UA"
            icon={Flame}
            accent={weekSummary.weeklyLoad > weekSummary.previousAvgLoad * 1.3 ? "warning" : "success"}
            hint={`Média anterior: ${weekSummary.previousAvgLoad} UA`}
            tooltip="UA = Unidades Arbitrárias. Mede a carga de treino combinando duração (min) e percepção de esforço (RPE de 1 a 10) de cada sessão, somadas na semana — quanto maior, mais intenso foi o estímulo total."
          />
          <StatCard
            label="Ciclo atual"
            value={`Sem. ${macrocycle.currentWeek}`}
            unit={`/ ${macrocycle.totalWeeks}`}
            icon={TrendingUp}
            accent="primary"
            hint="Bloco: Construção"
          />
        </div>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Check-in + evolução rápida */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="space-y-5 lg:col-span-1">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-card">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-text">Check-in pós-treino</h3>
                  <p className="text-xs text-text-muted">Leva menos de 1 minuto</p>
                </div>
              </div>
              <p className="text-sm text-text-muted">
                Suas respostas ajustam automaticamente a carga das próximas sessões e alertam seu treinador se houver risco.
              </p>
              <Link href="/atleta/checkin">
                <Button className="w-full">Fazer check-in agora</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <h3 className="font-display text-sm font-semibold text-text flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" /> Você está evoluindo
              </h3>
              {[
                { label: "Pace médio", delta: "+8% mais rápido", positive: true },
                { label: "Volume semanal", delta: "+12% nas últimas 4 semanas", positive: true },
                { label: "Risco atual", delta: "Baixo", positive: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{item.label}</span>
                  <span className={item.positive ? "font-semibold text-success" : "font-semibold text-danger"}>
                    {item.delta}
                  </span>
                </div>
              ))}
              <Link href="/atleta/evolucao" className="block pt-1">
                <Button size="sm" variant="ghost" className="w-full text-xs">Ver evolução completa</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Próximas sessões + últimos treinos */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="space-y-6 lg:col-span-2">
          <div>
            <SectionHeader title="Próximas sessões" href="/atleta/calendario" />
            <div className="space-y-3">
              {upcomingSessions.slice(0, 3).map((w) => (
                <WorkoutCard key={w.id} workout={w} href={`/atleta/treino/${w.id}`} />
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Últimos treinos" subtitle="Seu histórico recente de sessões concluídas" href="/atleta/evolucao" />
            <div className="grid gap-3 sm:grid-cols-3">
              {recentSessions.map((s) => (
                <Card key={s.id} className="p-4">
                  <Badge variant="success" className="mb-2">
                    {s.badge}
                  </Badge>
                  <p className="text-sm font-semibold text-text">{s.title}</p>
                  <p className="text-xs text-text-muted">{s.date}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                    <span>{s.distanceKm ? `${s.distanceKm} km` : "Sessão"}</span>
                    <span className="font-medium text-text">{s.pace}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                    RPE
                    <Progress value={s.rpe * 10} className="h-1.5 flex-1" />
                    <span className="font-medium text-text">{s.rpe}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-text-muted">
        {icon}
        <span className="text-[11px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-base font-bold text-text">{value}</p>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
