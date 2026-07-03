import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(_req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id || !["COACH", "ADMIN"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    include: { marketplaceStore: { select: { id: true, stripeAccountId: true } } },
  });
  if (!coach) return NextResponse.json({ error: "Treinador não encontrado" }, { status: 404 });

  const store = coach.marketplaceStore;
  if (!store) return NextResponse.json({ error: "Configure sua loja antes de conectar o Stripe" }, { status: 400 });

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://pacerunpro.com.br";

  let accountId = store.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "BR",
      email: session.user.email ?? undefined,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: { mcc: "7941", url: `${appUrl}/marketplace` },
    });
    accountId = account.id;
    await prisma.marketplaceStore.update({
      where: { id: store.id },
      data: { stripeAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/treinador/marketplace/conectar?refresh=1`,
    return_url:  `${appUrl}/treinador/marketplace/conectar?success=1`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
