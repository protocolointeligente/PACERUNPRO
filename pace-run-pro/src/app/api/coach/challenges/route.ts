import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getCoachId(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id || session.user.role !== "COACH") return null;
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return coach?.id ?? null;
}

export async function GET(_req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const challenges = await prisma.challenge.findMany({
    where: { coachId },
    include: { participants: { select: { id: true, progress: true, completedAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(challenges.map((c) => ({
    ...c,
    participantCount: c.participants.length,
    completedCount: c.participants.filter((p) => p.completedAt).length,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, description, type, targetValue, targetUnit, sport, startDate, endDate, isPublic } = body;

  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "title, startDate e endDate são obrigatórios" }, { status: 400 });
  }

  const challenge = await prisma.challenge.create({
    data: {
      coachId,
      title,
      description: description ?? "",
      type: type ?? "DISTANCIA",
      targetValue: targetValue ?? null,
      targetUnit: targetUnit ?? null,
      sport: sport ?? "CORRIDA",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isPublic: isPublic ?? false,
    },
  });

  return NextResponse.json(challenge, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const challenge = await prisma.challenge.findFirst({ where: { id, coachId } });
  if (!challenge) return NextResponse.json({ error: "Desafio não encontrado" }, { status: 404 });

  const updated = await prisma.challenge.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const challenge = await prisma.challenge.findFirst({ where: { id, coachId } });
  if (!challenge) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.challenge.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
