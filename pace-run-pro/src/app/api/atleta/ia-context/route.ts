import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      level: true,
      goal: true,
      weightKg: true,
      raceDate: true,
      user: { select: { name: true } },
    },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  // Weekly volume from last 4 weeks
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const logs = await prisma.workoutLog.findMany({
    where: { athleteId: athlete.id, finishedAt: { gte: fourWeeksAgo } },
    select: { distanceKm: true },
  });
  const totalKm = logs.reduce((s, l) => s + (l.distanceKm ?? 0), 0);
  const avgWeeklyKm = Math.round(totalKm / 4);

  // Active plan name
  const activePlan = await prisma.trainingPlan.findFirst({
    where: { athleteId: athlete.id },
    orderBy: { startDate: "desc" },
    select: { name: true },
  });

  // Next race
  const nextRace = await prisma.race.findFirst({
    where: { athleteId: athlete.id, date: { gte: new Date() } },
    orderBy: { date: "asc" },
    select: { distanceKm: true, date: true },
  });

  // Recent PRs from performance tests
  const prTests = await prisma.performanceTest.findMany({
    where: { athleteId: athlete.id },
    orderBy: { date: "desc" },
    take: 10,
    select: { distanceM: true, durationSec: true },
  });
  const prMap: Record<string, string> = {};
  for (const t of prTests) {
    if (!t.durationSec || !t.distanceM) continue;
    const distKm = t.distanceM / 1000;
    const key = distKm >= 42 ? "42k" : distKm >= 21 ? "21k" : distKm >= 10 ? "10k" : "5k";
    if (!prMap[key]) {
      const h = Math.floor(t.durationSec / 3600);
      const m = Math.floor((t.durationSec % 3600) / 60);
      const s = t.durationSec % 60;
      prMap[key] = h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
    }
  }

  const LEVEL_LABELS: Record<string, string> = {
    INICIANTE: "Iniciante",
    INTERMEDIARIO: "Intermediário",
    AVANCADO: "Avançado",
    PRO: "Pro",
  };

  const GOAL_LABELS: Record<string, string> = {
    CINCO_KM: "5 km",
    DEZ_KM: "10 km",
    VINTE_E_UM_KM: "Meia maratona",
    QUARENTA_E_DOIS_KM: "Maratona",
    ULTRAMARATONA: "Ultramaratona",
    EMAGRECIMENTO: "Emagrecimento",
    PERFORMANCE: "Performance geral",
    RETORNO_AS_CORRIDAS: "Retorno às corridas",
  };

  return NextResponse.json({
    name: athlete.user.name,
    level: LEVEL_LABELS[athlete.level ?? ""] ?? "Não informado",
    goal: GOAL_LABELS[athlete.goal ?? ""] ?? "Não informado",
    weeklyVolume: avgWeeklyKm > 0 ? `${avgWeeklyKm} km/semana` : "Não disponível",
    currentPlan: activePlan?.name ?? "Sem plano ativo",
    nextRace: nextRace
      ? `${nextRace.distanceKm >= 42 ? "Maratona" : nextRace.distanceKm >= 21 ? "Meia maratona" : `${nextRace.distanceKm}km`} — ${new Date(nextRace.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`
      : "Nenhuma prova cadastrada",
    recentPRs: prMap,
  });
}
