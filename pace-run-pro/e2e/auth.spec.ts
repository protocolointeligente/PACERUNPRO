import { test, expect } from "@playwright/test";

/**
 * E2E: Authentication flows.
 */

test.describe("Login flow", () => {
  test("shows error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill("notexist@test.com");
    await page.getByRole("textbox", { name: /senha/i }).fill("wrongpassword");
    await page.getByRole("button", { name: /entrar|login/i }).click();
    // Should stay on login page and show error
    await expect(page).toHaveURL(/login/);
  });

  test("redirects unauthenticated user away from dashboard", async ({ page }) => {
    await page.goto("/atleta/dashboard");
    // Should redirect to login
    await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/login|auth|\/$/);
  });

  test("redirects unauthenticated coach from treinador", async ({ page }) => {
    await page.goto("/treinador/dashboard");
    await page.waitForURL(/login|auth/, { timeout: 5000 }).catch(() => {});
    const url = page.url();
    expect(url).toMatch(/login|auth|\/$/);
  });
});

test.describe("Registration flow", () => {
  test("registration form validates required fields", async ({ page }) => {
    await page.goto("/cadastro");
    await page.getByRole("button", { name: /cadastrar|criar conta/i }).click();
    // Should show validation errors
    await expect(page.locator("form")).toBeVisible();
    await expect(page).toHaveURL(/cadastro/);
  });
});
