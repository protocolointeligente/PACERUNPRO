import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ATHLETE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!athlete) return NextResponse.json({ orders: [] });

  const orders = await prisma.marketplaceOrder.findMany({
    where: {
      athleteId: athlete.id,
      status: { in: ["PAID", "FULFILLED"] },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              type: true,
              sport: true,
              level: true,
              coverUrl: true,
              fileUrl: true,
              priceCents: true,
              store: { select: { name: true, slug: true, logoUrl: true } },
              coach: { select: { user: { select: { name: true, avatarUrl: true } } } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((item) => ({
        id: item.id,
        status: item.status,
        priceCents: item.priceCents,
        fileUrl: item.fileUrl ?? item.product.fileUrl,
        fulfilledAt: item.fulfilledAt?.toISOString() ?? null,
        product: item.product,
      })),
    })),
  });
}
