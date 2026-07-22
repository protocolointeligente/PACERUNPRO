import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exchangeStravaCode,
  getStravaAuthorizeUrl,
  getStravaRedirectConfig,
  STRAVA_CALLBACK_PATH,
} from "@/lib/integrations/strava";

const originalEnv = { ...process.env };

describe("Strava OAuth configuration", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.STRAVA_REDIRECT_URI;
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_ENV;
    process.env.NODE_ENV = "test";
    process.env.STRAVA_CLIENT_ID = "client id";
    process.env.STRAVA_CLIENT_SECRET = "server-only-secret";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("prioritizes the explicit STRAVA_REDIRECT_URI", () => {
    process.env.STRAVA_REDIRECT_URI =
      "https://www.pacerunpro.com.br/api/auth/strava/callback";
    process.env.APP_URL = "https://another.example.com";

    const config = getStravaRedirectConfig();

    expect(config.redirectUri).toBe(
      "https://www.pacerunpro.com.br/api/auth/strava/callback",
    );
    expect(config.source).toBe("STRAVA_REDIRECT_URI");
  });

  it("falls back to APP_URL with the real callback path", () => {
    process.env.APP_URL = "https://app.example.com/base";

    const config = getStravaRedirectConfig();

    expect(config.redirectUri).toBe(`https://app.example.com${STRAVA_CALLBACK_PATH}`);
    expect(config.source).toBe("APP_URL");
  });

  it("never uses a Vercel preview URL in production", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "temporary-preview.vercel.app";

    const config = getStravaRedirectConfig();

    expect(config.redirectUri).toBe(
      "https://www.pacerunpro.com.br/api/auth/strava/callback",
    );
    expect(config.source).toBe("production_default");
  });

  it("rejects an explicit URI that points to a nonexistent callback route", () => {
    process.env.STRAVA_REDIRECT_URI =
      "https://www.pacerunpro.com.br/api/integrations/strava/callback";

    expect(() => getStravaRedirectConfig()).toThrow(STRAVA_CALLBACK_PATH);
  });

  it("encodes redirect_uri and state in the authorization URL", () => {
    const redirectUri = "https://example.com/api/auth/strava/callback?source=test value";
    const url = getStravaAuthorizeUrl(redirectUri, "state with spaces");

    expect(url).toContain(`redirect_uri=${encodeURIComponent(redirectUri)}`);
    expect(url).toContain(`state=${encodeURIComponent("state with spaces")}`);
    expect(url).not.toContain("server-only-secret");
  });

  it("sends the same redirect_uri during code exchange", async () => {
    const redirectUri = "https://www.pacerunpro.com.br/api/auth/strava/callback";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          token_type: "Bearer",
          expires_at: 1,
          expires_in: 1,
          refresh_token: "refresh",
          access_token: "access",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await exchangeStravaCode("authorization-code", redirectUri);

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.redirect_uri).toBe(redirectUri);
    expect(body.client_secret).toBe("server-only-secret");
  });
});
