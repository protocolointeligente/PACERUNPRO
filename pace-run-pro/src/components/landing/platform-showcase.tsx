"use client";

import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  Smartphone,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AreaTrend } from "@/components/charts/trend-chart";
import {
  athleteList,
  coachOverview,
  currentAthlete,
  smartAlerts,
  todayWorkout,
  weekSummary,
  weekWorkouts,
  weeklyVolumeSeries,
  TYPE_COLORS,
  TYPE_LABELS,
  getSubtypeColor,
} from "@/lib/mock-data";
import { cn, formatPace } from "@/lib/utils";

const WEEKDAY_LABELS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

const accentMap: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  info: "bg-info/15 text-info",
  danger: "bg-danger/15 text-danger",
};

function BrowserFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
        <div className="ml-2 flex-1 truncate rounded-md bg-background/80 px-3 py-1 text-center text-[11px] text-text-muted">
          {title}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border border-border bg-background shadow-2xl shadow-black/40">
      <div className="flex justify-center border-b border-border bg-card py-2.5">
        <div className="h-1.5 w-20 rounded-full bg-text-muted/30" />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  accent = "primary",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "info" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-card-hover/40 p-3">
      <span className={cn("mb-2 flex h-7 w-7 items-center justify-center rounded-lg", accentMap[accent])}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="font-stat text-lg font-bold text-text">{value}</p>
      <p className="text-[11px] text-text-muted">{label}</p>
    </div>
  );
}

