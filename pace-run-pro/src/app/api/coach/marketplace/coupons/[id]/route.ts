import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

async function getCoachAndCoupon(session: Awaited<ReturnType<typeof getSession>>, couponId: string) {
  if (!session?.user?.id || session.user.role !== "COACH") return null;
  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return null;
  const coupon = await prisma.marketplaceCoupon.findFirst({ where: { id: couponId, coachId: coach.id } });
  if (!coupon) return null;
  return { coach, coupon };
}

// PATCH — toggle isActive or update description/expiry
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const ctx = await getCoachAndCoupon(session, id);
  if (!ctx) return NextResponse.json({ error: "Não autorizado ou cupom não encontrado" }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;
  const ALLOWED = new Set(["isActive", "description", "maxUses", "expiresAt"]);
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.has(k)));

  if (data.expiresAt && typeof data.expiresAt === "string") {
    data.expiresAt = new Date(data.expiresAt);
  }

  const updated = await prisma.marketplaceCoupon.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE — remove coupon (only if never used)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const ctx = await getCoachAndCoupon(session, id);
  if (!ctx) return NextResponse.json({ error: "Não autorizado ou cupom não encontrado" }, { status: 404 });

  if (ctx.coupon.usedCount > 0) {
    // Soft-delete: just deactivate
    await prisma.marketplaceCoupon.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ deactivated: true });
  }

  await prisma.marketplaceCoupon.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
