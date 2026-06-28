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

  // Find orders that contain this coach's products
  const commissions = await prisma.marketplaceCommission.findMany({
    where: { coachId: coach.id },
    include: {
      order: {
        include: {
          athlete: { select: { user: { select: { name: true, email: true } } } },
          items: { include: { product: { select: { title: true, type: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const orders = commissions.map((c) => ({
    id: c.order.id,
    status: c.order.status,
    createdAt: c.order.createdAt,
    athleteName: c.order.athlete.user.name,
    athleteEmail: c.order.athlete.user.email,
    grossCents: c.grossCents,
    commissionCents: c.commissionCents,
    netCents: c.netCents,
    paidOut: c.paidOut,
    items: c.order.items.map((i) => ({ title: i.product.title, type: i.product.type, priceCents: i.priceCents })),
  }));

  return NextResponse.json(orders);
}
