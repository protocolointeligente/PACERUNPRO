import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function resolveModel(userId: string, modelId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId }, select: { id: true } });
  if (!coach) return null;
  const model = await prisma.coachZoneModel.findFirst({ where: { id: modelId, coachId: coach.id } });
  return model;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await resolveModel(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const body = await req.json();

  // When activating a model, first deactivate all others for this coach
  if (body.isActive === true) {
    const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (coach) {
      await prisma.coachZoneModel.updateMany({
        where: { coachId: coach.id, id: { not: id } },
        data: { isActive: false },
      });
    }
  }

  const updated = await prisma.coachZoneModel.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      sport: body.sport ?? existing.sport,
      method: body.method ?? existing.method,
      zoneCount: body.zoneCount ?? existing.zoneCount,
      zones: body.zones ?? existing.zones,
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await resolveModel(session.user.id, id);
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  await prisma.coachZoneModel.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
