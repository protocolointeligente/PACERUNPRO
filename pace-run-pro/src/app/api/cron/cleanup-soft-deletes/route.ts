import { NextRequest, NextResponse } from 'next/server';
import { cleanupSoftDeletedUsers } from '@/lib/deletion-service';

/**
 * Vercel Cron Job: Cleanup soft-deleted users after 30-day grace period
 * 
 * Scheduled to run daily at 2 AM UTC via vercel.json
 * 
 * Security: Vercel automatically validates requests from its cron service
 * and attaches an Authorization header that can be verified if needed.
 */

export async function GET(request: NextRequest) {
  // Verify this is from Vercel's cron service
  // Vercel automatically attaches auth header for cron jobs
  const authHeader = request.headers.get('authorization');
  
  // Optional: validate the cron secret (add to Vercel env vars)
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('Unauthorized cron request');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    console.log('[CRON] Starting cleanup job at', new Date().toISOString());
    
    // Execute cleanup with production settings
    const result = await cleanupSoftDeletedUsers({
      grace_days: 30,           // LGPD 30-day grace period
      batchSize: 100,           // Process in batches to avoid overwhelming DB
      dryRun: false             // Actually delete (not dry run)
    });

    console.log('[CRON] Cleanup job completed:', result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Soft delete cleanup job completed successfully',
      result
    }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CRON] Cleanup job failed:', errorMessage);
    
    // Even on error, return 200 so Vercel doesn't retry aggressively
    // Error will be logged to Vercel logs and Sentry
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: errorMessage
    }, { status: 200 });
  }
}

export const runtime = 'nodejs';
