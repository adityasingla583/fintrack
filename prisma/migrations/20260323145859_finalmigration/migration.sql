/*
  Warnings:

  - You are about to drop the column `userId` on the `delete_account_otp` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId]` on the table `delete_account_otp` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `delete_account_otp` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "delete_account_otp" DROP CONSTRAINT "delete_account_otp_userId_fkey";

-- DropIndex
DROP INDEX "delete_account_otp_userId_idx";

-- DropIndex
DROP INDEX "delete_account_otp_userId_key";

-- AlterTable
ALTER TABLE "delete_account_otp" DROP COLUMN "userId",
ADD COLUMN     "accountId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "delete_account_otp_accountId_key" ON "delete_account_otp"("accountId");

-- AddForeignKey
ALTER TABLE "delete_account_otp" ADD CONSTRAINT "delete_account_otp_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
