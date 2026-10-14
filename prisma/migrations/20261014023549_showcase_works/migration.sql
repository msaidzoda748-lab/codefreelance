-- AlterTable
ALTER TABLE "PortfolioItem" ADD COLUMN     "appStoreUrl" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "downloadUrl" TEXT,
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playUrl" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "PortfolioItem_hidden_createdAt_idx" ON "PortfolioItem"("hidden", "createdAt");

-- CreateIndex
CREATE INDEX "PortfolioItem_categoryId_idx" ON "PortfolioItem"("categoryId");

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
