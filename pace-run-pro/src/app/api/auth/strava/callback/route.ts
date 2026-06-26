import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { exchangeStravaCode } from "@/lib/integrations/strava";
import { encrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/atleta/perfil?tab=dispositivos&error=strava_denied", request.url));
  }

  const storedState = request.cookies.get("strava_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/atleta/perfil?tab=dispositivos&error=strava_csrf", request.url));
  }

  const session = await getSession();
  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/atleta/perfil?tab=dispositivos");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const token = await exchangeStravaCode(code);
    const externalId = token.athlete?.id ? String(token.athlete.id) : null;

    await prisma.connectedDevice.upsert({
      where: { userId_provider: { userId: session.user.id, provider: "STRAVA" } },
      update: {
        externalId,
        accessToken: encrypt(token.access_token),
        refreshToken: token.refresh_token ? encrypt(token.refresh_token) : null,
      },
      create: {
        userId: session.user.id,
        provider: "STRAVA",
        externalId,
        accessToken: encrypt(token.access_token),
        refreshToken: token.refresh_token ? encrypt(token.refresh_token) : null,
      },
    });
  } catch (err) {
    console.error("[strava callback]", err);
    return NextResponse.redirect(new URL("/atleta/perfil?tab=dispositivos&error=strava_token", request.url));
  }

  const successResponse = NextResponse.redirect(new URL("/atleta/perfil?tab=dispositivos&connected=strava", request.url));
  successResponse.cookies.delete("strava_state");
  return successResponse;
}
