# Trust Score Calculator - Formula Documentation

## Overview

The Trust Score Calculator provides a **READ ONLY** scoring system that evaluates subject trustworthiness based on TrustCase history and appeal outcomes. The score is **NON-BINDING** and **NOT USED IN PAYMENTS** - it serves purely as an informational metric.

## Score Range

| Score Range | Category | Description |
|-------------|----------|-------------|
| 80-100 | EXCELLENT | Outstanding trust record |
| 60-79 | GOOD | Strong trust record |
| 40-59 | FAIR | Moderate trust record |
| 20-39 | POOR | Concerning trust record |
| 0-19 | CRITICAL | Serious trust issues |

## Formula Components

### 1. Base Score Calculation

```
Base Score = 100 - Σ(Case Status Penalties)
```

**Case Status Penalties:**
- OPEN: -15 points
- UNDER_REVIEW: -10 points  
- RESOLVED: -5 points
- DISMISSED: -3 points

### 2. Severity Penalty

```
Severity Penalty = Σ(Severity Weights)
```

**Severity Weights:**
- CRITICAL: 40 points
- HIGH: 25 points
- MEDIUM: 15 points
- LOW: 5 points

### 3. Appeal Adjustment

```
Appeal Adjustment = Σ(Appeal Impact Weights)
```

**Appeal Impact Weights:**
- ACCEPTED: -10 points (positive impact)
- REJECTED: +5 points (negative impact)
- UNDER_REVIEW: 0 points (neutral impact)

### 4. Time Decay Factor

```
Time Decay Factor = e^(-λ × min(age, maxAge))
```

**Parameters:**
- λ (lambda) = 0.0076 (decay rate)
- maxAge = 365 days (maximum age considered)
- age = days since most recent case

### 5. Final Score Calculation

```
Final Score = max(0, min(100, (Base Score - Severity Penalty + Appeal Adjustment) × Time Decay Factor))
```

## Calculation Example

### Subject with following history:
- 2 OPEN cases (1 CRITICAL, 1 HIGH)
- 1 RESOLVED case (MEDIUM)
- 1 DISMISSED case (LOW)
- 1 ACCEPTED appeal
- Most recent case: 30 days ago

**Step 1: Base Score**
```
Base Score = 100 - (15 + 15 + 5 + 3) = 62
```

**Step 2: Severity Penalty**
```
Severity Penalty = 40 (CRITICAL) + 25 (HIGH) + 15 (MEDIUM) + 5 (LOW) = 85
```

**Step 3: Appeal Adjustment**
```
Appeal Adjustment = -10 (ACCEPTED) = -10
```

**Step 4: Time Decay**
```
Time Decay Factor = e^(-0.0076 × 30) = e^(-0.228) = 0.796
```

**Step 5: Final Score**
```
Final Score = (62 - 85 - 10) × 0.796 = (-33) × 0.796 = -26.27
Final Score = max(0, -26.27) = 0
```

**Result: CRITICAL (0-19 range)**

## Configuration Parameters

### Default Configuration

```typescript
{
  severityWeights: {
    CRITICAL: 40,
    HIGH: 25,
    MEDIUM: 15,
    LOW: 5
  },
  appealImpactWeights: {
    ACCEPTED: -10,
    REJECTED: 5,
    UNDER_REVIEW: 0
  },
  timeDecayConfig: {
    halfLife: 90,    // 90 days half-life
    decayRate: 0.0076, // ln(0.5) / 90 days
    maxAge: 365     // Maximum age considered (1 year)
  },
  scoreRanges: {
    excellent: { min: 80, max: 100 },
    good: { min: 60, max: 79 },
    fair: { min: 40, max: 59 },
    poor: { min: 20, max: 39 },
    critical: { min: 0, max: 19 }
  }
}
```

## Business Rules

### ✅ READ ONLY
- Score calculation never modifies any data
- Score is purely informational
- No automatic actions triggered by score
- Score changes are logged for audit purposes

### ✅ NON-BINDING
- Score does not affect payment processing
- Score does not trigger account restrictions
- Score does not automatically suspend/block users
- Score is for informational purposes only

### ✅ NOT USED IN PAYMENTS
- Payment systems completely isolated from trust scoring
- No payment decisions based on trust score
- Financial systems cannot access trust score data
- Complete separation of concerns

## Input Validation

### Required Fields
- `subject_id`: UUID of the subject
- `subject_type`: USER/TRAVELER/SELLER/AUCTION
- `trust_cases`: Array of trust case objects
- `calculation_date`: Date of score calculation (defaults to now)

### Trust Case Object Structure
```typescript
{
  case_id: string,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED',
  created_at: Date,
  resolved_at: Date | null,
  appeals?: Array<{
    appeal_id: string,
    status: 'OPEN' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED',
    reviewed_at: Date | null,
    reviewed_by: string | null
  }>
}
```

## Output Structure

### Trust Score Result
```typescript
{
  subject_id: string,
  subject_type: string,
  trust_score: number,           // 0-100, rounded to 2 decimal places
  score_category: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL',
  score_breakdown: {
    base_score: number,
    severity_penalty: number,
    appeal_adjustment: number,
    time_decay_factor: number,
    final_score: number
  },
  calculation_details: {
    total_cases: number,
    open_cases: number,
    resolved_cases: number,
    dismissed_cases: number,
    appeals_count: number,
    accepted_appeals: number,
    rejected_appeals: number,
    oldest_case_age_days: number,
    newest_case_age_days: number,
    calculation_date: Date,
    config_used: Configuration
  },
  metadata: {
    read_only: true,
    non_binding: true,
    not_used_in_payments: true,
    last_updated: Date
  }
}
```

## Implementation Notes

### Performance Considerations
- Score calculation is O(n) where n = number of trust cases
- Time decay uses exponential function for smooth decay
- All calculations are in-memory, no database operations during scoring
- Results can be cached for frequently accessed subjects

### Security Considerations
- All inputs validated using Zod schemas
- No database writes during score calculation
- Read-only access to trust case data
- Audit logging for all score calculations

### Data Privacy
- Scores are calculated from existing trust case data
- No personal data stored beyond what's already in trust cases
- Score calculations are deterministic and reproducible
- All score calculations are logged for audit purposes

## Usage Examples

### Calculate Single Subject Score
```typescript
const calculator = new TrustScoreCalculator();
const score = await calculator.calculateTrustScore({
  subject_id: 'user-123',
  subject_type: 'USER',
  trust_cases: [...],
  calculation_date: new Date()
});
```

### Batch Score Calculation
```typescript
const scores = await calculator.getBatchTrustScores([
  { subject_id: 'user-123', subject_type: 'USER' },
  { subject_id: 'seller-456', subject_type: 'SELLER' }
]);
```

### Get Score Statistics
```typescript
const stats = await calculator.getTrustScoreStatistics('USER', {
  score_range: 'POOR',
  date_range: { start: new Date('2025-01-01'), end: new Date('2025-01-31') }
});
```

## Important Reminders

⚠️ **CRITICAL**: This trust score system is **READ ONLY** and **NON-BINDING**:
- Never use scores to automatically restrict users
- Never use scores in payment processing decisions
- Never use scores to automatically suspend/block accounts
- Scores are purely informational for administrative review

⚠️ **CRITICAL**: Complete separation from financial systems:
- Payment processors cannot access trust scores
- Trust scores cannot trigger financial actions
- Financial decisions cannot use trust score data
- Maintain complete data isolation

The Trust Score Calculator is designed to provide valuable insights while maintaining strict boundaries around its usage and impact.
