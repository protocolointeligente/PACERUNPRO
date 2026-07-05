import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse, type NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

const PROTECTED_API_PREFIXES = [
  "/api/coach/",
  "/api/atleta/",
  "/api/admin/",
  "/api/integrations/",
  "/api/checkins",
  "/api/treinador/",
  "/api/marketplace/",
  "/api/messages/",
  "/api/notifications",
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL ?? "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

const isDev = process.env.NODE_ENV === "development";

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    [
      "script-src 'self'",
      `'nonce-${nonce}'`,
      isDev ? "'unsafe-eval'" : "",
      "'unsafe-inline'", // Required for Next.js hydration scripts
      "https://sdk.pagseguro.com",
      "https://www.googletagmanager.com",
      "https://*.sentry.io",
    ].filter(Boolean).join(" "),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://images.unsplash.com https://lh3.googleusercontent.com https://*.googleusercontent.com https://sandbox.api.pagseguro.com https://api.pagseguro.com https://res.cloudinary.com https://*.amazonaws.com https://avatars.githubusercontent.com https://*.pacerunpro.com.br",
    "font-src 'self'",
    "connect-src 'self' https://api.pagseguro.com https://sandbox.api.pagseguro.com https://*.sentry.io https://www.strava.com wss:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl } = req;
  const session = req.auth as { user?: { role?: string } } | null;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
  }

  // Defense-in-depth for API routes: unauthenticated → 401 JSON
  if (nextUrl.pathname.startsWith("/api/")) {
    const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));
    if (isProtectedApi && !isLoggedIn) {
      const res = NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    const res = NextResponse.next();
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
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

  // Generate per-request nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Forward pathname so server-layout components can read it via headers()
  // Forward nonce so root layout can apply it to inline scripts
  const res = NextResponse.next({
    request: { headers: new Headers({ ...Object.fromEntries(req.headers), "x-nonce": nonce }) },
  });
  res.headers.set("x-pathname", nextUrl.pathname);
  res.headers.set("x-nonce", nonce);
  res.headers.set("Content-Security-Policy", csp);
  return res;
});

export const config = {
  matcher: ["/atleta/:path*", "/treinador/:path*", "/admin/:path*", "/api/:path*"],
};
