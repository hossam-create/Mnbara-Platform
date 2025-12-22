# Mnbara Platform - Database Schema Documentation

## Overview
This document describes the complete database schema for the Mnbara Platform, including all tables, relationships, and indexes.

## Database: `mnbara_db`
- **Type:** PostgreSQL 14+
- **Extensions:** PostGIS (for geo-spatial data)
- **Encoding:** UTF8

## Core Tables

### 1. Users (`users`)
Stores all user accounts (buyers, sellers, travelers, admins).

**Key Fields:**
- `id` - Primary key
- `email` - Unique, required
- `role` - buyer | traveler | seller | admin
- `kyc_status` - KYC verification status
- `rating` - Average user rating (0-5)

**Indexes:**
- `email` (UNIQUE)
- `role`

---

### 2. Wallets (`wallets`)
User financial accounts for holding balances.

**Key Fields:**
- `user_id` - One-to-one with users
- `balance` - Available funds
- `currency` - Default USD
- `is_locked` - Wallet lock status

**Relationships:**
- `user_id` → `users.id` (CASCADE DELETE)

---

### 3. Wallet Ledger (`wallet_ledger`)
Complete audit trail of all wallet balance changes.

**Key Fields:**
- `wallet_id` - Reference to wallet
- `amount` - Transaction amount (positive for credit, negative for debit)
- `type` - Transaction type (DEPOSIT, WITHDRAWAL, PAYMENT, REFUND, ESCROW_HOLD, ESCROW_RELEASE, etc.)
- `balance_before` - Balance before transaction
- `balance_after` - Balance after transaction
- `transaction_id` - Link to transactions table (nullable)
- `order_id` - Link to orders table (nullable)
- `escrow_id` - Link to escrow table (nullable)
- `performed_by` - User who initiated (null for system actions)

**Indexes:**
- `wallet_id` - Fast lookup by wallet
- `type` - Filter by transaction type
- `transaction_id` - Link to transactions
- `order_id` - Link to orders
- `created_at` - Chronological queries

**Purpose:**
- Provides complete audit trail for all wallet operations
- Enables balance reconciliation and dispute resolution
- Tracks escrow holds and releases
- Records all financial movements with context

**Example Query:**
```sql
-- Get wallet transaction history
SELECT * FROM wallet_ledger
WHERE wallet_id = 123
ORDER BY created_at DESC
LIMIT 50;

-- Calculate balance at specific point in time
SELECT balance_after FROM wallet_ledger
WHERE wallet_id = 123 AND created_at <= '2025-01-01'
ORDER BY created_at DESC
LIMIT 1;
```

---

### 4. Rewards (`rewards`)
User loyalty points system.

**Key Fields:**
- `total_points` - Lifetime earned
- `available_points` - Current redeemable
- `redeemed_points` - Already used

**Related Table:** `reward_transactions` (history log)

---

## Geo-Spatial Tables

### 5. Traveler Locations (`traveler_locations`)
Real-time location tracking of travelers.

**Key Fields:**
- `location` - PostGIS GEOGRAPHY(POINT) - lat/lon
- `country`, `city`, `airport_code`
- `last_updated` - Timestamp

**Indexes:**
- GIST index on `location` for fast geo queries

**Example Query:**
```sql
-- Find travelers within 10km of a point
SELECT * FROM traveler_locations
WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
    10000 -- meters
);
```

---

### 6. Trips (`trips`)
Traveler's planned journeys.

**Key Fields:**
- `traveler_id`
- `origin_country`, `destination_country`
- `departure_date`, `arrival_date`
- `max_weight`, `max_volume`
- `allowed_categories` - Array of allowed item types
- `status` - ACTIVE | COMPLETED | CANCELLED

---

## Marketplace Tables

### 7. Listings (`listings`)
Products for sale (regular or auction).

**Key Fields:**
- `listing_type` - buy_now | auction | make_offer
- `is_auction` - Boolean flag
- `starting_bid`, `current_bid`, `auction_ends_at`
- `location` - PostGIS point (where item is available)
- `status` - ACTIVE | SOLD | CANCELLED

**Indexes:**
- GIST on `location`
- B-tree on `is_auction` (partial index)

---

### 8. Bids (`bids`)
Auction bids history.

**Key Fields:**
- `listing_id`, `bidder_id`, `amount`

**Indexes:**
- `listing_id`, `amount DESC` (for top bids)

---

## Order & Delivery Tables

### 9. Orders (`orders`)
Main order/request table.

**Status Flow:**
```
REQUESTED → MATCHED → PURCHASED → IN_TRANSIT → ARRIVED → DELIVERED → COMPLETED
```

**Key Fields:**
- `buyer_id`, `traveler_id` (nullable until matched)
- `product_name`, `product_url`
- `product_price`, `delivery_fee`, `platform_fee`, `total_amount`
- `pickup_location`, `delivery_location`
- `status`

---

### 10. Tracking Events (`tracking_events`)
Shipment status update history.

