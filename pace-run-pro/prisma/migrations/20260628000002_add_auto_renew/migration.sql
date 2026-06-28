-- AddColumn
ALTER TABLE "subscriptions" ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false;
