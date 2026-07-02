import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adapterRegistry } from "@/lib/integrations/registry";
import { decrypt } from "@/lib/encryption";
import { syncDevice } from "@/lib/integrations/sync-service";
import { logger } from "@/lib/logger";
import type { ProviderName } from "@/lib/integrations/types";

/** GET: webhook challenge verification (Strava, Facebook, etc.) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!adapterRegistry.has(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const adapter = adapterRegistry.get(provider as ProviderName);
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  const verifyToken = process.env[`${provider.toUpperCase()}_WEBHOOK_VERIFY_TOKEN`] ?? "";
  const challenge = adapter.handleChallenge(query, verifyToken);

  if (!challenge) return NextResponse.json({ error: "Invalid challenge" }, { status: 400 });
  return NextResponse.json(challenge);
}

/** POST: incoming webhook event from provider */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!adapterRegistry.has(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const adapter = adapterRegistry.get(provider as ProviderName);
  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  // Verify webhook signature
  if (!adapter.verifyWebhook(rawBody, headers)) {
    logger.warn("Webhook signature invalid", { provider });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = adapter.parseWebhook(body);
  if (!event) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Find matching user by providerUserId
  const device = await prisma.connectedDevice.findFirst({
    where: {
      provider: provider.toUpperCase() as never,
      externalId: event.providerUserId,
    },
    select: { userId: true, accessToken: true, refreshToken: true, tokenExpiresAt: true },
  });

  if (!device) {
    logger.warn("Webhook: no device found for providerUserId", { provider, providerUserId: event.providerUserId });
    return NextResponse.json({ ok: true, matched: false });
  }

  // Trigger sync for this user/provider
  const result = await syncDevice(device.userId, provider as ProviderName);
  logger.info("Webhook sync triggered", { provider, userId: device.userId, result });

  return NextResponse.json({ ok: true, ...result });
}
