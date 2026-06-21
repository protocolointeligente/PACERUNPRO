import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowLeft, Calendar, ClipboardList, HeartPulse, Moon, Ruler, Target, TrendingUp, Weight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaTrend, LineTrend } from "@/components/charts/trend-chart";
import { WeeklyReleaseDialog } from "@/components/coach/weekly-release-dialog";
import { checkInHistory, recentSessions, weeklyVolumeSeries, weightSeries } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";

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

  const dbAthlete = await prisma.athlete.findUnique({
    where: { id },
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
            <WeeklyReleaseDialog athleteName={athlete.name} />
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
          <TabsTrigger value="checkins">Check-ins &amp; carga</TabsTrigger>
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
                <AreaTrend data={weeklyVolumeSeries} dataKey="km" color="#38bdf8" unit=" km" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-display text-sm font-semibold text-text">Evolução do peso (kg)</h3>
                <AreaTrend data={weightSeries} dataKey="kg" color="#a855f7" unit=" kg" />
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
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: "Cooper — 2.600 m", date: "18 mai 2026", result: "VO2máx ≈ 46.8 ml/kg/min" },
                { name: "VAM — 2.000 m em 8:00", date: "18 mai 2026", result: "VAM ≈ 15.0 km/h · pace 4:00/km" },
                { name: "Limiar — teste de 25 min", date: "12 mar 2026", result: "Pace de limiar ≈ 5:00/km" },
                { name: "Avaliação física completa", date: "02 fev 2026", result: "% gordura: 19.4% · IMC: 22.0" },
              ].map((t) => (
                <Card key={t.name}>
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-text">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.date}</p>
                    <p className="mt-1.5 text-sm text-text-muted">{t.result}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Workouts & history */}
        <TabsContent value="treinos">
          <div className="space-y-2.5">
            {recentSessions.map((s) => (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-card-hover text-text-muted">
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text">{s.title}</p>
                      <p className="text-xs text-text-muted">{s.date}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-text-muted">
                    <p className="font-semibold text-text">{s.pace}</p>
                    <p>RPE {s.rpe}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Check-ins & load */}
        <TabsContent value="checkins">
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
