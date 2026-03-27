# Rule Definition Format - Complete Documentation

**Status**: ✅ Complete  
**Date**: January 16, 2026  
**Version**: 1.0.0

---

## Overview

A comprehensive JSON-based rule definition format that enables no-code rule creation and deployment. Rules are versioned, editable without code changes, and support advanced detection patterns including count-based, unique actor, and sequence detection.

---

## Key Features

✅ **JSON-Based**: Human-readable, version-controllable format  
✅ **Versioned**: Semantic versioning for rule evolution  
✅ **No-Code Deployment**: Edit and deploy without code changes  
✅ **Count Detection**: Trigger on event count thresholds  
✅ **Unique Actor Detection**: Detect multiple actors from same source  
✅ **Sequence Detection**: Detect specific event sequences  
✅ **Simple Conditions**: Basic field-value comparisons  
✅ **Time Windows**: Flexible time-based evaluation  
✅ **Severity Levels**: LOW, MEDIUM, HIGH, CRITICAL  
✅ **Output Flags**: 5 flag types for different actions  

---

## File Structure

### 1. Schema Definition
**File**: `backend/services/auction-service/config/rule.schema.json`

JSON Schema (draft-07) that validates all rule definitions. Ensures:
- Required fields are present
- Field types are correct
- Enum values are valid
- Relationships between fields are valid

### 2. Example Rules
**File**: `backend/services/auction-service/config/example_rules.json`

15 production-ready example rules covering:
- Fraud detection
- Bot detection
- Security threats
- Compliance requirements
- System monitoring

### 3. Documentation
**File**: `RULE_DEFINITION_FORMAT_DOCUMENTATION.md`

This comprehensive guide covering:
- Schema overview
- Field definitions
- Condition types
- Usage examples
- Best practices

---

## Core Fields

### Required Fields

#### rule_id
```json
"rule_id": "rule-rapid-bid-detection"
```
- **Type**: String
- **Pattern**: `^rule-[a-z0-9-]+$` (kebab-case)
- **Description**: Unique identifier for the rule
- **Example**: `rule-rapid-bid-detection`, `rule-high-value-bid-spike`

#### name
```json
"name": "Rapid Bid Detection"
```
- **Type**: String
- **Length**: 3-255 characters
- **Description**: Human-readable rule name
- **Example**: `Rapid Bid Detection`, `Multiple Failed Logins`

#### version
```json
"version": "1.0.0"
```
- **Type**: String
- **Pattern**: `^\d+\.\d+\.\d+$` (semantic versioning)
- **Description**: Rule version (major.minor.patch)
- **Example**: `1.0.0`, `2.1.3`

#### event_types
```json
"event_types": ["BID_PLACED"]
```
- **Type**: Array of strings
- **Min Items**: 1
- **Description**: Event types that trigger this rule
- **Valid Values**: 68 event types from event taxonomy
- **Example**: `["BID_PLACED"]`, `["DISPUTE_CREATED", "DISPUTE_ESCALATED"]`

#### condition
```json
"condition": {
  "type": "count",
  "field": "actor_id",
  "operator": "greater_than",
  "value": 10
}
```
- **Type**: Object
- **Description**: Rule condition definition
- **Subtypes**: count, unique_actor, sequence, simple
- **See**: Condition Types section below

#### output_flag
```json
"output_flag": "FLAG_USER"
```
- **Type**: String
- **Enum**: `FLAG_USER`, `FLAG_AUCTION`, `FLAG_TRAVELER`, `RATE_LIMIT`, `REQUIRE_MANUAL_REVIEW`
- **Description**: Type of flag to produce when rule matches
- **Mapping**:
  - `FLAG_USER` - Flag user for review
  - `FLAG_AUCTION` - Flag auction for review
  - `FLAG_TRAVELER` - Flag traveler for review
  - `RATE_LIMIT` - Rate limit user
  - `REQUIRE_MANUAL_REVIEW` - Require manual review

#### severity
```json
"severity": "HIGH"
```
- **Type**: String
- **Enum**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- **Description**: Severity level of the flag
- **Mapping**:
  - `LOW` - Minor issue, informational
  - `MEDIUM` - Moderate issue, should review
  - `HIGH` - Serious issue, immediate review
  - `CRITICAL` - Critical issue, urgent action

#### enabled
```json
"enabled": true
```
- **Type**: Boolean
- **Description**: Whether the rule is active
- **Default**: true
- **Usage**: Set to false to disable rule without deletion

