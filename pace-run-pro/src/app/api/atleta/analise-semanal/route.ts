import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

function getWeekBounds(weeksAgo = 0) {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const start = new Date(today);
  start.setDate(today.getDate() + toMonday - weeksAgo * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const label = `${fmt(start)} – ${fmt(new Date(end.getTime() - 86400_000))} ${start.getFullYear()}`;

  return { start, end, label };
}

function pctDelta(curr: number, prev: number): number {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
  }

  const curr = getWeekBounds(0);
  const prev = getWeekBounds(1);

  const [logsThis, logsPrev, plannedWorkouts] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { athleteId: athlete.id, startedAt: { gte: curr.start, lt: curr.end } },
      select: {
        startedAt: true,
        distanceKm: true,
        durationSec: true,
        avgPaceSecPerKm: true,
        avgHr: true,
        rpe: true,
      },
    }),
    prisma.workoutLog.findMany({
      where: { athleteId: athlete.id, startedAt: { gte: prev.start, lt: prev.end } },
      select: {
        distanceKm: true,
        durationSec: true,
        avgPaceSecPerKm: true,
        avgHr: true,
        rpe: true,
      },
    }),
    prisma.workout.findMany({
      where: {
        date: { gte: curr.start, lt: curr.end },
        week: { plan: { athleteId: athlete.id } },
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        targetDistanceKm: true,
        targetDurationMin: true,
        targetRpe: true,
        date: true,
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const scheduled = plannedWorkouts.length;

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  const currVolume = sum(logsThis.map((l) => l.distanceKm ?? 0));
  const prevVolume = sum(logsPrev.map((l) => l.distanceKm ?? 0));

  const pacePairs = logsThis.filter((l) => l.avgPaceSecPerKm && l.distanceKm);
  const currPace =
    pacePairs.length > 0
      ? Math.round(
          sum(pacePairs.map((l) => l.avgPaceSecPerKm! * l.distanceKm!)) /
            sum(pacePairs.map((l) => l.distanceKm!)),
        )
      : 0;
  const prevPacePairs = logsPrev.filter((l) => l.avgPaceSecPerKm && l.distanceKm);
  const prevPace =
    prevPacePairs.length > 0
      ? Math.round(
          sum(prevPacePairs.map((l) => l.avgPaceSecPerKm! * l.distanceKm!)) /
            sum(prevPacePairs.map((l) => l.distanceKm!)),
        )
      : 0;

  const hrThis = logsThis.filter((l) => l.avgHr).map((l) => l.avgHr!);
  const currHr = hrThis.length > 0 ? Math.round(sum(hrThis) / hrThis.length) : 0;
  const hrPrev = logsPrev.filter((l) => l.avgHr).map((l) => l.avgHr!);
  const prevHr = hrPrev.length > 0 ? Math.round(sum(hrPrev) / hrPrev.length) : 0;

  type LoadEntry = { durationSec: number | null; rpe: number | null };
  const load = (logs: LoadEntry[]) =>
    sum(logs.map((l) => Math.round((l.durationSec ?? 0) / 60) * (l.rpe ?? 5)));
  const currLoad = load(logsThis);
  const prevLoad = load(logsPrev);

  const metrics = [
    {
      label: "Volume",
      value: Math.round(currVolume * 10) / 10,
      prev: Math.round(prevVolume * 10) / 10,
      unit: "km",
      delta: pctDelta(currVolume, prevVolume),
    },
    {
      label: "Sessões",
      value: logsThis.length,
      prev: logsPrev.length,
      unit: "sessões",
      delta: pctDelta(logsThis.length, logsPrev.length),
    },
    {
      label: "Pace médio",
      value: currPace,
      prev: prevPace,
      unit: "s/km",
      delta: pctDelta(currPace, prevPace),
    },
    {
      label: "FC média",
      value: currHr,
      prev: prevHr,
      unit: "bpm",
      delta: pctDelta(currHr, prevHr),
    },
    {
      label: "Carga",
      value: currLoad,
      prev: prevLoad,
      unit: "UA",
      delta: pctDelta(currLoad, prevLoad),
    },
  ];

  // Daily volume Mon–Sun
  const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const dailyVolume = DAY_NAMES.map((day, i) => {
    const d = new Date(curr.start);
    d.setDate(d.getDate() + i);
    const km = Math.round(
      sum(
        logsThis
          .filter(
            (l) =>
              l.startedAt &&
              new Date(l.startedAt).toDateString() === d.toDateString(),
          )
          .map((l) => l.distanceKm ?? 0),
      ) * 10,
    ) / 10;
    return { day, km };
  });

  const adherence =
    scheduled > 0
      ? Math.min(100, Math.round((logsThis.length / scheduled) * 100))
      : logsThis.length > 0
      ? 100
      : 0;

  const highlights: string[] = [];
  if (currVolume > prevVolume * 1.1 && prevVolume > 0) {
    highlights.push(
      `Volume aumentou ${pctDelta(currVolume, prevVolume).toFixed(1)}% em relação à semana anterior.`,
    );
  } else if (currVolume < prevVolume * 0.9 && prevVolume > 0) {
    highlights.push(
      `Volume reduziu ${Math.abs(pctDelta(currVolume, prevVolume)).toFixed(1)}% — semana de recuperação.`,
    );
  }
  if (adherence >= 85) {
    highlights.push(`Ótima aderência de ${adherence}% — todos os treinos no prazo.`);
  } else if (adherence > 0) {
    highlights.push(`Aderência de ${adherence}% — mantenha o ritmo na próxima semana.`);
  }
  if (currLoad > prevLoad * 1.2 && prevLoad > 0) {
    highlights.push("Carga de treino elevada esta semana — priorize a recuperação.");
  }
  if (highlights.length === 0) {
    highlights.push("Semana dentro da meta. Mantenha a consistência!");
  }

  const riskLevel: "low" | "medium" | "high" =
    adherence >= 85 ? "low" : adherence >= 70 ? "medium" : "high";

  // Planned vs actual breakdown
  const plannedVolumeKm = plannedWorkouts.reduce((s, w) => s + (w.targetDistanceKm ?? 0), 0);
  const plannedDurationMin = plannedWorkouts.reduce((s, w) => s + (w.targetDurationMin ?? 0), 0);
  const actualVolumeKm = logsThis.reduce((s, l) => s + (l.distanceKm ?? 0), 0);
  const actualDurationMin = logsThis.reduce((s, l) => s + Math.round((l.durationSec ?? 0) / 60), 0);

  const statusCounts = {
    CONCLUIDO: plannedWorkouts.filter((w) => w.status === "CONCLUIDO").length,
    PERDIDO:   plannedWorkouts.filter((w) => w.status === "PERDIDO").length,
    LIBERADO:  plannedWorkouts.filter((w) => w.status === "LIBERADO").length,
    AGENDADO:  plannedWorkouts.filter((w) => w.status === "AGENDADO").length,
    AJUSTADO:  plannedWorkouts.filter((w) => w.status === "AJUSTADO").length,
  };

  return NextResponse.json({
    weekLabel: curr.label,
    metrics,
    dailyVolume,
    adherence,
    riskLevel,
    highlights,
    // Planned vs actual summary
    plannedVolumeKm: Math.round(plannedVolumeKm * 10) / 10,
    actualVolumeKm:  Math.round(actualVolumeKm * 10) / 10,
    plannedDurationMin,
    actualDurationMin,
    plannedSessions: scheduled,
    completedSessions: statusCounts.CONCLUIDO,
    statusCounts,
    workouts: plannedWorkouts.map((w) => ({
      id: w.id,
      title: w.title,
      type: w.type,
      status: w.status,
      date: w.date,
      targetDistanceKm: w.targetDistanceKm,
      targetDurationMin: w.targetDurationMin,
      targetRpe: w.targetRpe,
    })),
    recommendation:
      adherence >= 85
        ? "Continue com a consistência — você está progredindo muito bem!"
        : adherence >= 70
        ? "Faltaram alguns treinos. Ajuste a agenda para a próxima semana."
        : "Aderência abaixo do ideal. Converse com seu treinador para revisar o plano.",
  });
}
