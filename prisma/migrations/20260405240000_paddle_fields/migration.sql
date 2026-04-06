-- AlterTable
ALTER TABLE "User" ADD COLUMN "paddleCustomerId" TEXT;
ALTER TABLE "User" ADD COLUMN "paddleSubscriptionId" TEXT;

CREATE UNIQUE INDEX "User_paddleCustomerId_key" ON "User"("paddleCustomerId");
CREATE UNIQUE INDEX "User_paddleSubscriptionId_key" ON "User"("paddleSubscriptionId");
