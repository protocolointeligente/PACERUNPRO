import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { TemplateScope } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "meus"; // meus | equipe
  const category = searchParams.get("category") ?? undefined;

  const where =
    tab === "equipe"
      ? { scope: "TEAM" as TemplateScope, ...(category ? { category: category as never } : {}) }
      : { coachId: coach.id, ...(category ? { category: category as never } : {}) };

  const templates = await prisma.sharedWorkoutTemplate.findMany({
    where,
    include: { coach: { select: { user: { select: { name: true, avatarUrl: true } } } } },
    orderBy: [{ scope: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, category, workoutType, scope, tags, objective, warmup, mainSet, cooldown, notes, targetPaceSecPerKm, targetHrZone, targetRpe, targetDistanceKm, targetDurationMin } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const template = await prisma.sharedWorkoutTemplate.create({
    data: {
      coachId: coach.id,
      name: name.trim(),
      description: description?.trim() || null,
      category: category ?? "CORRIDA",
      workoutType: workoutType ?? null,
      scope: scope ?? "PERSONAL",
      tags: tags ?? [],
      objective: objective?.trim() || null,
      warmup: warmup?.trim() || null,
      mainSet: mainSet?.trim() || null,
      cooldown: cooldown?.trim() || null,
      notes: notes?.trim() || null,
      targetPaceSecPerKm: targetPaceSecPerKm ?? null,
      targetHrZone: targetHrZone ?? null,
      targetRpe: targetRpe ?? null,
      targetDistanceKm: targetDistanceKm ?? null,
      targetDurationMin: targetDurationMin ?? null,
    },
    include: { coach: { select: { user: { select: { name: true, avatarUrl: true } } } } },
  });

  return NextResponse.json({ template }, { status: 201 });
}
