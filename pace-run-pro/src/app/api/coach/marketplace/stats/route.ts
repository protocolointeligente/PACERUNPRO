import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const [commissions, products] = await Promise.all([
    prisma.marketplaceCommission.findMany({
      where: { coachId: coach.id },
      select: { grossCents: true, netCents: true, commissionCents: true, paidOut: true, createdAt: true },
    }),
    prisma.marketplaceProduct.findMany({
      where: { coachId: coach.id },
      select: { id: true, title: true, type: true, priceCents: true, purchases: true, published: true },
    }),
  ]);

  const totalGross = commissions.reduce((s, c) => s + c.grossCents, 0);
  const totalNet = commissions.reduce((s, c) => s + c.netCents, 0);
  const pendingPayout = commissions.filter((c) => !c.paidOut).reduce((s, c) => s + c.netCents, 0);
  const totalOrders = commissions.length;

  // Last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentCommissions = commissions.filter((c) => new Date(c.createdAt) >= thirtyDaysAgo);
  const recentGross = recentCommissions.reduce((s, c) => s + c.grossCents, 0);

  return NextResponse.json({
    totalGrossCents: totalGross,
    totalNetCents: totalNet,
    pendingPayoutCents: pendingPayout,
    totalOrders,
    last30DaysGrossCents: recentGross,
    totalProducts: products.length,
    publishedProducts: products.filter((p) => p.published).length,
    products,
  });
}
