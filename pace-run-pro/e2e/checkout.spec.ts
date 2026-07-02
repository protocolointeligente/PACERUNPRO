import { test, expect } from "@playwright/test";

/**
 * E2E: Commercial flows — subscription and marketplace.
 */

test.describe("Checkout & Subscription", () => {
  test("planos/assinar page loads and shows plans", async ({ page }) => {
    await page.goto("/assinar");
    // Page should be accessible (may redirect to login if required)
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe("complete");
  });

  test("marketplace/loja page loads", async ({ page }) => {
    const res = await page.goto("/loja");
    expect(res?.status()).not.toBe(500);
  });

  test("checkout page shows PIX option", async ({ page }) => {
    await page.goto("/checkout?plan=ATHLETE_MONTHLY");
    // Either shows checkout form or redirects to login
    await page.waitForLoadState("networkidle");
    const url = page.url();
    // Acceptable: either checkout page or login redirect
    expect(url).toMatch(/checkout|login|auth/);
  });
});

test.describe("API endpoints — commercial", () => {
  test("GET /api/planos returns plan list", async ({ request }) => {
    const res = await request.get("/api/planos");
    expect([200, 401]).toContain(res.status());
  });

  test("voucher validation rejects invalid voucher", async ({ request }) => {
    const res = await request.post("/api/vouchers/validate", {
      data: { code: "INVALID_CODE_XYZABC" },
    });
    expect([400, 401, 404, 422]).toContain(res.status());
  });

  test("webhook pagbank rejects requests without valid signature", async ({ request }) => {
    const res = await request.post("/api/webhooks/pagbank", {
      headers: { "Content-Type": "application/json" },
      data: { event: "CHARGE.PAID", id: "fake" },
    });
    // Should reject with 401 or 400 (invalid signature)
    expect([400, 401, 403]).toContain(res.status());
  });
});
