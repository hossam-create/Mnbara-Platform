# STRICT EVENT TAXONOMY - MARKETPLACE PLATFORM
**Date**: January 16, 2026  
**Status**: ✅ **FINAL**  
**Security Level**: BANK-FACING  
**Compliance**: AUDITABLE, NO FREE-TEXT, NO DYNAMIC ENUMS

---

## EXECUTIVE SUMMARY

Defined a STRICT event taxonomy with 12 mandatory categories, 68 allowed event types, and rigid actor/target constraints. All events are pre-defined, auditable, and bank-facing compliant.

**Key Principles**:
- ✅ NO free-text event types
- ✅ NO dynamic enums
- ✅ MANDATORY categories only
- ✅ Strict actor/target validation
- ✅ Bank-facing auditable
- ✅ Immutable taxonomy

---

## MANDATORY CATEGORIES (12)

1. **AUTH** - Authentication & authorization
2. **SEARCH** - Search & discovery
3. **PRODUCT** - Product/listing management
4. **AUCTION** - Auction lifecycle
5. **BID** - Bidding operations
6. **ESCROW** - Escrow management
7. **WALLET** - Wallet operations
8. **PAYMENT** - Payment processing
9. **DELIVERY** - Delivery & fulfillment
10. **DISPUTE** - Dispute resolution
11. **TRUST** - Trust & safety
12. **SYSTEM** - System operations

---

## CATEGORY: AUTH (Authentication & Authorization)

**Allowed Event Types** (5):
- `AUTH_LOGIN_SUCCESS`
- `AUTH_LOGIN_FAILED`
- `AUTH_LOGOUT`
- `AUTH_TOKEN_ISSUED`
- `AUTH_TOKEN_REVOKED`

**Allowed Actor Types**:
- USER
- SYSTEM

**Allowed Target Types**:
- USER

**Validation Rules**:
- actor_id must be valid user ID
- target_id must match actor_id
- context must include: method (email|oauth|sso), success (boolean)

---

## CATEGORY: SEARCH (Search & Discovery)

**Allowed Event Types** (4):
- `SEARCH_QUERY_EXECUTED`
- `SEARCH_FILTER_APPLIED`
- `SEARCH_RESULT_VIEWED`
- `SEARCH_RECOMMENDATION_SHOWN`

**Allowed Actor Types**:
- USER
- SYSTEM

**Allowed Target Types**:
- AUCTION
- PRODUCT

**Validation Rules**:
- actor_id must be valid user ID
- target_id can be auction/product ID or null (for general search)
- context must include: query_type, result_count

---

## CATEGORY: PRODUCT (Product/Listing Management)

**Allowed Event Types** (6):
- `PRODUCT_CREATED`
- `PRODUCT_UPDATED`
- `PRODUCT_PUBLISHED`
- `PRODUCT_UNPUBLISHED`
- `PRODUCT_DELETED`
- `PRODUCT_VIEWED`

**Allowed Actor Types**:
- USER
- ADMIN
- SYSTEM

**Allowed Target Types**:
- PRODUCT
- AUCTION

**Validation Rules**:
- actor_id must be valid user/admin ID
- target_id must be valid product/auction ID
- context must include: action_type, previous_status, new_status

---

## CATEGORY: AUCTION (Auction Lifecycle)

**Allowed Event Types** (8):
- `AUCTION_CREATED`
- `AUCTION_STARTED`
- `AUCTION_ENDED_NORMAL`
- `AUCTION_ENDED_RESERVE_NOT_MET`
- `AUCTION_EXTENDED`
- `AUCTION_CANCELLED`
- `AUCTION_SETTLED`
- `AUCTION_FINALIZED`

**Allowed Actor Types**:
- USER
- ADMIN
- SYSTEM

**Allowed Target Types**:
- AUCTION

**Validation Rules**:
- actor_id must be valid user/admin ID
- target_id must be valid auction ID
- context must include: auction_status, reserve_met (boolean), final_price (decimal)

---

## CATEGORY: BID (Bidding Operations)

**Allowed Event Types** (7):
- `BID_PLACED`
- `BID_OUTBID`
- `BID_WON`
- `BID_CANCELLED`
- `BID_INVALIDATED`
- `BID_THROTTLED`
- `PROXY_BID_ACTIVATED`