### Optional Fields

#### description
```json
"description": "Flag users who place more than 10 bids in 5 minutes"
```
- **Type**: String
- **Max Length**: 1000 characters
- **Description**: Detailed description of what the rule detects

#### threshold
```json
"threshold": 10
```
- **Type**: Integer
- **Min Value**: 1
- **Description**: Threshold value for triggering the rule
- **Usage**: Used with count-based rules

#### window
```json
"window": {
  "value": 5,
  "unit": "minutes"
}
```
- **Type**: Object
- **Description**: Time window for rule evaluation
- **Properties**:
  - `value` (integer, min 1): Time window value
  - `unit` (string): `seconds`, `minutes`, `hours`, `days`
- **Example**: 5 minutes, 24 hours, 7 days

#### tags
```json
"tags": ["fraud", "bot-detection", "bidding"]
```
- **Type**: Array of strings
- **Description**: Tags for categorizing rules
- **Common Tags**: `fraud`, `abuse`, `security`, `compliance`, `bot-detection`, `shill-bidding`, `account-compromise`, `aml`, `system`

#### created_at / updated_at
```json
"created_at": "2026-01-16T00:00:00Z",
"updated_at": "2026-01-16T00:00:00Z"
```
- **Type**: String (ISO 8601 datetime)
- **Description**: Rule creation and last update timestamps
- **Auto-managed**: Set by system

#### created_by / updated_by
```json
"created_by": "admin",
"updated_by": "admin"
```
- **Type**: String
- **Description**: User ID who created/updated the rule
- **Auto-managed**: Set by system

#### notes
```json
"notes": "Detects potential bot bidding patterns"
```
- **Type**: String
- **Max Length**: 2000 characters
- **Description**: Internal notes about the rule

---

## Condition Types

### 1. Count Condition

**Type**: `count`  
**Purpose**: Trigger when event count exceeds threshold  
**Use Cases**: Rapid bidding, multiple failed logins, rapid account creation

```json
{
  "type": "count",
  "field": "actor_id",
  "operator": "greater_than",
  "value": 10
}
```

**Fields**:
- `type` (required): `"count"`
- `field` (required): Field to count (e.g., `event_type`, `actor_id`)
- `operator` (required): `equals`, `greater_than`, `less_than`, `greater_than_or_equal`, `less_than_or_equal`
- `value` (required): Value to compare against (integer, min 1)

**Example**: Flag users with more than 10 bids in 5 minutes
```json
{
  "type": "count",
  "field": "actor_id",
  "operator": "greater_than",
  "value": 10
}
```

**With threshold and window**:
```json
{
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
  }
}
```

---

### 2. Unique Actor Condition

**Type**: `unique_actor`  
**Purpose**: Trigger when unique actors exceed threshold  
**Use Cases**: Multiple IP addresses, account farming, distributed attacks

```json
{
  "type": "unique_actor",
  "actor_field": "ip_address",
  "operator": "greater_than",
  "value": 5
}
```

**Fields**:
- `type` (required): `"unique_actor"`
- `actor_field` (required): Field to count unique values from
  - `actor_id` - Count unique user IDs
  - `ip_address` - Count unique IP addresses
  - `user_agent` - Count unique user agents
- `operator` (required): `equals`, `greater_than`, `less_than`, `greater_than_or_equal`, `less_than_or_equal`
- `value` (required): Number of unique actors threshold (integer, min 1)

**Example**: Flag users accessing from more than 5 different IP addresses in 1 hour
```json
{
  "type": "unique_actor",
  "actor_field": "ip_address",
  "operator": "greater_than",
  "value": 5
}
```

**With threshold and window**:
```json
{
  "condition": {
    "type": "unique_actor",
    "actor_field": "ip_address",
    "operator": "greater_than",
    "value": 5
  },
  "threshold": 5,
  "window": {
    "value": 1,
    "unit": "hours"
  }
}
```

---

### 3. Sequence Condition

**Type**: `sequence`  
**Purpose**: Trigger when events occur in specific order  
**Use Cases**: Fraud patterns, abuse sequences, suspicious workflows

```json
{
  "type": "sequence",
  "sequence": ["DISPUTE_CREATED", "DISPUTE_ESCALATED"],
  "max_gap_seconds": 3600,
  "same_actor": true,
  "same_target": true
}
```

