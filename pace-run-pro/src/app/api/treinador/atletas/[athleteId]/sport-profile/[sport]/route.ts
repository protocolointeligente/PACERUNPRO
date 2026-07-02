import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import type { SportType } from "@prisma/client";

const VALID_SPORTS: SportType[] = ["RUN", "BIKE", "SWIM", "STRENGTH", "MOBILITY", "TRIATHLON", "BRICK"];

function isSportType(val: string): val is SportType {
  return VALID_SPORTS.includes(val as SportType);
}

async function getCoachAndAthleteIds(
  coachUserId: string,
  athleteId: string,
): Promise<{ coachId: string } | null> {
  const coach = await prisma.coach.findUnique({ where: { userId: coachUserId }, select: { id: true } });
  if (!coach) return null;
  const athlete = await prisma.athlete.findFirst({
    where: { id: athleteId, coachId: coach.id },
    select: { id: true },
  });
  if (!athlete) return null;
  return { coachId: coach.id };
}

// GET /api/treinador/atletas/[athleteId]/sport-profile/[sport]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ athleteId: string; sport: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { athleteId, sport } = await params;
  const sportEnum = sport.toUpperCase();
  if (!isSportType(sportEnum)) return NextResponse.json({ error: "Invalid sport" }, { status: 400 });

  const guard = await getCoachAndAthleteIds(session.user.id, athleteId);
  if (!guard) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await prisma.athleteSportProfile.findUnique({
    where: { athleteId_sport: { athleteId, sport: sportEnum as SportType } },
  });
  return NextResponse.json({ profile: profile ?? null });
}

// PUT /api/treinador/atletas/[athleteId]/sport-profile/[sport]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ athleteId: string; sport: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { athleteId, sport } = await params;
  const sportEnum = sport.toUpperCase();
  if (!isSportType(sportEnum)) return NextResponse.json({ error: "Invalid sport" }, { status: 400 });

  const guard = await getCoachAndAthleteIds(session.user.id, athleteId);
  if (!guard) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const sportType = sportEnum as SportType;

  const profile = await prisma.athleteSportProfile.upsert({
    where: { athleteId_sport: { athleteId, sport: sportType } },
    create: { athleteId, sport: sportType, ...body },
    update: body,
  });
  return NextResponse.json({ profile });
}
