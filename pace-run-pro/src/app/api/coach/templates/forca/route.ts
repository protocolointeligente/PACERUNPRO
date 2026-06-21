import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getCoach(userId: string) {
  return prisma.coach.findUnique({ where: { userId } });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const coach = await getCoach(session.user.id);
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 403 });

  const templates = await prisma.coachStrengthTemplate.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const coach = await getCoach(session.user.id);
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 403 });

  const body = await req.json();
  const { name, description, division, targetLevel, focus, sessions } = body;

  if (!name || !sessions) {
    return NextResponse.json({ error: "Campos obrigatórios: name, sessions" }, { status: 400 });
  }

  const template = await prisma.coachStrengthTemplate.create({
    data: {
      coachId: coach.id,
      name,
      description: description ?? null,
      division: division ?? null,
      targetLevel: targetLevel ?? "Iniciante",
      focus: focus ?? "forca",
      sessions,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
