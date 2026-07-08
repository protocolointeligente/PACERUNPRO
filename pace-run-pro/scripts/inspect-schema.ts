import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

async function inspect() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    // Get athletes table structure
    const athletesResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'athletes'
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== ATHLETES TABLE ===');
    athletesResult.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (default: ${row.column_default})`);
    });
    
    // Get other tables we're trying to update
    const tables = ['workout_logs', 'payments', 'leads', 'coach_strength_templates', 'coach_run_templates', 'coach_zone_models', 'plan_products', 'plan_purchases', 'expenses'];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      if (result.rows.length > 0) {
        console.log(`\n=== ${table.toUpperCase()} ===`);
        result.rows.forEach(row => {
          console.log(`  ${row.column_name}: ${row.data_type}`);
        });
      }
    }
  } finally {
    await client.end();
  }
}

inspect().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
