import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const existing = await prisma.sharedWorkoutTemplate.findUnique({ where: { id } });
  if (!existing || existing.coachId !== coach.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, category, workoutType, scope, tags, objective, warmup, mainSet, cooldown, notes, targetPaceSecPerKm, targetHrZone, targetRpe, targetDistanceKm, targetDurationMin } = body;

  const template = await prisma.sharedWorkoutTemplate.update({
    where: { id },
    data: {
      name: name?.trim() ?? existing.name,
      description: description?.trim() ?? existing.description,
      category: category ?? existing.category,
      workoutType: workoutType ?? existing.workoutType,
      scope: scope ?? existing.scope,
      tags: tags ?? existing.tags,
      objective: objective?.trim() ?? existing.objective,
      warmup: warmup?.trim() ?? existing.warmup,
      mainSet: mainSet?.trim() ?? existing.mainSet,
      cooldown: cooldown?.trim() ?? existing.cooldown,
      notes: notes?.trim() ?? existing.notes,
      targetPaceSecPerKm: targetPaceSecPerKm ?? existing.targetPaceSecPerKm,
      targetHrZone: targetHrZone ?? existing.targetHrZone,
      targetRpe: targetRpe ?? existing.targetRpe,
      targetDistanceKm: targetDistanceKm ?? existing.targetDistanceKm,
      targetDurationMin: targetDurationMin ?? existing.targetDurationMin,
    },
  });

  return NextResponse.json({ template });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const existing = await prisma.sharedWorkoutTemplate.findUnique({ where: { id } });
  if (!existing || existing.coachId !== coach.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  await prisma.sharedWorkoutTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
