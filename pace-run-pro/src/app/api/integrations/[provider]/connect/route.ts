import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { adapterRegistry } from "@/lib/integrations/registry";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await params;
  if (!adapterRegistry.has(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const adapter = adapterRegistry.get(provider as never);
  if (!adapter.supportsOAuth) {
    return NextResponse.json({ error: "Provider does not use OAuth" }, { status: 400 });
  }

  const state = Buffer.from(JSON.stringify({ userId: session.user.id, ts: Date.now() })).toString("base64url");
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/${provider}/callback`;

  try {
    const url = adapter.getAuthorizeUrl({ state, redirectUri });
    logger.info("OAuth connect initiated", { provider, userId: session.user.id });
    return NextResponse.redirect(url);
  } catch (err) {
    logger.error("OAuth connect failed", { provider, err });
    return NextResponse.json({ error: "Failed to build authorization URL" }, { status: 500 });
  }
}
