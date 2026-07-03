import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const HEALTH_TYPES = ["WELLNESS", "READINESS", "SF36", "HEALTH"] as const;

const QuestionnaireSchema = z.object({
  type:      z.string().min(1).max(50),
  title:     z.string().max(200).optional().nullable(),
  responses: z.record(z.string(), z.unknown()),
  score:     z.number().optional().nullable(),
});

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

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true, parqAccepted: true },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const raw = await req.json();
  const parsed = QuestionnaireSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const { type, title, responses, score } = parsed.data;

  // Health questionnaires require LGPD/PAR-Q acceptance
  if ((HEALTH_TYPES as readonly string[]).includes(type) && !athlete.parqAccepted) {
    return NextResponse.json({ error: "É necessário aceitar o PAR-Q antes de preencher questionários de saúde." }, { status: 403 });
  }

  const q = await prisma.questionnaire.create({
    data: { athleteId: athlete.id, type, title: title ?? null, responses: responses as object, score: score ?? null },
    select: { id: true, type: true, score: true, completedAt: true },
  });

  return NextResponse.json(q, { status: 201 });
}