**Fields**:
- `type` (required): `"sequence"`
- `sequence` (required): Ordered list of event types (array, min 2 items)
- `max_gap_seconds` (optional): Maximum seconds between events (0 = no limit)
- `same_actor` (optional): Whether all events must be from same actor (default: false)
- `same_target` (optional): Whether all events must target same entity (default: false)

**Example 1**: Dispute escalation pattern (same actor, same target, within 1 hour)
```json
{
  "type": "sequence",
  "sequence": ["DISPUTE_CREATED", "DISPUTE_ESCALATED"],
  "max_gap_seconds": 3600,
  "same_actor": true,
  "same_target": true
}
```

**Example 2**: Bid then dispute pattern (same actor, different targets, within 30 minutes)
```json
{
  "type": "sequence",
  "sequence": ["BID_WON", "DISPUTE_CREATED"],
  "max_gap_seconds": 1800,
  "same_actor": true,
  "same_target": false
}
```

**Example 3**: Search then bid pattern (same actor, no time limit)
```json
{
  "type": "sequence",
  "sequence": ["SEARCH_QUERY_EXECUTED", "BID_PLACED"],
  "max_gap_seconds": 0,
  "same_actor": true,
  "same_target": false
}
```

---

### 4. Simple Condition

**Type**: `simple`  
**Purpose**: Trigger on specific event field values  
**Use Cases**: High-value transactions, specific event types, field-based filtering

```json
{
  "type": "simple",
  "field": "context.amount",
  "operator": "greater_than",
  "value": 10000
}
```

**Fields**:
- `type` (required): `"simple"`
- `field` (required): Event field to evaluate (supports dot notation for nested fields)
- `operator` (required): Comparison operator
  - `equals` - Exact match
  - `not_equals` - Not equal
  - `greater_than` - Greater than
  - `less_than` - Less than
  - `greater_than_or_equal` - Greater than or equal
  - `less_than_or_equal` - Less than or equal
  - `in` - Value in array
  - `not_in` - Value not in array
  - `contains` - String contains
  - `not_contains` - String does not contain
  - `starts_with` - String starts with
  - `ends_with` - String ends with
  - `exists` - Field exists
  - `not_exists` - Field does not exist
- `value` (required): Value to compare against (string, number, boolean, or array)

**Example 1**: High-value bid detection
```json
{
  "type": "simple",
  "field": "context.amount",
  "operator": "greater_than",
  "value": 10000
}
```

**Example 2**: Specific event type
```json
{
  "type": "simple",
  "field": "event_type",
  "operator": "equals",
  "value": "BID_PLACED"
}
```

**Example 3**: Multiple event types
```json
{
  "type": "simple",
  "field": "event_type",
  "operator": "in",
  "value": ["DISPUTE_CREATED", "DISPUTE_ESCALATED"]
}
```

**Example 4**: Field existence check
```json
{
  "type": "simple",
  "field": "context.dispute_reason",
  "operator": "exists",
  "value": true
}
```

---

## Event Types

The `event_types` field accepts any of these 68 event types from the event taxonomy:

### Authentication (5)
- `AUTH_LOGIN_SUCCESS`
- `AUTH_LOGIN_FAILED`
- `AUTH_LOGOUT`
- `AUTH_TOKEN_ISSUED`
- `AUTH_TOKEN_REVOKED`

### Search (4)
- `SEARCH_QUERY_EXECUTED`
- `SEARCH_FILTER_APPLIED`
- `SEARCH_RESULT_VIEWED`
- `SEARCH_RECOMMENDATION_SHOWN`

### Product (5)
- `PRODUCT_VIEWED`
- `PRODUCT_ADDED_TO_CART`
- `PRODUCT_REMOVED_FROM_CART`
- `PRODUCT_REVIEWED`
- `PRODUCT_SHARED`

### Auction (8)
- `AUCTION_CREATED`
- `AUCTION_STARTED`
- `AUCTION_ENDED_NORMAL`
- `AUCTION_ENDED_RESERVE_NOT_MET`
- `AUCTION_EXTENDED`
- `AUCTION_CANCELLED`
- `AUCTION_SETTLED`
- `AUCTION_FINALIZED`

### Bidding (7)
- `BID_PLACED`
- `BID_OUTBID`
- `BID_WON`
- `BID_CANCELLED`
- `BID_INVALIDATED`
- `BID_THROTTLED`
- `PROXY_BID_ACTIVATED`

### Escrow (5)
- `ESCROW_CREATED`
- `ESCROW_HELD`
- `ESCROW_RELEASED`
- `ESCROW_REFUNDED`
- `ESCROW_DISPUTE_FLAGGED`

