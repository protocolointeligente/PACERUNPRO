-- Add link field to notifications for deep linking
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "link" TEXT;

-- Create athlete_invites table for secure invite tokens
CREATE TABLE IF NOT EXISTS "athlete_invites" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "email" TEXT,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "athlete_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "athlete_invites_token_key" ON "athlete_invites"("token");
CREATE INDEX IF NOT EXISTS "athlete_invites_token_idx" ON "athlete_invites"("token");

ALTER TABLE "athlete_invites" ADD CONSTRAINT "athlete_invites_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
