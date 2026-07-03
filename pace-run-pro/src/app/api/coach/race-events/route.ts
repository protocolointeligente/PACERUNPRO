import { NextRequest, NextResponse } from "next/server";
import { getSession, requireCoach } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RaceEventSchema = z.object({
  athleteId:   z.string().min(1),
  planId:      z.string().optional(),
  title:       z.string().min(1).max(200),
  date:        z.string().datetime(),
  type:        z.enum(["RACE", "TEST", "EVENT"]).default("RACE"),
  priority:    z.enum(["A", "B", "C"]).default("A"),
  distanceKm:  z.number().positive().optional(),
  location:    z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  goalTime:    z.string().max(20).optional(),
});

// GET /api/coach/race-events?athleteId=xxx
// Lists upcoming race events for an athlete (or all athletes of the coach).

export async function GET(req: NextRequest) {
  const session = await getSession();
  const guard = requireCoach(session);
  if (guard) return guard;

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user!.id as string },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const athleteId = req.nextUrl.searchParams.get("athleteId");
  const planId = req.nextUrl.searchParams.get("planId");
  const includePast = req.nextUrl.searchParams.get("includePast") === "true";

  const events = await prisma.raceEvent.findMany({
    where: {
      coachId: coach.id,
      ...(athleteId ? { athleteId } : {}),
      ...(planId ? { planId } : {}),
      ...(!includePast ? { date: { gte: new Date() } } : {}),
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      date: true,
      type: true,
      priority: true,
      distanceKm: true,
      location: true,
      goalTime: true,
      completed: true,
      actualTime: true,
      athleteId: true,
      planId: true,
      athlete: { select: { user: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ events });
}

// POST /api/coach/race-events
// Creates a new race event for an athlete.

export async function POST(req: NextRequest) {
  const session = await getSession();
  const guard = requireCoach(session);
  if (guard) return guard;

  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user!.id as string },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = RaceEventSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const d = parsed.data;

  // Verify athlete belongs to this coach
  const athlete = await prisma.athlete.findFirst({
    where: { id: d.athleteId, coachId: coach.id },
    select: { id: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const event = await prisma.raceEvent.create({
    data: {
      athleteId:   d.athleteId,
      coachId:     coach.id,
      planId:      d.planId,
      title:       d.title,
      date:        new Date(d.date),
      type:        d.type,
      priority:    d.priority,
      distanceKm:  d.distanceKm,
      location:    d.location,
      description: d.description,
      goalTime:    d.goalTime,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}
