import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isCoachRoute = nextUrl.pathname.startsWith("/treinador");
  const isAthleteRoute = nextUrl.pathname.startsWith("/aluno");
  const isProtected = isAdminRoute || isCoachRoute || isAthleteRoute;

  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session?.user as { role?: string } | undefined)?.role;

  if (isLoggedIn && isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/aluno/dashboard", nextUrl));
  }

  if (isLoggedIn && isCoachRoute && !["COACH", "ADMIN"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/aluno/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/aluno/:path*", "/treinador/:path*", "/admin/:path*"],
};
