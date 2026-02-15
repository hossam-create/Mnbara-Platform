# Rule Definition Format - Complete Index

**Status**: ✅ Complete  
**Date**: January 16, 2026  
**Files**: 3  
**Documentation**: 2000+ lines

---

## Quick Navigation

### Files
1. [rule.schema.json](#rule-schema-json) - JSON Schema for validation
2. [example_rules.json](#example-rules-json) - 15 production-ready examples
3. [RULE_DEFINITION_FORMAT_DOCUMENTATION.md](#documentation) - Comprehensive guide

### Key Sections
- [Core Features](#core-features)
- [Rule Structure](#rule-structure)
- [Condition Types](#condition-types)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Files

### rule.schema.json

**Location**: `backend/services/auction-service/config/rule.schema.json`

JSON Schema (draft-07) for validating rule definitions:

**Features**:
- ✅ Validates required fields
- ✅ Enforces field types
- ✅ Validates enum values
- ✅ Supports 4 condition types
- ✅ Validates 68 event types
- ✅ Enforces semantic versioning

**Size**: 400+ lines

**Usage**:
```bash
# Validate rule against schema
jsonschema -i rule.json rule.schema.json
```

---

### example_rules.json

**Location**: `backend/services/auction-service/config/example_rules.json`

15 production-ready example rules covering common detection patterns:

**Rules Included**:
1. Rapid Bid Detection - Bot activity detection
2. High Value Bid Spike - High-value transaction detection
3. Multiple Failed Logins - Brute force attack detection
4. Dispute Escalation Pattern - Dispute abuse detection
5. Unique IP Addresses - Account compromise detection
6. Payment Failure Retry - Payment fraud detection
7. Rapid Account Creation - Account farming detection
8. Auction Cancellation Abuse - Seller abuse detection
9. Bid Then Dispute Pattern - Post-win fraud detection
10. Escrow Release Delay - Compliance review
11. Search Then Bid Sequence - Shill bidding detection
12. Delivery Failure Pattern - Seller quality detection
13. Refund Abuse - Refund fraud detection
14. Wallet Transfer Spike - AML compliance
15. System Error Spike - System monitoring

**Size**: 500+ lines

**Usage**:
```json
// Load and use example rules
const rules = JSON.parse(fs.readFileSync('example_rules.json'));
for (const rule of rules.rules) {
  await rulesEngine.evaluateRule(rule, context);
}
```

---

### RULE_DEFINITION_FORMAT_DOCUMENTATION.md

**Location**: `RULE_DEFINITION_FORMAT_DOCUMENTATION.md`

Comprehensive documentation covering all aspects of the rule definition format:

**Sections**:
- Overview and features
- File structure
- Core fields (required and optional)
- Condition types (count, unique_actor, sequence, simple)
- Event types (68 total)
- Usage examples (4 detailed examples)
- Best practices (10 guidelines)
- Deployment workflow (6 steps)
- Integration guide
- Schema validation

**Size**: 2000+ lines

---

## Core Features

### 1. JSON-Based Format
- Human-readable
- Version-controllable
- Easy to edit
- No code changes needed

### 2. Versioning
- Semantic versioning (major.minor.patch)
- Track rule evolution
- Support multiple versions

### 3. Four Condition Types

#### Count Condition
Trigger when event count exceeds threshold
- Use case: Rapid bidding, multiple failed logins
- Example: More than 10 bids in 5 minutes

#### Unique Actor Condition
Trigger when unique actors exceed threshold
- Use case: Multiple IP addresses, account farming
- Example: More than 5 different IP addresses in 1 hour

#### Sequence Condition
Trigger when events occur in specific order
- Use case: Fraud patterns, abuse sequences
- Example: Dispute created then escalated within 1 hour

#### Simple Condition
Trigger on specific event field values
- Use case: High-value transactions, specific event types
- Example: Bid amount greater than $10,000

### 4. Time Windows
- Flexible time-based evaluation
- Units: seconds, minutes, hours, days
- Example: 5 minutes, 24 hours, 7 days

### 5. Output Flags (5 Types)
- `FLAG_USER` - Flag user for review
- `FLAG_AUCTION` - Flag auction for review
- `FLAG_TRAVELER` - Flag traveler for review
- `RATE_LIMIT` - Rate limit user
- `REQUIRE_MANUAL_REVIEW` - Require manual review

### 6. Severity Levels (4)
- `LOW` - Informational
- `MEDIUM` - Should review
- `HIGH` - Serious issue
- `CRITICAL` - Urgent action

---

## Rule Structure

```json
{
  "rule_id": "rule-rapid-bid-detection",
  "name": "Rapid Bid Detection",
  "description": "Flag users who place more than 10 bids in 5 minutes",
  "version": "1.0.0",
  "event_types": ["BID_PLACED"],
  "condition": {
    "type": "count",
    "field": "actor_id",
    "operator": "greater_than",
    "value": 10
  },
  "threshold": 10,
  "window": {
    "value": 5,
    "unit": "minutes"
  },
  "output_flag": "FLAG_USER",
  "severity": "HIGH",
  "enabled": true,
  "tags": ["fraud", "bot-detection"],
  "created_at": "2026-01-16T00:00:00Z",
  "updated_at": "2026-01-16T00:00:00Z",
  "created_by": "admin",
  "notes": "Detects potential bot bidding patterns"
}
```

---

## Condition Types

### Count Condition
```json
{
  "type": "count",
  "field": "actor_id",
  "operator": "greater_than",
  "value": 10
}
```

### Unique Actor Condition
```json
{
  "type": "unique_actor",
  "actor_field": "ip_address",
  "operator": "greater_than",
  "value": 5
}
```

### Sequence Condition
```json
{
  "type": "sequence",
  "sequence": ["DISPUTE_CREATED", "DISPUTE_ESCALATED"],
  "max_gap_seconds": 3600,
  "same_actor": true,
  "same_target": true
}
```

### Simple Condition
```json
{
  "type": "simple",
  "field": "context.amount",
  "operator": "greater_than",
  "value": 10000
}
```

---

## Operators

### Comparison Operators
- `equals` - Exact match
- `not_equals` - Not equal
- `greater_than` - Greater than
- `less_than` - Less than
- `greater_than_or_equal` - Greater than or equal
- `less_than_or_equal` - Less than or equal

### Array Operators
- `in` - Value in array
- `not_in` - Value not in array

### String Operators
- `contains` - String contains
- `not_contains` - String does not contain
- `starts_with` - String starts with
- `ends_with` - String ends with

### Existence Operators
- `exists` - Field exists
- `not_exists` - Field does not exist

---

## Event Types (68 Total)

### Authentication (5)
- AUTH_LOGIN_SUCCESS
- AUTH_LOGIN_FAILED
- AUTH_LOGOUT
- AUTH_TOKEN_ISSUED
- AUTH_TOKEN_REVOKED

### Search (4)
- SEARCH_QUERY_EXECUTED
- SEARCH_FILTER_APPLIED
- SEARCH_RESULT_VIEWED
- SEARCH_RECOMMENDATION_SHOWN

### Product (5)
- PRODUCT_VIEWED
- PRODUCT_ADDED_TO_CART
- PRODUCT_REMOVED_FROM_CART
- PRODUCT_REVIEWED
- PRODUCT_SHARED

### Auction (8)
- AUCTION_CREATED
- AUCTION_STARTED
- AUCTION_ENDED_NORMAL
- AUCTION_ENDED_RESERVE_NOT_MET
- AUCTION_EXTENDED
- AUCTION_CANCELLED
- AUCTION_SETTLED
- AUCTION_FINALIZED

### Bidding (7)
- BID_PLACED
- BID_OUTBID
- BID_WON
- BID_CANCELLED
- BID_INVALIDATED
- BID_THROTTLED
- PROXY_BID_ACTIVATED

### Escrow (5)
- ESCROW_CREATED
- ESCROW_HELD
- ESCROW_RELEASED
- ESCROW_REFUNDED
- ESCROW_DISPUTE_FLAGGED

### Wallet (5)
- WALLET_CREATED
- WALLET_BALANCE_VIEWED
- WALLET_TRANSACTION_VIEWED
- WALLET_TRANSFER_INITIATED
- WALLET_TRANSFER_COMPLETED

### Payment (6)
- PAYMENT_INITIATED
- PAYMENT_PROCESSING
- PAYMENT_COMPLETED
- PAYMENT_FAILED
- PAYMENT_REFUNDED
- PAYMENT_DISPUTED

### Delivery (5)
- DELIVERY_INITIATED
- DELIVERY_IN_TRANSIT
- DELIVERY_ATTEMPTED
- DELIVERY_COMPLETED
- DELIVERY_FAILED

### Disputes (6)
- DISPUTE_CREATED
- DISPUTE_EVIDENCE_SUBMITTED
- DISPUTE_UNDER_REVIEW
- DISPUTE_RESOLVED
- DISPUTE_ESCALATED
- DISPUTE_APPEALED

### Trust (6)
- TRUST_ACTION_CREATED
- TRUST_ACTION_UPDATED
- TRUST_ACTION_EXPIRED
- TRUST_SCORE_CALCULATED
- TRUST_SCORE_UPDATED
- ENFORCEMENT_ACTION_CREATED

### System (6)
- SYSTEM_STARTUP
- SYSTEM_SHUTDOWN
- SYSTEM_ERROR
- SYSTEM_WARNING
- SYSTEM_MAINTENANCE_START
- SYSTEM_MAINTENANCE_END

---

## Usage Examples

### Example 1: Rapid Bidding Detection
```json
{
  "rule_id": "rule-rapid-bid-detection",
  "name": "Rapid Bid Detection",
  "event_types": ["BID_PLACED"],
  "condition": {
    "type": "count",
    "field": "actor_id",
    "operator": "greater_than",
    "value": 10
  },
  "threshold": 10,
  "window": { "value": 5, "unit": "minutes" },
  "output_flag": "FLAG_USER",
  "severity": "HIGH"
}
```

### Example 2: Account Compromise Detection
```json
{
  "rule_id": "rule-unique-ip-addresses",
  "name": "Unusual IP Address Activity",
  "event_types": ["AUTH_LOGIN_SUCCESS"],
  "condition": {
    "type": "unique_actor",
    "actor_field": "ip_address",
    "operator": "greater_than",
    "value": 5
  },
  "threshold": 5,
  "window": { "value": 1, "unit": "hours" },
  "output_flag": "FLAG_USER",
  "severity": "HIGH"
}
```

### Example 3: Dispute Escalation Pattern
```json
{
  "rule_id": "rule-dispute-escalation-pattern",
  "name": "Dispute Escalation Pattern",
  "event_types": ["DISPUTE_CREATED", "DISPUTE_ESCALATED"],
  "condition": {
    "type": "sequence",
    "sequence": ["DISPUTE_CREATED", "DISPUTE_ESCALATED"],
    "max_gap_seconds": 3600,
    "same_actor": true,
    "same_target": true
  },
  "output_flag": "FLAG_USER",
  "severity": "MEDIUM"
}
```

### Example 4: High-Value Transaction
```json
{
  "rule_id": "rule-high-value-bid-spike",
  "name": "High Value Bid Spike",
  "event_types": ["BID_PLACED"],
  "condition": {
    "type": "simple",
    "field": "context.amount",
    "operator": "greater_than",
    "value": 10000
  },
  "output_flag": "FLAG_AUCTION",
  "severity": "MEDIUM"
}
```

---

## Best Practices

### 1. Rule Naming
- Use descriptive names
- Use title case
- Include detection type

### 2. Rule IDs
- Use kebab-case
- Make IDs descriptive
- Avoid generic IDs

### 3. Versioning
- Start with 1.0.0
- Increment patch for minor changes
- Increment minor for new features
- Increment major for breaking changes

### 4. Descriptions
- Provide clear descriptions
- Explain what rule detects
- Include thresholds and windows

### 5. Tags
- Use consistent tag names
- Use multiple tags
- Common tags: fraud, abuse, security, compliance

### 6. Time Windows
- Use appropriate windows
- Shorter for rapid activity
- Longer for patterns

### 7. Thresholds
- Base on normal behavior
- Use historical data
- Document rationale
- Review regularly

### 8. Severity Levels
- LOW - Informational
- MEDIUM - Should review
- HIGH - Serious issue
- CRITICAL - Urgent action

### 9. Output Flags
- Choose appropriate type
- FLAG_USER for user issues
- FLAG_AUCTION for auction issues
- FLAG_TRAVELER for traveler issues
- RATE_LIMIT for rate limiting
- REQUIRE_MANUAL_REVIEW for human review

### 10. Testing
- Test with historical data
- Monitor false positives
- Adjust thresholds
- Document issues

---

## Deployment Workflow

### 1. Create Rule
Write rule JSON following schema

### 2. Validate
Validate against rule.schema.json

### 3. Add to Rules
Add to example_rules.json or rules database

### 4. Deploy
Deploy without code changes

### 5. Monitor
Monitor execution and flag production

### 6. Update
Update version and redeploy

---

## Integration

### With Rules Engine Service
```typescript
// Load rule from JSON
const rule = JSON.parse(ruleJson);

// Validate
validateRuleAgainstSchema(rule);

// Evaluate
const results = await rulesEngine.evaluateRule(rule, context);

// Produce flags
if (results) {
  console.log(`Flag: ${rule.output_flag}`);
}
```

### With Event Logging System
- Rules evaluate events from Event table
- Read-only access to events
- No modifications to events
- Produces only flags (no actions)

---

## Statistics

| Metric | Value |
|--------|-------|
| Schema Lines | 400+ |
| Example Rules | 15 |
| Condition Types | 4 |
| Operators | 14 |
| Event Types | 68 |
| Output Flags | 5 |
| Severity Levels | 4 |
| Documentation Lines | 2000+ |

---

## Summary

The rule definition format is **production-ready** with:

✅ **JSON-based** - Human-readable, version-controllable  
✅ **Versioned** - Semantic versioning support  
✅ **No-code** - Edit and deploy without code changes  
✅ **Powerful** - 4 condition types, 14 operators  
✅ **Validated** - JSON Schema ensures correctness  
✅ **Documented** - 2000+ lines of documentation  
✅ **Examples** - 15 production-ready rules  

Ready for immediate integration with the Rules Engine Service.

---

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `rule.schema.json` | JSON Schema validation | ✅ Complete |
| `example_rules.json` | 15 production examples | ✅ Complete |
| `RULE_DEFINITION_FORMAT_DOCUMENTATION.md` | Comprehensive guide | ✅ Complete |
| `RULE_DEFINITION_FORMAT_SUMMARY.md` | Quick summary | ✅ Complete |
| `RULE_DEFINITION_FORMAT_INDEX.md` | This index | ✅ Complete |

---

**Last Updated**: January 16, 2026  
**Status**: ✅ COMPLETE  
**Quality**: PRODUCTION-READY
