import { describe, expect, it } from "vitest";
import { Client } from "pg";

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

suite("fase 3 — banco de integração", () => {
  it("conecta ao banco de teste e executa em transação isolada", async () => {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<{ value: number }>("SELECT 1 AS value");
      expect(result.rows[0]?.value).toBe(1);
      await client.query("ROLLBACK");
    } finally {
      await client.end();
    }
  });

  it("confirma que as tabelas de autorização, calendário e pagamentos existem", async () => {
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      const result = await client.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('User','Coach','Athlete','TrainingPlan','TrainingWeek','Workout','PaymentLedgerEntry','WebhookEvent')`
      );
      const names = new Set(result.rows.map((row) => row.table_name));
      for (const name of ["User", "Coach", "Athlete", "TrainingPlan", "TrainingWeek", "Workout", "PaymentLedgerEntry", "WebhookEvent"]) {
        expect(names.has(name), `tabela ausente: ${name}`).toBe(true);
      }
    } finally {
      await client.end();
    }
  });
});
