import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { AthleteRow } from "./_list-client";
import AthleteListClient from "./_list-client";

const GOAL_LABELS: Record<string, string> = {
  CINCO_KM: "5 km",
  DEZ_KM: "10 km",
  VINTE_E_UM_KM: "21 km",
  QUARENTA_E_DOIS_KM: "42 km",
  ULTRAMARATONA: "Ultra",
  EMAGRECIMENTO: "Emagrecimento",
  PERFORMANCE: "Performance",
  RETORNO_AS_CORRIDAS: "Retorno",
};

const LEVEL_LABELS: Record<string, string> = {
  INICIANTE: "Iniciante",
  INTERMEDIARIO: "Intermediário",
  AVANCADO: "Avançado",
  PRO: "Pro",
};

function formatLastCheckIn(date?: Date | null): string {
  if (!date) return "Nunca";
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  return `${days} dias atrás`;
}

function formatRaceDate(date?: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AthleteListPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [coach, recentLogs] = await Promise.all([
    prisma.coach.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        athletes: {
          select: {
            id: true,
            status: true,
            adherenceRate: true,
            goal: true,
            level: true,
            raceDate: true,
            user: { select: { name: true, avatarUrl: true } },
            checkins: {
              orderBy: { date: "desc" },
              take: 1,
              select: { date: true },
            },
          },
          orderBy: { user: { name: "asc" } },
        },
      },
    }),
    prisma.workoutLog.findMany({
      where: { startedAt: { gte: sevenDaysAgo } },
      select: { athleteId: true, durationSec: true, rpe: true },
    }),
  ]);

  const loadByAthlete = new Map<string, number>();
  for (const log of recentLogs) {
    const dur = (log.durationSec ?? 0) / 60;
    const rpe = Math.min(log.rpe ?? 5, 10);
    const prev = loadByAthlete.get(log.athleteId) ?? 0;
    loadByAthlete.set(log.athleteId, prev + Math.round(dur * rpe));
  }

  const athletes: AthleteRow[] = (coach?.athletes ?? []).map((a) => ({
    id: a.id,
    name: a.user.name,
    avatarUrl: a.user.avatarUrl,
    goal: GOAL_LABELS[a.goal ?? ""] ?? "—",
    level: LEVEL_LABELS[a.level] ?? "Iniciante",
    status: (a.status as "ativo" | "risco" | "inativo") ?? "ativo",
    adherence: a.adherenceRate ?? 0,
    weeklyLoad: loadByAthlete.get(a.id) ?? 0,
    lastCheckIn: formatLastCheckIn(a.checkins[0]?.date),
    raceDate: formatRaceDate(a.raceDate),
  }));

  return <AthleteListClient athletes={athletes} />;
}
