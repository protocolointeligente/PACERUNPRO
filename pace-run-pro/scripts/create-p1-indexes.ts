#!/usr/bin/env node

/**
 * P1.3 Index Creation Script
 * Directly creates 18+ indexes using raw SQL via pg client
 */

import { Client } from 'pg';

const indexes = [
  // Filter indexes
  { name: 'idx_athletes_status', sql: 'CREATE INDEX IF NOT EXISTS idx_athletes_status ON athletes(status);' },
  { name: 'idx_athletes_coach_id', sql: 'CREATE INDEX IF NOT EXISTS idx_athletes_coach_id ON athletes("coachId");' },
  { name: 'idx_workouts_type', sql: 'CREATE INDEX IF NOT EXISTS idx_workouts_type ON workouts(type);' },
  { name: 'idx_workouts_status', sql: 'CREATE INDEX IF NOT EXISTS idx_workouts_status ON workouts(status);' },
  { name: 'idx_workout_logs_source', sql: 'CREATE INDEX IF NOT EXISTS idx_workout_logs_source ON workout_logs(source);' },
  { name: 'idx_vouchers_active', sql: 'CREATE INDEX IF NOT EXISTS idx_vouchers_active ON vouchers(active);' },
  { name: 'idx_vouchers_active_expires', sql: 'CREATE INDEX IF NOT EXISTS idx_vouchers_active_expires ON vouchers(active, "expiresAt");' },
  { name: 'idx_coach_plans_active', sql: 'CREATE INDEX IF NOT EXISTS idx_coach_plans_active ON coach_plans(active);' },
  
  // GIN indexes (JSON)
  { name: 'idx_workouts_blocks_gin', sql: 'CREATE INDEX IF NOT EXISTS idx_workouts_blocks_gin ON workouts USING GIN(blocks);' },
  { name: 'idx_workout_logs_gpstrack_gin', sql: 'CREATE INDEX IF NOT EXISTS idx_workout_logs_gpstrack_gin ON workout_logs USING GIN("gpsTrack");' },
  { name: 'idx_workout_logs_splits_gin', sql: 'CREATE INDEX IF NOT EXISTS idx_workout_logs_splits_gin ON workout_logs USING GIN(splits);' },
  { name: 'idx_plan_products_content_gin', sql: 'CREATE INDEX IF NOT EXISTS idx_plan_products_content_gin ON plan_products USING GIN("planContent");' },
  { name: 'idx_coach_zone_models_zones_gin', sql: 'CREATE INDEX IF NOT EXISTS idx_coach_zone_models_zones_gin ON coach_zone_models USING GIN(zones);' },
  { name: 'idx_coach_strength_templates_sessions_gin', sql: 'CREATE INDEX IF NOT EXISTS idx_coach_strength_templates_sessions_gin ON coach_strength_templates USING GIN(sessions);' },
  { name: 'idx_coach_run_templates_sessions_gin', sql: 'CREATE INDEX IF NOT EXISTS idx_coach_run_templates_sessions_gin ON coach_run_templates USING GIN(sessions);' },
  { name: 'idx_shared_workout_templates_blocks_gin', sql: 'CREATE INDEX IF NOT EXISTS idx_shared_workout_templates_blocks_gin ON shared_workout_templates USING GIN(blocks);' },
];

async function createIndexes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    console.log(`📊 Creating ${indexes.length} indexes...\n`);

    for (const index of indexes) {
      try {
        await client.query(index.sql);
        console.log(`✅ ${index.name}`);
      } catch (error) {
        console.log(`⚠️  ${index.name} (${(error as Error).message})`);
      }
    }

    // Verify indexes created
    console.log('\n📋 Verifying indexes...\n');
    const result = await client.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
        AND tablename IN (
          'athletes', 'workouts', 'workout_logs', 'vouchers',
          'coach_plans', 'plan_products', 'coach_zone_models',
          'coach_strength_templates', 'coach_run_templates',
          'shared_workout_templates', 'feed_posts', 'feed_comments'
        )
      ORDER BY tablename, indexname;
    `);

    console.log(`📊 Total indexes: ${result.rowCount}`);
    console.log('\n📋 Indexes by table:\n');

    const indexesByTable: Record<string, string[]> = {};
    for (const row of result.rows) {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    }

    for (const [table, tableIndexes] of Object.entries(indexesByTable)) {
      console.log(`  ${table} (${tableIndexes.length})`);
      tableIndexes.forEach(idx => {
        console.log(`    ├─ ${idx}`);
      });
    }

    console.log('\n✨ P1.3 Index creation complete!\n');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createIndexes();
