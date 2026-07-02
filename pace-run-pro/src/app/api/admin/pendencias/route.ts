import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [pendingCoaches, pastDueSubs, staleMktOrders, recentFailedPayments] = await Promise.all([
    // Coaches awaiting approval (status PENDING on their subscription)
    prisma.user.findMany({
      where: { role: "COACH", subscriptions: { some: { status: "TRIAL" } } },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        subscriptions: { select: { plan: true, status: true, startedAt: true }, take: 1, orderBy: { startedAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    // Subscriptions past due (payment failed)
    prisma.subscription.findMany({
      where: { status: "PAST_DUE" },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { renewsAt: "asc" },
      take: 20,
    }),

    // Marketplace orders pending > 24h
    prisma.marketplaceOrder.findMany({
      where: { status: "PENDING", createdAt: { lt: since24h } },
      include: {
        athlete: { include: { user: { select: { name: true, email: true } } } },
        items: { include: { product: { select: { title: true } } }, take: 1 },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),

    // Failed payments in last 7 days
    prisma.payment.findMany({
      where: { status: "FAILED", createdAt: { gte: since7d } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    pendingCoaches: pendingCoaches.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      plan: u.subscriptions[0]?.plan ?? "FREE",
      status: u.subscriptions[0]?.status ?? "TRIAL",
    })),
    pastDueSubs: pastDueSubs.map((s) => ({
      id: s.id,
      userName: s.user.name,
      userEmail: s.user.email,
      plan: s.plan,
      renewsAt: s.renewsAt,
    })),
    staleMktOrders: staleMktOrders.map((o) => ({
      id: o.id,
      athleteName: o.athlete.user.name,
      athleteEmail: o.athlete.user.email,
      totalCents: o.totalCents,
      productTitle: o.items[0]?.product?.title ?? "—",
      createdAt: o.createdAt,
    })),
    failedPayments: recentFailedPayments.map((p) => ({
      id: p.id,
      userName: p.user.name,
      userEmail: p.user.email,
      amountCents: p.amountCents,
      method: p.method,
      createdAt: p.createdAt,
    })),
  });
}
