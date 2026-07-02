import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import type { SportType } from "@prisma/client";

const VALID_SPORTS: SportType[] = ["RUN", "BIKE", "SWIM", "STRENGTH", "MOBILITY", "TRIATHLON", "BRICK"];

function isSportType(val: string): val is SportType {
  return VALID_SPORTS.includes(val as SportType);
}

// GET /api/athlete/sport-profile/[sport]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sport: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sport } = await params;
  if (!isSportType(sport.toUpperCase())) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  const profile = await prisma.athleteSportProfile.findUnique({
    where: { athleteId_sport: { athleteId: athlete.id, sport: sport.toUpperCase() as SportType } },
  });

  return NextResponse.json({ profile: profile ?? null });
}

// PUT /api/athlete/sport-profile/[sport]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sport: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sport } = await params;
  if (!isSportType(sport.toUpperCase())) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  const body = await req.json();
  const sportEnum = sport.toUpperCase() as SportType;

  const profile = await prisma.athleteSportProfile.upsert({
    where: { athleteId_sport: { athleteId: athlete.id, sport: sportEnum } },
    create: {
      athleteId:            athlete.id,
      sport:                sportEnum,
      thresholdPaceSecPerKm: body.thresholdPaceSecPerKm ?? null,
      vdot:                  body.vdot ?? null,
      vamKmh:                body.vamKmh ?? null,
      vo2max:                body.vo2max ?? null,
      ftpWatts:              body.ftpWatts ?? null,
      ftpWattsPerKg:         body.ftpWattsPerKg ?? null,
      criticalPowerWatts:    body.criticalPowerWatts ?? null,
      wPrimeJoules:          body.wPrimeJoules ?? null,
      cssPacePer100m:        body.cssPacePer100m ?? null,
      cssMetersPerSec:       body.cssMetersPerSec ?? null,
      hrMax:                 body.hrMax ?? null,
      hrRest:                body.hrRest ?? null,
      hrThreshold:           body.hrThreshold ?? null,
      zones:                 body.zones ?? null,
    },
    update: {
      thresholdPaceSecPerKm: body.thresholdPaceSecPerKm ?? undefined,
      vdot:                  body.vdot ?? undefined,
      vamKmh:                body.vamKmh ?? undefined,
      vo2max:                body.vo2max ?? undefined,
      ftpWatts:              body.ftpWatts ?? undefined,
      ftpWattsPerKg:         body.ftpWattsPerKg ?? undefined,
      criticalPowerWatts:    body.criticalPowerWatts ?? undefined,
      wPrimeJoules:          body.wPrimeJoules ?? undefined,
      cssPacePer100m:        body.cssPacePer100m ?? undefined,
      cssMetersPerSec:       body.cssMetersPerSec ?? undefined,
      hrMax:                 body.hrMax ?? undefined,
      hrRest:                body.hrRest ?? undefined,
      hrThreshold:           body.hrThreshold ?? undefined,
      zones:                 body.zones ?? undefined,
    },
  });

  return NextResponse.json({ profile });
}

// DELETE /api/athlete/sport-profile/[sport]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sport: string }> },
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sport } = await params;
  if (!isSportType(sport.toUpperCase())) {
    return NextResponse.json({ error: "Invalid sport" }, { status: 400 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Athlete not found" }, { status: 404 });

  await prisma.athleteSportProfile.deleteMany({
    where: { athleteId: athlete.id, sport: sport.toUpperCase() as SportType },
  });

  return NextResponse.json({ ok: true });
}
