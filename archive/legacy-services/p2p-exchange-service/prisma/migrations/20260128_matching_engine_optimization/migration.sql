-- Add composite index for matching engine optimization
-- This index speeds up the query: SELECT * FROM ExchangeRequest WHERE status = 'OPEN' AND fromCurrency = ? AND toCurrency = ? AND expiresAt > NOW()

CREATE INDEX IF NOT EXISTS "idx_exchange_request_matching" 
ON "ExchangeRequest"("status", "fromCurrency", "toCurrency", "expiresAt");

-- Add index for faster expiration checks
CREATE INDEX IF NOT EXISTS "idx_exchange_request_expiry" 
ON "ExchangeRequest"("expiresAt", "status");

-- Add index for user's open requests (for marketplace browsing)
CREATE INDEX IF NOT EXISTS "idx_exchange_request_user_status" 
ON "ExchangeRequest"("userId", "status", "createdAt");

-- Add index for settlement status tracking
CREATE INDEX IF NOT EXISTS "idx_settlement_status_created" 
ON "Settlement"("status", "createdAt");

-- Add index for communication log queries
CREATE INDEX IF NOT EXISTS "idx_communication_match_created" 
ON "CommunicationLog"("matchId", "createdAt");
