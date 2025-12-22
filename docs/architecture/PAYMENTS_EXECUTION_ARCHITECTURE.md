# Payments Execution Architecture

## ⚠️ REGULATORY PREREQUISITE

**THIS ARCHITECTURE IS DESIGN-ONLY UNTIL:**
- Banking license approved, OR
- Regulated payment partner agreement signed

**DO NOT IMPLEMENT EXECUTION CODE WITHOUT LEGAL APPROVAL**

---

## System Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PAYMENTS EXECUTION SYSTEM                                   │
│                         (REQUIRES LICENSE/PARTNER APPROVAL)                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │                           LAYER 0: KILL SWITCHES                                 │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │    │
│  │  │ EMERGENCY_DISABLE│  │ EXECUTION_FREEZE │  │ CORRIDOR_SUSPEND │               │    │
│  │  │     ALL          │  │                  │  │                  │               │    │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘               │    │
│  │           │                     │                     │                          │    │
│  │           └─────────────────────┴─────────────────────┘                          │    │
│  │                                 │                                                 │    │
│  │                    ┌────────────▼────────────┐                                   │    │
│  │                    │   GLOBAL GATE CHECK     │                                   │    │
│  │                    │  (All execution stops   │                                   │    │
│  │                    │   if ANY switch ON)     │                                   │    │
│  │                    └────────────┬────────────┘                                   │    │
│  └─────────────────────────────────┼────────────────────────────────────────────────┘    │
│                                    │                                                     │
│  ┌─────────────────────────────────▼────────────────────────────────────────────────┐   │
│  │                        LAYER 1: LICENSE VERIFICATION                              │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  LICENSE_VERIFIED = false (DEFAULT)                                       │    │   │
│  │  │  PARTNER_AGREEMENT_ACTIVE = false (DEFAULT)                               │    │   │
│  │  │  REGULATORY_APPROVAL_DATE = null                                          │    │   │
│  │  │                                                                            │    │   │
│  │  │  ⛔ ALL EXECUTION CODE BLOCKED UNTIL THESE ARE TRUE                       │    │   │
│  │  └──────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────┬────────────────────────────────────────────────┘   │
│                                    │                                                     │
│  ┌─────────────────────────────────▼────────────────────────────────────────────────┐   │
│  │                        LAYER 2: ADVISORY SYSTEM (EXISTING)                        │   │
│  │                                                                                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │  Payment    │  │    FX       │  │    Fee      │  │  Compliance │              │   │
│  │  │  Advisory   │  │  Advisory   │  │  Advisory   │  │  Advisory   │              │   │
│  │  │  (READ)     │  │  (READ)     │  │  (READ)     │  │  (READ)     │              │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │   │
│  │         │                │                │                │                      │   │
│  │         └────────────────┴────────────────┴────────────────┘                      │   │
│  │                                    │                                              │   │
│  │                    ┌───────────────▼───────────────┐                              │   │
│  │                    │    ADVISORY OUTPUT            │                              │   │
│  │                    │    (Deterministic, Audited)   │                              │   │
│  │                    └───────────────┬───────────────┘                              │   │
│  └────────────────────────────────────┼──────────────────────────────────────────────┘   │
│                                       │                                                  │
│  ┌────────────────────────────────────▼──────────────────────────────────────────────┐  │
│  │                    LAYER 3: HUMAN CONFIRMATION GATE                                │  │
│  │                                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐    │  │
│  │  │                    MANDATORY CONFIRMATION STEPS                           │    │  │
│  │  │                                                                            │    │  │
│  │  │  1. User reviews advisory output                                          │    │  │
│  │  │  2. User explicitly confirms amount, recipient, fees                      │    │  │
│  │  │  3. User enters 2FA/PIN                                                   │    │  │
│  │  │  4. System generates CONFIRMATION_TOKEN (expires 5 min)                   │    │  │
│  │  │  5. User clicks final "Execute Payment" button                            │    │  │
│  │  │                                                                            │    │  │
│  │  │  ⚠️ NO EXECUTION WITHOUT ALL 5 STEPS COMPLETED                           │    │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘    │  │
│  └────────────────────────────────────┬──────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼──────────────────────────────────────────────┐  │
│  │                    LAYER 4: EXECUTION BOUNDARY                                     │  │
│  │                    ⛔ FORBIDDEN PRE-LICENSE ⛔                                     │  │
│  │                                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         EXECUTION CONTROLLER                                 │ │  │
│  │  │                                                                              │ │  │
│  │  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │ │  │
│  │  │  │  Validate   │───▶│   Create    │───▶│   Submit    │───▶│   Confirm   │  │ │  │
│  │  │  │  Request    │    │   Escrow    │    │   to PSP    │    │   Receipt   │  │ │  │
│  │  │  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │ │  │
│  │  │         │                  │                  │                  │          │ │  │
│  │  │         ▼                  ▼                  ▼                  ▼          │ │  │
│  │  │  ┌─────────────────────────────────────────────────────────────────────┐   │ │  │
│  │  │  │                    IMMUTABLE AUDIT LEDGER                            │   │ │  │
│  │  │  │  (Every state change logged with hash chain)                         │   │ │  │
│  │  │  └─────────────────────────────────────────────────────────────────────┘   │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────┬──────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼──────────────────────────────────────────────┐  │
│  │                    LAYER 5: ESCROW MANAGEMENT                                      │  │
│  │                    ⛔ FORBIDDEN PRE-LICENSE ⛔                                     │  │
│  │                                                                                    │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │                         ESCROW STATE MACHINE                               │   │  │
│  │  │                                                                            │   │  │
│  │  │   CREATED ──▶ FUNDED ──▶ LOCKED ──▶ RELEASED ──▶ SETTLED                  │   │  │
│  │  │      │           │          │           │            │                     │   │  │
│  │  │      ▼           ▼          ▼           ▼            ▼                     │   │  │
│  │  │   CANCELLED  REFUNDED   DISPUTED   PARTIAL     COMPLETED                   │   │  │
│  │  │                                                                            │   │  │
│  │  │   Release Conditions (ALL must be true):                                   │   │  │
│  │  │   ✓ Delivery confirmed by buyer                                           │   │  │
│  │  │   ✓ No active disputes                                                     │   │  │
│  │  │   ✓ Cooling period elapsed (24-72h based on amount)                       │   │  │
│  │  │   ✓ Human approval for amounts > $500                                      │   │  │
│  │  │   ✓ Kill switches not active                                               │   │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────┬──────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼──────────────────────────────────────────────┐  │
│  │                    LAYER 6: PSP INTEGRATION                                        │  │
│  │                    ⛔ FORBIDDEN PRE-LICENSE ⛔                                     │  │
│  │                                                                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │   Stripe    │  │   Paymob    │  │   PayPal    │  │   Bank API  │              │  │
│  │  │  Connector  │  │  Connector  │  │  Connector  │  │  Connector  │              │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │  │
│  │         │                │                │                │                      │  │
│  │         └────────────────┴────────────────┴────────────────┘                      │  │
│  │                                    │                                              │  │
│  │                    ┌───────────────▼───────────────┐                              │  │
│  │                    │   PSP ABSTRACTION LAYER       │                              │  │
│  │                    │   (Unified interface)         │                              │  │
│  │                    └───────────────────────────────┘                              │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                    LAYER 7: RECONCILIATION                                         │  │
│  │                    ⛔ FORBIDDEN PRE-LICENSE ⛔                                     │  │
│  │                                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │  Daily Reconciliation:                                                       │ │  │
│  │  │  1. Compare internal ledger vs PSP statements                               │ │  │
│  │  │  2. Flag discrepancies > $0.01                                              │ │  │
│  │  │  3. Auto-pause execution if discrepancy > $100                              │ │  │
│  │  │  4. Human review required for all discrepancies                             │ │  │
│  │  │  5. Generate compliance reports                                              │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Execution Control Layers

