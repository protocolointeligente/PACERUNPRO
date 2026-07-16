import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Activity, AlertTriangle, CheckCircle2, HeartPulse } from "lucide-react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(start: Date) {
  const d = new Date(start);
  d.setDate(d.getDate() + 7);
  return d;
}

function avg(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

export default async function CoachWeeklyAnalysisPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const weekStart = startOfWeek();
  const weekEnd = endOfWeek(weekStart);

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          adherenceRate: true,
          recoveryScore: true,
          user: { select: { name: true, email: true, avatarUrl: true } },
          workoutLogs: {
            where: { startedAt: { gte: weekStart, lt: weekEnd } },
            select: { durationSec: true, distanceKm: true, avgHr: true, rpe: true, source: true },
          },
          checkins: {
            where: { date: { gte: weekStart, lt: weekEnd } },
            select: { sleep: true, stress: true, fatigue: true, pain: true, flagged: true },
          },
        },
      },
    },
  });

  if (!coach) redirect("/login");

  const plannedByAthlete = await prisma.workout.groupBy({
    by: ["weekId"],
    where: {
      date: { gte: weekStart, lt: weekEnd },
      week: { plan: { coachId: coach.id } },
    },
    _count: { _all: true },
  });
  const weekIds = plannedByAthlete.map((item) => item.weekId);
  const weeks = weekIds.length
    ? await prisma.trainingWeek.findMany({
        where: { id: { in: weekIds } },
        select: { id: true, plan: { select: { athleteId: true } } },
      })
    : [];
  const athleteByWeek = new Map(weeks.map((week) => [week.id, week.plan.athleteId]));
  const plannedMap = new Map<string, number>();
  plannedByAthlete.forEach((item) => {
    const athleteId = athleteByWeek.get(item.weekId);
    if (athleteId) plannedMap.set(athleteId, (plannedMap.get(athleteId) ?? 0) + item._count._all);
  });

  const rows = coach.athletes.map((athlete) => {
    const planned = plannedMap.get(athlete.id) ?? 0;
    const done = athlete.workoutLogs.length;
    const adherence = planned > 0 ? Math.round((done / planned) * 100) : Math.round((athlete.adherenceRate ?? 0) * 100);
    const durationMin = Math.round(athlete.workoutLogs.reduce((sum, log) => sum + (log.durationSec ?? 0), 0) / 60);
    const distanceKm = athlete.workoutLogs.reduce((sum, log) => sum + (log.distanceKm ?? 0), 0);
    const sleep = avg(athlete.checkins.map((checkin) => checkin.sleep));
    const stress = avg(athlete.checkins.map((checkin) => checkin.stress));
    const fatigue = avg(athlete.checkins.map((checkin) => checkin.fatigue));
    const flagged = athlete.checkins.some((checkin) => checkin.flagged || (checkin.pain ?? 0) >= 7 || (checkin.fatigue ?? 0) >= 8);
    return { athlete, planned, done, adherence, durationMin, distanceKm, sleep, stress, fatigue, flagged };
  });

  const totalPlanned = rows.reduce((sum, row) => sum + row.planned, 0);
  const totalDone = rows.reduce((sum, row) => sum + row.done, 0);
  const avgAdherence = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.adherence, 0) / rows.length) : 0;
  const riskCount = rows.filter((row) => row.flagged || row.adherence < 60).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Badge variant="primary">Análise semanal</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold text-text">Carga, aderência e prontidão</h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Semana de {weekStart.toLocaleDateString("pt-BR")} a {new Date(weekEnd.getTime() - 1).toLocaleDateString("pt-BR")}.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Planejados" value={String(totalPlanned)} icon={<Activity className="h-5 w-5" />} />
        <Metric label="Realizados" value={String(totalDone)} icon={<CheckCircle2 className="h-5 w-5" />} />
        <Metric label="Aderência média" value={`${avgAdherence}%`} icon={<HeartPulse className="h-5 w-5" />} />
        <Metric label="Atenções" value={String(riskCount)} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold text-text">Atletas da semana</h2>
            <p className="text-sm text-text-muted">Clique no atleta para abrir métricas completas.</p>
          </div>
          <div className="divide-y divide-border">
            {rows.length === 0 ? (
              <div className="px-5 py-10 text-sm text-text-muted">Nenhum atleta vinculado.</div>
            ) : rows.map((row) => (
              <Link key={row.athlete.id} href={`/treinador/atletas/${row.athlete.id}`} className="grid gap-3 px-5 py-4 transition-colors hover:bg-card-hover md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                <div>
                  <p className="font-semibold text-text">{row.athlete.user.name}</p>
                  <p className="text-xs text-text-muted">{row.done}/{row.planned || "?"} sessões · {row.distanceKm.toFixed(1)} km · {row.durationMin} min</p>
                </div>
                <Badge variant={row.adherence >= 80 ? "success" : row.adherence >= 60 ? "warning" : "danger"}>{row.adherence}% aderência</Badge>
                <p className="text-sm text-text-muted">Sono {row.sleep?.toFixed(1) ?? "-"} · Stress {row.stress?.toFixed(1) ?? "-"}</p>
                <Badge variant={row.flagged ? "danger" : "outline"}>{row.flagged ? "Atenção" : "OK"}</Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-text">{value}</p>
        </div>
        <span className="text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}
