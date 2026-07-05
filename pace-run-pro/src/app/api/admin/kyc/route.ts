import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewSchema = z.object({
  coachId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().max(500).optional(),
});

// GET /api/admin/kyc — list coaches pending KYC review
export async function GET() {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coaches = await prisma.coach.findMany({
    where: { kycStatus: "SUBMITTED" },
    select: {
      id: true,
      kycStatus: true,
      kycDocumentUrl: true,
      kycSubmittedAt: true,
      kycNotes: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { kycSubmittedAt: "asc" },
  });

  return NextResponse.json({ coaches });
}

// POST /api/admin/kyc — approve or reject a coach's KYC submission
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const { coachId, decision, notes } = parsed.data;

  const coach = await prisma.coach.findUnique({
    where: { id: coachId },
    select: { id: true, kycStatus: true },
  });

  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });
  if (coach.kycStatus !== "SUBMITTED") {
    return NextResponse.json({ error: "KYC não está pendente de revisão" }, { status: 400 });
  }

  await prisma.coach.update({
    where: { id: coachId },
    data: {
      kycStatus: decision,
      kycReviewedAt: new Date(),
      kycNotes: notes ?? null,
    },
  });

  return NextResponse.json({ success: true, decision });
}
