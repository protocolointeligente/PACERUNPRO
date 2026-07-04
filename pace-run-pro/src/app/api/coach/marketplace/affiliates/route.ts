import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET — own affiliate account + referral stats
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const affiliate = await prisma.marketplaceAffiliate.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      code: true,
      commissionPct: true,
      totalSales: true,
      isActive: true,
      createdAt: true,
      referrals: {
        select: { earningCents: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!affiliate) return NextResponse.json({ affiliate: null });

  const totalEarnings = affiliate.referrals.reduce((s, r) => s + r.earningCents, 0);
  const pendingEarnings = affiliate.referrals
    .filter((r) => r.status === "PENDING")
    .reduce((s, r) => s + r.earningCents, 0);

  return NextResponse.json({
    affiliate: {
      id: affiliate.id,
      code: affiliate.code,
      commissionPct: affiliate.commissionPct,
      totalSales: affiliate.totalSales,
      isActive: affiliate.isActive,
      createdAt: affiliate.createdAt,
      totalEarnings,
      pendingEarnings,
      recentReferrals: affiliate.referrals.slice(0, 10),
    },
  });
}

// POST — create affiliate account
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { code?: string; commissionPct?: number };
  const code = body.code?.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code || code.length < 3) {
    return NextResponse.json({ error: "Código deve ter pelo menos 3 caracteres alfanuméricos" }, { status: 400 });
  }

  const existing = await prisma.marketplaceAffiliate.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Você já possui um programa de afiliado" }, { status: 409 });
  }

  const codeConflict = await prisma.marketplaceAffiliate.findUnique({
    where: { code },
    select: { id: true },
  });
  if (codeConflict) {
    return NextResponse.json({ error: "Este código já está em uso. Escolha outro." }, { status: 409 });
  }

  const commissionPct = Math.min(Math.max(body.commissionPct ?? 0.10, 0.01), 0.30);

  const affiliate = await prisma.marketplaceAffiliate.create({
    data: { userId: session.user.id, code, commissionPct },
    select: { id: true, code: true, commissionPct: true, createdAt: true },
  });

  return NextResponse.json({ affiliate }, { status: 201 });
}