### Layer 0: Kill Switches

```typescript
// ALWAYS ACTIVE - Even pre-license
interface KillSwitches {
  EMERGENCY_DISABLE_ALL: boolean;      // Stops everything
  EXECUTION_FREEZE: boolean;           // Stops only execution
  CORRIDOR_SUSPEND: Map<string, boolean>; // Per-corridor freeze
  ESCROW_RELEASE_HALT: boolean;        // Stops all releases
  PSP_DISCONNECT: Map<string, boolean>; // Per-PSP disconnect
}

// Kill switch check - runs BEFORE any execution
function checkKillSwitches(): ExecutionGate {
  if (EMERGENCY_DISABLE_ALL) return { allowed: false, reason: 'EMERGENCY' };
  if (EXECUTION_FREEZE) return { allowed: false, reason: 'FROZEN' };
  // ... more checks
  return { allowed: true };
}
```

### Layer 1: License Verification

```typescript
// ⛔ FORBIDDEN: Do not set these to true without legal approval
interface LicenseGate {
  LICENSE_VERIFIED: false;           // DEFAULT: false
  PARTNER_AGREEMENT_ACTIVE: false;   // DEFAULT: false
  REGULATORY_APPROVAL_DATE: null;    // DEFAULT: null
  APPROVED_CORRIDORS: [];            // DEFAULT: empty
  APPROVED_CURRENCIES: [];           // DEFAULT: empty
  MAX_TRANSACTION_LIMIT: 0;          // DEFAULT: 0
}

// This function MUST return false until license approved
function isExecutionLicensed(): boolean {
  return LICENSE_VERIFIED && PARTNER_AGREEMENT_ACTIVE;
}
```

