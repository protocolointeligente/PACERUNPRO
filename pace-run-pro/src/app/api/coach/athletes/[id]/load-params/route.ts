import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function resolveCoachAthlete(coachUserId: string, athleteId: string) {
  const coach = await prisma.coach.findUnique({
    where: { userId: coachUserId },
    select: { id: true, athletes: { select: { id: true } } },
  });
  if (!coach) return null;
  if (!coach.athletes.some((a) => a.id === athleteId)) return null;
  return coach;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id: athleteId } = await params;
  const coach = await resolveCoachAthlete(session.user.id, athleteId);
  if (!coach) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const lp = await prisma.athleteLoadParams.findUnique({ where: { athleteId } });
  return NextResponse.json(lp ?? {});
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id: athleteId } = await params;
  const coach = await resolveCoachAthlete(session.user.id, athleteId);
  if (!coach) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();
  const data = {
    thresholdPaceSecPerKm: body.thresholdPaceSecPerKm ? parseInt(body.thresholdPaceSecPerKm) : null,
    ftpWatts:              body.ftpWatts ? parseInt(body.ftpWatts) : null,
    swimThresholdSecPer100m: body.swimThresholdSecPer100m ? parseInt(body.swimThresholdSecPer100m) : null,
    hrMax:                 body.hrMax ? parseInt(body.hrMax) : null,
    hrRest:                body.hrRest ? parseInt(body.hrRest) : null,
  };

  const result = await prisma.athleteLoadParams.upsert({
    where: { athleteId },
    update: data,
    create: { athleteId, ...data },
  });

  return NextResponse.json(result);
}
