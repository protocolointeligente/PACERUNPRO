-- Migration: 20260702000001_add_missing_indices
-- Adds indices to tables that are queried without them, preventing full table scans

-- notifications: userId is the primary query filter
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- achievements: queried by athleteId
CREATE INDEX IF NOT EXISTS "achievements_athleteId_idx" ON "achievements"("athleteId");

-- races: queried by athleteId
CREATE INDEX IF NOT EXISTS "races_athleteId_date_idx" ON "races"("athleteId", "date");

-- feed_posts: queried by author for profile feeds
CREATE INDEX IF NOT EXISTS "feed_posts_authorId_createdAt_idx" ON "feed_posts"("authorId", "createdAt");

-- feed_comments: queried by postId (loading comments per post) and authorId (user's comments)
CREATE INDEX IF NOT EXISTS "feed_comments_postId_idx" ON "feed_comments"("postId");
CREATE INDEX IF NOT EXISTS "feed_comments_authorId_idx" ON "feed_comments"("authorId");

-- teams: queried by coachId
CREATE INDEX IF NOT EXISTS "teams_coachId_idx" ON "teams"("coachId");
