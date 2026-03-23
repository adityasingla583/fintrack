-- CreateTable
CREATE TABLE "delete_account_otp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delete_account_otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delete_account_otp_userId_key" ON "delete_account_otp"("userId");

-- CreateIndex
CREATE INDEX "delete_account_otp_userId_idx" ON "delete_account_otp"("userId");

-- AddForeignKey
ALTER TABLE "delete_account_otp" ADD CONSTRAINT "delete_account_otp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
