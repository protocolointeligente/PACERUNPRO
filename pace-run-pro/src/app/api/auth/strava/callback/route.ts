import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/aluno/perfil?tab=dispositivos&error=strava_denied", request.url));
  }

  // In production: exchange `code` for access_token + refresh_token via Strava API,
  // store tokens in DB linked to current user session, fetch initial activities backfill.
  // For demo: redirect back to profile with success flag
  return NextResponse.redirect(new URL("/aluno/perfil?tab=dispositivos&connected=strava", request.url));
}