export function PlatformShowcase() {
  const alert = smartAlerts[0];
  const athlete = athleteList[0];

  return (
    <section id="plataforma" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">Veja na prática</Badge>
          <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
            A plataforma{" "}
            <span className="gradient-text">em ação</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-text-muted">
            As mesmas telas que treinadores e atletas usam todos os dias — prescrição, execução,
            check-in com IA e evolução, tudo em português.
          </p>
        </div>

        <Tabs defaultValue="treinador">
          <div className="mb-10 flex justify-center">
            <TabsList className="h-auto w-full flex-wrap justify-center gap-1.5 p-1.5 sm:w-auto">
              <TabsTrigger value="treinador" className="gap-1.5 px-4 py-2 text-xs sm:text-sm">
                <LayoutDashboard className="h-4 w-4" /> Dashboard do treinador
              </TabsTrigger>
              <TabsTrigger value="atleta" className="gap-1.5 px-4 py-2 text-xs sm:text-sm">
                <Smartphone className="h-4 w-4" /> Tela do atleta
              </TabsTrigger>
              <TabsTrigger value="prescricao" className="gap-1.5 px-4 py-2 text-xs sm:text-sm">
                <ClipboardList className="h-4 w-4" /> Prescrição semanal
              </TabsTrigger>
              <TabsTrigger value="checkin" className="gap-1.5 px-4 py-2 text-xs sm:text-sm">
                <Sparkles className="h-4 w-4" /> Check-in com IA
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard do treinador */}
          <TabsContent value="treinador">
            <BrowserFrame title="app.pacerunpro.com.br/treinador/dashboard">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-text-muted">
                      Olá, {coachOverview.name.split(" ")[0]} 👋
                    </p>
                    <h4 className="font-display text-lg font-bold text-text">
                      Visão geral da semana
                    </h4>
                  </div>
                  <Badge variant="primary">{coachOverview.credential}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat label="Atletas ativos" value={String(coachOverview.athletesCount)} icon={Users} />
                  <MiniStat label="Treinos prescritos" value={String(coachOverview.prescribedThisWeek)} icon={ClipboardList} accent="info" />
                  <MiniStat label="Check-ins pendentes" value={String(coachOverview.pendingCheckIns)} icon={Inbox} accent="success" />
                  <MiniStat label="Carga da equipe" value={`${Math.round(coachOverview.teamLoad * 100)}%`} icon={Activity} accent="warning" />
                </div>

                <Card className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary font-display text-xs font-bold text-white">
                        CA
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{athlete.name}</p>
                        <p className="text-xs text-text-muted">
                          Meta: {athlete.goal} · Último check-in {athlete.lastCheckIn}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Adesão {Math.round(athlete.adherence * 100)}%</Badge>
                  </div>
                </Card>

                <Card className="border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning">
                      <AlertTriangle className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text">{alert.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{alert.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </BrowserFrame>
          </TabsContent>

          {/* Tela do atleta */}
          <TabsContent value="atleta">
            <PhoneFrame>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-text-muted">{weekSummary.weekLabel}</p>
                    <h4 className="font-display text-lg font-bold text-text">
                      Olá, {currentAthlete.firstName} 👋
                    </h4>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary font-display text-xs font-bold text-white">
                    CA
                  </div>
                </div>

                <Card className="border-primary/30 bg-primary/5 p-4">
                  <Badge
                    style={{
                      borderColor: `${TYPE_COLORS.corrida}55`,
                      color: TYPE_COLORS.corrida,
                      backgroundColor: `${TYPE_COLORS.corrida}1a`,
                    }}
                    className="mb-2 border"
                  >
                    Treino de hoje
                  </Badge>
                  <p className="font-display text-base font-bold text-text">{todayWorkout.title}</p>
                  <div className="mt-3 flex gap-4">
                    <div>
                      <p className="font-stat text-lg font-bold text-text">{todayWorkout.distanceKm} km</p>
                      <p className="text-[11px] text-text-muted">Distância</p>
                    </div>
                    <div>
                      <p className="font-stat text-lg font-bold text-text">
                        {formatPace(todayWorkout.targetPaceSecPerKm!)}
                      </p>
                      <p className="text-[11px] text-text-muted">Pace alvo</p>
                    </div>
                    <div>
                      <p className="font-stat text-lg font-bold text-text">RPE {todayWorkout.targetRpe}</p>
                      <p className="text-[11px] text-text-muted">Intensidade</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-text-muted">Volume da semana</span>
                    <span className="font-stat font-bold text-text">
                      {weekSummary.doneKm} / {weekSummary.plannedKm} km
                    </span>
                  </div>
                  <Progress value={(weekSummary.doneKm / weekSummary.plannedKm) * 100} />
                </Card>

                <Card className="p-4">
                  <p className="mb-1 text-sm text-text-muted">Evolução do volume semanal</p>
                  <AreaTrend data={weeklyVolumeSeries} dataKey="km" color="#38bdf8" unit=" km" />
                </Card>
              </div>
            </PhoneFrame>
          </TabsContent>

          {/* Prescrição semanal */}
          <TabsContent value="prescricao">
            <BrowserFrame title="app.pacerunpro.com.br/treinador/prescricao">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display text-lg font-bold text-text">
                      Plano da semana — {currentAthlete.name}
                    </h4>
                    <p className="text-xs text-text-muted">{weekSummary.weekLabel}</p>
                  </div>
                  <Badge variant="info">Bloco: Construção</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {weekWorkouts.map((w, i) => (
                    <div key={w.id} className="rounded-xl border border-border bg-card-hover/30 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                          {WEEKDAY_LABELS[i]}
                        </span>
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: getSubtypeColor(w.type, w.subtype) }}
                        />
                      </div>
                      <Badge
                        style={{
                          borderColor: `${w.color}55`,
                          color: w.color,
                          backgroundColor: `${w.color}1a`,
                        }}
                        className="mb-1.5 border text-[10px]"
                      >
                        {TYPE_LABELS[w.type]}
                      </Badge>
                      <p className="text-xs font-semibold leading-snug text-text">{w.title}</p>
                      <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-text-muted">
                        {w.distanceKm && <span>{w.distanceKm} km</span>}
                        {w.durationMin && <span>{w.durationMin} min</span>}
                        {w.targetPaceSecPerKm && <span>{formatPace(w.targetPaceSecPerKm)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </BrowserFrame>
          </TabsContent>

          {/* Check-in com IA */}
          <TabsContent value="checkin">
            <PhoneFrame>
              <div className="space-y-3">
                <div className="mb-1 text-center">
                  <Badge variant="primary" className="mb-1">
                    <Sparkles className="h-3 w-3" /> Check-in inteligente
                  </Badge>
                  <p className="text-[11px] text-text-muted">Todo dia, em 30 segundos</p>
                </div>

                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-primary text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-card-hover px-3 py-2 text-sm text-text">
                    Bom dia, Camila! Como você dormiu e está se sentindo hoje?
                  </div>
                </div>

                <div className="ml-9 space-y-2.5 rounded-2xl border border-border bg-background/60 p-3">
                  {[
                    { label: "Qualidade do sono", value: 7 },
                    { label: "Fadiga muscular", value: 6 },
                    { label: "Dor / desconforto", value: 3 },
                    { label: "Motivação", value: 8 },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-text-muted">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={row.value * 10} className="h-1.5 w-16" />
                        <span className="font-stat text-xs font-bold text-text">{row.value}/10</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm gradient-primary px-3 py-2 text-sm font-medium text-white">
                    Enviado ✅
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-primary text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm">
                    <p className="font-semibold text-warning">⚠️ Fadiga acumulada detectada</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      Sua fadiga muscular subiu 18% nos últimos 3 dias. O treino de amanhã foi
                      ajustado automaticamente:{" "}
                      <strong className="font-semibold text-text">
                        intervalado reduzido em 15% de volume
                      </strong>{" "}
                      para preservar sua recuperação.
                    </p>
                  </div>
                </div>
              </div>
            </PhoneFrame>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
