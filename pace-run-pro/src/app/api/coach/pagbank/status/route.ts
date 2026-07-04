import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET /api/coach/pagbank/status
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role !== "COACH") return NextResponse.json({ error: "Apenas treinadores" }, { status: 403 });

  const coach = await prisma.coach.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const account = await prisma.pagBankSellerAccount.findUnique({
    where: { coachId: coach.id },
    select: {
      pagbankAccountId: true,
      authorizationStatus: true,
      authorizedAt: true,
      tokenExpiresAt: true,
    },
  });

  if (!account) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: account.authorizationStatus === "authorized",
    pagbankAccountId: account.pagbankAccountId,
    authorizationStatus: account.authorizationStatus,
    authorizedAt: account.authorizedAt,
    tokenExpiresAt: account.tokenExpiresAt,
  });
}
