import { auth } from "@/auth";
import { NextResponse } from "next/server";

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

  if (isLoggedIn && isAdminRoute && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/aluno/dashboard", nextUrl));
  }

  if (isLoggedIn && isCoachRoute && !["COACH", "ADMIN"].includes(session.user.role)) {
    return NextResponse.redirect(new URL("/aluno/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/aluno/:path*", "/treinador/:path*", "/admin/:path*"],
};
