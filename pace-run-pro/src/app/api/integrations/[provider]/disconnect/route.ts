import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-guard";
import { adapterRegistry } from "@/lib/integrations/registry";
import { decrypt } from "@/lib/encryption";
import { logger } from "@/lib/logger";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await params;
  if (!adapterRegistry.has(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const device = await prisma.connectedDevice.findUnique({
    where: { userId_provider: { userId: session.user.id, provider: provider.toUpperCase() as never } },
  });

  if (!device) return NextResponse.json({ error: "Not connected" }, { status: 404 });

  // Best-effort revoke at provider
  if (device.accessToken) {
    try {
      const adapter = adapterRegistry.get(provider as never);
      const tokens = {
        accessToken: decrypt(device.accessToken),
        refreshToken: device.refreshToken ? decrypt(device.refreshToken) : undefined,
      };
      await adapter.revokeTokens(tokens);
    } catch {
      // Non-fatal
    }
  }

  await prisma.connectedDevice.delete({ where: { id: device.id } });
  logger.info("Provider disconnected", { provider, userId: session.user.id });
  return NextResponse.json({ ok: true });
}
