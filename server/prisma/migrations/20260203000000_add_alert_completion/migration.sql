-- AlterTable
ALTER TABLE "AlertEvent" ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "completedByUserId" TEXT,
ADD COLUMN "completionReason" TEXT;

-- CreateIndex
CREATE INDEX "AlertEvent_completedAt_idx" ON "AlertEvent"("completedAt");
