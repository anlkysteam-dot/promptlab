-- AlterTable
ALTER TABLE "PromptHistory" ADD COLUMN "shareToFeed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "PromptHistory_shareToFeed_createdAt_idx" ON "PromptHistory"("shareToFeed", "createdAt" DESC);
