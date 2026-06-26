import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!athlete) return NextResponse.json(null);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const workout = await prisma.workout.findFirst({
    where: {
      week: { plan: { athleteId: athlete.id } },
      date: { gte: todayStart, lt: todayEnd },
      type: "FORCA",
      status: { in: ["LIBERADO", "AGENDADO"] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      objective: true,
      strengthWorkout: {
        select: {
          split: true,
          label: true,
          blocks: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              sets: true,
              reps: true,
              restSec: true,
              rpe: true,
              notes: true,
              exercise: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  description: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(workout ?? null);
}
