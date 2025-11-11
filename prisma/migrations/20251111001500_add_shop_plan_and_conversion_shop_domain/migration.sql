-- Add shopDomain column to Conversion table
ALTER TABLE "Conversion" ADD COLUMN "shopDomain" TEXT;

-- Create ShopPlan table to persist billing status per shop
CREATE TABLE "ShopPlan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "shopDomain" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "billingKey" TEXT,
  "hasActivePayment" INTEGER NOT NULL DEFAULT 0,
  "activeSubscriptionId" TEXT,
  "activeSubscriptionName" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "ShopPlan_shopDomain_key" ON "ShopPlan"("shopDomain");



