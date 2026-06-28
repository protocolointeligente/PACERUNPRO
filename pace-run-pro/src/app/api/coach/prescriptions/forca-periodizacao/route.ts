import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// POST — save a force periodization plan as a template for the coach
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const body = await req.json();
  const { focus, level, weeks } = body;

  if (!focus || !weeks) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const FOCUS_LABELS: Record<string, string> = {
    HIPERTROFIA: "Hipertrofia",
    FORCA: "Força Máxima",
    PERDA_GORDURA: "Perda de Gordura",
    SUPORTE_CORRIDA: "Suporte à Corrida",
  };

  const template = await prisma.coachStrengthTemplate.create({
    data: {
      coachId: coach.id,
      name: `Periodização de Força — ${FOCUS_LABELS[focus] ?? focus} (${weeks.length}sem)`,
      description: `Plano periodizado ${weeks.length} semanas · Foco: ${FOCUS_LABELS[focus] ?? focus} · Nível: ${level ?? "Intermediário"}`,
      division: "PERSONALIZADA",
      targetLevel: level ?? "INTERMEDIARIO",
      focus: FOCUS_LABELS[focus] ?? focus,
      sessions: weeks,
    },
    select: { id: true, name: true },
  });

  return NextResponse.json({ ok: true, template });
}
