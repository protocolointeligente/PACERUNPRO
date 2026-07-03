import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || !["COACH", "ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    include: { marketplaceStore: { select: { stripeAccountId: true } } },
  });

  const accountId = coach?.marketplaceStore?.stripeAccountId ?? null;
  if (!accountId) {
    return NextResponse.json({ connected: false, payoutsEnabled: false, accountId: null });
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);

  return NextResponse.json({
    connected:      account.details_submitted,
    payoutsEnabled: account.payouts_enabled,
    accountId,
  });
}
