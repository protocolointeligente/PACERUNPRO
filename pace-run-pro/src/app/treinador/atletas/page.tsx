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

function deriveAthleteStatus(adherenceRate?: number | null): "ativo" | "risco" | "inativo" {
  if (adherenceRate == null) return "ativo";
  if (adherenceRate >= 0.8) return "ativo";
  if (adherenceRate >= 0.5) return "risco";
  return "inativo";
}

export default async function AthleteListPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const athleteSelect = {
    id: true,
    adherenceRate: true,
    goal: true,
    level: true,
    raceDate: true,
    user: { select: { name: true, avatarUrl: true } },
    checkins: {
      orderBy: { date: "desc" as const },
      take: 1,
      select: { date: true },
    },
  };

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      athletes: { select: athleteSelect, orderBy: { user: { name: "asc" } } },
    },
  });

  type CoachAthlete = NonNullable<typeof coach>["athletes"][number];
  const athletesById = new Map<string, CoachAthlete>();
  for (const athlete of coach?.athletes ?? []) athletesById.set(athlete.id, athlete);

  const athletes: AthleteRow[] = Array.from(athletesById.values()).sort((a, b) => a.user.name.localeCompare(b.user.name)).map((a) => ({
    id: a.id,
    name: a.user.name,
    avatarUrl: a.user.avatarUrl,
    goal: GOAL_LABELS[a.goal ?? ""] ?? "—",
    level: LEVEL_LABELS[a.level] ?? "Iniciante",
    status: deriveAthleteStatus(a.adherenceRate),
    adherence: a.adherenceRate ?? 0,
    weeklyLoad: 0,
    lastCheckIn: formatLastCheckIn(a.checkins[0]?.date),
    raceDate: formatRaceDate(a.raceDate),
  }));

  return <AthleteListClient athletes={athletes} />;
}
