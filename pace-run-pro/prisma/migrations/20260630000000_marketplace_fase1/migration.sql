-- Marketplace Fase 1: make PlanProduct.coachId nullable + full marketplace ecosystem

-- 1. Make plan_products.coachId nullable
ALTER TABLE "plan_products" ALTER COLUMN "coachId" DROP NOT NULL;

-- 2. Drop old NOT NULL FK constraint and re-add as nullable (Postgres keeps the FK but nullable is set via the column)
-- The foreign key constraint itself doesn't enforce NOT NULL, so just dropping NOT NULL is enough.

-- 3. MarketplaceStore
CREATE TABLE IF NOT EXISTS "marketplace_stores" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "coachId"         TEXT NOT NULL UNIQUE,
  "name"            TEXT NOT NULL,
  "slug"            TEXT NOT NULL UNIQUE,
  "description"     TEXT,
  "logoUrl"         TEXT,
  "bannerUrl"       TEXT,
  "primaryColor"    TEXT NOT NULL DEFAULT '#C6F24E',
  "instagramUrl"    TEXT,
  "whatsapp"        TEXT,
  "commissionPct"   DOUBLE PRECISION NOT NULL DEFAULT 0.15,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "stripeAccountId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "marketplace_stores"
  ADD CONSTRAINT "marketplace_stores_coachId_fkey"
  FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE;

-- 4. Enums
DO $$ BEGIN
  CREATE TYPE "MarketplaceProductType" AS ENUM (
    'PLANILHA','EBOOK','CURSO','EVENTO','CONSULTORIA','AVALIACAO','TESTE','ASSINATURA','TREINAMENTO'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MarketplaceOrderStatus" AS ENUM (
    'PENDING','PAID','PROCESSING','FULFILLED','CANCELLED','REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. MarketplaceProduct
CREATE TABLE IF NOT EXISTS "marketplace_products" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "storeId"         TEXT,
  "coachId"         TEXT,
  "type"            "MarketplaceProductType" NOT NULL DEFAULT 'PLANILHA',
  "title"           TEXT NOT NULL,
  "slug"            TEXT NOT NULL UNIQUE,
  "description"     TEXT NOT NULL DEFAULT '',
  "coverUrl"        TEXT,
  "priceCents"      INTEGER NOT NULL DEFAULT 0,
  "currency"        TEXT NOT NULL DEFAULT 'BRL',
  "durationWeeks"   INTEGER,
  "level"           TEXT,
  "sport"           TEXT,
  "format"          TEXT,
  "eventDate"       TIMESTAMP(3),
  "maxParticipants" INTEGER,
  "deliveryDays"    INTEGER,
  "included"        TEXT[] DEFAULT ARRAY[]::TEXT[],
  "content"         JSONB,
  "fileUrl"         TEXT,
  "published"       BOOLEAN NOT NULL DEFAULT false,
  "featured"        BOOLEAN NOT NULL DEFAULT false,
  "purchases"       INTEGER NOT NULL DEFAULT 0,
  "rating"          DOUBLE PRECISION,
  "ratingCount"     INTEGER NOT NULL DEFAULT 0,
  "commissionPct"   DOUBLE PRECISION,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "marketplace_products_storeId_idx" ON "marketplace_products"("storeId");
CREATE INDEX IF NOT EXISTS "marketplace_products_coachId_idx" ON "marketplace_products"("coachId");
CREATE INDEX IF NOT EXISTS "marketplace_products_type_published_idx" ON "marketplace_products"("type","published");

ALTER TABLE "marketplace_products"
  ADD CONSTRAINT "marketplace_products_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "marketplace_stores"("id") ON DELETE CASCADE;

ALTER TABLE "marketplace_products"
  ADD CONSTRAINT "marketplace_products_coachId_fkey"
  FOREIGN KEY ("coachId") REFERENCES "coaches"("id") ON DELETE CASCADE;

-- 6. MarketplaceOrder
CREATE TABLE IF NOT EXISTS "marketplace_orders" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "athleteId"       TEXT NOT NULL,
  "totalCents"      INTEGER NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'BRL',
  "status"          "MarketplaceOrderStatus" NOT NULL DEFAULT 'PENDING',
  "stripeSessionId" TEXT,
  "pagbankOrderId"  TEXT,
  "notes"           TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "marketplace_orders_athleteId_idx" ON "marketplace_orders"("athleteId");

ALTER TABLE "marketplace_orders"
  ADD CONSTRAINT "marketplace_orders_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "athletes"("id");

-- 7. MarketplaceOrderItem
CREATE TABLE IF NOT EXISTS "marketplace_order_items" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "orderId"     TEXT NOT NULL,
  "productId"   TEXT NOT NULL,
  "priceCents"  INTEGER NOT NULL,
  "quantity"    INTEGER NOT NULL DEFAULT 1,
  "status"      "MarketplaceOrderStatus" NOT NULL DEFAULT 'PENDING',
  "fulfilledAt" TIMESTAMP(3),
  "fileUrl"     TEXT
);

