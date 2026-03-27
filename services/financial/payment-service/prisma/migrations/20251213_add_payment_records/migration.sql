-- Add Payment Records table to track external payment provider transactions
-- This provides a complete audit trail of all payments processed through Stripe, PayPal, and Paymob

-- Payment Provider enum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'PAYMOB', 'WALLET', 'BLOCKCHAIN');

-- Payment Status enum
CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING',
    'PROCESSING', 
    'REQUIRES_ACTION',
    'SUCCEEDED',
    'FAILED',
    'CANCELED',
    'REFUNDED',
    'PARTIALLY_REFUNDED',
    'DISPUTED'
);

-- Payment Method enum
CREATE TYPE "PaymentMethodType" AS ENUM (
    'CARD',
    'PAYPAL',
    'MOBILE_WALLET',
    'BANK_TRANSFER',
    'CRYPTO',
    'WALLET_BALANCE'
);

-- Create Payment table
CREATE TABLE "Payment" (
    "id" SERIAL PRIMARY KEY,
    
    -- External provider references
    "provider" "PaymentProvider" NOT NULL,
    "externalId" VARCHAR(255) NOT NULL,  -- Stripe PaymentIntent ID, PayPal Order ID, Paymob Transaction ID
    "externalStatus" VARCHAR(100),        -- Raw status from provider
    
    -- Internal references
    "orderId" INTEGER,                    -- Link to Order
    "userId" INTEGER NOT NULL,            -- User who made the payment
    "escrowId" INTEGER,                   -- Link to Escrow if applicable
    
    -- Amount details
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "fee" DECIMAL(10, 2) DEFAULT 0,       -- Payment provider fee
    "netAmount" DECIMAL(10, 2),           -- Amount after fees
    
    -- Payment details
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethodType",
    "methodDetails" JSONB,                -- Card last 4, PayPal email, etc.
    
    -- Capture/Authorization
    "captureMethod" VARCHAR(50),          -- 'automatic' or 'manual'
    "capturedAt" TIMESTAMP,
    "capturedAmount" DECIMAL(10, 2),
    
    -- Refund tracking
    "refundedAmount" DECIMAL(10, 2) DEFAULT 0,
    "refundedAt" TIMESTAMP,
    
    -- Metadata
    "description" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "errorCode" VARCHAR(100),
    
    -- Webhook tracking
    "lastWebhookAt" TIMESTAMP,
    "webhookCount" INTEGER DEFAULT 0,
    
    -- Timestamps
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT "unique_provider_external_id" UNIQUE ("provider", "externalId")
);

-- Create indexes for efficient queries
CREATE INDEX "idx_payment_provider" ON "Payment"("provider");
CREATE INDEX "idx_payment_external_id" ON "Payment"("externalId");
CREATE INDEX "idx_payment_order_id" ON "Payment"("orderId");
CREATE INDEX "idx_payment_user_id" ON "Payment"("userId");
CREATE INDEX "idx_payment_status" ON "Payment"("status");
CREATE INDEX "idx_payment_created_at" ON "Payment"("createdAt");

-- Create Webhook Event Log table for audit trail
CREATE TABLE "WebhookEvent" (
    "id" SERIAL PRIMARY KEY,
    
    -- Event identification
    "provider" "PaymentProvider" NOT NULL,
    "eventId" VARCHAR(255) NOT NULL,      -- Provider's event ID
    "eventType" VARCHAR(100) NOT NULL,    -- e.g., 'payment_intent.succeeded'
    
    -- Related payment
    "paymentId" INTEGER REFERENCES "Payment"("id"),
    "externalPaymentId" VARCHAR(255),     -- Provider's payment/order ID
    
    -- Event data
    "payload" JSONB NOT NULL,             -- Full webhook payload
    "headers" JSONB,                      -- Webhook headers for verification
    
    -- Processing status
    "processed" BOOLEAN DEFAULT FALSE,
    "processedAt" TIMESTAMP,
    "processingError" TEXT,
    "retryCount" INTEGER DEFAULT 0,
    
    -- Timestamps
    "receivedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate processing
    CONSTRAINT "unique_provider_event_id" UNIQUE ("provider", "eventId")
);

-- Create indexes for webhook events
CREATE INDEX "idx_webhook_provider" ON "WebhookEvent"("provider");
CREATE INDEX "idx_webhook_event_type" ON "WebhookEvent"("eventType");
CREATE INDEX "idx_webhook_payment_id" ON "WebhookEvent"("paymentId");
CREATE INDEX "idx_webhook_processed" ON "WebhookEvent"("processed");
CREATE INDEX "idx_webhook_received_at" ON "WebhookEvent"("receivedAt");

-- Add trigger to update updatedAt on Payment
CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_updated_at_trigger
    BEFORE UPDATE ON "Payment"
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_updated_at();

-- Comments for documentation
COMMENT ON TABLE "Payment" IS 'Tracks all external payment provider transactions (Stripe, PayPal, Paymob)';
COMMENT ON TABLE "WebhookEvent" IS 'Audit log of all webhook events received from payment providers';
COMMENT ON COLUMN "Payment"."externalId" IS 'Provider-specific ID: Stripe PaymentIntent ID, PayPal Order ID, or Paymob Transaction ID';
COMMENT ON COLUMN "Payment"."captureMethod" IS 'For Stripe: automatic or manual capture. Manual is used for escrow holds.';
