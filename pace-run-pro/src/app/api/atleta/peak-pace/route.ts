import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// Standard effort durations (seconds) for the peak-pace curve
const DURATIONS = [30, 60, 120, 300, 600, 1200, 1800, 3600];
const LABELS = ["30s", "1min", "2min", "5min", "10min", "20min", "30min", "60min"];

type GpsPoint = { lat: number; lng: number; timestamp: number; altitude?: number };

function haversineM(a: GpsPoint, b: GpsPoint): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sin2));
}

// Compute best pace (sec/km) for a given duration from GPS points
function bestPaceForDuration(points: GpsPoint[], targetSec: number): number | null {
  if (points.length < 2) return null;
  let best: number | null = null;

  for (let i = 0; i < points.length; i++) {
    let distM = 0;
    for (let j = i + 1; j < points.length; j++) {
      distM += haversineM(points[j - 1], points[j]);
      const elapsed = (points[j].timestamp - points[i].timestamp) / 1000;
      if (elapsed >= targetSec) {
        const paceSecPerKm = (elapsed / (distM / 1000));
        if (best === null || paceSecPerKm < best) best = paceSecPerKm;
        break;
      }
    }
  }
  return best;
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ data: [] });

  // Fetch logs with GPS data from last 6 months
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const logs = await prisma.workoutLog.findMany({
    where: {
      athleteId: athlete.id,
      gpsTrack: { not: "DbNull" },
      finishedAt: { gte: sixMonthsAgo },
    },
    select: { gpsTrack: true, durationSec: true },
    take: 50,
  });

  // Also compute from splits as fallback
  const splitLogs = await prisma.workoutLog.findMany({
    where: {
      athleteId: athlete.id,
      avgPaceSecPerKm: { not: null },
      distanceKm: { not: null },
      durationSec: { not: null },
    },
    select: { avgPaceSecPerKm: true, distanceKm: true, durationSec: true },
    take: 100,
  });

  const bestByDuration: Map<number, number> = new Map();

  // Process GPS tracks
  for (const log of logs) {
    if (!log.gpsTrack) continue;
    let points: GpsPoint[];
    try {
      const raw = log.gpsTrack as unknown;
      points = Array.isArray(raw) ? (raw as GpsPoint[]) : [];
    } catch {
      continue;
    }
    if (points.length < 2) continue;

    for (const dur of DURATIONS) {
      if (log.durationSec && log.durationSec < dur) continue;
      const pace = bestPaceForDuration(points, dur);
      if (pace && pace > 120 && pace < 900) { // sanity: between 2:00/km and 15:00/km
        const current = bestByDuration.get(dur);
        if (!current || pace < current) bestByDuration.set(dur, Math.round(pace));
      }
    }
  }

  // Fallback: use average pace for the full duration if no GPS
  for (const log of splitLogs) {
    if (!log.avgPaceSecPerKm || !log.durationSec) continue;
    for (const dur of DURATIONS) {
      if (log.durationSec < dur) continue;
      const pace = log.avgPaceSecPerKm;
      if (pace > 120 && pace < 900) {
        if (!bestByDuration.has(dur)) {
          bestByDuration.set(dur, Math.round(pace));
        }
      }
    }
  }

  const data = DURATIONS.map((dur, i) => {
    const paceSec = bestByDuration.get(dur);
    if (!paceSec) return null;
    const min = Math.floor(paceSec / 60);
    const sec = paceSec % 60;
    return {
      label: LABELS[i],
      durationSec: dur,
      paceSec,
      paceStr: `${min}:${String(sec).padStart(2, "0")}`,
    };
  }).filter(Boolean);

  return NextResponse.json({ data, hasData: data.length > 0 });
}
