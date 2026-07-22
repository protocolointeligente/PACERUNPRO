import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import {
  exchangeStravaCode,
  fetchStravaActivities,
  getStravaRedirectConfig,
  logStravaOAuthConfig,
} from "@/lib/integrations/strava";
import { persistStravaActivity } from "@/lib/integrations/strava-sync";
import { encrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const storedState = request.cookies.get("strava_state")?.value ?? "";
  const receivedState = state ?? "";
  const storedStateBuffer = Buffer.from(storedState, "utf8");
  const receivedStateBuffer = Buffer.from(receivedState, "utf8");
  const validState =
    storedStateBuffer.length > 0 &&
    storedStateBuffer.length === receivedStateBuffer.length &&
    timingSafeEqual(storedStateBuffer, receivedStateBuffer);
  if (!validState) {
    const csrfResponse = NextResponse.redirect(
      new URL("/atleta/perfil?tab=dispositivos&error=strava_csrf", request.url),
    );
    csrfResponse.cookies.delete("strava_state");
    return csrfResponse;
  }

  if (error || !code) {
    const deniedResponse = NextResponse.redirect(
      new URL("/atleta/perfil?tab=dispositivos&error=strava_denied", request.url),
    );
    deniedResponse.cookies.delete("strava_state");
    return deniedResponse;
  }

  const session = await getSession();
  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/atleta/perfil?tab=dispositivos");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const redirectConfig = getStravaRedirectConfig();
    logStravaOAuthConfig(redirectConfig);
    const token = await exchangeStravaCode(code, redirectConfig.redirectUri);
    const externalId = token.athlete?.id ? String(token.athlete.id) : null;

    const device = await prisma.connectedDevice.upsert({
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

    const athlete = await prisma.athlete.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (athlete) {
      try {
        const activities = await fetchStravaActivities(token.access_token, 30);
        for (const activity of activities) {
          await persistStravaActivity(athlete.id, activity);
        }
        await prisma.connectedDevice.update({
          where: { id: device.id },
          data: { lastSyncAt: new Date() },
        });
      } catch (syncErr) {
        console.warn("[strava callback initial sync]", syncErr);
      }
    }
  } catch (err) {
    console.error("[strava callback]", err);
    return NextResponse.redirect(new URL("/atleta/perfil?tab=dispositivos&error=strava_token", request.url));
  }

  const successResponse = NextResponse.redirect(new URL("/atleta/perfil?tab=dispositivos&connected=strava", request.url));
  successResponse.cookies.delete("strava_state");
  return successResponse;
}
