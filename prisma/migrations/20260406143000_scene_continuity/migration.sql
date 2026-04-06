-- CreateTable
CREATE TABLE "PromptProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptScene" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sceneNo" INTEGER NOT NULL,
    "userInput" TEXT NOT NULL,
    "generatedPrompt" TEXT NOT NULL,
    "continuitySnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptScene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptProject_userId_updatedAt_idx" ON "PromptProject"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "PromptScene_projectId_sceneNo_idx" ON "PromptScene"("projectId", "sceneNo");

-- CreateIndex
CREATE UNIQUE INDEX "PromptScene_projectId_sceneNo_key" ON "PromptScene"("projectId", "sceneNo");

-- AddForeignKey
ALTER TABLE "PromptProject" ADD CONSTRAINT "PromptProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptScene" ADD CONSTRAINT "PromptScene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "PromptProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
