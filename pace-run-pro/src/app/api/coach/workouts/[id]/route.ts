import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function resolveCoachWorkout(userId: string, workoutId: string) {
  const coach = await prisma.coach.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!coach) return null;

  const workout = await prisma.workout.findFirst({
    where: { id: workoutId, week: { plan: { coachId: coach.id } } },
    select: { id: true },
  });
  return workout ? { coachId: coach.id, workoutId: workout.id } : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const resolved = await resolveCoachWorkout(session.user.id, id);
  if (!resolved) return NextResponse.json({ error: "Treino não encontrado" }, { status: 404 });

  const body = (await req.json()) as {
    date?: string;
    title?: string;
    objective?: string;
    warmup?: string;
    mainSet?: string;
    cooldown?: string;
    notes?: string;
    targetDistanceKm?: number | null;
    targetDurationMin?: number | null;
    targetPaceSecPerKm?: number | null;
    targetPacePer100m?: number | null;
    targetRpe?: number | null;
    structured?: boolean;
    blocks?: unknown;
  };

  const data: Record<string, unknown> = {};

  if (body.date !== undefined) {
    const d = new Date(body.date);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }
    data.date = d;
  }
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.objective === "string") data.objective = body.objective.trim();
  if (typeof body.warmup === "string") data.warmup = body.warmup.trim() || null;
  if (typeof body.mainSet === "string") data.mainSet = body.mainSet.trim() || null;
  if (typeof body.cooldown === "string") data.cooldown = body.cooldown.trim() || null;
  if (typeof body.notes === "string") data.notes = body.notes.trim() || null;
  if (body.targetDistanceKm !== undefined) data.targetDistanceKm = body.targetDistanceKm;
  if (body.targetDurationMin !== undefined) data.targetDurationMin = body.targetDurationMin;
  if (body.targetPaceSecPerKm !== undefined) data.targetPaceSecPerKm = body.targetPaceSecPerKm;
  if (body.targetPacePer100m !== undefined) data.targetPacePer100m = body.targetPacePer100m;
  if (body.targetRpe !== undefined) data.targetRpe = body.targetRpe;
  if (typeof body.structured === "boolean") data.structured = body.structured;
  if (body.blocks !== undefined) data.blocks = body.blocks;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  await prisma.workout.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const resolved = await resolveCoachWorkout(session.user.id, id);
  if (!resolved) return NextResponse.json({ error: "Treino não encontrado" }, { status: 404 });

  await prisma.workout.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
