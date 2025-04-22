/*
  Warnings:

  - Added the required column `userId` to the `MeterReading` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MeterReading" ADD COLUMN     "userId" TEXT; -- Temporarily allow NULL

-- Update existing rows
UPDATE "MeterReading" SET "userId" = 'cm9o9v7f50000uuvkl8nn89i9';

-- AlterTable to enforce NOT NULL after update
ALTER TABLE "MeterReading" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "MeterReading_userId_idx" ON "MeterReading"("userId");

-- CreateIndex
CREATE INDEX "MeterReading_userId_readingTypeCode_timestamp_idx" ON "MeterReading"("userId", "readingTypeCode", "timestamp");

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
