/*
  Warnings:

  - You are about to drop the `Forecast` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Recommendation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Simulation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Forecast" DROP CONSTRAINT "Forecast_userId_fkey";

-- DropForeignKey
ALTER TABLE "Recommendation" DROP CONSTRAINT "Recommendation_userId_fkey";

-- DropForeignKey
ALTER TABLE "Simulation" DROP CONSTRAINT "Simulation_userId_fkey";

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FinancialGoal" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Income" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Insurance" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Retirement" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "Forecast";

-- DropTable
DROP TABLE "Recommendation";

-- DropTable
DROP TABLE "Simulation";

-- DropEnum
DROP TYPE "RecommendationPriority";

-- DropEnum
DROP TYPE "RecommendationStatus";

-- DropEnum
DROP TYPE "SimulationScenario";

-- CreateTable
CREATE TABLE "FinanceAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "nextSteps" JSONB NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIForecast" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "futureValue" DECIMAL(15,2) NOT NULL,
    "retirementCorpus" DECIMAL(15,2) NOT NULL,
    "savingRate" DECIMAL(5,2) NOT NULL,
    "debtRatio" DECIMAL(5,2) NOT NULL,
    "summary" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AIForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISimulation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL,
    "oldScore" INTEGER NOT NULL,
    "newScore" INTEGER NOT NULL,
    "scenario" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AISimulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseTime" DOUBLE PRECISION NOT NULL,
    "tokenUsage" INTEGER NOT NULL,
    "cost" DECIMAL(10,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AIAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceAuditLog_userId_idx" ON "FinanceAuditLog"("userId");

-- CreateIndex
CREATE INDEX "FinanceAuditLog_module_idx" ON "FinanceAuditLog"("module");

-- CreateIndex
CREATE INDEX "AIRecommendation_userId_idx" ON "AIRecommendation"("userId");

-- CreateIndex
CREATE INDEX "AIRecommendation_createdAt_idx" ON "AIRecommendation"("createdAt");

-- CreateIndex
CREATE INDEX "AIForecast_userId_idx" ON "AIForecast"("userId");

-- CreateIndex
CREATE INDEX "AIForecast_createdAt_idx" ON "AIForecast"("createdAt");

-- CreateIndex
CREATE INDEX "AISimulation_userId_idx" ON "AISimulation"("userId");

-- CreateIndex
CREATE INDEX "AISimulation_createdAt_idx" ON "AISimulation"("createdAt");

-- CreateIndex
CREATE INDEX "AISimulation_scenarioType_idx" ON "AISimulation"("scenarioType");

-- CreateIndex
CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");

-- CreateIndex
CREATE INDEX "AIConversation_createdAt_idx" ON "AIConversation"("createdAt");

-- CreateIndex
CREATE INDEX "AIConversation_provider_idx" ON "AIConversation"("provider");

-- CreateIndex
CREATE INDEX "AIAuditLog_userId_idx" ON "AIAuditLog"("userId");

-- CreateIndex
CREATE INDEX "AIAuditLog_createdAt_idx" ON "AIAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIAuditLog_status_idx" ON "AIAuditLog"("status");

-- AddForeignKey
ALTER TABLE "FinanceAuditLog" ADD CONSTRAINT "FinanceAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIRecommendation" ADD CONSTRAINT "AIRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIForecast" ADD CONSTRAINT "AIForecast_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISimulation" ADD CONSTRAINT "AISimulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAuditLog" ADD CONSTRAINT "AIAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
