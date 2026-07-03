import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PROTECTED_API_PREFIXES = [
  "/api/coach/",
  "/api/atleta/",
  "/api/athlete/",
  "/api/admin/",
  "/api/integrations/",
  "/api/checkins",
  "/api/treinador/",
  "/api/marketplace/",
  "/api/messages/",
  "/api/notifications",
];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Defense-in-depth for API routes: unauthenticated → 401 JSON
  if (nextUrl.pathname.startsWith("/api/")) {
    const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
    if (isProtectedApi && !isLoggedIn) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isCoachRoute = nextUrl.pathname.startsWith("/treinador");
  const isAthleteRoute = nextUrl.pathname.startsWith("/atleta");
  const isProtected = isAdminRoute || isCoachRoute || isAthleteRoute;

  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based routing.
  // Admin pages: block non-admins at the edge as defence-in-depth. The server
  // layout is still the authoritative gate (it re-reads DB role), so false
  // negatives from stale JWTs are caught there.
  if (isLoggedIn && isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/atleta/dashboard", nextUrl));
  }

  if (isLoggedIn && isCoachRoute && !["COACH", "ADMIN"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/atleta/dashboard", nextUrl));
  }

  if (isLoggedIn && isAthleteRoute && role === "COACH") {
    return NextResponse.redirect(new URL("/treinador/dashboard", nextUrl));
  }

  // Forward pathname so server-layout components can read it via headers()
  const res = NextResponse.next();
  res.headers.set("x-pathname", nextUrl.pathname);
  return res;
});

export const config = {
  matcher: ["/atleta/:path*", "/treinador/:path*", "/admin/:path*", "/api/:path*"],
};
