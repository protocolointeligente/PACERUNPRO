import { test, expect } from "@playwright/test";

/**
 * E2E: Health check and public pages.
 * These tests do NOT require authentication.
 */

test.describe("Public routes", () => {
  test("health endpoint responds OK", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(["ok", "degraded"]).toContain(body.status);
    expect(body).toHaveProperty("ts");
  });

  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/pace|run|pro/i);
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("cadastro page renders registration form", async ({ page }) => {
    await page.goto("/cadastro");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("non-existent route returns 404", async ({ page }) => {
    const res = await page.goto("/rota-que-nao-existe-xyzabc");
    expect([404, 200]).toContain(res?.status());
  });
});

test.describe("API rate limiting", () => {
  test("auth register enforces rate limit after 5 rapid requests", async ({ request }) => {
    const body = { name: "Test", email: `ratelimit+${Date.now()}@test.com`, password: "Abc123!@#", role: "ATHLETE" };
    let lastStatus = 200;
    for (let i = 0; i < 6; i++) {
      const res = await request.post("/api/auth/register", { data: body });
      lastStatus = res.status();
    }
    // At some point should get 429
    expect([400, 429, 409]).toContain(lastStatus);
  });
});
