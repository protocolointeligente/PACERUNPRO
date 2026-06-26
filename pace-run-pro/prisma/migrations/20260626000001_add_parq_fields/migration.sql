-- AlterTable
ALTER TABLE "athletes" ADD COLUMN "parqAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "athletes" ADD COLUMN "parqAcceptedAt" TIMESTAMP(3);
