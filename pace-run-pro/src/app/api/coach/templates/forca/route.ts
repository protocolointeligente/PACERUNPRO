import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json([]);

  const templates = await prisma.coachForceTemplate.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, description, division, targetLevel, focus, sessions } = body;

  if (!name || !sessions) {
    return NextResponse.json({ error: "Campos obrigatórios: name, sessions" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

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