**Allowed Actor Types**:
- USER
- SYSTEM

**Allowed Target Types**:
- BID
- AUCTION

**Validation Rules**:
- actor_id must be valid user ID
- target_id must be valid bid/auction ID
- context must include: bid_amount (decimal), is_auto_bid (boolean), triggered_extension (boolean)

---

## CATEGORY: ESCROW (Escrow Management)

**Allowed Event Types** (5):
- `ESCROW_CREATED`
- `ESCROW_HELD`
- `ESCROW_RELEASED`
- `ESCROW_REFUNDED`
- `ESCROW_DISPUTE_FLAGGED`

**Allowed Actor Types**:
- USER
- ADMIN
- SYSTEM

**Allowed Target Types**:
- ESCROW
- BID
- ORDER

**Validation Rules**:
- actor_id must be valid user/admin ID
- target_id must be valid escrow/bid/order ID
- context must include: escrow_amount (decimal), release_reason, ledger_entry_id

---

## CATEGORY: WALLET (Wallet Operations)

**Allowed Event Types** (5):
- `WALLET_CREATED`
- `WALLET_BALANCE_VIEWED`
- `WALLET_TRANSACTION_VIEWED`
- `WALLET_TRANSFER_INITIATED`
- `WALLET_TRANSFER_COMPLETED`

**Allowed Actor Types**:
- USER
- ADMIN
- SYSTEM

**Allowed Target Types**:
- WALLET
- USER

**Validation Rules**:
- actor_id must be valid user/admin ID
- target_id must be valid wallet/user ID
- context must include: balance (decimal), transaction_type, status

---

## CATEGORY: PAYMENT (Payment Processing)

**Allowed Event Types** (6):
- `PAYMENT_INITIATED`
- `PAYMENT_INTENT_CREATED`
- `PAYMENT_COMPLETED`
- `PAYMENT_FAILED`
- `PAYMENT_REFUNDED`
- `PAYMENT_WEBHOOK_RECEIVED`

**Allowed Actor Types**:
- USER
- SYSTEM

**Allowed Target Types**:
- PAYMENT
- ORDER

**Validation Rules**:
- actor_id must be valid user ID or 'SYSTEM'
- target_id must be valid payment/order ID
- context must include: amount (decimal), currency, payment_method, status
- NO payment card data in context

---

## CATEGORY: DELIVERY (Delivery & Fulfillment)

**Allowed Event Types** (6):
- `DELIVERY_CREATED`
- `DELIVERY_PICKED_UP`
- `DELIVERY_IN_TRANSIT`
- `DELIVERY_DELIVERED`
- `DELIVERY_FAILED`
- `DELIVERY_CANCELLED`

**Allowed Actor Types**:
- USER
- ADMIN
- SYSTEM

**Allowed Target Types**:
- ORDER
- DELIVERY

**Validation Rules**:
- actor_id must be valid user/admin ID
- target_id must be valid order/delivery ID
- context must include: tracking_number, carrier, status, estimated_delivery_date

---

## CATEGORY: DISPUTE (Dispute Resolution)

**Allowed Event Types** (6):
- `DISPUTE_CREATED`
- `DISPUTE_EVIDENCE_SUBMITTED`
- `DISPUTE_UNDER_REVIEW`
- `DISPUTE_RESOLVED`
- `DISPUTE_ESCALATED`
- `DISPUTE_APPEALED`

**Allowed Actor Types**:
- USER
- ADMIN
- SYSTEM

**Allowed Target Types**:
- DISPUTE
- BID
- ORDER

**Validation Rules**:
- actor_id must be valid user/admin ID
- target_id must be valid dispute/bid/order ID
- context must include: dispute_reason, resolution_type, decision_maker

---

## CATEGORY: TRUST (Trust & Safety)

**Allowed Event Types** (8):
- `TRUST_SCORE_CALCULATED`
- `TRUST_SCORE_UPDATED`
- `TRUST_ACTION_CREATED`
- `TRUST_ACTION_LIFTED`
- `TRUST_ACTION_EXPIRED`
- `TRUST_APPEAL_SUBMITTED`
- `TRUST_APPEAL_APPROVED`
- `TRUST_APPEAL_REJECTED`

