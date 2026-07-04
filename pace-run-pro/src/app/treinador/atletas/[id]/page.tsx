import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowLeft, Calendar, CalendarDays, CheckCircle2, ClipboardList, Clock, Dumbbell, HeartPulse, Moon, Ruler, Target, TrendingUp, Weight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaTrend, LineTrend } from "@/components/charts/trend-chart";
import { WeeklyReleaseDialog } from "@/components/coach/weekly-release-dialog";
import { DeleteWorkoutButton, DeletePlanButton, EditWorkoutButton } from "@/components/coach/delete-buttons";
import { TrainingLoadPanel } from "@/components/coach/training-load-panel";
import { AthleteCalendar, type CalWorkout } from "@/components/coach/athlete-calendar";
import { WorkoutLogComments } from "@/components/workout-log-comments";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-guard";

const GOAL_LABELS: Record<string, string> = {
  CINCO_KM: "5 km",
  DEZ_KM: "10 km",
  VINTE_E_UM_KM: "21 km",
  QUARENTA_E_DOIS_KM: "42 km",
  ULTRAMARATONA: "Ultra",
  EMAGRECIMENTO: "Emagrecimento",
  PERFORMANCE: "Performance",
  RETORNO_AS_CORRIDAS: "Retorno às corridas",
};

const LEVEL_LABELS: Record<string, string> = {
  INICIANTE: "Iniciante",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
  PRO: "Pro",
};

const statusVariants = { ativo: "success", risco: "danger", inativo: "default" } as const;
const statusLabels = { ativo: "Ativo", risco: "Em risco", inativo: "Inativo" } as const;

