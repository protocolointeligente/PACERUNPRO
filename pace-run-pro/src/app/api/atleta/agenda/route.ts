import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getAthleteId(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id || session.user.role !== "ATHLETE") return null;
  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true, coachId: true },
  });
  return athlete ?? null;
}

// GET — my appointments + available slots for a specific coach/date
export async function GET(req: NextRequest) {
  const session = await getSession();
  const athlete = await getAthleteId(session);
  if (!athlete) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const coachId = searchParams.get("coachId");
  const dateStr = searchParams.get("date"); // YYYY-MM-DD

  // Return available slots for a specific coach+date
  if (coachId && dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    const dayOfWeek = date.getDay();

    const availability = await prisma.coachAvailability.findFirst({
      where: { coachId, dayOfWeek, isActive: true },
    });
    if (!availability) return NextResponse.json({ slots: [] });

    // Generate all slots
    const [startH, startM] = availability.startTime.split(":").map(Number);
    const [endH, endM] = availability.endTime.split(":").map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    const slots: string[] = [];

    for (let m = startMins; m + availability.slotMinutes <= endMins; m += availability.slotMinutes) {
      const h = Math.floor(m / 60).toString().padStart(2, "0");
      const min = (m % 60).toString().padStart(2, "0");
      const slotDate = new Date(dateStr + `T${h}:${min}:00`);
      slots.push(slotDate.toISOString());
    }

    // Exclude already booked slots
    const dayStart = new Date(dateStr + "T00:00:00");
    const dayEnd = new Date(dateStr + "T23:59:59");
    const booked = await prisma.appointment.findMany({
      where: {
        coachId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { scheduledAt: true, durationMin: true },
    });

    const available = slots.filter((slot) => {
      const slotTime = new Date(slot).getTime();
      return !booked.some((b) => {
        const bookedTime = new Date(b.scheduledAt).getTime();
        const bookedEnd = bookedTime + b.durationMin * 60000;
        const slotEnd = slotTime + availability.slotMinutes * 60000;
        return slotTime < bookedEnd && slotEnd > bookedTime;
      });
    });

    return NextResponse.json({ slots: available, slotMinutes: availability.slotMinutes });
  }

  // Return my appointments + coaches with availability
  const [appointments, coaches] = await Promise.all([
    prisma.appointment.findMany({
      where: { athleteId: athlete.id },
      orderBy: { scheduledAt: "asc" },
      include: {
        coach: { include: { user: { select: { name: true, avatarUrl: true } } } },
        product: { select: { title: true } },
      },
    }),
    prisma.coach.findMany({
      where: {
        coachAvailability: { some: { isActive: true } },
      },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        coachAvailability: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      },
    }),
  ]);

  return NextResponse.json({ appointments, coaches, myCoachId: athlete.coachId });
}

// POST — book an appointment
export async function POST(req: NextRequest) {
  const session = await getSession();
  const athlete = await getAthleteId(session);
  if (!athlete) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { coachId, scheduledAt, notes, productId } = await req.json();
  if (!coachId || !scheduledAt) {
    return NextResponse.json({ error: "coachId e scheduledAt são obrigatórios" }, { status: 400 });
  }

  // Verify coach has availability on that day/time
  const date = new Date(scheduledAt);
  const dayOfWeek = date.getDay();
  const availability = await prisma.coachAvailability.findFirst({
    where: { coachId, dayOfWeek, isActive: true },
  });
  if (!availability) {
    return NextResponse.json({ error: "Treinador sem disponibilidade nesse dia" }, { status: 400 });
  }

  // Check for conflicts
  const conflict = await prisma.appointment.findFirst({
    where: {
      coachId,
      status: { in: ["PENDING", "CONFIRMED"] },
      scheduledAt: {
        gte: new Date(date.getTime() - availability.slotMinutes * 60000 + 60000),
        lte: new Date(date.getTime() + availability.slotMinutes * 60000 - 60000),
      },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "Horário não disponível" }, { status: 409 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      coachId,
      athleteId: athlete.id,
      scheduledAt: date,
      durationMin: availability.slotMinutes,
      status: "PENDING",
      athleteNotes: notes ?? null,
      productId: productId ?? null,
    },
    include: {
      coach: { include: { user: { select: { name: true } } } },
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}

// PATCH — athlete can cancel their own appointment
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const athlete = await getAthleteId(session);
  if (!athlete) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || status !== "CANCELLED") {
    return NextResponse.json({ error: "Apenas cancelamento permitido pelo atleta" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id, athleteId: athlete.id },
  });
  if (!appointment) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  if (appointment.status === "COMPLETED") {
    return NextResponse.json({ error: "Não é possível cancelar um agendamento concluído" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  return NextResponse.json(updated);
}
