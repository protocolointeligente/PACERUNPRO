import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getAthleteId(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id) return null;
  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return athlete?.id ?? null;
}

// GET — athlete's challenges + leaderboard for a specific challenge
export async function GET(req: NextRequest) {
  const session = await getSession();
  const athleteId = await getAthleteId(session);
  if (!athleteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const challengeId = searchParams.get("challengeId");

  if (challengeId) {
    // Leaderboard for a specific challenge
    const challenge = await prisma.challenge.findFirst({ where: { id: challengeId } });
    if (!challenge) return NextResponse.json({ error: "Desafio não encontrado" }, { status: 404 });

    const participants = await prisma.challengeParticipant.findMany({
      where: { challengeId },
      orderBy: { progress: "desc" },
      include: { athlete: { select: { user: { select: { name: true, avatarUrl: true } } } } },
    });

    const myEntry = participants.find((p) => p.athleteId === athleteId);

    return NextResponse.json({
      challenge,
      leaderboard: participants.map((p, i) => ({ ...p, rank: i + 1 })),
      myRank: myEntry ? participants.findIndex((p) => p.athleteId === athleteId) + 1 : null,
    });
  }

  // List: challenges athlete is enrolled in
  const participations = await prisma.challengeParticipant.findMany({
    where: { athleteId },
    include: {
      challenge: {
        include: {
          coach: { select: { user: { select: { name: true, avatarUrl: true } } } },
          _count: { select: { participants: true } },
        },
      },
    },
    orderBy: { challenge: { endDate: "asc" } },
  });

  // Also include public challenges not yet joined
  const joinedIds = participations.map((p) => p.challengeId);
  const publicChallenges = await prisma.challenge.findMany({
    where: {
      isPublic: true,
      id: { notIn: joinedIds },
      endDate: { gte: new Date() },
    },
    include: {
      coach: { select: { user: { select: { name: true, avatarUrl: true } } } },
      _count: { select: { participants: true } },
    },
  });

  return NextResponse.json({
    enrolled: participations.map((p) => ({ ...p.challenge, myProgress: p.progress, completedAt: p.completedAt })),
    available: publicChallenges,
  });
}

// POST — join or update progress in a challenge
export async function POST(req: NextRequest) {
  const session = await getSession();
  const athleteId = await getAthleteId(session);
  if (!athleteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { challengeId, progress } = await req.json();
  if (!challengeId) return NextResponse.json({ error: "challengeId obrigatório" }, { status: 400 });

  const challenge = await prisma.challenge.findFirst({ where: { id: challengeId } });
  if (!challenge) return NextResponse.json({ error: "Desafio não encontrado" }, { status: 404 });

  const existingParticipation = await prisma.challengeParticipant.findUnique({
    where: { challengeId_athleteId: { challengeId, athleteId } },
  });

  if (!existingParticipation) {
    // Join the challenge
    const participation = await prisma.challengeParticipant.create({
      data: { challengeId, athleteId, progress: progress ?? 0 },
    });
    return NextResponse.json({ ...participation, action: "joined" }, { status: 201 });
  }

  // Update progress
  const newProgress = progress ?? existingParticipation.progress;
  const isCompleted =
    challenge.targetValue != null && newProgress >= challenge.targetValue && !existingParticipation.completedAt;

  const updated = await prisma.challengeParticipant.update({
    where: { challengeId_athleteId: { challengeId, athleteId } },
    data: {
      progress: newProgress,
      ...(isCompleted ? { completedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ ...updated, action: "updated" });
}
