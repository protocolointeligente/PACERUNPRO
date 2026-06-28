import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// POST — generate a new invite token for the authenticated coach
export async function POST() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  // 30-day expiry
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const invite = await prisma.athleteInvite.create({
    data: { coachId: coach.id, expiresAt },
    select: { token: true, expiresAt: true },
  });

  return NextResponse.json({ token: invite.token, expiresAt: invite.expiresAt });
}

// GET — list active (unused, non-expired) invites for the authenticated coach
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const invites = await prisma.athleteInvite.findMany({
    where: { coachId: coach.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { token: true, expiresAt: true, createdAt: true },
  });

  return NextResponse.json({ invites });
}
