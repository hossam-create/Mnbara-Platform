-- CreateTable
CREATE TABLE "kyc_verifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "idType" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idPhotoPath" TEXT NOT NULL,
    "selfiePhotoPath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ocrText" TEXT,
    "ocrMatch" BOOLEAN,
    "faceMatch" BOOLEAN,
    "faceConfidence" DOUBLE PRECISION,
    "faceDistance" DOUBLE PRECISION,
    "reviewedBy" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kyc_verifications_userId_key" ON "kyc_verifications"("userId");

-- CreateIndex
CREATE INDEX "kyc_verifications_userId_idx" ON "kyc_verifications"("userId");

-- CreateIndex
CREATE INDEX "kyc_verifications_status_idx" ON "kyc_verifications"("status");
