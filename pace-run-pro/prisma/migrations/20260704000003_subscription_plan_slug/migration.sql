-- Add plan_slug to subscriptions for precise B2B plan tier tracking
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "plan_slug" TEXT;
