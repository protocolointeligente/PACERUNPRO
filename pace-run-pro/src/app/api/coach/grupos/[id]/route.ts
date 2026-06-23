import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getCoachAndGroup(userId: string, groupId: string) {
  const coach = await prisma.coach.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!coach) return { error: "Coach não encontrado", status: 404 } as const;

  const group = await prisma.team.findFirst({
    where: { id: groupId, coachId: coach.id },
  });
  if (!group) return { error: "Grupo não encontrado", status: 404 } as const;

  return { coach, group };
}

// PATCH: rename group or add/remove athlete
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const result = await getCoachAndGroup(session.user.id, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = (await req.json()) as { name?: string; addAthleteId?: string; removeAthleteId?: string };

  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    const updated = await prisma.team.update({
      where: { id },
      data: { name: body.name.trim() },
    });
    return NextResponse.json(updated);
  }

  if (body.addAthleteId) {
    await prisma.teamMember.upsert({
      where: { teamId_athleteId: { teamId: id, athleteId: body.addAthleteId } },
      create: { teamId: id, athleteId: body.addAthleteId },
      update: {},
    });
    return NextResponse.json({ ok: true });
  }

  if (body.removeAthleteId) {
    await prisma.teamMember.deleteMany({
      where: { teamId: id, athleteId: body.removeAthleteId },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nenhuma operação válida" }, { status: 400 });
}

// DELETE: delete group
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const result = await getCoachAndGroup(session.user.id, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
