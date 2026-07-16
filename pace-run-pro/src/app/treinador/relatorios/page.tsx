import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Download, FileText, Users } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function CoachReportsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const since = daysAgo(30);
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: {
        where: { deletedAt: null },
        select: {
          id: true,
          status: true,
          adherenceRate: true,
          user: { select: { name: true, email: true } },
          workoutLogs: {
            where: { startedAt: { gte: since } },
            select: { distanceKm: true, durationSec: true, avgHr: true, rpe: true, source: true },
          },
          checkins: {
            where: { date: { gte: since } },
            select: { flagged: true, sleep: true, stress: true, fatigue: true },
          },
        },
      },
    },
  });

  if (!coach) redirect("/login");

  const workouts = await prisma.workout.findMany({
    where: { date: { gte: since }, week: { plan: { coachId: coach.id } } },
    select: { id: true, status: true, targetDistanceKm: true, targetDurationMin: true },
  });

  const actualLogs = coach.athletes.flatMap((athlete) => athlete.workoutLogs);
  const plannedSessions = workouts.length;
  const completedSessions = actualLogs.length;
  const plannedDistance = workouts.reduce((sum, workout) => sum + (workout.targetDistanceKm ?? 0), 0);
  const actualDistance = actualLogs.reduce((sum, log) => sum + (log.distanceKm ?? 0), 0);
  const actualHours = actualLogs.reduce((sum, log) => sum + (log.durationSec ?? 0), 0) / 3600;
  const flags = coach.athletes.reduce((sum, athlete) => sum + athlete.checkins.filter((checkin) => checkin.flagged).length, 0);
  const sourceCounts = actualLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.source] = (acc[log.source] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="primary">Relatórios</Badge>
          <h1 className="mt-3 font-display text-3xl font-bold text-text">Indicadores da assessoria</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Últimos 30 dias com base em treinos planejados, logs realizados e check-ins.
          </p>
        </div>
        <Link href="/treinador/analise-semanal" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
          Análise semanal <BarChart3 className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Sessões planejadas" value={String(plannedSessions)} />
        <Metric label="Sessões realizadas" value={String(completedSessions)} />
        <Metric label="Distância realizada" value={`${actualDistance.toFixed(1)} km`} />
        <Metric label="Horas realizadas" value={`${actualHours.toFixed(1)} h`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardContent className="p-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-bold text-text">Atletas no período</h2>
              <p className="text-sm text-text-muted">Resumo para revisão mensal.</p>
            </div>
            <div className="divide-y divide-border">
              {coach.athletes.length === 0 ? (
                <div className="px-5 py-10 text-sm text-text-muted">Nenhum atleta vinculado.</div>
              ) : coach.athletes.map((athlete) => {
                const distance = athlete.workoutLogs.reduce((sum, log) => sum + (log.distanceKm ?? 0), 0);
                const duration = athlete.workoutLogs.reduce((sum, log) => sum + (log.durationSec ?? 0), 0) / 3600;
                const flagged = athlete.checkins.filter((checkin) => checkin.flagged).length;
                return (
                  <Link key={athlete.id} href={`/treinador/atletas/${athlete.id}`} className="grid gap-3 px-5 py-4 transition-colors hover:bg-card-hover md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                    <div>
                      <p className="font-semibold text-text">{athlete.user.name}</p>
                      <p className="text-xs text-text-muted">{athlete.user.email}</p>
                    </div>
                    <Badge variant={(athlete.adherenceRate ?? 0) >= 0.8 ? "success" : "outline"}>{Math.round((athlete.adherenceRate ?? 0) * 100)}% aderência</Badge>
                    <p className="text-sm text-text-muted">{distance.toFixed(1)} km · {duration.toFixed(1)} h</p>
                    <Badge variant={flagged > 0 ? "warning" : "outline"}>{flagged} alerta(s)</Badge>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-text">Planejado x realizado</h2>
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <ReportLine label="Sessões" value={`${completedSessions}/${plannedSessions}`} percent={plannedSessions ? Math.min(100, Math.round((completedSessions / plannedSessions) * 100)) : 0} />
              <ReportLine label="Distância" value={`${actualDistance.toFixed(1)}/${plannedDistance.toFixed(1)} km`} percent={plannedDistance ? Math.min(100, Math.round((actualDistance / plannedDistance) * 100)) : 0} />
              <ReportLine label="Check-ins em alerta" value={String(flags)} percent={flags > 0 ? 100 : 0} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="font-display text-lg font-bold text-text">Fontes de dados</h2>
              {Object.keys(sourceCounts).length === 0 ? (
                <p className="text-sm text-text-muted">Nenhum log realizado nos últimos 30 dias.</p>
              ) : Object.entries(sourceCounts).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-text-muted">{source}</span>
                  <span className="font-semibold text-text">{count}</span>
                </div>
              ))}
              <button className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full")} disabled>
                <Download className="h-4 w-4" />
                Exportar PDF em breve
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-text">{value}</p>
        </div>
        <Users className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}

function ReportLine({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">{label}</span>
        <span className="font-semibold text-text">{value}</span>
      </div>
      <span className="block h-2 rounded-full bg-card-hover">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </span>
    </div>
  );
}