### Layer 2: Advisory System (Existing - No Changes)

The existing advisory system remains unchanged:
- `payment-advisory.service.ts` - READ-ONLY
- `payment-advisory.routes.ts` - READ-ONLY
- All deterministic, all audited

### Layer 3: Human Confirmation Gate

```typescript
interface ConfirmationRequirements {
  // ALL must be true for execution to proceed
  userReviewedAdvisory: boolean;
  userConfirmedDetails: boolean;
  twoFactorVerified: boolean;
  confirmationTokenValid: boolean;
  finalButtonClicked: boolean;
  
  // Token expires in 5 minutes
  tokenExpiresAt: Date;
  
  // Confirmation must match advisory exactly
  confirmedAmount: number;
  confirmedCurrency: string;
  confirmedRecipient: string;
  confirmedFees: number;
}

// ⛔ FORBIDDEN PRE-LICENSE
function validateConfirmation(req: ConfirmationRequirements): boolean {
  throw new Error('EXECUTION_NOT_LICENSED');
}
```

### Layer 4: Execution Boundary

```typescript
// ⛔ FORBIDDEN PRE-LICENSE - This entire module
interface ExecutionRequest {
  advisoryId: string;           // Links to advisory output
  confirmationToken: string;    // From human confirmation
  userId: string;
  amount: number;
  currency: string;
  recipientId: string;
  paymentMethod: PaymentMethod;
}

interface ExecutionResult {
  executionId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  escrowId: string;
  pspReference: string;
  auditHash: string;
  timestamp: Date;
}

// ⛔ FORBIDDEN PRE-LICENSE
class ExecutionController {
  async execute(req: ExecutionRequest): Promise<ExecutionResult> {
    // 1. Check kill switches
    // 2. Verify license
    // 3. Validate confirmation
    // 4. Create escrow
    // 5. Submit to PSP
    // 6. Log to immutable ledger
    // 7. Return result
    throw new Error('EXECUTION_NOT_LICENSED');
  }
}
```

### Layer 5: Escrow Release Controls

```typescript
// ⛔ FORBIDDEN PRE-LICENSE
interface EscrowReleaseConditions {
  deliveryConfirmedByBuyer: boolean;
  noActiveDisputes: boolean;
  coolingPeriodElapsed: boolean;      // 24-72h based on amount
  humanApprovalIfHighValue: boolean;  // Required if > $500
  killSwitchesInactive: boolean;
  
  // Additional safety checks
  recipientKYCVerified: boolean;
  noFraudSignals: boolean;
  withinDailyLimits: boolean;
}

// ⛔ FORBIDDEN PRE-LICENSE
interface EscrowStateMachine {
  states: ['CREATED', 'FUNDED', 'LOCKED', 'RELEASED', 'SETTLED', 
           'CANCELLED', 'REFUNDED', 'DISPUTED', 'PARTIAL', 'COMPLETED'];
  
  transitions: {
    CREATED: ['FUNDED', 'CANCELLED'];
    FUNDED: ['LOCKED', 'REFUNDED'];
    LOCKED: ['RELEASED', 'DISPUTED', 'REFUNDED'];
    RELEASED: ['SETTLED', 'PARTIAL'];
    DISPUTED: ['REFUNDED', 'RELEASED'];  // After resolution
    // ... etc
  };
}

// Cooling periods by amount
const COOLING_PERIODS = {
  UNDER_100: 24 * 60 * 60 * 1000,    // 24 hours
  UNDER_500: 48 * 60 * 60 * 1000,    // 48 hours
  OVER_500: 72 * 60 * 60 * 1000,     // 72 hours + human approval
};
```

