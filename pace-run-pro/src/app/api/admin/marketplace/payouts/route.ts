import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

// GET — list unpaid commissions grouped by coach
export async function GET() {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const unpaid = await prisma.marketplaceCommission.findMany({
    where: { paidOut: false },
    include: {
      coach: { select: { id: true, user: { select: { name: true, email: true } } } },
      order: { select: { id: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by coach
  const byCoach = new Map<string, {
    coachId: string;
    coachName: string | null;
    coachEmail: string;
    netCents: number;
    commissionIds: string[];
  }>();

  for (const c of unpaid) {
    if (!c.coachId || !c.coach) continue;
    const key = c.coachId;
    if (!byCoach.has(key)) {
      byCoach.set(key, {
        coachId: c.coachId,
        coachName: c.coach.user.name,
        coachEmail: c.coach.user.email,
        netCents: 0,
        commissionIds: [],
      });
    }
    const entry = byCoach.get(key)!;
    entry.netCents += c.netCents;
    entry.commissionIds.push(c.id);
  }

  return NextResponse.json({ coaches: Array.from(byCoach.values()) });
}

// POST — mark commissions as paid, create payout record
export async function POST(req: NextRequest) {
  const session = await getSession();
  const denied = requireAdmin(session);
  if (denied) return denied;

  const body = await req.json() as { coachId?: string; pixKey?: string; method?: string };
  const { coachId, pixKey, method = "PIX" } = body;
  if (!coachId) return NextResponse.json({ error: "coachId obrigatório" }, { status: 400 });

  const unpaid = await prisma.marketplaceCommission.findMany({
    where: { coachId, paidOut: false },
    select: { id: true, netCents: true },
  });

  if (unpaid.length === 0) {
    return NextResponse.json({ error: "Nenhuma comissão pendente para este coach" }, { status: 400 });
  }

  const totalNet = unpaid.reduce((s, c) => s + c.netCents, 0);

  const payout = await prisma.marketplacePayout.create({
    data: {
      coachId,
      amountCents: totalNet,
      method,
      pixKey: pixKey ?? null,
      status: "COMPLETED",
      processedAt: new Date(),
    },
  });

  await prisma.marketplaceCommission.updateMany({
    where: { id: { in: unpaid.map((c) => c.id) } },
    data: { paidOut: true, paidAt: new Date(), payoutId: payout.id },
  });

  await writeAuditLog({
    userId: session?.user?.id,
    action: "PAYOUT_CREATED",
    entity: "MarketplacePayout",
    entityId: payout.id,
    meta: { coachId, amountCents: totalNet, method, count: unpaid.length },
  });

  return NextResponse.json({ payoutId: payout.id, amountCents: totalNet, count: unpaid.length });
}
