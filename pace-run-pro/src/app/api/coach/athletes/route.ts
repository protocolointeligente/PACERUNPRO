import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

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

function deriveAthleteStatus(adherenceRate?: number | null): "ativo" | "risco" | "inativo" {
  if (adherenceRate == null) return "ativo";
  if (adherenceRate >= 0.8) return "ativo";
  if (adherenceRate >= 0.5) return "risco";
  return "inativo";
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      athletes: {
        select: {
          id: true,
          adherenceRate: true,
          goal: true,
          level: true,
          user: { select: { name: true, avatarUrl: true } },
        },
      },
    },
  });

  if (!coach) {
    return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });
  }

  const result = coach.athletes.map((a) => ({
    id: a.id,
    name: a.user.name,
    avatarUrl: a.user.avatarUrl ?? undefined,
    goal: a.goal ? (GOAL_LABELS[a.goal] ?? a.goal) : "—",
    level: LEVEL_LABELS[a.level] ?? a.level,
    status: deriveAthleteStatus(a.adherenceRate),
    adherence: a.adherenceRate,
    vdot: null,
  }));

  return NextResponse.json(result);
}
