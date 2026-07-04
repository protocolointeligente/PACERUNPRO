import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET /api/marketplace/orders/[orderId]/status
// Polled by the PIX payment screen to detect when the order is paid
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { orderId } = await params;

  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
    select: { status: true, athlete: { select: { userId: true } } },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (order.athlete.userId !== session.user.id) return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  return NextResponse.json({ status: order.status });
}
