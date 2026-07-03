import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// B2B plan pricing (centavos/mês)
const PLAN_PRICE: Record<string, number> = {
  FREE: 0,
  ATHLETE: 4990,
  COACH: 14990,
  TEAM: 49900,
};

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [activeSubs, payments, mktCommissions, expenses] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: { plan: true, status: true, startedAt: true, renewsAt: true },
    }),
    prisma.payment.findMany({
      where: { status: "PAID", paidAt: { gte: startOfLastMonth } },
      select: { amountCents: true, paidAt: true, method: true },
      orderBy: { paidAt: "desc" },
    }),
    prisma.marketplaceCommission.findMany({
      where: { order: { status: "PAID" } },
      select: { commissionCents: true, createdAt: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: new Date(now.getFullYear(), now.getMonth() - 2, 1) } },
      select: { amountCents: true, category: true, date: true, description: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
  ]);

  // MRR from active subscriptions
  const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0);
  const arr = mrr * 12;

  // Subscriptions by plan
  const byPlan: Record<string, number> = {};
  for (const s of activeSubs) {
    byPlan[s.plan] = (byPlan[s.plan] ?? 0) + 1;
  }

  // Revenue this month vs last month
  const revenueThisMonth = payments
    .filter((p) => p.paidAt && p.paidAt >= startOfMonth)
    .reduce((sum, p) => sum + p.amountCents, 0);
  const revenueLastMonth = payments
    .filter((p) => p.paidAt && p.paidAt >= startOfLastMonth && p.paidAt <= endOfLastMonth)
    .reduce((sum, p) => sum + p.amountCents, 0);

  // Marketplace GMV (total orders paid)
  const mktGmv = await prisma.marketplaceOrder.aggregate({
    where: { status: "PAID" },
    _sum: { totalCents: true },
  });
  const mktTake = mktCommissions.reduce((sum, c) => sum + c.commissionCents, 0);

  // Expenses this month
  const expensesThisMonth = expenses
    .filter((e) => new Date(e.date) >= startOfMonth)
    .reduce((sum, e) => sum + e.amountCents, 0);

  const recentPayments = payments.slice(0, 20).map((p) => ({
    amountCents: p.amountCents,
    paidAt: p.paidAt,
    method: p.method,
  }));

  return NextResponse.json({
    mrr,
    arr,
    byPlan,
    totalActive: activeSubs.length,
    revenueThisMonth,
    revenueLastMonth,
    revenueGrowthPct: revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 1000) / 10
      : 0,
    mktGmv: mktGmv._sum.totalCents ?? 0,
    mktTake,
    expensesThisMonth,
    netThisMonth: revenueThisMonth - expensesThisMonth,
    recentPayments,
    recentExpenses: expenses.slice(0, 10),
  });
}