**Allowed Actor Types**:
- USER
- ADMIN
- SYSTEM

**Allowed Target Types**:
- USER
- TRUST_ACTION

**Validation Rules**:
- actor_id must be valid user/admin ID
- target_id must be valid user/trust_action ID
- context must include: trust_score (0-100), trust_level, action_type, severity

---

## CATEGORY: SYSTEM (System Operations)

**Allowed Event Types** (6):
- `SYSTEM_STARTUP`
- `SYSTEM_SHUTDOWN`
- `SYSTEM_ERROR`
- `SYSTEM_WARNING`
- `SYSTEM_MAINTENANCE_START`
- `SYSTEM_MAINTENANCE_END`

**Allowed Actor Types**:
- SYSTEM
- ADMIN

**Allowed Target Types**:
- SYSTEM

**Validation Rules**:
- actor_id must be 'SYSTEM' or valid admin ID
- target_id must be 'SYSTEM'
- context must include: error_code, severity, component, message

---

## ACTOR TYPE CONSTRAINTS

| Actor Type | Allowed Categories | Restrictions |
|------------|-------------------|--------------|
| USER | AUTH, SEARCH, PRODUCT, AUCTION, BID, ESCROW, WALLET, PAYMENT, DELIVERY, DISPUTE, TRUST | Cannot create SYSTEM events |
| ADMIN | AUTH, PRODUCT, AUCTION, ESCROW, DELIVERY, DISPUTE, TRUST, SYSTEM | Full access to all categories |
| SYSTEM | AUTH, SEARCH, AUCTION, BID, ESCROW, WALLET, PAYMENT, DELIVERY, TRUST, SYSTEM | Automated operations only |

---

## TARGET TYPE CONSTRAINTS

| Target Type | Allowed Categories | Restrictions |
|------------|-------------------|--------------|
| USER | AUTH, SEARCH, PRODUCT, WALLET, TRUST | User-specific events |
| AUCTION | SEARCH, PRODUCT, AUCTION, BID | Auction lifecycle |
| BID | BID, ESCROW, DISPUTE | Bid operations |
| ORDER | PAYMENT, DELIVERY, DISPUTE | Order operations |
| WALLET | WALLET, PAYMENT | Wallet operations |
| ESCROW | ESCROW, DISPUTE | Escrow operations |
| PAYMENT | PAYMENT | Payment operations |
| DELIVERY | DELIVERY | Delivery operations |
| DISPUTE | DISPUTE | Dispute operations |
| TRUST_ACTION | TRUST | Trust actions |
| PRODUCT | PRODUCT, SEARCH | Product operations |
| SYSTEM | SYSTEM | System operations |

---

## VALIDATION MATRIX

### AUTH Category
```
Event Type                | Actor Types    | Target Types | Context Required
AUTH_LOGIN_SUCCESS        | USER, SYSTEM   | USER         | method, success, device_type
AUTH_LOGIN_FAILED         | USER, SYSTEM   | USER         | method, success, failure_reason
AUTH_LOGOUT               | USER           | USER         | session_duration
AUTH_TOKEN_ISSUED         | SYSTEM         | USER         | token_type, expiry
AUTH_TOKEN_REVOKED        | SYSTEM, ADMIN  | USER         | token_type, reason
```

### SEARCH Category
```
Event Type                | Actor Types    | Target Types | Context Required
SEARCH_QUERY_EXECUTED     | USER, SYSTEM   | AUCTION      | query_text, result_count
SEARCH_FILTER_APPLIED     | USER           | AUCTION      | filter_type, filter_value
SEARCH_RESULT_VIEWED      | USER           | AUCTION      | result_position, rank
SEARCH_RECOMMENDATION_SHOWN | SYSTEM       | AUCTION      | recommendation_type, score
```

### PRODUCT Category
```
Event Type                | Actor Types    | Target Types | Context Required
PRODUCT_CREATED           | USER, ADMIN    | PRODUCT      | title, category, price
PRODUCT_UPDATED           | USER, ADMIN    | PRODUCT      | fields_changed, previous_values
PRODUCT_PUBLISHED         | USER, ADMIN    | PRODUCT      | publish_date, visibility
PRODUCT_UNPUBLISHED       | USER, ADMIN    | PRODUCT      | reason, unpublish_date
PRODUCT_DELETED           | ADMIN          | PRODUCT      | reason, deleted_by
PRODUCT_VIEWED            | USER           | PRODUCT      | view_duration, source
```

