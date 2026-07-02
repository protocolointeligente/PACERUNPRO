import { auth } from "@/auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";

/** Safe wrapper — returns null instead of throwing when auth() fails. */
export async function getSession(): Promise<Session | null> {
  try {
    return await auth();
  } catch {
    return null;
  }
}

type UserRole = "ADMIN" | "COACH" | "ATHLETE";

function userRole(session: Session | null): UserRole | null {
  return (session?.user as { role?: UserRole } | undefined)?.role ?? null;
}

/** Returns 401/403 JSON response if the session doesn't have the required role, or null if authorized. */
export function requireRole(session: Session | null, role: UserRole): NextResponse | null {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (userRole(session) !== role) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  return null;
}

/** Convenience helper for admin-only API routes. */
export function requireAdmin(session: Session | null): NextResponse | null {
  return requireRole(session, "ADMIN");
}

/** Convenience helper for coach-only API routes. */
export function requireCoach(session: Session | null): NextResponse | null {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const role = userRole(session);
  if (role !== "COACH" && role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }
  return null;
}
