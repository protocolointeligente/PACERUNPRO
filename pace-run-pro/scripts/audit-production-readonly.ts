import { Client } from "pg";

const REQUIRED_SOFT_DELETE_COLUMNS = [
  { table: "users", column: "deletedAt" },
  { table: "users", column: "deletionReason" },
  { table: "users", column: "deletedBy" },
  { table: "athletes", column: "deletedAt" },
  { table: "coaches", column: "deletedAt" },
  { table: "subscriptions", column: "deletedAt" },
  { table: "billing_settings", column: "deletedAt" },
];

const TABLES_TO_COUNT = [
  "users",
  "coaches",
  "athletes",
  "training_plans",
  "workouts",
  "workout_logs",
  "subscriptions",
  "payments",
  "sessions",
  "accounts",
];

type QueryResultRow = Record<string, unknown>;

async function safeQuery<T extends QueryResultRow>(
  client: Client,
  label: string,
  sql: string,
  values: unknown[] = []
): Promise<T[]> {
  try {
    const result = await client.query<T>(sql, values);
    return result.rows;
  } catch (error) {
    console.warn(`WARN ${label}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

function printRows(title: string, rows: QueryResultRow[]) {
  console.log(`\n## ${title}`);
  if (rows.length === 0) {
    console.log("No rows or query unavailable.");
    return;
  }
  console.table(rows);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for read-only audit.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const databaseInfo = await safeQuery(client, "database_info", `
      SELECT
        current_database() AS database,
        current_user AS user,
        inet_server_addr() AS host,
        inet_server_port() AS port,
        now() AS audited_at
    `);
    printRows("Database", databaseInfo);

    const tableCounts: QueryResultRow[] = [];
    for (const table of TABLES_TO_COUNT) {
      const rows = await safeQuery<{ count: string }>(
        client,
        `count_${table}`,
        `SELECT COUNT(*)::text AS count FROM "${table}"`
      );
      tableCounts.push({ table, count: rows[0]?.count ?? "unavailable" });
    }
    printRows("Table Counts", tableCounts);

    const roleCounts = await safeQuery(client, "role_counts", `
      SELECT role::text, COUNT(*)::text AS count
      FROM users
      GROUP BY role
      ORDER BY role
    `);
    printRows("User Roles", roleCounts);

    const softDeleteColumns = await safeQuery(client, "soft_delete_columns", `
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'users' AND column_name IN ('deletedAt', 'deletionReason', 'deletedBy'))
          OR (table_name IN ('athletes', 'coaches', 'subscriptions', 'billing_settings') AND column_name = 'deletedAt')
        )
      ORDER BY table_name, column_name
    `);
    printRows("Soft Delete Columns Found", softDeleteColumns);

    const foundColumnKeys = new Set(
      softDeleteColumns.map((row) => `${row.table_name}.${row.column_name}`)
    );
    const missingColumns = REQUIRED_SOFT_DELETE_COLUMNS
      .filter((item) => !foundColumnKeys.has(`${item.table}.${item.column}`))
      .map((item) => ({ table: item.table, missing_column: item.column }));
    printRows("Soft Delete Columns Missing", missingColumns);

    const deletedCounts = await safeQuery(client, "deleted_counts", `
      SELECT 'users' AS table_name, COUNT(*)::text AS deleted_count FROM users WHERE "deletedAt" IS NOT NULL
      UNION ALL
      SELECT 'athletes', COUNT(*)::text FROM athletes WHERE "deletedAt" IS NOT NULL
      UNION ALL
      SELECT 'coaches', COUNT(*)::text FROM coaches WHERE "deletedAt" IS NOT NULL
      UNION ALL
      SELECT 'subscriptions', COUNT(*)::text FROM subscriptions WHERE "deletedAt" IS NOT NULL
      UNION ALL
      SELECT 'billing_settings', COUNT(*)::text FROM billing_settings WHERE "deletedAt" IS NOT NULL
    `);
    printRows("Soft Deleted Records", deletedCounts);

    const coachesWithoutProfile = await safeQuery(client, "coaches_without_profile", `
      SELECT u.id, u.email, u.role::text
      FROM users u
      LEFT JOIN coaches c ON c."userId" = u.id
      WHERE u.role = 'COACH'
        AND c.id IS NULL
      ORDER BY u.email
      LIMIT 50
    `);
    printRows("COACH Users Without Coach Profile", coachesWithoutProfile);

    const athletesWithoutProfile = await safeQuery(client, "athletes_without_profile", `
      SELECT u.id, u.email, u.role::text
      FROM users u
      LEFT JOIN athletes a ON a."userId" = u.id
      WHERE u.role = 'ATHLETE'
        AND a.id IS NULL
      ORDER BY u.email
      LIMIT 50
    `);
    printRows("ATHLETE Users Without Athlete Profile", athletesWithoutProfile);

    const orphanAthletes = await safeQuery(client, "orphan_athletes", `
      SELECT a.id, a."userId"
      FROM athletes a
      LEFT JOIN users u ON u.id = a."userId"
      WHERE u.id IS NULL
      LIMIT 50
    `);
    printRows("Athlete Rows Without User", orphanAthletes);

    const prismaMigrations = await safeQuery(client, "prisma_migrations", `
      SELECT migration_name, finished_at, rolled_back_at
      FROM _prisma_migrations
      ORDER BY started_at DESC
      LIMIT 20
    `);
    printRows("Recent Prisma Migrations", prismaMigrations);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
