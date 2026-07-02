import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { adapterRegistry } from "@/lib/integrations/registry";
import { syncDevice } from "@/lib/integrations/sync-service";
import type { ProviderName } from "@/lib/integrations/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider } = await params;
  if (!adapterRegistry.has(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const result = await syncDevice(session.user.id, provider as ProviderName);
  return NextResponse.json(result);
}