### Wallet (5)
- `WALLET_CREATED`
- `WALLET_BALANCE_VIEWED`
- `WALLET_TRANSACTION_VIEWED`
- `WALLET_TRANSFER_INITIATED`
- `WALLET_TRANSFER_COMPLETED`

### Payment (6)
- `PAYMENT_INITIATED`
- `PAYMENT_PROCESSING`
- `PAYMENT_COMPLETED`
- `PAYMENT_FAILED`
- `PAYMENT_REFUNDED`
- `PAYMENT_DISPUTED`

### Delivery (5)
- `DELIVERY_INITIATED`
- `DELIVERY_IN_TRANSIT`
- `DELIVERY_ATTEMPTED`
- `DELIVERY_COMPLETED`
- `DELIVERY_FAILED`

### Disputes (6)
- `DISPUTE_CREATED`
- `DISPUTE_EVIDENCE_SUBMITTED`
- `DISPUTE_UNDER_REVIEW`
- `DISPUTE_RESOLVED`
- `DISPUTE_ESCALATED`
- `DISPUTE_APPEALED`

### Trust (6)
- `TRUST_ACTION_CREATED`
- `TRUST_ACTION_UPDATED`
- `TRUST_ACTION_EXPIRED`
- `TRUST_SCORE_CALCULATED`
- `TRUST_SCORE_UPDATED`
- `ENFORCEMENT_ACTION_CREATED`

### System (6)
- `SYSTEM_STARTUP`
- `SYSTEM_SHUTDOWN`
- `SYSTEM_ERROR`
- `SYSTEM_WARNING`
- `SYSTEM_MAINTENANCE_START`
- `SYSTEM_MAINTENANCE_END`

---

## Usage Examples

### Example 1: Rapid Bidding Detection

