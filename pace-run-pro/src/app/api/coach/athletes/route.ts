import { NextResponse } from "next/server";
import { auth } from "@/auth";
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      athletes: {
        select: {
          id: true,
          status: true,
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
    status: (a.status === "ativo" || a.status === "risco" || a.status === "inativo"
      ? a.status
      : "ativo") as "ativo" | "risco" | "inativo",
    adherence: a.adherenceRate,
    vdot: null,
  }));

  return NextResponse.json(result);
}
