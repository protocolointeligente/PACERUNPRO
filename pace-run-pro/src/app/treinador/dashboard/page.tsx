import { getSession } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CoachDashboard from "./_dashboard-client";
import type { AthleteRow } from "./_dashboard-client";

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
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  return `${days} dias atrás`;
}

export default async function CoachDashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      coach: {
        select: {
          credential: true,
          athletes: {
            select: {
              id: true,
              status: true,
              adherenceRate: true,
              goal: true,
              level: true,
              user: { select: { name: true } },
              checkins: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
            },
          },
        },
      },
    },
  });

  const rawAthletes = user?.coach?.athletes ?? [];
  const athletes: AthleteRow[] = rawAthletes.map((a) => ({
    id: a.id,
    name: a.user.name,
    goal: GOAL_LABELS[a.goal ?? ""] ?? "—",
    level: LEVEL_LABELS[a.level] ?? "Iniciante",
    status: (a.status ?? "ativo") as "ativo" | "risco" | "inativo",
    adherence: a.adherenceRate ?? 0,
    weeklyLoad: 0,
    lastCheckIn: formatLastCheckIn(a.checkins[0]?.date),
  }));

  const firstName = (user?.name ?? "Treinador").split(" ")[0];
  const credential = user?.coach?.credential ?? "";
  const athletesAtRisk = athletes.filter((a) => a.status === "risco").length;

  return (
    <CoachDashboard
      firstName={firstName}
      credential={credential}
      athleteCount={athletes.length}
      athletesAtRisk={athletesAtRisk}
      athletes={athletes}
    />
  );
}