### AUCTION Category
```
Event Type                | Actor Types    | Target Types | Context Required
AUCTION_CREATED           | USER, ADMIN    | AUCTION      | starting_bid, reserve_price, duration
AUCTION_STARTED           | SYSTEM         | AUCTION      | start_time, end_time
AUCTION_ENDED_NORMAL      | SYSTEM         | AUCTION      | final_price, winner_id, bid_count
AUCTION_ENDED_RESERVE_NOT_MET | SYSTEM     | AUCTION      | highest_bid, reserve_price
AUCTION_EXTENDED          | SYSTEM         | AUCTION      | extension_duration, trigger_reason
AUCTION_CANCELLED         | USER, ADMIN    | AUCTION      | cancellation_reason
AUCTION_SETTLED           | SYSTEM         | AUCTION      | settlement_date, escrow_released
AUCTION_FINALIZED         | SYSTEM         | AUCTION      | finalization_date, appeals_window_closed
```

### BID Category
```
Event Type                | Actor Types    | Target Types | Context Required
BID_PLACED                | USER           | BID          | bid_amount, is_auto_bid, timestamp
BID_OUTBID                | SYSTEM         | BID          | outbid_by_amount, new_highest_bid
BID_WON                   | SYSTEM         | BID          | final_price, settlement_date
BID_CANCELLED             | USER           | BID          | cancellation_reason
BID_INVALIDATED           | ADMIN, SYSTEM  | BID          | invalidation_reason, dispute_id
BID_THROTTLED             | SYSTEM         | BID          | throttle_reason, throttle_duration
PROXY_BID_ACTIVATED       | SYSTEM         | BID          | max_amount, current_bid
```

### ESCROW Category
```
Event Type                | Actor Types    | Target Types | Context Required
ESCROW_CREATED            | SYSTEM         | ESCROW       | escrow_amount, hold_reason
ESCROW_HELD               | SYSTEM         | ESCROW       | hold_date, hold_duration
ESCROW_RELEASED           | SYSTEM         | ESCROW       | release_date, release_reason, ledger_entry_id
ESCROW_REFUNDED           | SYSTEM, ADMIN  | ESCROW       | refund_date, refund_reason, ledger_entry_id
ESCROW_DISPUTE_FLAGGED    | ADMIN, SYSTEM  | ESCROW       | dispute_id, flag_reason
```

### WALLET Category
```
Event Type                | Actor Types    | Target Types | Context Required
WALLET_CREATED            | SYSTEM         | WALLET       | wallet_type, initial_balance
WALLET_BALANCE_VIEWED     | USER           | WALLET       | balance, view_date
WALLET_TRANSACTION_VIEWED | USER           | WALLET       | transaction_count, date_range
WALLET_TRANSFER_INITIATED | USER           | WALLET       | transfer_amount, recipient_id
WALLET_TRANSFER_COMPLETED | SYSTEM         | WALLET       | transfer_amount, completion_date, ledger_entry_id
```

### PAYMENT Category
```
Event Type                | Actor Types    | Target Types | Context Required
PAYMENT_INITIATED         | USER           | PAYMENT      | amount, currency, payment_method
PAYMENT_INTENT_CREATED    | SYSTEM         | PAYMENT      | intent_id, amount, currency
PAYMENT_COMPLETED         | SYSTEM         | PAYMENT      | amount, completion_date, transaction_id
PAYMENT_FAILED            | SYSTEM         | PAYMENT      | failure_reason, error_code
PAYMENT_REFUNDED          | SYSTEM, ADMIN  | PAYMENT      | refund_amount, refund_reason, ledger_entry_id
PAYMENT_WEBHOOK_RECEIVED  | SYSTEM         | PAYMENT      | webhook_type, webhook_data
```

