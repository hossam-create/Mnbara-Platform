-- CreateTable
CREATE TABLE IF NOT EXISTS "UserTwoFactor" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "secret" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "backupCodes" TEXT,
    "enabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTwoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserTwoFactor_userId_key" ON "UserTwoFactor"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserTwoFactor_userId_idx" ON "UserTwoFactor"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserTwoFactor_enabled_idx" ON "UserTwoFactor"("enabled");

-- AddForeignKey
ALTER TABLE "UserTwoFactor" ADD CONSTRAINT "UserTwoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;





