import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthCheck {
  status: "ok" | "degraded" | "error";
  ts: number;
  uptime: number;
  version: string;
  checks: {
    database: { status: "ok" | "error"; latencyMs?: number; error?: string };
  };
}

export async function GET() {
  const start = Date.now();
  const result: HealthCheck = {
    status: "ok",
    ts: start,
    uptime: process.uptime(),
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
    checks: {
      database: { status: "ok" },
    },
  };

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    result.checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch (err) {
    result.checks.database = {
      status: "error",
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "unknown",
    };
    result.status = "degraded";
  }

  const httpStatus = result.status === "ok" ? 200 : 503;
  return NextResponse.json(result, { status: httpStatus });
}
