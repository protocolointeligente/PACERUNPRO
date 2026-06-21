import { NextRequest, NextResponse } from "next/server";
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

  const redirectUri = new URL("/api/auth/strava/callback", request.url).toString();
  return NextResponse.redirect(getStravaAuthorizeUrl(redirectUri));
}
