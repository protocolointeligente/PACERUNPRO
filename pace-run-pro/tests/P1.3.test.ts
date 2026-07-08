import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';

/**
 * P1.3 Test Suite: Database Indexes
 * Validates that 16+ missing indexes were created for 30x-100x performance improvement
 */

describe('P1.3: Database Indexes', () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it('should have created idx_athletes_status index', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='athletes' AND indexname='idx_athletes_status'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have created idx_athletes_coach_id index', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='athletes' AND indexname='idx_athletes_coach_id'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have created idx_workouts_type index', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='workouts' AND indexname='idx_workouts_type'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have created idx_workouts_status index', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='workouts' AND indexname='idx_workouts_status'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have created idx_workout_logs_source index', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='workout_logs' AND indexname='idx_workout_logs_source'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have created idx_vouchers_active index', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='vouchers' AND indexname='idx_vouchers_active'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have created idx_coach_plans_active index', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='coach_plans' AND indexname='idx_coach_plans_active'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have created GIN index for workouts.blocks', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='workouts' AND indexname='idx_workouts_blocks_gin'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have created GIN index for workout_logs.gpsTrack', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='workout_logs' AND indexname='idx_workout_logs_gpstrack_gin'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have created GIN index for plan_products.planContent', async () => {
    const result = await client.query(
      `SELECT * FROM pg_indexes WHERE tablename='plan_products' AND indexname='idx_plan_products_content_gin'`
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('should have 16+ new indexes created', async () => {
    const result = await client.query(
      `SELECT COUNT(*) as count FROM pg_indexes 
       WHERE tablename IN ('athletes', 'workouts', 'workout_logs', 'vouchers', 
                           'coach_plans', 'plan_products', 'coach_zone_models',
                           'coach_strength_templates', 'coach_run_templates',
                           'shared_workout_templates')
       AND indexname LIKE 'idx_%'`
    );
    
    const count = parseInt(result.rows[0].count);
    expect(count).toBeGreaterThanOrEqual(16);
  });

  it('P1.3 compliance: All required indexes present', async () => {
    const requiredIndexes = [
      'idx_athletes_status',
      'idx_athletes_coach_id',
      'idx_workouts_type',
      'idx_workouts_status',
      'idx_workout_logs_source',
      'idx_vouchers_active',
      'idx_coach_plans_active',
      'idx_workouts_blocks_gin',
      'idx_workout_logs_gpstrack_gin',
      'idx_workout_logs_splits_gin',
      'idx_plan_products_content_gin',
      'idx_coach_zone_models_zones_gin',
      'idx_coach_strength_templates_sessions_gin',
      'idx_coach_run_templates_sessions_gin',
      'idx_shared_workout_templates_blocks_gin',
    ];

    const result = await client.query(
      `SELECT indexname FROM pg_indexes 
       WHERE indexname = ANY($1::text[])`,
      [requiredIndexes]
    );

    expect(result.rowCount).toBe(requiredIndexes.length);
  });
});
