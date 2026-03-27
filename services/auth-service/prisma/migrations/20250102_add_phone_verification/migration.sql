-- Add phoneVerified field to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");
CREATE INDEX IF NOT EXISTS "User_phoneVerified_idx" ON "User"("phoneVerified");

-- CreateTable
CREATE TABLE IF NOT EXISTS "PhoneVerification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "otpCode" TEXT,
    "expiresAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "lastOtpSentAt" TIMESTAMP(3),
    "otpRequestCount" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PhoneVerification_userId_key" ON "PhoneVerification"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhoneVerification_userId_idx" ON "PhoneVerification"("userId");
CREATE INDEX IF NOT EXISTS "PhoneVerification_phoneNumber_idx" ON "PhoneVerification"("phoneNumber");
CREATE INDEX IF NOT EXISTS "PhoneVerification_expiresAt_idx" ON "PhoneVerification"("expiresAt");

-- AddForeignKey
ALTER TABLE "PhoneVerification" ADD CONSTRAINT "PhoneVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;





