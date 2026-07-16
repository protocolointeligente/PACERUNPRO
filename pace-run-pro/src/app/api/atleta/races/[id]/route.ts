import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { calculateVDOT, getTrainingPaces, parseRaceTime } from "@/lib/vdot";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE")
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const { id } = await params;
  const race = await prisma.race.findFirst({ where: { id, athleteId: athlete.id } });
  if (!race) return NextResponse.json({ error: "Prova não encontrada" }, { status: 404 });

  const body = (await req.json()) as {
    resultTime?: string;
    goalTime?: string;
    location?: string;
  };

  const updated = await prisma.race.update({
    where: { id },
    data: {
      ...(body.resultTime !== undefined && { resultTime: body.resultTime }),
      ...(body.goalTime !== undefined && { goalTime: body.goalTime }),
      ...(body.location !== undefined && { location: body.location }),
    },
  });

  if (body.resultTime) {
    try {
      const timeSec = parseRaceTime(body.resultTime);
      const vdot = calculateVDOT(race.distanceKm * 1000, timeSec);
      const paces = getTrainingPaces(vdot);
      const thresholdPaceSecPerKm = Math.round(paces.T.fastSecPerKm);

      await prisma.athleteLoadParams.upsert({
        where: { athleteId: athlete.id },
        create: { athleteId: athlete.id, thresholdPaceSecPerKm },
        update: { thresholdPaceSecPerKm },
      });
    } catch {
      // Invalid resultTime format — skip VDOT update silently
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  await prisma.race.deleteMany({ where: { id, athleteId: athlete.id } });
  return NextResponse.json({ ok: true });
}
