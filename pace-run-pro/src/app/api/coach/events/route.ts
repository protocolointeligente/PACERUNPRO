import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getCoachId(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session?.user?.id || session.user.role !== "COACH") return null;
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  return coach?.id ?? null;
}

// GET — list coach's events with registration counts
export async function GET(_req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const events = await prisma.marketplaceProduct.findMany({
    where: { coachId, type: "EVENTO" },
    include: {
      eventRegistrations: { select: { id: true, status: true } },
    },
    orderBy: { eventDate: "asc" },
  });

  return NextResponse.json(events.map((e) => ({
    ...e,
    registrationCount: e.eventRegistrations.length,
    confirmedCount: e.eventRegistrations.filter((r) => r.status === "CONFIRMED").length,
  })));
}

// POST — create event (MarketplaceProduct type=EVENTO)
export async function POST(req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, description, priceCents, maxParticipants, eventDate, location, isOnline, isPublished, format } = body;

  if (!title || !eventDate) {
    return NextResponse.json({ error: "title e eventDate são obrigatórios" }, { status: 400 });
  }

  // Ensure store exists
  let store = await prisma.marketplaceStore.findUnique({ where: { coachId } });
  if (!store) {
    const coach = await prisma.coach.findUnique({ where: { id: coachId }, include: { user: true } });
    if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });
    store = await prisma.marketplaceStore.create({
      data: {
        coachId,
        name: coach.user.name ?? "Minha Loja",
        slug: coach.slug ?? coachId,
      },
    });
  }

  const event = await prisma.marketplaceProduct.create({
    data: {
      coachId,
      storeId: store.id,
      type: "EVENTO",
      title,
      slug: `${store.slug}-evento-${Date.now()}`,
      description: description ?? "",
      priceCents: priceCents ?? 0,
      maxParticipants: maxParticipants ?? null,
      eventDate: new Date(eventDate),
      format: format ?? (isOnline ? "online" : (location ?? "presencial")),
      published: isPublished ?? false,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

// PATCH — update event or registration status
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, registrationId, registrationStatus, ...data } = body;

  if (registrationId) {
    // Update a specific registration status
    const reg = await prisma.eventRegistration.findFirst({
      where: { id: registrationId, product: { coachId } },
    });
    if (!reg) return NextResponse.json({ error: "Inscrição não encontrada" }, { status: 404 });
    const updated = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status: registrationStatus ?? reg.status },
    });
    return NextResponse.json(updated);
  }

  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const event = await prisma.marketplaceProduct.findFirst({ where: { id, coachId } });
  if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

  const updated = await prisma.marketplaceProduct.update({
    where: { id },
    data: {
      ...(data.title != null ? { title: data.title } : {}),
      ...(data.description != null ? { description: data.description } : {}),
      ...(data.priceCents != null ? { priceCents: data.priceCents } : {}),
      ...(data.maxParticipants != null ? { maxParticipants: data.maxParticipants } : {}),
      ...(data.eventDate != null ? { eventDate: new Date(data.eventDate) } : {}),
      ...(data.format != null ? { format: data.format } : {}),
      ...(data.published != null ? { published: data.published } : {}),
    },
  });
  return NextResponse.json(updated);
}

// DELETE — remove event
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  const coachId = await getCoachId(session);
  if (!coachId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  const event = await prisma.marketplaceProduct.findFirst({ where: { id, coachId } });
  if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

  await prisma.marketplaceProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
