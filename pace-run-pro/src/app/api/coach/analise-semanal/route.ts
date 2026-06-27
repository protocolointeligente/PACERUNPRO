import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function getWeekBounds(weekStart?: string) {
  let start: Date;

  if (weekStart) {
    start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
  } else {
    const today = new Date();
    const dow = today.getDay();
    const toMonday = dow === 0 ? -6 : 1 - dow;
    start = new Date(today);
    start.setDate(today.getDate() + toMonday);
    start.setHours(0, 0, 0, 0);
  }

  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  const prev = new Date(start);
  prev.setDate(start.getDate() - 7);

  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const label = `${fmt(start)} – ${fmt(new Date(end.getTime() - 86400_000))} ${start.getFullYear()}`;

  return { start, end, prev, label };
}

function pctDelta(curr: number, prev: number) {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function sumArr(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) {
    return NextResponse.json({ error: "Perfil de treinador não encontrado" }, { status: 404 });
  }

  const weekStartParam = req.nextUrl.searchParams.get("weekStart") ?? undefined;
  const week = getWeekBounds(weekStartParam);

  const athletes = await prisma.athlete.findMany({
    where: { coachId: coach.id },
    select: { id: true, user: { select: { name: true } } },
  });

  if (athletes.length === 0) {
    return NextResponse.json({ weekLabel: week.label, analyses: [] });
  }

  const athleteIds = athletes.map((a) => a.id);

  const [logsThis, logsPrev, workoutsThisWeek] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { athleteId: { in: athleteIds }, startedAt: { gte: week.start, lt: week.end } },
      select: { athleteId: true, distanceKm: true, durationSec: true, avgPaceSecPerKm: true, rpe: true },
    }),
    prisma.workoutLog.findMany({
      where: { athleteId: { in: athleteIds }, startedAt: { gte: week.prev, lt: week.start } },
      select: { athleteId: true, distanceKm: true, avgPaceSecPerKm: true },
    }),
    prisma.workout.findMany({
      where: {
        date: { gte: week.start, lt: week.end },
        week: { plan: { athleteId: { in: athleteIds } } },
      },
      select: { week: { select: { plan: { select: { athleteId: true } } } } },
    }),
  ]);

  // Group by athleteId
  const group = <T extends { athleteId: string }>(arr: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of arr) {
      if (!m.has(x.athleteId)) m.set(x.athleteId, []);
      m.get(x.athleteId)!.push(x);
    }
    return m;
  };

  const scheduledByAthlete = new Map<string, number>();
  for (const w of workoutsThisWeek) {
    const aid = w.week.plan.athleteId;
    scheduledByAthlete.set(aid, (scheduledByAthlete.get(aid) ?? 0) + 1);
  }

  const thisMap = group(logsThis);
  const prevMap = group(logsPrev);

  const analyses = athletes.map((ath) => {
    const thisLogs = thisMap.get(ath.id) ?? [];
    const prevLogs = prevMap.get(ath.id) ?? [];
    const sched = scheduledByAthlete.get(ath.id) ?? 0;

    const currVolume = sumArr(thisLogs.map((l) => l.distanceKm ?? 0));
    const prevVolume = sumArr(prevLogs.map((l) => l.distanceKm ?? 0));

    const pacePairs = thisLogs.filter((l) => l.avgPaceSecPerKm && l.distanceKm);
    const currPace =
      pacePairs.length > 0
        ? Math.round(
            sumArr(pacePairs.map((l) => l.avgPaceSecPerKm! * l.distanceKm!)) /
              sumArr(pacePairs.map((l) => l.distanceKm!)),
          )
        : 0;
    const prevPacePairs = prevLogs.filter((l) => l.avgPaceSecPerKm && l.distanceKm);
    const prevPace =
      prevPacePairs.length > 0
        ? Math.round(
            sumArr(prevPacePairs.map((l) => l.avgPaceSecPerKm! * l.distanceKm!)) /
              sumArr(prevPacePairs.map((l) => l.distanceKm!)),
          )
        : 0;

    const adherence =
      sched > 0
        ? Math.min(100, Math.round((thisLogs.length / sched) * 100))
        : thisLogs.length > 0
        ? 100
        : 0;

    const riskLevel: "low" | "medium" | "high" =
      adherence >= 85 ? "low" : adherence >= 70 ? "medium" : "high";

    const highlights: string[] = [];
    if (currVolume > prevVolume * 1.1 && prevVolume > 0) {
      highlights.push(`Volume +${pctDelta(currVolume, prevVolume).toFixed(1)}% vs semana anterior.`);
    } else if (currVolume < prevVolume * 0.9 && prevVolume > 0) {
      highlights.push(`Volume -${Math.abs(pctDelta(currVolume, prevVolume)).toFixed(1)}% vs semana anterior.`);
    }
    if (riskLevel === "high") {
      highlights.push(`Aderência baixa (${adherence}%) — verificar com atleta.`);
    } else if (riskLevel === "low") {
      highlights.push(`Ótima aderência (${adherence}%).`);
    }
    if (highlights.length === 0) {
      highlights.push(`${thisLogs.length} sessão${thisLogs.length !== 1 ? "s" : ""} completada${thisLogs.length !== 1 ? "s" : ""}.`);
    }

    return {
      athleteId: ath.id,
      athleteName: ath.user.name,
      weekLabel: week.label,
      adherence,
      riskLevel,
      highlights,
      recommendation:
        riskLevel === "high"
          ? "Verificar barreiras: lesão, desmotivação ou excesso de trabalho."
          : riskLevel === "medium"
          ? "Monitorar próxima semana e oferecer suporte proativo."
          : "Atleta em boa forma — manter a progressão.",
      metrics: [
        {
          label: "Volume",
          value: Math.round(currVolume * 10) / 10,
          prev: Math.round(prevVolume * 10) / 10,
          unit: "km",
          delta: pctDelta(currVolume, prevVolume),
        },
        {
          label: "Sessões",
          value: thisLogs.length,
          prev: prevLogs.length,
          unit: "sessões",
          delta: pctDelta(thisLogs.length, prevLogs.length),
        },
        {
          label: "Pace médio",
          value: currPace,
          prev: prevPace,
          unit: "s/km",
          delta: pctDelta(currPace, prevPace),
        },
      ],
    };
  });

  return NextResponse.json({ weekLabel: week.label, analyses });
}
