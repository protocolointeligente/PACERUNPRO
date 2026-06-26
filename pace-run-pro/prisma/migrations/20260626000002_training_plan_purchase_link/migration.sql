-- AlterTable: add optional purchaseId link to training_plans
ALTER TABLE "training_plans" ADD COLUMN "purchaseId" TEXT;

-- CreateIndex: unique so one purchase maps to at most one plan
CREATE UNIQUE INDEX "training_plans_purchaseId_key" ON "training_plans"("purchaseId");
