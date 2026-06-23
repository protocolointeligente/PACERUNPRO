import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function resolveProduct(userId: string, productId: string) {
  const coach = await prisma.coach.findUnique({ where: { userId }, select: { id: true } });
  if (!coach) return null;
  const product = await prisma.planProduct.findFirst({
    where: { id: productId, coachId: coach.id },
    select: { id: true },
  });
  return product ? { coachId: coach.id } : null;
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
  const resolved = await resolveProduct(session.user.id, id);
  if (!resolved) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const body = await req.json();
  const allowedFields = [
    "title", "description", "sport", "level", "durationWeeks",
    "weeklyHoursMin", "weeklyHoursMax", "goal", "priceCents",
    "coverUrl", "included", "published", "featured",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) data[field] = body[field];
  }

  const updated = await prisma.planProduct.update({ where: { id }, data });
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
  const resolved = await resolveProduct(session.user.id, id);
  if (!resolved) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  await prisma.planProduct.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
