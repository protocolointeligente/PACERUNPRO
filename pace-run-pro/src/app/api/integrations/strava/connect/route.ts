import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth-guard";
import { getStravaAuthorizeUrl } from "@/lib/integrations/strava";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/atleta/perfil?tab=dispositivos");
    return NextResponse.redirect(loginUrl);
  }

  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/atleta/perfil?tab=dispositivos&error=strava_not_configured", request.url)
    );
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = new URL("/api/auth/strava/callback", request.url).toString();
  const response = NextResponse.redirect(getStravaAuthorizeUrl(redirectUri, state));
  response.cookies.set("strava_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  return response;
}
