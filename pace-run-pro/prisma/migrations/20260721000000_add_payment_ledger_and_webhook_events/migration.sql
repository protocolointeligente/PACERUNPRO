CREATE TABLE "payment_ledger_entries" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "providerOrderId" TEXT,
  "providerChargeId" TEXT,
  "userId" TEXT,
  "coachId" TEXT,
  "grossCents" INTEGER NOT NULL,
  "platformFeeCents" INTEGER NOT NULL,
  "netCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "status" TEXT NOT NULL DEFAULT 'PAID',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_ledger_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_ledger_entries_providerEventId_key" ON "payment_ledger_entries"("providerEventId");
CREATE INDEX "payment_ledger_entries_provider_createdAt_idx" ON "payment_ledger_entries"("provider", "createdAt");
CREATE INDEX "payment_ledger_entries_coachId_createdAt_idx" ON "payment_ledger_entries"("coachId", "createdAt");

CREATE TABLE "webhook_events" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerEventId" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'received',
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "webhook_events_providerEventId_key" ON "webhook_events"("providerEventId");
CREATE INDEX "webhook_events_provider_receivedAt_idx" ON "webhook_events"("provider", "receivedAt");
