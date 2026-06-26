import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  vo2FromCooper,
  vo2From5MinTest,
  vo2From3km,
  vamFromDistanceTime,
  vo2FromVam,
  paceFromKmh,
  thresholdPaceFromTest,
} from "@/lib/calculations";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json([]);

  const tests = await prisma.performanceTest.findMany({
    where: { athleteId: athlete.id },
    orderBy: { date: "desc" },
    take: 10,
  });

  return NextResponse.json(tests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE")
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete)
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const body = (await req.json()) as {
    type: string;
    distanceM?: number;
    durationSec?: number;
    avgHr?: number;
    maxHr?: number;
    notes?: string;
  };

  const { type, distanceM, durationSec, avgHr, maxHr, notes } = body;

  // Compute derived metrics based on test type
  let vo2max: number | null = null;
  let vamKmh: number | null = null;
  let thresholdPaceSecPerKm: number | null = null;

  if (type === "COOPER" && distanceM) {
    vo2max = Math.round(vo2FromCooper(distanceM) * 10) / 10;
    vamKmh = Math.round(vamFromDistanceTime(distanceM, 720) * 10) / 10; // 12 min = 720s
    thresholdPaceSecPerKm = thresholdPaceFromTest(distanceM, 720);
  } else if (type === "CINCO_MINUTOS" && distanceM) {
    vo2max = Math.round(vo2From5MinTest(distanceM) * 10) / 10;
    vamKmh = Math.round(vamFromDistanceTime(distanceM, 300) * 10) / 10; // 5 min = 300s
    thresholdPaceSecPerKm = thresholdPaceFromTest(distanceM, 300);
  } else if (type === "TRES_KM" && durationSec) {
    vo2max = Math.round(vo2From3km(durationSec) * 10) / 10;
    const _vam = vamFromDistanceTime(3000, durationSec);
    vamKmh = Math.round(_vam * 10) / 10;
    thresholdPaceSecPerKm = paceFromKmh(_vam * 0.9); // threshold ≈ 90% VAM
  } else if (type === "VAM" && distanceM && durationSec) {
    const _vam = vamFromDistanceTime(distanceM, durationSec);
    vamKmh = Math.round(_vam * 10) / 10;
    vo2max = Math.round(vo2FromVam(_vam) * 10) / 10;
    thresholdPaceSecPerKm = paceFromKmh(_vam * 0.9);
  }

  const test = await prisma.performanceTest.create({
    data: {
      athleteId: athlete.id,
      type: type as Parameters<typeof prisma.performanceTest.create>[0]["data"]["type"],
      date: new Date(),
      distanceM: distanceM ?? null,
      durationSec: durationSec ?? null,
      avgHr: avgHr ?? null,
      maxHr: maxHr ?? null,
      vo2max,
      vamKmh,
      thresholdPaceSecPerKm,
      notes: notes ?? null,
    },
  });

  return NextResponse.json({ test, vo2max, vamKmh, thresholdPaceSecPerKm });
}
