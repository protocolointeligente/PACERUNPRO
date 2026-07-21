import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("fase 2 — contratos de integração", () => {
  it("protege autenticação e vínculo treinador-atleta", () => {
    const weeks = read("src/app/api/coach/athletes/[id]/weeks/route.ts");
    const workouts = read("src/app/api/coach/workouts/[id]/route.ts");
    expect(weeks).toContain('session.user.role !== "COACH"');
    expect(weeks).toContain("coachId: coach.id");
    expect(workouts).toContain("week: { plan: { coachId: coach.id } }");
  });

  it("protege prescrição, cópia segura e liberação explícita", () => {
    const copy = read("src/app/api/coach/workouts/copy/route.ts");
    const release = read("src/app/api/coach/athletes/[id]/weeks/route.ts");
    expect(copy).toContain("targetAthleteIds");
    expect(copy).toContain("skipped");
    expect(copy).toContain("targetDate");
    expect(release).toContain("releasedAt: parsed.data.released ? new Date() : null");
    expect(release).toContain('action: parsed.data.released ? "PUBLISH" : "UNPUBLISH"');
  });

  it("mantém checkout sem cartão bruto e webhook PagBank idempotente", () => {
    const webhook = read("src/app/api/webhooks/pagbank/route.ts");
    const pagbank = read("src/lib/pagbank.ts");
    expect(webhook).toContain("prisma.webhookEvent");
    expect(webhook).toContain("prisma.paymentLedgerEntry");
    expect(webhook).toContain("platformFeeCents");
    expect(webhook).toContain("P2002");
    expect(pagbank).not.toContain("createCreditCardOrder");
    expect(pagbank).not.toMatch(/cardNumber|cardCvv|securityCode/);
  });
});