**Key Fields:**
- `order_id`
- `status`, `location`, `notes`
- `created_at`

**Example:**
```json
{
  "order_id": 123,
  "status": "IN_TRANSIT",
  "location": "Dubai International Airport",
  "notes": "Package cleared customs"
}
```

---

## Financial Tables

### 11. Transactions (`transactions`)
All monetary movements.

**Types:**
- `DEPOSIT` - Add funds to wallet
- `WITHDRAWAL` - Remove funds
- `ESCROW_HOLD` - Lock buyer's funds
- `ESCROW_RELEASE` - Release to seller
- `ESCROW_REFUND` - Return to buyer
- `PAYMENT` - Direct payment

**Indexes:**
- `user_id`, `type`, `status`
- `order_id` (nullable)

---

## Communication Tables

### 12. Chat Messages (`chat_messages`)
In-app messaging between users.

**Key Fields:**
- `sender_id`, `receiver_id`, `order_id`
- `message`, `is_read`

---

### 13. Notifications (`notifications`)
Push/email notifications log.

**Types:**
- ORDER_UPDATE
- BID_PLACED
- DELIVERY_STATUS
- REWARD_EARNED

---

## Review System

### 14. Reviews (`reviews`)
User ratings and feedback.

**Key Fields:**
- `order_id` - Tied to specific order
- `reviewer_id`, `reviewee_id`
- `rating` (1-5), `comment`

**Constraint:** One review per user per order (UNIQUE)

---

## Consent & KYC Tables

### 15. Consents (`consents`)
GDPR-compliant user consent tracking.

**Key Fields:**
- `user_id` - One-to-one with users
- `essential_data` - Required for core functionality (always true)
- `analytics_consent` - Anonymous usage data
- `personalization_consent` - Personalized recommendations
- `marketing_consent` - Promotional communications
- `terms_accepted`, `terms_version` - Terms of service acceptance
- `privacy_policy_accepted`, `privacy_policy_version` - Privacy policy acceptance
- `consent_source` - WEB | MOBILE_IOS | MOBILE_ANDROID | API

**Indexes:**
- `user_id` (UNIQUE)
- `marketing_consent` (for email campaigns)

---

### 16. Consent History (`consent_history`)
Audit trail for consent changes (GDPR requirement).

**Key Fields:**
- `user_id` - Reference to user
- `consent_type` - Which consent changed
- `previous_value`, `new_value` - Before/after values
- `ip_address`, `user_agent` - Context of change

---

### 17. KYC Uploads (`kyc_uploads`)
Document storage for identity verification.

**Key Fields:**
- `user_id` - Reference to user
- `document_type` - PASSPORT | NATIONAL_ID | DRIVERS_LICENSE | SELFIE | PROOF_OF_ADDRESS
- `file_url` - MinIO/S3 encrypted path
- `status` - PENDING | IN_REVIEW | APPROVED | REJECTED | EXPIRED
- `expiry_date` - Document expiration

**Indexes:**
- `user_id`
- `document_type`
- `status`
- `expiry_date` (for expiration alerts)

---

### 18. KYC Verifications (`kyc_verifications`)
Overall KYC application status per user.

**Key Fields:**
- `user_id` - One-to-one with users
- `level` - NONE | BASIC | STANDARD | ENHANCED
- `status` - PENDING | IN_REVIEW | APPROVED | REJECTED
- `full_legal_name`, `date_of_birth`, `nationality` - Encrypted personal info

**Verification Levels:**
- `NONE` - No KYC
- `BASIC` - Email + phone verified
- `STANDARD` - ID document verified
- `ENHANCED` - Full KYC with proof of address

---

## Performance Considerations

| Table | Est. Rows | Index Strategy |
|-------|-----------|----------------|
| users | 100K+ | email, role |
| wallets | 100K+ | user_id (unique) |
| wallet_ledger | 10M+ | wallet_id, type, created_at |
| orders | 1M+ | buyer_id, status, created_at |
| traveler_locations | 10K+ | GIST (geo) |
| listings | 500K+ | GIST (geo), is_auction |
| bids | 5M+ | listing_id, amount DESC |
| consents | 100K+ | user_id (unique), marketing_consent |
| kyc_uploads | 200K+ | user_id, status, expiry_date |
| kyc_verifications | 50K+ | user_id (unique), status |

---

## Maintenance

**Auto-Update Timestamps:**
All major tables have `updated_at` triggers that auto-update on row modification.

**Backup Strategy:**
- Daily full backup
- Continuous WAL archiving for point-in-time recovery

---

## Migration Commands

```bash
# Run initial schema
psql -U mnbara_user -d mnbara_db -f complete_schema.sql

# Enable PostGIS (if not already)
psql -U mnbara_user -d mnbara_db -c "CREATE EXTENSION postgis;"

# Verify tables
psql -U mnbara_user -d mnbara_db -c "\dt"
```

---

**Last Updated:** 2025-12-01  
**Version:** 1.0.0
