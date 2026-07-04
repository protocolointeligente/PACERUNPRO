import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeConnectCode } from "@/lib/pagbank";
import { encrypt } from "@/lib/encryption";

// GET /api/coach/pagbank/callback?code=xxx&state=userId
// PagBank redirects here after coach authorization
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const userId = searchParams.get("state"); // userId passed as state param
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (error || !code || !userId) {
    return NextResponse.redirect(`${appUrl}/treinador/marketplace/conectar?error=authorization_denied`);
  }

  try {
    const tokens = await exchangeConnectCode(code);

    const coach = await prisma.coach.findUnique({ where: { userId }, select: { id: true } });
    if (!coach) {
      return NextResponse.redirect(`${appUrl}/treinador/marketplace/conectar?error=coach_not_found`);
    }

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await prisma.pagBankSellerAccount.upsert({
      where: { coachId: coach.id },
      update: {
        pagbankAccountId: tokens.account_id,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiresAt: expiresAt,
        authorizationStatus: "authorized",
        authorizedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        coachId: coach.id,
        pagbankAccountId: tokens.account_id,
        accessToken: encrypt(tokens.access_token),
        refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        tokenExpiresAt: expiresAt,
        authorizationStatus: "authorized",
      },
    });

    return NextResponse.redirect(`${appUrl}/treinador/marketplace/conectar?success=1`);
  } catch {
    return NextResponse.redirect(`${appUrl}/treinador/marketplace/conectar?error=token_exchange_failed`);
  }
}