### Layer 6: PSP Integration

```typescript
// ⛔ FORBIDDEN PRE-LICENSE
interface PSPConnector {
  name: string;
  enabled: boolean;
  corridors: string[];
  
  // Methods - ALL FORBIDDEN PRE-LICENSE
  createPaymentIntent(req: PaymentRequest): Promise<PaymentIntent>;
  capturePayment(intentId: string): Promise<CaptureResult>;
  refundPayment(paymentId: string, amount: number): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
}

// ⛔ FORBIDDEN PRE-LICENSE
const PSP_CONNECTORS: Record<string, PSPConnector> = {
  stripe: { /* FORBIDDEN */ },
  paymob: { /* FORBIDDEN */ },
  paypal: { /* FORBIDDEN */ },
  bank_api: { /* FORBIDDEN */ },
};
```

### Layer 7: Reconciliation

```typescript
// ⛔ FORBIDDEN PRE-LICENSE
interface ReconciliationJob {
  frequency: 'DAILY';
  
  steps: [
    'FETCH_INTERNAL_LEDGER',
    'FETCH_PSP_STATEMENTS',
    'COMPARE_TRANSACTIONS',
    'FLAG_DISCREPANCIES',
    'GENERATE_REPORT',
    'ALERT_IF_THRESHOLD_EXCEEDED',
  ];
  
  thresholds: {
    flagDiscrepancy: 0.01;        // Flag any difference > $0.01
    pauseExecution: 100;          // Pause if total discrepancy > $100
    requireHumanReview: 0;        // All discrepancies need review
  };
}
```

---

## Failure Modes

### 1. PSP Failure

```
Trigger: PSP returns error or timeout
Response:
  1. Mark transaction as PENDING_RETRY
  2. Log to audit ledger
  3. Retry with exponential backoff (max 3 attempts)
  4. If all retries fail:
     - Mark as FAILED
     - Notify user
     - Trigger manual review
  5. DO NOT release escrow
```

### 2. Escrow Release Failure

```
Trigger: Release conditions not met
Response:
  1. Keep funds in LOCKED state
  2. Log reason for hold
  3. Notify both parties
  4. Escalate to human review after 72h
  5. DO NOT auto-release
```

### 3. Reconciliation Discrepancy

```
Trigger: Internal ledger != PSP statement
Response:
  1. Flag discrepancy immediately
  2. If > $100 total: PAUSE ALL EXECUTION
  3. Generate detailed report
  4. Require human resolution
  5. Resume only after manual approval
```

### 4. Kill Switch Activation

```
Trigger: Any kill switch set to true
Response:
  1. Immediately halt all execution
  2. Keep existing escrows in current state
  3. Log activation reason
  4. Notify ops team
  5. Require manual deactivation
```

### 5. License Expiry

```
Trigger: License or partner agreement expires
Response:
  1. Immediately halt new executions
  2. Complete in-flight transactions
  3. Release escrows per normal flow
  4. Revert to advisory-only mode
  5. Notify legal team
```

---

## Kill-Switch Integration

