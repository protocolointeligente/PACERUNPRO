import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getCoachId(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id || session.user.role !== "COACH") return null;
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return coach?.id ?? null;
}

// GET — availability + upcoming appointments
export async function GET(_req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [availability, appointments] = await Promise.all([
    prisma.coachAvailability.findMany({ where: { coachId }, orderBy: { dayOfWeek: "asc" } }),
    prisma.appointment.findMany({
      where: { coachId, scheduledAt: { gte: new Date() } },
      include: {
        athlete: { select: { user: { select: { name: true, email: true, avatarUrl: true } } } },
        product: { select: { title: true, type: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({ availability, appointments });
}

// POST — create/replace availability schedule
export async function POST(req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { availability } = body as { availability: { dayOfWeek: number; startTime: string; endTime: string; slotMinutes: number; isActive: boolean }[] };

  if (!Array.isArray(availability)) {
    return NextResponse.json({ error: "availability[] obrigatório" }, { status: 400 });
  }

  // Replace all availability for this coach
  await prisma.coachAvailability.deleteMany({ where: { coachId } });
  if (availability.length > 0) {
    await prisma.coachAvailability.createMany({
      data: availability.map((a) => ({ coachId, ...a })),
    });
  }

  return NextResponse.json({ ok: true });
}

// PATCH — update appointment status
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, status, meetUrl, notes } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const appt = await prisma.appointment.findFirst({ where: { id, coachId } });
  if (!appt) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(meetUrl != null ? { meetUrl } : {}),
      ...(notes != null ? { notes } : {}),
    },
  });

  return NextResponse.json(updated);
}
