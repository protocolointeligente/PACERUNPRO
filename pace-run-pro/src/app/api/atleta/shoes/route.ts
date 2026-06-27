import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getAthlete(userId: string) {
  return prisma.athlete.findUnique({ where: { userId }, select: { id: true } });
}

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const athlete = await getAthlete(session.user.id);
  if (!athlete) return NextResponse.json({ shoes: [] });

  const shoes = await prisma.shoe.findMany({
    where: { athleteId: athlete.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ shoes });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const athlete = await getAthlete(session.user.id);
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const body = await req.json();
  const { name, brand, model, color, imageEmoji, imageUrl, maxKm } = body;
  if (!name || !brand || !model) {
    return NextResponse.json({ error: "Nome, marca e modelo são obrigatórios" }, { status: 400 });
  }

  const shoe = await prisma.shoe.create({
    data: {
      athleteId: athlete.id,
      name, brand, model,
      color: color ?? "blue",
      imageEmoji: imageEmoji ?? "👟",
      imageUrl: imageUrl ?? null,
      maxKm: maxKm ? Number(maxKm) : 700,
    },
  });
  return NextResponse.json({ shoe }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const athlete = await getAthlete(session.user.id);
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  // Ensure shoe belongs to this athlete
  const shoe = await prisma.shoe.findFirst({ where: { id, athleteId: athlete.id } });
  if (!shoe) return NextResponse.json({ error: "Tênis não encontrado" }, { status: 404 });

  const updated = await prisma.shoe.update({
    where: { id },
    data: {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.brand !== undefined && { brand: updates.brand }),
      ...(updates.model !== undefined && { model: updates.model }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.imageEmoji !== undefined && { imageEmoji: updates.imageEmoji }),
      ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
      ...(updates.kmAccumulated !== undefined && { kmAccumulated: Number(updates.kmAccumulated) }),
      ...(updates.maxKm !== undefined && { maxKm: Number(updates.maxKm) }),
      ...(updates.active !== undefined && { active: Boolean(updates.active) }),
    },
  });
  return NextResponse.json({ shoe: updated });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const athlete = await getAthlete(session.user.id);
  if (!athlete) return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  await prisma.shoe.deleteMany({ where: { id, athleteId: athlete.id } });
  return NextResponse.json({ ok: true });
}
