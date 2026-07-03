import { NextRequest, NextResponse } from "next/server";
import { getSession, requireCoach } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PatchSchema = z.object({
  title:       z.string().min(1).max(200).optional(),
  date:        z.string().datetime().optional(),
  type:        z.enum(["RACE", "TEST", "EVENT"]).optional(),
  priority:    z.enum(["A", "B", "C"]).optional(),
  distanceKm:  z.number().positive().nullable().optional(),
  location:    z.string().max(200).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  goalTime:    z.string().max(20).nullable().optional(),
  completed:   z.boolean().optional(),
  actualTime:  z.string().max(20).nullable().optional(),
  notes:       z.string().max(1000).nullable().optional(),
});

async function resolveCoachEvent(session: Awaited<ReturnType<typeof getSession>>, eventId: string) {
  const coach = await prisma.coach.findUnique({
    where: { userId: session!.user!.id as string },
    select: { id: true },
  });
  if (!coach) return { error: NextResponse.json({ error: "Coach não encontrado" }, { status: 404 }), event: null, coach: null };

  const event = await prisma.raceEvent.findFirst({
    where: { id: eventId, coachId: coach.id },
  });
  if (!event) return { error: NextResponse.json({ error: "Evento não encontrado" }, { status: 404 }), event: null, coach: null };

  return { error: null, event, coach };
}

// PATCH /api/coach/race-events/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  const guard = requireCoach(session);
  if (guard) return guard;

  const { error, coach } = await resolveCoachEvent(session, id);
  if (error || !coach) return error!;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const d = parsed.data;
  const updated = await prisma.raceEvent.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.date !== undefined ? { date: new Date(d.date) } : {}),
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.priority !== undefined ? { priority: d.priority } : {}),
      ...(d.distanceKm !== undefined ? { distanceKm: d.distanceKm } : {}),
      ...(d.location !== undefined ? { location: d.location } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.goalTime !== undefined ? { goalTime: d.goalTime } : {}),
      ...(d.completed !== undefined ? { completed: d.completed } : {}),
      ...(d.actualTime !== undefined ? { actualTime: d.actualTime } : {}),
      ...(d.notes !== undefined ? { notes: d.notes } : {}),
    },
  });

  return NextResponse.json({ event: updated });
}

// DELETE /api/coach/race-events/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  const guard = requireCoach(session);
  if (guard) return guard;

  const { error } = await resolveCoachEvent(session, id);
  if (error) return error;

  await prisma.raceEvent.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
