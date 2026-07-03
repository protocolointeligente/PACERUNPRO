import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSchema = z.object({
  code: z.string().min(3).max(32).toUpperCase(),
  discountPct: z.number().min(0.01).max(1).optional(),
  discountCents: z.number().int().min(1).optional(),
  minOrderCents: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
  description: z.string().max(200).optional(),
}).refine((d) => d.discountPct != null || d.discountCents != null, {
  message: "Informe discountPct ou discountCents",
});

// GET /api/coach/marketplace/coupons — list coupons for coach's store
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, marketplaceStore: { select: { id: true } } },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  const coupons = await prisma.marketplaceCoupon.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      discountPct: true,
      discountCents: true,
      minOrderCents: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      isActive: true,
      description: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ coupons });
}

// POST /api/coach/marketplace/coupons — create a new coupon
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, marketplaceStore: { select: { id: true } } },
  });
  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  // Check code uniqueness
  const existing = await prisma.marketplaceCoupon.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return NextResponse.json({ error: "Código já existe" }, { status: 409 });
  }

  const coupon = await prisma.marketplaceCoupon.create({
    data: {
      code: parsed.data.code,
      coachId: coach.id,
      storeId: coach.marketplaceStore?.id ?? null,
      discountPct: parsed.data.discountPct ?? null,
      discountCents: parsed.data.discountCents ?? null,
      minOrderCents: parsed.data.minOrderCents ?? null,
      maxUses: parsed.data.maxUses ?? null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      description: parsed.data.description ?? null,
    },
    select: { id: true, code: true, discountPct: true, discountCents: true, isActive: true },
  });

  return NextResponse.json(coupon, { status: 201 });
}
