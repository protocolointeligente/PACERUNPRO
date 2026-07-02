import { describe, it, expect } from "vitest";
import {
  getCoachNav,
  canAccess,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type CoachRole,
  type CoachFeature,
} from "@/lib/coach-permissions";

describe("ROLE_LABELS", () => {
  it("has label for all roles", () => {
    expect(ROLE_LABELS["autonomo"]).toBeTruthy();
    expect(ROLE_LABELS["owner"]).toBeTruthy();
    expect(ROLE_LABELS["hired"]).toBeTruthy();
  });
});

describe("ROLE_DESCRIPTIONS", () => {
  it("has description for all roles", () => {
    expect(ROLE_DESCRIPTIONS["autonomo"]).toBeTruthy();
    expect(ROLE_DESCRIPTIONS["owner"]).toBeTruthy();
    expect(ROLE_DESCRIPTIONS["hired"]).toBeTruthy();
  });
});

describe("getCoachNav", () => {
  it("returns main and more arrays", () => {
    const nav = getCoachNav("autonomo", "b2b-pro");
    expect(Array.isArray(nav.main)).toBe(true);
    expect(Array.isArray(nav.more)).toBe(true);
  });

  it("hired role returns no business nav", () => {
    const { main, more } = getCoachNav("hired", "b2b-assessoria");
    // hired always gets core nav only
    expect(main.length).toBeGreaterThan(0);
    // business nav items should NOT be in more for hired
    const hrefs = more.map((n) => n.href);
    expect(hrefs).not.toContain("/treinador/gestao");
    expect(hrefs).not.toContain("/treinador/financeiro");
  });

  it("free plan excludes business nav", () => {
    const { more } = getCoachNav("autonomo", "b2b-free");
    const hrefs = more.map((n) => n.href);
    expect(hrefs).not.toContain("/treinador/gestao");
    expect(hrefs).not.toContain("/treinador/vouchers");
  });

  it("starter plan includes base business nav", () => {
    const { more } = getCoachNav("autonomo", "b2b-starter");
    const hrefs = more.map((n) => n.href);
    expect(hrefs).toContain("/treinador/gestao");
    expect(hrefs).toContain("/treinador/financeiro");
    expect(hrefs).not.toContain("/treinador/vouchers");
  });

  it("pro plan includes vouchers", () => {
    const { more } = getCoachNav("autonomo", "b2b-pro");
    const hrefs = more.map((n) => n.href);
    expect(hrefs).toContain("/treinador/vouchers");
    expect(hrefs).not.toContain("/treinador/admin");
  });

  it("assessoria plan includes admin", () => {
    const { more } = getCoachNav("autonomo", "b2b-assessoria");
    const hrefs = more.map((n) => n.href);
    expect(hrefs).toContain("/treinador/admin");
    expect(hrefs).not.toContain("/treinador/white-label");
  });

  it("unlimited plan includes white-label", () => {
    const { more } = getCoachNav("autonomo", "b2b-unlimited");
    const hrefs = more.map((n) => n.href);
    expect(hrefs).toContain("/treinador/white-label");
  });

  it("without planId defaults to full access for non-hired", () => {
    const { more } = getCoachNav("autonomo");
    // No planId = legacy role-only check → no tier filtering
    // Should still return something (helpNav at minimum)
    expect(more.length).toBeGreaterThan(0);
  });
});

describe("canAccess", () => {
  it("hired role cannot access any feature", () => {
    const features: CoachFeature[] = ["gestao", "financeiro", "planos-venda", "vouchers", "crm", "admin", "white-label", "minha-pagina"];
    for (const f of features) {
      expect(canAccess("hired", f, "b2b-unlimited")).toBe(false);
    }
  });

  it("autonomo without planId can access everything (legacy)", () => {
    expect(canAccess("autonomo", "gestao")).toBe(true);
    expect(canAccess("autonomo", "white-label")).toBe(true);
  });

  it("free plan cannot access gestao", () => {
    expect(canAccess("autonomo", "gestao", "b2b-free")).toBe(false);
  });

  it("starter can access gestao and financeiro", () => {
    expect(canAccess("autonomo", "gestao", "b2b-starter")).toBe(true);
    expect(canAccess("autonomo", "financeiro", "b2b-starter")).toBe(true);
  });

  it("starter cannot access vouchers (needs pro)", () => {
    expect(canAccess("autonomo", "vouchers", "b2b-starter")).toBe(false);
  });

  it("pro can access vouchers", () => {
    expect(canAccess("autonomo", "vouchers", "b2b-pro")).toBe(true);
  });

  it("pro cannot access admin (needs assessoria)", () => {
    expect(canAccess("autonomo", "admin", "b2b-pro")).toBe(false);
  });

  it("assessoria can access admin", () => {
    expect(canAccess("autonomo", "admin", "b2b-assessoria")).toBe(true);
  });

  it("assessoria cannot access white-label (needs unlimited)", () => {
    expect(canAccess("autonomo", "white-label", "b2b-assessoria")).toBe(false);
  });

  it("unlimited can access white-label", () => {
    expect(canAccess("autonomo", "white-label", "b2b-unlimited")).toBe(true);
  });

  it("unknown plan treated as free (tier 0)", () => {
    expect(canAccess("autonomo", "gestao", "unknown-plan")).toBe(false);
  });
});
