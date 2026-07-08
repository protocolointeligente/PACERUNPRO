/**
 * Cron Job: Daily cleanup of expired soft-deleted users
 * 
 * Run this daily (e.g., via cron or AWS Lambda):
 * 0 2 * * * npx tsx scripts/cleanup-soft-deletes.ts
 * 
 * This will:
 * 1. Find all soft-deleted users older than 30 days
 * 2. Permanently hard delete them
 * 3. Log results
 */

import { cleanupSoftDeletedUsers } from "@/lib/deletion-service";

async function runCleanup() {
  console.log("🧹 Starting cleanup of expired soft-deleted users...\n");

  try {
    const result = await cleanupSoftDeletedUsers({
      grace_days: 30,
      batchSize: 100,
      dryRun: process.env.DRY_RUN === "true",
    });

    console.log(`\n✅ Cleanup complete:`);
    console.log(`  - Permanently deleted: ${result.deleted} users`);
    if (result.errors.length > 0) {
      console.log(`  - Errors: ${result.errors.length}`);
      for (const err of result.errors) {
        console.log(`    • ${err.userId}: ${err.error}`);
      }
    }

    process.exit(result.errors.length === 0 ? 0 : 1);
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

runCleanup();
