-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('ACCOUNT_UPGRADE', 'PHONE_VERIFY', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "CustomerOtp" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "guestId" TEXT,
    "purpose" "OtpPurpose" NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerOtp_phone_purpose_expiresAt_idx" ON "CustomerOtp"("phone", "purpose", "expiresAt");

-- CreateIndex
CREATE INDEX "CustomerOtp_guestId_idx" ON "CustomerOtp"("guestId");