export default async function AthleteFullViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") redirect("/login");

  // Resolve coach record for ownership check
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) redirect("/treinador/dashboard");

  // Verify this athlete belongs to the logged-in coach (prevents IDOR)
  const dbAthlete = await prisma.athlete.findFirst({
    where: { id, coachId: coach.id },
    select: {
      id: true,
      status: true,
      adherenceRate: true,
      goal: true,
      level: true,
      raceDate: true,
      weightKg: true,
      heightCm: true,
      user: { select: { name: true, avatarUrl: true } },
    },
  });

  if (!dbAthlete) notFound();

  // Fetch real check-in history (last 10)
  const rawCheckins = await prisma.checkIn.findMany({
    where: { athleteId: dbAthlete.id },
    orderBy: { date: "desc" },
    take: 10,
    select: { date: true, rpe: true, pain: true, sleep: true, fatigue: true, mood: true },
  });
  const checkInHistory = rawCheckins.map((c) => ({
    date: c.date.toISOString().split("T")[0],
    rpe: c.rpe ?? 0,
    pain: c.pain ?? 0,
    sleep: c.sleep ?? 0,
    fatigue: c.fatigue ?? 0,
    mood: c.mood ?? 0,
  }));

  // Fetch recent workout sessions (last 5 completed)
  const rawLogs = await prisma.workoutLog.findMany({
    where: { athleteId: dbAthlete.id },
    include: { workout: { select: { date: true, title: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const recentSessions = rawLogs.filter((log) => log.workout).map((log) => ({
    id: log.id,
    title: log.workout!.title,
    date: new Date(log.workout!.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    pace: log.avgPaceSecPerKm
      ? `${Math.floor(log.avgPaceSecPerKm / 60)}:${String(log.avgPaceSecPerKm % 60).padStart(2, "0")}/km`
      : "—",
    rpe: log.rpe ?? null,
  }));

  // Active training plan with upcoming workouts
  const activePlan = await prisma.trainingPlan.findFirst({
    where: { athleteId: dbAthlete.id },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      name: true,
      goal: true,
      startDate: true,
      endDate: true,
      weeks: {
        orderBy: { weekNumber: "asc" },
        select: {
          id: true,
          weekNumber: true,
          phase: true,
          released: true,
          targetVolumeKm: true,
          workouts: {
            orderBy: { date: "asc" },
            select: {
              id: true,
              date: true,
              title: true,
              type: true,
              status: true,
              targetDistanceKm: true,
              targetDurationMin: true,
              targetPaceSecPerKm: true,
              targetRpe: true,
              structured: true,
            },
          },
        },
      },
    },
  });

  // Performance tests (most recent per type)
  const TEST_LABELS: Record<string, string> = {
    COOPER: "Cooper",
    CINCO_MINUTOS: "Teste 5 min",
    TRES_KM: "3 km",
    DOIS_MIL_E_QUATROCENTOS_M: "2.400 m",
    VAM: "VAM",
    RAST: "RAST",
    LIMIAR: "Limiar",
  };
  const rawTests = await prisma.performanceTest.findMany({
    where: { athleteId: dbAthlete.id },
    orderBy: { date: "desc" },
    take: 6,
    select: { type: true, date: true, vo2max: true, vamKmh: true, thresholdPaceSecPerKm: true, notes: true },
  });
  const performanceTests = rawTests.map((t) => {
    const result = [
      t.vo2max != null && `VO2máx ≈ ${t.vo2max.toFixed(1)} ml/kg/min`,
      t.vamKmh != null && `VAM ≈ ${t.vamKmh.toFixed(1)} km/h`,
      t.thresholdPaceSecPerKm != null &&
        `Pace limiar ≈ ${Math.floor(t.thresholdPaceSecPerKm / 60)}:${String(t.thresholdPaceSecPerKm % 60).padStart(2, "0")}/km`,
      t.notes,
    ].filter(Boolean).join(" · ");
    return {
      name: TEST_LABELS[t.type] ?? t.type,
      date: new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
      result: result || "—",
    };
  });

  // Weekly volume series (last 8 weeks)
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);
  const volumeLogs = await prisma.workoutLog.findMany({
    where: { athleteId: dbAthlete.id, workout: { date: { gte: eightWeeksAgo } } },
    include: { workout: { select: { date: true } } },
    orderBy: { createdAt: "asc" },
  });
  const weekMap = new Map<string, number>();
  for (const log of volumeLogs) {
    if (!log.workout) continue;
    const d = new Date(log.workout.date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    weekMap.set(label, (weekMap.get(label) ?? 0) + (log.distanceKm ?? 0));
  }
  const weeklyVolumeSeries = [...weekMap.entries()].map(([label, km]) => ({ label, km: Math.round(km * 10) / 10 }));

  // Weight series from Metric
  const metricRows = await prisma.metric.findMany({
    where: { athleteId: dbAthlete.id, weightKg: { not: null } },
    orderBy: { date: "asc" },
    take: 12,
    select: { date: true, weightKg: true },
  });
  const weightSeries = metricRows.map((m) => ({
    label: new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    kg: m.weightKg!,
  }));

  const calWorkouts: CalWorkout[] = activePlan?.weeks.flatMap((w) =>
    w.workouts.map((wo) => ({
      id: wo.id,
      date: new Date(wo.date).toISOString().slice(0, 10),
      type: wo.type as string,
      title: wo.title,
      status: wo.status as string,
      targetDistanceKm: wo.targetDistanceKm,
      targetDurationMin: wo.targetDurationMin,
      targetPaceSecPerKm: wo.targetPaceSecPerKm,
      targetRpe: wo.targetRpe,
      structured: wo.structured,
    }))
  ) ?? [];

  const rawStatus = dbAthlete.status ?? "ativo";
  const status = (rawStatus === "ativo" || rawStatus === "risco" || rawStatus === "inativo"
    ? rawStatus : "ativo") as "ativo" | "risco" | "inativo";

  const athlete = {
    id: dbAthlete.id,
    name: dbAthlete.user.name ?? "—",
    avatarUrl: dbAthlete.user.avatarUrl ?? undefined,
    status,
    adherence: dbAthlete.adherenceRate,
    goal: dbAthlete.goal ? (GOAL_LABELS[dbAthlete.goal] ?? dbAthlete.goal) : "—",
    level: LEVEL_LABELS[dbAthlete.level] ?? dbAthlete.level,
    raceDate: dbAthlete.raceDate ? dbAthlete.raceDate.toISOString().split("T")[0] : null,
    weeklyLoad: null as number | null,
    weightKg: dbAthlete.weightKg,
    heightCm: dbAthlete.heightCm,
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/treinador/atletas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
      {/* Header */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={athlete.avatarUrl} alt={athlete.name} />
              <AvatarFallback className="text-lg">{athlete.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-xl font-bold text-text sm:text-2xl">{athlete.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant={statusVariants[athlete.status]}>{statusLabels[athlete.status]}</Badge>
                <Badge variant="outline">{athlete.level}</Badge>
                <Badge variant="primary">{athlete.goal}</Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/treinador/prescricao/corrida"><Button variant="secondary">Prescrever treino</Button></Link>
            <WeeklyReleaseDialog athleteName={athlete.name} athleteId={athlete.id} />
          </div>
        </CardContent>
      </Card>

      {athlete.status === "risco" && (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="flex items-start gap-3 p-4">
            <Badge variant="danger" className="mt-0.5 shrink-0"><AlertTriangle className="h-3 w-3" /></Badge>
            <p className="text-sm text-text-muted">
              <span className="font-semibold text-text">Atenção:</span> esse atleta apresenta queda de adesão e
              indicadores de fadiga elevados nos últimos check-ins. O motor de check-in inteligente já reduziu o
              volume da semana automaticamente — revise o plano antes de liberar a próxima semana.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="visao">
        <TabsList>
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="fisico">Dados físicos &amp; testes</TabsTrigger>
          <TabsTrigger value="treinos">Treinos &amp; histórico</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="carga">Carga de treino</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="visao">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={Target} label="Objetivo" value={athlete.goal} />
            <Metric icon={Calendar} label="Próxima prova" value={athlete.raceDate ?? "—"} />
            <Metric icon={TrendingUp} label="Adesão" value={`${Math.round(athlete.adherence * 100)}%`} />
            <Metric
              icon={Activity}
              label="Carga semanal"
              value="—"
              tooltip="UA = Unidades Arbitrárias. Será calculada automaticamente a partir dos check-ins."
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-display text-sm font-semibold text-text">Volume semanal (km)</h3>
                {weeklyVolumeSeries.length > 0
                  ? <AreaTrend data={weeklyVolumeSeries} dataKey="km" color="#38bdf8" unit=" km" />
                  : <p className="py-8 text-center text-sm text-text-muted">Nenhum dado de volume ainda.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-display text-sm font-semibold text-text">Evolução do peso (kg)</h3>
                {weightSeries.length > 0
                  ? <AreaTrend data={weightSeries} dataKey="kg" color="#46E0C8" unit=" kg" />
                  : <p className="py-8 text-center text-sm text-text-muted">Nenhum dado de peso ainda.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Physical data & tests */}
        <TabsContent value="fisico">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={Weight} label="Peso" value={athlete.weightKg ? `${athlete.weightKg} kg` : "—"} />
            <Metric icon={Ruler} label="Altura" value={athlete.heightCm ? `${athlete.heightCm} cm` : "—"} />
            <Metric icon={HeartPulse} label="FC máxima" value="—" />
          </div>
          <div className="mt-5">
            <h3 className="mb-3 font-display text-sm font-semibold text-text">Avaliações &amp; testes recentes</h3>
            {performanceTests.length === 0 ? (
              <p className="text-sm text-text-muted">Nenhum teste de performance registrado.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {performanceTests.map((t) => (
                  <Card key={t.name + t.date}>
                    <CardContent className="p-4">
                      <p className="text-sm font-semibold text-text">{t.name}</p>
                      <p className="text-xs text-text-muted">{t.date}</p>
                      <p className="mt-1.5 text-sm text-text-muted">{t.result}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Workouts & history */}
        <TabsContent value="treinos">
          <div className="space-y-4">
            {/* Active training plan */}
            {activePlan ? (
              <>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Plano ativo</p>
                        <h3 className="mt-1 font-display text-base font-bold text-text">{activePlan.name}</h3>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {new Date(activePlan.startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          {" – "}
                          {new Date(activePlan.endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                          {" · "}{activePlan.weeks.length} semanas
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="primary">{activePlan.weeks.filter((w) => w.released).length}/{activePlan.weeks.length} sem. liberadas</Badge>
                        <DeletePlanButton planId={activePlan.id} planName={activePlan.name} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Workouts per week */}
                {activePlan.weeks.map((week) => {
                  const phaseLabels: Record<string, string> = { BASE: "Base", CONSTRUCAO: "Construção", ESPECIFICO: "Específico", POLIMENTO: "Taper" };
                  const phaseBadge: Record<string, "info" | "primary" | "warning" | "success"> = { BASE: "info", CONSTRUCAO: "primary", ESPECIFICO: "warning", POLIMENTO: "success" };
                  return (
                    <div key={week.id}>
                      <div className="mb-1.5 flex items-center gap-2 px-1">
                        <span className="text-xs font-semibold text-text-muted">Semana {week.weekNumber}</span>
                        <Badge variant={phaseBadge[week.phase] ?? "outline"} className="text-[10px]">{phaseLabels[week.phase] ?? week.phase}</Badge>
                        {week.released
                          ? <Badge variant="success" className="text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Liberada</Badge>
                          : <Badge variant="outline" className="text-[10px] text-text-muted">Não liberada</Badge>}
                        <span className="text-[10px] text-text-muted">{week.targetVolumeKm} km/sem</span>
                      </div>
                      {week.workouts.length === 0 ? (
                        <Card><CardContent className="px-4 py-3 text-xs text-text-muted">Nenhuma sessão gerada.</CardContent></Card>
                      ) : (
                        <div className="space-y-1.5">
                          {week.workouts.map((wo) => {
                            const pace = wo.targetPaceSecPerKm
                              ? `${Math.floor(wo.targetPaceSecPerKm / 60)}:${String(wo.targetPaceSecPerKm % 60).padStart(2, "0")}/km`
                              : null;
                            return (
                              <Card key={wo.id} className={wo.status === "LIBERADO" ? "border-success/20 bg-success/5" : ""}>
                                <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card-hover text-text-muted">
                                      <Dumbbell className="h-3.5 w-3.5" />
                                    </span>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-text">{wo.title}</p>
                                      <p className="text-[11px] text-text-muted">
                                        {new Date(wo.date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-3 text-right text-xs text-text-muted">
                                    {wo.targetDistanceKm && (
                                      <span className="hidden sm:flex items-center gap-1"><CalendarDays className="h-3 w-3" />{wo.targetDistanceKm} km</span>
                                    )}
                                    {pace && (
                                      <span className="hidden md:flex items-center gap-1 font-mono font-semibold text-text"><Clock className="h-3 w-3" />{pace}</span>
                                    )}
                                    <Badge variant={wo.status === "LIBERADO" ? "success" : wo.status === "CONCLUIDO" ? "primary" : "outline"} className="text-[10px]">
                                      {wo.status === "LIBERADO" ? "Liberado" : wo.status === "CONCLUIDO" ? "Concluído" : wo.status === "PERDIDO" ? "Perdido" : "Agendado"}
                                    </Badge>
                                    {wo.status !== "CONCLUIDO" && (
                                      <>
                                        <EditWorkoutButton
                                          workoutId={wo.id}
                                          currentDate={new Date(wo.date).toISOString().split("T")[0]}
                                          currentTitle={wo.title ?? ""}
                                        />
                                        <DeleteWorkoutButton workoutId={wo.id} />
                                      </>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <Card>
                <CardContent className="p-5">
                  <p className="py-8 text-center text-sm text-text-muted">Nenhum plano de treino criado ainda.</p>
                </CardContent>
              </Card>
            )}

            {/* Completed sessions */}
            {recentSessions.length > 0 && (
              <div>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-text-muted">Sessões concluídas</p>
                <div className="space-y-1.5">
                  {recentSessions.map((s) => (
                    <Card key={s.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                              <ClipboardList className="h-3.5 w-3.5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-text">{s.title}</p>
                              <p className="text-xs text-text-muted">{s.date}</p>
                            </div>
                          </div>
                          <div className="text-right text-xs text-text-muted">
                            <p className="font-semibold text-text">{s.pace}</p>
                            <p>RPE {s.rpe ?? "—"}</p>
                          </div>
                        </div>
                        <WorkoutLogComments
                          logId={s.id}
                          currentUserId={session.user.id}
                          currentUserRole={session.user.role}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Calendar with drag & drop rescheduling */}
        <TabsContent value="calendario">
          <AthleteCalendar athleteId={dbAthlete.id} initialWorkouts={calWorkouts} />
        </TabsContent>

        {/* Training load (CTL/ATL/TSB) */}
        <TabsContent value="carga">
          <TrainingLoadPanel athleteId={dbAthlete.id} />
        </TabsContent>

        {/* Check-ins */}
        <TabsContent value="checkins">
          {checkInHistory.length === 0 ? (
            <Card>
              <CardContent className="p-5">
                <p className="py-8 text-center text-sm text-text-muted">Nenhum check-in registrado ainda.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-text">
                      <Moon className="h-4 w-4 text-info" /> Sono x Fadiga (últimos check-ins)
                    </h3>
                    <LineTrend
                      data={checkInHistory.map((c) => ({ label: new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), sleep: c.sleep, fatigue: c.fatigue }))}
                      dataKey="sleep"
                      color="#38bdf8"
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-text">
                      <Activity className="h-4 w-4 text-danger" /> Dor reportada
                    </h3>
                    <LineTrend
                      data={checkInHistory.map((c) => ({ label: new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), pain: c.pain }))}
                      dataKey="pain"
                      color="#ef4444"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="mt-5 space-y-2">
                {checkInHistory.slice().reverse().map((c) => (
                  <Card key={c.date}>
                    <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-2 p-4 text-xs text-text-muted">
                      <span className="font-medium text-text">
                        {new Date(c.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" })}
                      </span>
                      <span>RPE {c.rpe}</span>
                      <span>Dor {c.pain}</span>
                      <span>Sono {c.sleep}</span>
                      <span>Fadiga {c.fatigue}</span>
                      <span>Humor {c.mood}</span>
                      <Progress value={(c.rpe / 10) * 100} className="h-1.5 max-w-[120px]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tooltip,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-muted">
            {label}
            {tooltip && <InfoTooltip text={tooltip} />}
          </p>
          <p className="truncate font-display text-base font-bold text-text">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
