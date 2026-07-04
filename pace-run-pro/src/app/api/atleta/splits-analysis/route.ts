import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

interface NormalizedSplit {
  km: number;
  distKm: number;
  paceSecPerKm: number;
  elevationGainM?: number;
}

function formatPaceSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseSplits(raw: unknown): NormalizedSplit[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const splits: NormalizedSplit[] = [];
  for (let i = 0; i < raw.length; i++) {
    const s = raw[i];
    if (!s || typeof s !== "object") continue;
    const obj = s as Record<string, unknown>;

    let distKm = 1.0;
    if (typeof obj.distance === "number") {
      distKm = obj.distance > 100 ? obj.distance / 1000 : obj.distance;
    } else if (typeof obj.distKm === "number") {
      distKm = obj.distKm;
    }

    let paceSecPerKm = 0;
    if (typeof obj.paceSecPerKm === "number" && obj.paceSecPerKm > 0) {
      paceSecPerKm = obj.paceSecPerKm;
    } else if (typeof obj.elapsedTime === "number" && distKm > 0) {
      paceSecPerKm = Math.round(obj.elapsedTime / distKm);
    } else if (typeof obj.elapsed_time === "number" && distKm > 0) {
      paceSecPerKm = Math.round(obj.elapsed_time / distKm);
    } else if (typeof obj.moving_time === "number" && distKm > 0) {
      paceSecPerKm = Math.round(obj.moving_time / distKm);
    } else {
      continue;
    }

    if (paceSecPerKm <= 0 || paceSecPerKm > 1800) continue;

    splits.push({
      km: i + 1,
      distKm,
      paceSecPerKm,
      elevationGainM:
        typeof obj.elevationDiff === "number" ? obj.elevationDiff :
        typeof obj.elevation_difference === "number" ? obj.elevation_difference :
        undefined,
    });
  }

  return splits.length >= 2 ? splits : null;
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ hasData: false });

  const log = await prisma.workoutLog.findFirst({
    where: {
      athleteId: athlete.id,
      splits: { not: undefined },
      OR: [{ sport: "RUN" }, { workout: { sport: "RUN" } }],
    },
    select: { startedAt: true, distanceKm: true, splits: true },
    orderBy: { startedAt: "desc" },
  });

  if (!log) return NextResponse.json({ hasData: false });

  const splits = parseSplits(log.splits);
  if (!splits) return NextResponse.json({ hasData: false });

  const paces = splits.map((s) => s.paceSecPerKm);
  const avgPace = Math.round(paces.reduce((s, p) => s + p, 0) / paces.length);

  const bestKm = splits.reduce((b, s) => s.paceSecPerKm < b.paceSecPerKm ? s : b, splits[0]);
  const worstKm = splits.reduce((w, s) => s.paceSecPerKm > w.paceSecPerKm ? s : w, splits[0]);

  const half = Math.floor(splits.length / 2);
  const avgFirst = splits.slice(0, half).reduce((s, p) => s + p.paceSecPerKm, 0) / half;
  const avgSecond = splits.slice(half).reduce((s, p) => s + p.paceSecPerKm, 0) / (splits.length - half);
  const diff = avgSecond - avgFirst;
  const splitType: "negative" | "positive" | "even" =
    diff < -5 ? "negative" : diff > 5 ? "positive" : "even";

  return NextResponse.json({
    hasData: true,
    date: log.startedAt,
    distanceKm: log.distanceKm,
    splits: splits.map((s) => ({
      ...s,
      paceStr: formatPaceSec(s.paceSecPerKm),
      diffFromAvg: s.paceSecPerKm - avgPace,
    })),
    avgPace,
    avgPaceStr: formatPaceSec(avgPace),
    bestKm: { ...bestKm, paceStr: formatPaceSec(bestKm.paceSecPerKm) },
    worstKm: { ...worstKm, paceStr: formatPaceSec(worstKm.paceSecPerKm) },
    splitType,
    firstHalfAvg: Math.round(avgFirst),
    secondHalfAvg: Math.round(avgSecond),
  });
}
