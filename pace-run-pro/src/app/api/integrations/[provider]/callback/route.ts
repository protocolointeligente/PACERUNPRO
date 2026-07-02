import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adapterRegistry } from "@/lib/integrations/registry";
import { encrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!adapterRegistry.has(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    logger.warn("OAuth callback error from provider", { provider, error });
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=${error}`);
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  // Decode state to get userId
  let userId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as { userId: string };
    userId = decoded.userId;
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const adapter = adapterRegistry.get(provider as never);
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/${provider}/callback`;

  try {
    const { tokens, providerUserId } = await adapter.exchangeCode(code, redirectUri);

    await prisma.connectedDevice.upsert({
      where: { userId_provider: { userId, provider: provider.toUpperCase() as never } },
      create: {
        userId,
        provider: provider.toUpperCase() as never,
        externalId: providerUserId || null,
        accessToken: tokens.accessToken ? encrypt(tokens.accessToken) : null,
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
        tokenExpiresAt: tokens.expiresAt ?? null,
      },
      update: {
        externalId: providerUserId || undefined,
        accessToken: tokens.accessToken ? encrypt(tokens.accessToken) : undefined,
        refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
        tokenExpiresAt: tokens.expiresAt ?? null,
      },
    });

    logger.info("OAuth callback success", { provider, userId });
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?connected=${provider}`);
  } catch (err) {
    logger.error("OAuth callback exchange failed", { provider, userId, err });
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/integrations?error=exchange_failed`);
  }
}
