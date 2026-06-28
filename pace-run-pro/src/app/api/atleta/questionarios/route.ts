import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET — list questionnaires for the authenticated athlete
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!athlete) return NextResponse.json({ questionnaires: [] });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? undefined;

  const questionnaires = await prisma.questionnaire.findMany({
    where: { athleteId: athlete.id, ...(type ? { type } : {}) },
    orderBy: { completedAt: "desc" },
    take: 20,
    select: { id: true, type: true, title: true, score: true, completedAt: true },
  });

  return NextResponse.json({ questionnaires });
}

// POST — save a completed questionnaire
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const body = await req.json();
  const { type, title, responses, score } = body;

  if (!type || !responses) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const q = await prisma.questionnaire.create({
    data: { athleteId: athlete.id, type, title: title ?? null, responses, score: score ?? null },
    select: { id: true, type: true, score: true, completedAt: true },
  });

  return NextResponse.json(q, { status: 201 });
}
