import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, athletes: { select: { id: true } } },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const body = await req.json() as { athleteId: string; workoutIds: string[] };
  const { athleteId, workoutIds } = body;

  if (!athleteId || !Array.isArray(workoutIds) || workoutIds.length === 0) {
    return NextResponse.json({ error: "athleteId e workoutIds são obrigatórios" }, { status: 400 });
  }

  const coachAthleteIds = new Set(coach.athletes.map((a) => a.id));
  if (!coachAthleteIds.has(athleteId)) {
    return NextResponse.json({ error: "Atleta inválido" }, { status: 403 });
  }

  const updated = await prisma.workout.updateMany({
    where: {
      id: { in: workoutIds },
      status: "AGENDADO",
      week: { plan: { athleteId, coachId: coach.id } },
    },
    data: { status: "LIBERADO" },
  });

  return NextResponse.json({ released: updated.count });
}
