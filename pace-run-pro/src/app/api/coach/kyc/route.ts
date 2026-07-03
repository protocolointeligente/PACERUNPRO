import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SubmitSchema = z.object({
  documentUrl: z.string().url("URL do documento inválida").max(2000),
});

// GET /api/coach/kyc — return current KYC status
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: {
      kycStatus: true,
      kycDocumentUrl: true,
      kycSubmittedAt: true,
      kycReviewedAt: true,
      kycNotes: true,
    },
  });

  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  return NextResponse.json(coach);
}

// POST /api/coach/kyc — submit document URL for verification
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "COACH") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    select: { id: true, kycStatus: true },
  });

  if (!coach) return NextResponse.json({ error: "Coach não encontrado" }, { status: 404 });

  if (coach.kycStatus === "APPROVED") {
    return NextResponse.json({ error: "KYC já aprovado" }, { status: 400 });
  }

  const updated = await prisma.coach.update({
    where: { id: coach.id },
    data: {
      kycStatus: "SUBMITTED",
      kycDocumentUrl: parsed.data.documentUrl,
      kycSubmittedAt: new Date(),
      kycNotes: null,
    },
    select: { kycStatus: true, kycSubmittedAt: true },
  });

  return NextResponse.json(updated);
}