Detect users placing more than 10 bids in 5 minutes (bot activity):

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
  "tags": ["fraud", "bot-detection"]
}
```

### Example 2: Account Compromise Detection

Detect users accessing from multiple IP addresses (account compromise):

```json
{
  "rule_id": "rule-unique-ip-addresses",
  "name": "Unusual IP Address Activity",
  "description": "Flag users accessing from more than 5 different IP addresses in 1 hour",
  "version": "1.0.0",
  "event_types": ["AUTH_LOGIN_SUCCESS"],
  "condition": {
    "type": "unique_actor",
    "actor_field": "ip_address",
    "operator": "greater_than",
    "value": 5
  },
  "threshold": 5,
  "window": {
    "value": 1,
    "unit": "hours"
  },
  "output_flag": "FLAG_USER",
  "severity": "HIGH",
  "enabled": true,
  "tags": ["security", "account-compromise"]
}
```

### Example 3: Dispute Escalation Pattern

Detect users escalating disputes immediately after creation (abuse):

```json
{
  "rule_id": "rule-dispute-escalation-pattern",
  "name": "Dispute Escalation Pattern",
  "description": "Flag users who create disputes, then escalate them within 1 hour",
  "version": "1.0.0",
  "event_types": ["DISPUTE_CREATED", "DISPUTE_ESCALATED"],
  "condition": {
    "type": "sequence",
    "sequence": ["DISPUTE_CREATED", "DISPUTE_ESCALATED"],
    "max_gap_seconds": 3600,
    "same_actor": true,
    "same_target": true
  },
  "output_flag": "FLAG_USER",
  "severity": "MEDIUM",
  "enabled": true,
  "tags": ["abuse", "disputes"]
}
```

### Example 4: High-Value Transaction

Detect high-value bids for compliance review:

```json
{
  "rule_id": "rule-high-value-bid-spike",
  "name": "High Value Bid Spike",
  "description": "Flag auctions with bids exceeding $10,000",
  "version": "1.0.0",
  "event_types": ["BID_PLACED"],
  "condition": {
    "type": "simple",
    "field": "context.amount",
    "operator": "greater_than",
    "value": 10000
  },
  "output_flag": "FLAG_AUCTION",
  "severity": "MEDIUM",
  "enabled": true,
  "tags": ["compliance", "high-value"]
}
```

---

## Best Practices

### 1. Rule Naming
- Use descriptive names that clearly indicate what the rule detects
- Use title case (e.g., "Rapid Bid Detection")
- Include the detection type in the name (e.g., "Pattern", "Spike", "Abuse")

### 2. Rule IDs
- Use kebab-case format (e.g., `rule-rapid-bid-detection`)
- Make IDs descriptive and unique
- Avoid generic IDs like `rule-1`, `rule-2`

### 3. Versioning
- Start with `1.0.0`
- Increment patch version for minor changes (e.g., threshold adjustments)
- Increment minor version for new features (e.g., new condition type)
- Increment major version for breaking changes (e.g., different event types)

### 4. Descriptions
- Provide clear, concise descriptions
- Explain what the rule detects and why
- Include threshold values and time windows in description

### 5. Tags
- Use consistent tag names across rules
- Common tags: `fraud`, `abuse`, `security`, `compliance`, `bot-detection`, `shill-bidding`, `account-compromise`, `aml`, `system`
- Use multiple tags for better categorization

### 6. Time Windows
- Use appropriate time windows for the detection pattern
- Shorter windows (minutes) for rapid activity detection
- Longer windows (hours/days) for pattern detection
- Consider user behavior when setting windows

### 7. Thresholds
- Set thresholds based on normal user behavior
- Use historical data to calibrate thresholds
- Document threshold rationale in notes
- Review and adjust thresholds regularly

### 8. Severity Levels
- `LOW` - Informational, no immediate action needed
- `MEDIUM` - Should review, potential issue
- `HIGH` - Serious issue, immediate review recommended
- `CRITICAL` - Urgent action required

### 9. Output Flags
- Choose appropriate flag type for the detection
- `FLAG_USER` - User behavior issue
- `FLAG_AUCTION` - Auction-specific issue
- `FLAG_TRAVELER` - Traveler/seller issue
- `RATE_LIMIT` - Rate limiting needed
- `REQUIRE_MANUAL_REVIEW` - Needs human review

### 10. Testing
- Test rules with historical data before enabling
- Monitor false positive rates
- Adjust thresholds based on results
- Document any issues or edge cases

---

## Deployment Workflow

### 1. Create Rule
Create a new rule JSON following the schema:
```json
{
  "rule_id": "rule-new-detection",
  "name": "New Detection Rule",
  "version": "1.0.0",
  ...
}
```

### 2. Validate Rule
Validate against `rule.schema.json`:
```bash
# Using JSON Schema validator
jsonschema -i rule.json rule.schema.json
```

### 3. Add to Rules File
Add rule to `example_rules.json` or rules database

### 4. Deploy
Deploy without code changes:
```bash
# Rules are loaded from JSON at runtime
# No code deployment needed
```

### 5. Monitor
Monitor rule execution and flag production:
- Track false positive rate
- Monitor performance impact
- Adjust thresholds as needed

### 6. Update
Update rule version and redeploy:
```json
{
  "version": "1.1.0",
  "threshold": 15,  // Changed from 10
  "updated_at": "2026-01-17T00:00:00Z"
}
```

---

## Integration with Rules Engine

The rule definition format integrates with the RulesEngineService:

```typescript
// Load rule from JSON
const rule = JSON.parse(ruleJson);

// Validate against schema
validateRuleAgainstSchema(rule);

// Evaluate rule
const results = await rulesEngine.evaluateRule(rule, context);

// Produce flags
if (results) {
  // Flag produced based on output_flag type
  console.log(`Flag: ${rule.output_flag}, Severity: ${rule.severity}`);
}
```

---

## Schema Validation

All rules are validated against `rule.schema.json` which enforces:

✅ Required fields present  
✅ Field types correct  
✅ Enum values valid  
✅ Relationships between fields valid  
✅ Condition type consistency  
✅ Event type validity  
✅ Semantic versioning format  

---

## Files

| File | Purpose | Status |
|------|---------|--------|
| `rule.schema.json` | JSON Schema for validation | ✅ Complete |
| `example_rules.json` | 15 production-ready examples | ✅ Complete |
| `RULE_DEFINITION_FORMAT_DOCUMENTATION.md` | This documentation | ✅ Complete |

---

## Conclusion

The rule definition format provides a flexible, no-code way to define and deploy rules. Rules are:

✅ **JSON-based** - Human-readable, version-controllable  
✅ **Versioned** - Semantic versioning for evolution  
✅ **No-code** - Edit and deploy without code changes  
✅ **Powerful** - Support for count, unique actor, and sequence detection  
✅ **Validated** - JSON Schema ensures correctness  
✅ **Production-ready** - 15 example rules included  

Ready for immediate use and deployment.
