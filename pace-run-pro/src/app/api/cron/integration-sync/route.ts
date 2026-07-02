import { NextRequest, NextResponse } from "next/server";
import { syncAllPollingProviders } from "@/lib/integrations/sync-service";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  logger.info("Integration polling sync started");
  const results = await syncAllPollingProviders();
  const total = results.reduce((s, r) => s + r.synced, 0);
  logger.info("Integration polling sync complete", { total, providers: results.length });

  return NextResponse.json({ ok: true, results, total });
}
