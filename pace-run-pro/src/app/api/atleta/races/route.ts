import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { calculateVDOT, getTrainingPaces, parseRaceTime } from "@/lib/vdot";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) return NextResponse.json([]);

  const races = await prisma.race.findMany({
    where: { athleteId: athlete.id },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(races);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id } });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const body = (await req.json()) as {
    name: string;
    date: string;
    distanceKm: number;
    goalTime?: string;
    resultTime?: string;
    location?: string;
  };

  if (!body.name || !body.date || !body.distanceKm) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  const race = await prisma.race.create({
    data: {
      athleteId: athlete.id,
      name: body.name,
      date: new Date(body.date),
      distanceKm: body.distanceKm,
      goalTime: body.goalTime ?? null,
      resultTime: body.resultTime ?? null,
      location: body.location ?? null,
    },
  });

  if (body.resultTime) {
    await upsertVdotFromResult(athlete.id, body.distanceKm, body.resultTime);
  }

  return NextResponse.json(race, { status: 201 });
}

async function upsertVdotFromResult(athleteId: string, distanceKm: number, resultTime: string) {
  try {
    const timeSec = parseRaceTime(resultTime);
    const vdot = calculateVDOT(distanceKm * 1000, timeSec);
    const paces = getTrainingPaces(vdot);
    const thresholdPaceSecPerKm = Math.round(paces.T.fastSecPerKm);

    await prisma.athleteLoadParams.upsert({
      where: { athleteId },
      create: { athleteId, thresholdPaceSecPerKm },
      update: { thresholdPaceSecPerKm },
    });
  } catch {
    // Invalid resultTime format — skip VDOT update silently
  }
}
