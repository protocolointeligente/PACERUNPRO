import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const [commissions, products, orders, stores] = await Promise.all([
    prisma.marketplaceCommission.findMany({
      select: { grossCents: true, commissionCents: true, netCents: true, paidOut: true, createdAt: true, coachId: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.marketplaceProduct.findMany({
      select: { id: true, title: true, type: true, priceCents: true, purchases: true, published: true, coachId: true },
      take: 500,
    }),
    prisma.marketplaceOrder.findMany({
      select: { id: true, status: true, totalCents: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.marketplaceStore.findMany({
      select: { id: true, name: true, slug: true, isActive: true, commissionPct: true, coach: { select: { user: { select: { name: true } } } } },
    }),
  ]);

  const gmv = commissions.reduce((s, c) => s + c.grossCents, 0);
  const totalCommissionRevenue = commissions.reduce((s, c) => s + c.commissionCents, 0);
  const totalNetToCoaches = commissions.reduce((s, c) => s + c.netCents, 0);
  const pendingPayout = commissions.filter((c) => !c.paidOut).reduce((s, c) => s + c.netCents, 0);
  const totalOrders = commissions.length;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentCommissions = commissions.filter((c) => new Date(c.createdAt) >= thirtyDaysAgo);
  const mrrMarketplace = recentCommissions.reduce((s, c) => s + c.grossCents, 0);

  // Top sellers by coach
  const coachRevMap: Record<string, number> = {};
  for (const c of commissions) {
    if (c.coachId) coachRevMap[c.coachId] = (coachRevMap[c.coachId] ?? 0) + c.grossCents;
  }

  // Category breakdown
  const typePurchasesMap: Record<string, number> = {};
  for (const p of products) {
    typePurchasesMap[p.type] = (typePurchasesMap[p.type] ?? 0) + p.purchases;
  }

  return NextResponse.json({
    gmv,
    mrrMarketplace,
    totalCommissionRevenue,
    totalNetToCoaches,
    pendingPayout,
    totalOrders,
    publishedProducts: products.filter((p) => p.published).length,
    totalProducts: products.length,
    totalStores: stores.length,
    recentOrders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
    })),
    categoryBreakdown: Object.entries(typePurchasesMap).map(([type, count]) => ({ type, count })),
    stores: stores.map((s) => ({ ...s, coachName: s.coach.user.name })),
  });
}

// PATCH — update commission config
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json();
  const { defaultCommissionPct, categoryConfig } = body;

  const config = await prisma.marketplaceConfig.upsert({
    where: { id: "default" },
    update: {
      ...(defaultCommissionPct != null ? { defaultCommissionPct } : {}),
      ...(categoryConfig != null ? { categoryConfig } : {}),
    },
    create: { id: "default", defaultCommissionPct: defaultCommissionPct ?? 0.15, categoryConfig: categoryConfig ?? null },
  });

  return NextResponse.json(config);
}
