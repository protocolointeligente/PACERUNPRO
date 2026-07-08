import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function canAccessLog(logId: string, userId: string, role: string) {
  // ✅ Otimização P1.7: Simplificar validação sem nested relationships
  const log = await prisma.workoutLog.findUnique({
    where: { id: logId },
    select: {
      athleteId: true,
      athlete: { select: { userId: true, coachId: true } },
    },
  });
  if (!log) return null;
  if (role === "ADMIN") return log;
  if (log.athlete.userId === userId) return log;
  
  // Para coach, verificar se coach.userId === userId
  if (role === "COACH" && log.athlete.coachId) {
    const coach = await prisma.coach.findUnique({
      where: { id: log.athlete.coachId },
      select: { userId: true },
    });
    if (coach?.userId === userId) return log;
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const log = await canAccessLog(id, session.user.id, session.user.role);
  if (!log) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const comments = await prisma.workoutLogComment.findMany({
    where: { workoutLogId: id },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
  });
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const log = await canAccessLog(id, session.user.id, session.user.role);
  if (!log) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Comentário vazio" }, { status: 400 });

  const comment = await prisma.workoutLogComment.create({
    data: { workoutLogId: id, userId: session.user.id, text: text.trim() },
    include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
  });
  return NextResponse.json(comment, { status: 201 });
}