CREATE INDEX IF NOT EXISTS "marketplace_order_items_orderId_idx" ON "marketplace_order_items"("orderId");
CREATE INDEX IF NOT EXISTS "marketplace_order_items_productId_idx" ON "marketplace_order_items"("productId");

ALTER TABLE "marketplace_order_items"
  ADD CONSTRAINT "marketplace_order_items_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE;

ALTER TABLE "marketplace_order_items"
  ADD CONSTRAINT "marketplace_order_items_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "marketplace_products"("id");

-- 8. MarketplacePayout
CREATE TABLE IF NOT EXISTS "marketplace_payouts" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "coachId"     TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency"    TEXT NOT NULL DEFAULT 'BRL',
  "status"      TEXT NOT NULL DEFAULT 'PENDING',
  "method"      TEXT NOT NULL DEFAULT 'PIX',
  "pixKey"      TEXT,
  "transferId"  TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "marketplace_payouts_coachId_idx" ON "marketplace_payouts"("coachId");

ALTER TABLE "marketplace_payouts"
  ADD CONSTRAINT "marketplace_payouts_coachId_fkey"
  FOREIGN KEY ("coachId") REFERENCES "coaches"("id");

-- 9. MarketplaceCommission
CREATE TABLE IF NOT EXISTS "marketplace_commissions" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "orderId"         TEXT NOT NULL,
  "coachId"         TEXT,
  "grossCents"      INTEGER NOT NULL,
  "commissionPct"   DOUBLE PRECISION NOT NULL,
  "commissionCents" INTEGER NOT NULL,
  "netCents"        INTEGER NOT NULL,
  "paidOut"         BOOLEAN NOT NULL DEFAULT false,
  "paidAt"          TIMESTAMP(3),
  "payoutId"        TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "marketplace_commissions_coachId_idx" ON "marketplace_commissions"("coachId");
CREATE INDEX IF NOT EXISTS "marketplace_commissions_orderId_idx" ON "marketplace_commissions"("orderId");

ALTER TABLE "marketplace_commissions"
  ADD CONSTRAINT "marketplace_commissions_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "marketplace_orders"("id");

ALTER TABLE "marketplace_commissions"
  ADD CONSTRAINT "marketplace_commissions_coachId_fkey"
  FOREIGN KEY ("coachId") REFERENCES "coaches"("id");

ALTER TABLE "marketplace_commissions"
  ADD CONSTRAINT "marketplace_commissions_payoutId_fkey"
  FOREIGN KEY ("payoutId") REFERENCES "marketplace_payouts"("id");

-- 10. MarketplaceReview
CREATE TABLE IF NOT EXISTS "marketplace_reviews" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "rating"    INTEGER NOT NULL,
  "comment"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("productId","athleteId")
);

ALTER TABLE "marketplace_reviews"
  ADD CONSTRAINT "marketplace_reviews_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "marketplace_products"("id") ON DELETE CASCADE;

ALTER TABLE "marketplace_reviews"
  ADD CONSTRAINT "marketplace_reviews_athleteId_fkey"
  FOREIGN KEY ("athleteId") REFERENCES "athletes"("id");

-- 11. MarketplaceConfig
CREATE TABLE IF NOT EXISTS "marketplace_config" (
  "id"                  TEXT NOT NULL PRIMARY KEY,
  "defaultCommissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
  "categoryConfig"      JSONB,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default config
INSERT INTO "marketplace_config" ("id","defaultCommissionPct","createdAt","updatedAt")
VALUES ('default','0.15',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
