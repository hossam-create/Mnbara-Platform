-- Rollback migration: Drop all admin tracking tables and columns

-- Drop triggers first
DROP TRIGGER IF EXISTS set_updated_at_user_sessions ON user_sessions;
DROP TRIGGER IF EXISTS set_updated_at_kyc ON kyc_verifications;
DROP TRIGGER IF EXISTS set_updated_at_escrow ON escrow_transactions;

-- Drop tables
DROP TABLE IF EXISTS system_metrics CASCADE;
DROP TABLE IF EXISTS escrow_transactions CASCADE;
DROP TABLE IF EXISTS traveler_flights CASCADE;
DROP TABLE IF EXISTS auction_events CASCADE;
DROP TABLE IF EXISTS kyc_verifications CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS kyc_verified_at;
ALTER TABLE users DROP COLUMN IF EXISTS kyc_verified;
ALTER TABLE users DROP COLUMN IF EXISTS mfa_secret;
ALTER TABLE users DROP COLUMN IF EXISTS mfa_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS total_login_count;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_country;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_ip;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
