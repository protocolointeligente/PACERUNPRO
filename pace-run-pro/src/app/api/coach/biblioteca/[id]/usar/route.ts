import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// POST /api/coach/biblioteca/[id]/usar
// Increments usedCount and returns the template content ready to copy into a workout prescription
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const template = await prisma.sharedWorkoutTemplate.findUnique({ where: { id } });
  if (!template) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });

  // Anyone can use a TEAM template; only the owner can use a PERSONAL template
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  if (template.scope === "PERSONAL" && template.coachId !== coach.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  await prisma.sharedWorkoutTemplate.update({ where: { id }, data: { usedCount: { increment: 1 } } });

  return NextResponse.json({
    template: {
      name: template.name,
      workoutType: template.workoutType,
      objective: template.objective,
      warmup: template.warmup,
      mainSet: template.mainSet,
      cooldown: template.cooldown,
      notes: template.notes,
      targetPaceSecPerKm: template.targetPaceSecPerKm,
      targetHrZone: template.targetHrZone,
      targetRpe: template.targetRpe,
      targetDistanceKm: template.targetDistanceKm,
      targetDurationMin: template.targetDurationMin,
    },
  });
}
