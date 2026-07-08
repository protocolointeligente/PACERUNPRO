import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json(null, { status: 404 });

  const workout = await prisma.workout.findFirst({
    where: {
      id,
      week: { plan: { athleteId: athlete.id } },
      type: "FORCA",
    },
    select: {
      id: true,
      title: true,
      status: true,
      objective: true,
      date: true,
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
                  videos: {
                    select: {
                      url: true,
                      title: true,
                    },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!workout) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(workout);
}
