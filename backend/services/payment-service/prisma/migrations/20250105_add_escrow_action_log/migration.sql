-- Escrow action audit log
CREATE TABLE IF NOT EXISTS "EscrowActionLog" (
    "id" SERIAL PRIMARY KEY,
    "escrowId" INTEGER NOT NULL REFERENCES "Escrow"("id") ON DELETE CASCADE,
    "action" TEXT NOT NULL, -- CREATED, HELD, RELEASE_REQUESTED, RELEASED, REFUND_REQUESTED, REFUNDED, FORCE_RELEASE, FORCE_REFUND, DISPUTE, AUTO_RELEASE
    "performedBy" INTEGER,  -- userId or system user
    "performedByRole" TEXT, -- buyer, seller, admin, system
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "EscrowActionLog_escrowId_idx" ON "EscrowActionLog"("escrowId");
CREATE INDEX IF NOT EXISTS "EscrowActionLog_action_idx" ON "EscrowActionLog"("action");





