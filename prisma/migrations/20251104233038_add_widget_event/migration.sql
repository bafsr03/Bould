/*
  Warnings:

  - A unique constraint covering the columns `[shopifyProductId]` on the table `Conversion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "WidgetEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyProductId" TEXT NOT NULL,
    "conversionId" TEXT,
    "shopDomain" TEXT,
    "recommendedSize" TEXT,
    "confidence" REAL,
    "requestId" TEXT,
    "correlationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WidgetEvent_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "Conversion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WidgetEvent_shopifyProductId_idx" ON "WidgetEvent"("shopifyProductId");

-- CreateIndex
CREATE INDEX "WidgetEvent_createdAt_idx" ON "WidgetEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversion_shopifyProductId_key" ON "Conversion"("shopifyProductId");
