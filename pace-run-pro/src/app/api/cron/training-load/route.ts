import { NextRequest, NextResponse } from "next/server";
import { persistAllAthletesLoad } from "@/lib/load-persistence-service";

// Called by Vercel Cron at 02:00 UTC (23:00 America/Sao_Paulo — after training day ends)
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();

  try {
    const result = await persistAllAthletesLoad();
    return NextResponse.json({
      ok: true,
      processed: result.processed,
      errors: result.errors,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