```typescript
// Feature flags for execution (ALL DEFAULT FALSE)
interface ExecutionFeatureFlags {
  // Master switches
  PAYMENT_EXECUTION_ENABLED: false;     // ⛔ FORBIDDEN PRE-LICENSE
  ESCROW_EXECUTION_ENABLED: false;      // ⛔ FORBIDDEN PRE-LICENSE
  PSP_INTEGRATION_ENABLED: false;       // ⛔ FORBIDDEN PRE-LICENSE
  
  // Kill switches (can be activated anytime)
  EMERGENCY_DISABLE_ALL: false;         // Stops everything
  EXECUTION_FREEZE: false;              // Stops execution only
  ESCROW_RELEASE_HALT: false;           // Stops releases only
  
  // Per-corridor controls
  CORRIDOR_ENABLED: Map<string, false>; // All corridors disabled
  
  // Per-PSP controls
  PSP_ENABLED: Map<string, false>;      // All PSPs disabled
  
  // Limits (all zero until licensed)
  MAX_SINGLE_TRANSACTION: 0;
  MAX_DAILY_VOLUME: 0;
  MAX_ESCROW_HOLD_DAYS: 0;
}

// Kill switch activation flow
async function activateKillSwitch(
  switch: keyof ExecutionFeatureFlags,
  reason: string,
  activatedBy: string
): Promise<void> {
  // 1. Set flag immediately
  await setFeatureFlag(switch, true);
  
  // 2. Log to immutable audit
  await auditLog.write({
    action: 'KILL_SWITCH_ACTIVATED',
    switch,
    reason,
    activatedBy,
    timestamp: new Date(),
  });
  
  // 3. Notify ops team
  await notifyOps({
    type: 'KILL_SWITCH',
    switch,
    reason,
  });
  
  // 4. Execution stops immediately
  // (checked at start of every execution)
}
```

---

## Code Classification

### ✅ ALLOWED NOW (Advisory Only)

```
backend/services/crowdship-service/src/services/payment-advisory.service.ts
backend/services/crowdship-service/src/routes/payment-advisory.routes.ts
backend/services/crowdship-service/src/types/payment-advisory.types.ts
backend/services/crowdship-service/src/config/feature-flags.ts (advisory flags only)
```

### ⛔ FORBIDDEN PRE-LICENSE

```
// DO NOT CREATE THESE FILES UNTIL LICENSED:

backend/services/payment-service/src/services/payment-execution.service.ts
backend/services/payment-service/src/services/escrow-execution.service.ts
backend/services/payment-service/src/services/psp-connector.service.ts
backend/services/payment-service/src/services/reconciliation.service.ts
backend/services/payment-service/src/routes/execution.routes.ts
backend/services/payment-service/src/controllers/execution.controller.ts

// DO NOT ADD THESE FEATURE FLAGS UNTIL LICENSED:

FF_PAYMENT_EXECUTION_ENABLED
FF_ESCROW_EXECUTION_ENABLED
FF_PSP_INTEGRATION_ENABLED
FF_STRIPE_ENABLED
FF_PAYMOB_ENABLED
FF_PAYPAL_ENABLED
```

### ⚠️ STUB ONLY (Can exist but must throw)

```typescript
// These can exist as stubs that throw errors

// payment-execution.service.ts (STUB)
export class PaymentExecutionService {
  async execute(): Promise<never> {
    throw new Error('PAYMENT_EXECUTION_NOT_LICENSED: Requires banking license or regulated partner agreement');
  }
}

// escrow-execution.service.ts (STUB)
export class EscrowExecutionService {
  async release(): Promise<never> {
    throw new Error('ESCROW_EXECUTION_NOT_LICENSED: Requires banking license or regulated partner agreement');
  }
}
```

---

## Transition Checklist (Advisory → Execution)

When license/partner is approved:

```
□ 1. Legal sign-off received
□ 2. Regulatory approval documented
□ 3. Partner agreement signed
□ 4. Compliance audit completed
□ 5. Security audit completed
□ 6. PCI-DSS compliance verified
□ 7. Kill switches tested
□ 8. Reconciliation process tested
□ 9. Failure modes tested
□ 10. Human-in-loop flows tested
□ 11. Audit logging verified
□ 12. Ops team trained
□ 13. Rollback plan documented
□ 14. Feature flags configured
□ 15. Monitoring dashboards ready
□ 16. Alerting configured
□ 17. Staged rollout plan approved
□ 18. First transaction supervised
```

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Advisory System | ✅ ACTIVE | Read-only, deterministic |
| Kill Switches | ✅ ACTIVE | Always available |
| License Gate | ✅ ACTIVE | Blocks all execution |
| Human Confirmation | 📋 DESIGNED | Implement post-license |
| Execution Controller | ⛔ FORBIDDEN | Requires license |
| Escrow Execution | ⛔ FORBIDDEN | Requires license |
| PSP Integration | ⛔ FORBIDDEN | Requires license |
| Reconciliation | ⛔ FORBIDDEN | Requires license |

**Current State: ADVISORY-ONLY**
**Target State: EXECUTION-ENABLED (post-license)**