### DELIVERY Category
```
Event Type                | Actor Types    | Target Types | Context Required
DELIVERY_CREATED          | SYSTEM         | DELIVERY     | tracking_number, carrier, estimated_date
DELIVERY_PICKED_UP        | SYSTEM         | DELIVERY     | pickup_date, pickup_location
DELIVERY_IN_TRANSIT       | SYSTEM         | DELIVERY     | current_location, estimated_delivery
DELIVERY_DELIVERED        | SYSTEM         | DELIVERY     | delivery_date, delivery_location, signature
DELIVERY_FAILED           | SYSTEM         | DELIVERY     | failure_reason, retry_date
DELIVERY_CANCELLED        | USER, ADMIN    | DELIVERY     | cancellation_reason, cancellation_date
```

### DISPUTE Category
```
Event Type                | Actor Types    | Target Types | Context Required
DISPUTE_CREATED           | USER           | DISPUTE      | dispute_reason, description
DISPUTE_EVIDENCE_SUBMITTED | USER          | DISPUTE      | evidence_type, evidence_count
DISPUTE_UNDER_REVIEW      | ADMIN, SYSTEM  | DISPUTE      | review_start_date, assigned_to
DISPUTE_RESOLVED          | ADMIN          | DISPUTE      | resolution_type, decision, decision_date
DISPUTE_ESCALATED         | ADMIN, SYSTEM  | DISPUTE      | escalation_reason, escalated_to
DISPUTE_APPEALED          | USER           | DISPUTE      | appeal_reason, appeal_date
```

### TRUST Category
```
Event Type                | Actor Types    | Target Types | Context Required
TRUST_SCORE_CALCULATED    | SYSTEM         | USER         | score, level, calculation_date
TRUST_SCORE_UPDATED       | SYSTEM         | USER         | previous_score, new_score, reason
TRUST_ACTION_CREATED      | ADMIN, SYSTEM  | TRUST_ACTION | action_type, severity, duration
TRUST_ACTION_LIFTED       | ADMIN          | TRUST_ACTION | lift_reason, lift_date
TRUST_ACTION_EXPIRED      | SYSTEM         | TRUST_ACTION | expiry_date
TRUST_APPEAL_SUBMITTED    | USER           | TRUST_ACTION | appeal_reason, submission_date
TRUST_APPEAL_APPROVED     | ADMIN          | TRUST_ACTION | approval_date, decision_reason
TRUST_APPEAL_REJECTED     | ADMIN          | TRUST_ACTION | rejection_date, decision_reason
```

### SYSTEM Category
```
Event Type                | Actor Types    | Target Types | Context Required
SYSTEM_STARTUP            | SYSTEM         | SYSTEM       | startup_time, version, environment
SYSTEM_SHUTDOWN           | SYSTEM, ADMIN  | SYSTEM       | shutdown_time, reason
SYSTEM_ERROR              | SYSTEM         | SYSTEM       | error_code, component, message, severity
SYSTEM_WARNING            | SYSTEM         | SYSTEM       | warning_code, component, message
SYSTEM_MAINTENANCE_START  | ADMIN, SYSTEM  | SYSTEM       | maintenance_type, estimated_duration
SYSTEM_MAINTENANCE_END    | ADMIN, SYSTEM  | SYSTEM       | maintenance_type, actual_duration
```

---

## TOTAL EVENT COUNT

| Category | Event Types | Total |
|----------|------------|-------|
| AUTH | 5 | 5 |
| SEARCH | 4 | 4 |
| PRODUCT | 6 | 6 |
| AUCTION | 8 | 8 |
| BID | 7 | 7 |
| ESCROW | 5 | 5 |
| WALLET | 5 | 5 |
| PAYMENT | 6 | 6 |
| DELIVERY | 6 | 6 |
| DISPUTE | 6 | 6 |
| TRUST | 8 | 8 |
| SYSTEM | 6 | 6 |
| **TOTAL** | **68** | **68** |

---

## COMPLIANCE CHECKLIST

- [x] NO free-text event types (all pre-defined)
- [x] NO dynamic enums (fixed taxonomy)
- [x] MANDATORY categories only (12 categories)
- [x] Strict actor/target validation
- [x] Bank-facing auditable
- [x] Immutable taxonomy
- [x] Context validation rules
- [x] No sensitive data in events
- [x] Comprehensive validation matrix
- [x] Clear actor/target constraints

---

**Status**: ✅ COMPLETE  
**Compliance**: BANK-FACING AUDITABLE  
**Immutability**: ENFORCED
