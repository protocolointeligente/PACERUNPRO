import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { EvolucaoPDF } from "@/components/pdf/evolucao-pdf";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const vars = searchParams.get("vars")?.split(",").filter(Boolean) ?? ["volume", "pace", "fc", "vo2", "wellness", "provas", "peso"];

  // Fetch athlete profile
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
  const athlete = await prisma.athlete.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const athleteId = athlete.id;
  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  function weekLabel(date: Date) {
    const d = new Date(date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  const [logs, metrics, perfTests, races, checkins] = await Promise.all([
    prisma.workoutLog.findMany({
      where: { athleteId, workout: { date: { gte: twelveWeeksAgo } } },
      include: { workout: { select: { date: true } } },
      orderBy: { workout: { date: "asc" } },
    }),
    prisma.metric.findMany({
      where: { athleteId, date: { gte: twelveMonthsAgo } },
      orderBy: { date: "asc" },
      select: { date: true, weightKg: true, vo2max: true },
    }),
    prisma.performanceTest.findMany({
      where: { athleteId, vo2max: { not: null } },
      orderBy: { date: "asc" },
      select: { date: true, vo2max: true },
    }),
    prisma.race.findMany({
      where: { athleteId, resultTime: { not: null } },
      orderBy: { date: "desc" },
      take: 6,
      select: { date: true, distanceKm: true, resultTime: true },
    }),
    prisma.checkIn.findMany({
      where: { athleteId },
      orderBy: { date: "desc" },
      take: 10,
      select: { date: true, rpe: true, sleep: true, fatigue: true, pain: true, mood: true },
    }),
  ]);

  const weekMap = new Map<string, { km: number; paces: number[]; hrs: number[] }>();
  for (const log of logs) {
    if (!log.workout) continue;
    const label = weekLabel(new Date(log.workout.date));
    const e = weekMap.get(label) ?? { km: 0, paces: [], hrs: [] };
    e.km += log.distanceKm ?? 0;
    if (log.avgPaceSecPerKm) e.paces.push(log.avgPaceSecPerKm);
    if (log.avgHr) e.hrs.push(log.avgHr);
    weekMap.set(label, e);
  }

  const weeklyVolume = [...weekMap.entries()].map(([label, d]) => ({ label, km: Math.round(d.km * 10) / 10 }));
  const avgPace = [...weekMap.entries()].filter(([, d]) => d.paces.length).map(([label, d]) => ({ label, paceSec: Math.round(d.paces.reduce((a, b) => a + b, 0) / d.paces.length) }));
  const avgHr = [...weekMap.entries()].filter(([, d]) => d.hrs.length).map(([label, d]) => ({ label, hr: Math.round(d.hrs.reduce((a, b) => a + b, 0) / d.hrs.length) }));
  const weightHistory = metrics.filter(m => m.weightKg != null).map(m => ({ label: new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), kg: m.weightKg! }));
  const vo2History = [
    ...perfTests.filter(t => t.vo2max != null).map(t => ({ label: new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), vo2: Math.round(t.vo2max! * 10) / 10 })),
    ...metrics.filter(m => m.vo2max != null).map(m => ({ label: new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), vo2: Math.round(m.vo2max! * 10) / 10 })),
  ];
  const racesFormatted = races.map(r => ({
    distance: r.distanceKm >= 42 ? "Maratona" : r.distanceKm >= 21 ? "Meia maratona" : r.distanceKm >= 10 ? "10 km" : r.distanceKm >= 5 ? "5 km" : `${r.distanceKm} km`,
    date: new Date(r.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
    time: r.resultTime ?? "—",
    pace: "—",
  }));
  const checkinsFormatted = checkins.map(c => ({
    date: new Date(c.date).toISOString().split("T")[0],
    rpe: c.rpe ?? 0,
    sleep: c.sleep ?? 0,
    fatigue: c.fatigue ?? 0,
    pain: c.pain ?? 0,
    mood: c.mood ?? 0,
  }));

  const now = new Date();
  const generatedAt = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const element = createElement(EvolucaoPDF, {
    athleteName: user?.name ?? "Atleta",
    generatedAt,
    selectedVars: vars,
    data: { weeklyVolume, avgPace, avgHr, trainingLoad: [], weightHistory, vo2History, races: racesFormatted, checkins: checkinsFormatted },
  }) as unknown as ReactElement<DocumentProps>;

  const pdfBuffer = await renderToBuffer(element);

  const safeName = (user?.name ?? "atleta").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return new NextResponse(new Uint8Array(pdfBuffer).buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="evolucao-${safeName}.pdf"`,
    },
  });
}
