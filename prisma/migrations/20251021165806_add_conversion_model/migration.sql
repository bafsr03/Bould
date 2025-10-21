-- CreateTable
CREATE TABLE "Conversion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopifyProductId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "categoryId" INTEGER NOT NULL,
    "trueSize" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "trueWaist" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "previewImageUrl" TEXT,
    "sizeScaleUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
