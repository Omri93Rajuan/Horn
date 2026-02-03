-- Run this migration manually using psql or your database client
-- Or run: npx prisma migrate deploy

ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "completedByUserId" TEXT;
ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "completionReason" TEXT;

CREATE INDEX IF NOT EXISTS "AlertEvent_completedAt_idx" ON "AlertEvent"("completedAt");
