-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "transactionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_subscriberId_key" ON "Subscriber"("subscriberId");

-- CreateIndex
CREATE INDEX "Subscriber_subscriberId_idx" ON "Subscriber"("subscriberId");

-- CreateIndex
CREATE INDEX "Subscriber_email_idx" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "Notification_subscriberId_idx" ON "Notification"("subscriberId");

-- CreateIndex
CREATE INDEX "Notification_templateId_idx" ON "Notification"("templateId");

-- CreateIndex
CREATE INDEX "Notification_transactionId_idx" ON "Notification"("transactionId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");
