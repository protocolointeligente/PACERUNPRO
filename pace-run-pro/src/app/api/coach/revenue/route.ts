import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // All paid purchases for this coach's products
  const purchases = await prisma.planPurchase.findMany({
    where: {
      status: "PAID",
      product: { coachId: coach.id },
    },
    select: {
      id: true,
      pricePaidCents: true,
      createdAt: true,
      product: { select: { id: true, title: true, sport: true } },
      athlete: { select: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCents = purchases.reduce((s, p) => s + p.pricePaidCents, 0);

  const thisMonthCents = purchases
    .filter((p) => p.createdAt >= startOfThisMonth)
    .reduce((s, p) => s + p.pricePaidCents, 0);

  const lastMonthCents = purchases
    .filter((p) => p.createdAt >= startOfLastMonth && p.createdAt <= endOfLastMonth)
    .reduce((s, p) => s + p.pricePaidCents, 0);

  // Per-product breakdown
  const byProductMap = new Map<
    string,
    { productId: string; title: string; sport: string; count: number; totalCents: number }
  >();
  for (const p of purchases) {
    const existing = byProductMap.get(p.product.id);
    if (existing) {
      existing.count++;
      existing.totalCents += p.pricePaidCents;
    } else {
      byProductMap.set(p.product.id, {
        productId: p.product.id,
        title: p.product.title,
        sport: p.product.sport,
        count: 1,
        totalCents: p.pricePaidCents,
      });
    }
  }
  const byProduct = Array.from(byProductMap.values()).sort((a, b) => b.totalCents - a.totalCents);

  // Monthly trend — last 6 months
  const monthly: { label: string; totalCents: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const label = d.toLocaleString("pt-BR", { month: "short", year: "2-digit" });
    const cents = purchases
      .filter((p) => p.createdAt >= d && p.createdAt <= end)
      .reduce((s, p) => s + p.pricePaidCents, 0);
    monthly.push({ label, totalCents: cents });
  }

  // Recent transactions (last 20)
  const recent = purchases.slice(0, 20).map((p) => ({
    id: p.id,
    athleteName: p.athlete.user.name ?? "Atleta",
    productTitle: p.product.title,
    pricePaidCents: p.pricePaidCents,
    createdAt: p.createdAt.toISOString(),
  }));

  return NextResponse.json({
    totalCents,
    thisMonthCents,
    lastMonthCents,
    salesCount: purchases.length,
    byProduct,
    monthly,
    recent,
  });
}
