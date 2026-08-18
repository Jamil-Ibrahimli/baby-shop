-- DropIndex
DROP INDEX "Review_productId_userId_key";

-- CreateIndex
CREATE INDEX "Review_productId_userId_idx" ON "Review"("productId", "userId");
