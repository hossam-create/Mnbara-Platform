# PHASE 6.3 — Appeals & Review Workflow (Controlled Reversal)

**Status**: ✅ COMPLETE  
**Date**: January 9, 2026  
**Scope**: Formal, auditable appeals workflow for contesting Trust & Safety enforcement actions

---

## EXECUTIVE SUMMARY

Phase 6.3 implements a formal appeals and review workflow that allows users to contest Trust & Safety enforcement actions WITHOUT weakening enforcement, touching balances, or bypassing audit rules.

**Key Principle**: Appeals are REQUESTS only. Decisions are ADMIN/CONTROL CENTER only. Every step is logged and immutable.

---

## CRITICAL RULES (NON-NEGOTIABLE)

### ❌ FORBIDDEN
- Appeals can NEVER auto-reverse enforcement
- Appeals can NEVER modify ledger entries
- Appeals can NEVER release escrow
- Appeals can NEVER be decided by Frontend
- No deletes, no updates to historical actions

### ✅ REQUIRED
- Appeals are REQUESTS only
- Decisions are ADMIN / CONTROL CENTER only
- Every step is logged and immutable
- Enforcement remains authoritative
- Reversals are explicit actions, not edits to original TrustAction

---

## ARCHITECTURE

### Data Models (Append-Only)

#### Appeal
```
id                    INT PRIMARY KEY
trustActionId         INT FK (UNIQUE - one appeal per action)
subjectType           ENUM (USER | WALLET | AUCTION)
subjectId             INT
appealReason          ENUM (INCORRECT_ENFORCEMENT | EVIDENCE_MISUNDERSTOOD | CIRCUMSTANCES_CHANGED | TECHNICAL_ERROR | DISPUTE_RESOLVED | OTHER)
userStatement         TEXT
evidence              JSON (optional)
status                ENUM (PENDING | UNDER_REVIEW | APPROVED | REJECTED)
assignedTo            TEXT (reviewer email)
assignedAt            TIMESTAMP
decidedBy             TEXT (reviewer email)
decidedAt             TIMESTAMP
decision              TEXT (APPROVED | REJECTED)
justification         TEXT
submittedAt           TIMESTAMP
createdAt             TIMESTAMP
```

#### AppealDecisionLog (Audit Trail)
```
id                    INT PRIMARY KEY
appealId              INT FK
action                TEXT (SUBMITTED | ASSIGNED | APPROVED | REJECTED)
metadata              JSON
createdAt             TIMESTAMP
```

### Services

#### AppealTrustActionService
Handles appeal submission and retrieval:
- `submitAppeal()` - User submits appeal (validates TrustAction exists and is ACTIVE)
- `getAppeal()` - Get appeal details
- `getAppealsForUser()` - Get user's appeals
- `getPendingAppeals()` - Get pending appeals (admin)
- `getAppealHistory()` - Get appeal history (admin)
- `verifyEnforcementImmutable()` - Verify enforcement state unchanged

#### AppealReviewService
Handles review and decision:
- `assignReviewer()` - Assign reviewer to appeal
- `approveAppeal()` - Approve appeal and create reversal action (dual approval required)
- `rejectAppeal()` - Reject appeal (enforcement remains active)
- `getAppealTimeline()` - Get full timeline of appeal and related actions

### Controllers

#### AppealTrustActionController
Provides REST endpoints for users and admins:

**User Endpoints**:
- `POST /api/v1/appeals` - Submit appeal
- `GET /api/v1/appeals/:appealId` - Get appeal details
- `GET /api/v1/appeals` - Get user's appeals

**Admin Endpoints**:
- `GET /admin/control-center/appeals/pending` - Get pending appeals
- `GET /admin/control-center/appeals/:appealId` - Get appeal details
- `POST /admin/control-center/appeals/:appealId/assign` - Assign reviewer
- `POST /admin/control-center/appeals/:appealId/approve` - Approve appeal (dual approval)
- `POST /admin/control-center/appeals/:appealId/reject` - Reject appeal
- `GET /admin/control-center/appeals/:appealId/timeline` - Get appeal timeline
- `GET /admin/control-center/appeals` - Get all appeals history

---

## WORKFLOW

### 1. Appeal Submission (User)

```
User submits appeal for TrustAction
  ↓
Validate TrustAction exists and is ACTIVE
  ↓
Check no duplicate appeal exists
  ↓
Create Appeal record (PENDING)
  ↓
Create AppealDecisionLog (SUBMITTED)
  ↓
Return appeal to user
```

**Validations**:
- TrustAction must exist
- TrustAction must be ACTIVE
- No appeal already exists for this TrustAction
- User statement required
- Appeal reason must be valid enum

**Effect**:
- Creates Appeal record ONLY
- NO enforcement change
- NO financial impact
- Immutable audit log created

### 2. Review Assignment (Admin)

```
Admin assigns reviewer to appeal
  ↓
Update Appeal status to UNDER_REVIEW
  ↓
Set assignedTo and assignedAt
  ↓
Create AppealDecisionLog (ASSIGNED)
  ↓
Return updated appeal
```

### 3. Review Decision (Admin)

#### Approval Path (Dual Approval Required)

```
Reviewer 1 initiates approval
  ↓
Reviewer 2 provides second approval
  ↓
Validate dual approval (different reviewers)
  ↓
Update Appeal status to APPROVED
  ↓
Create NEW TrustAction of reversal type
  ↓
Create AppealDecisionLog (APPROVED)
  ↓
Create TrustActionLog for reversal
  ↓
Return appeal and reversal action
```

**Reversal Action Types**:
- FREEZE_WALLET → UNFREEZE_WALLET
- FREEZE_ESCROW_RELEASE → RESTORE_ESCROW_RELEASE
- BLOCK_PAYOUTS → RESTORE_PAYOUTS
- AUCTION_BID_BLOCK → RESTORE_AUCTION_ACCESS
- ACCOUNT_RESTRICTED → RESTORE_ACCOUNT_ACCESS

**Critical**: Original TrustAction remains ACTIVE and immutable. Reversal is explicit new action.

#### Rejection Path

```
Reviewer reviews appeal
  ↓
Decides to reject
  ↓
Update Appeal status to REJECTED
  ↓
Create AppealDecisionLog (REJECTED)
  ↓
Return updated appeal
```

**Effect**: TrustAction remains ACTIVE. Appeal closed permanently.

### 4. Timeline Tracking

```
Timeline includes:
  - Enforcement activation
  - Enforcement logs
  - Appeal submission
  - Appeal assignment
  - Appeal decision logs
  - Reversal action (if approved)
```

All events chronologically ordered and immutable.

---

## SAFETY GUARANTEES

### ✅ GUARANTEE 1: Appeal cannot change enforcement state
- Appeal submission does NOT modify TrustAction
- TrustAction remains ACTIVE throughout appeal process
- Reversal creates NEW action, not edit to original

**Test**: `SAFETY_1: Appeal cannot change enforcement state`

### ✅ GUARANTEE 2: Appeal cannot create ledger entries
- Appeal submission is purely informational
- No wallet ledger entries created
- No financial mutations possible

**Test**: `SAFETY_2: Appeal cannot create ledger entries`

### ✅ GUARANTEE 3: Appeal cannot release escrow
- Appeal submission does NOT release escrow
- Escrow remains locked while enforcement active
- Only explicit reversal action can release escrow

**Test**: `SAFETY_3: Appeal cannot release escrow`

### ✅ GUARANTEE 4: Reversal requires dual approval
- Approval requires two different reviewers
- Same reviewer cannot approve twice
- Dual approval enforced at service level

**Test**: `SAFETY_4: Reversal requires dual approval`

### ✅ GUARANTEE 5: Original TrustAction never modified
- Original TrustAction is immutable
- All fields remain unchanged
- Status remains ACTIVE (unless manually lifted)

**Test**: `SAFETY_5: Original TrustAction never modified`

### ✅ GUARANTEE 6: Duplicate appeals rejected
- Only one appeal per TrustAction allowed
- Duplicate submission rejected with error
- Prevents appeal spam

**Test**: `SAFETY_6: Duplicate appeals rejected`

### ✅ GUARANTEE 7: Frontend cannot trigger resolution
- Approval endpoints are admin-only
- Frontend cannot call approval endpoints
- Appeal status only changes through proper workflow

**Test**: `SAFETY_7: Frontend cannot trigger resolution`

### ✅ GUARANTEE 8: Full timeline tracking
- Every event logged immutably
- Timeline chronologically ordered
- Complete audit trail preserved

**Test**: `SAFETY_8: Full timeline tracking`

---

## API CONTRACTS

### User Endpoints

#### POST /api/v1/appeals
Submit appeal for trust action

**Request**:
```json
{
  "trustActionId": 123,
  "subjectType": "USER",
  "subjectId": 456,
  "appealReason": "INCORRECT_ENFORCEMENT",
  "userStatement": "This enforcement is incorrect because...",
  "evidence": {
    "documentUrl": "https://...",
    "description": "Supporting evidence"
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "appeal": {
    "id": 789,
    "trustActionId": 123,
    "status": "PENDING",
    "submittedAt": "2026-01-09T10:00:00Z",
    "createdAt": "2026-01-09T10:00:00Z"
  },
  "message": "Appeal submitted successfully"
}
```

#### GET /api/v1/appeals/:appealId
Get appeal details (user can see their own appeals)

**Response** (200):
```json
{
  "success": true,
  "appeal": {
    "id": 789,
    "trustActionId": 123,
    "status": "PENDING",
    "appealReason": "INCORRECT_ENFORCEMENT",
    "userStatement": "...",
    "submittedAt": "2026-01-09T10:00:00Z",
    "decisionLogs": [...]
  }
}
```

#### GET /api/v1/appeals
Get user's appeals

**Response** (200):
```json
{
  "success": true,
  "appeals": [...],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

### Admin Endpoints

#### GET /admin/control-center/appeals/pending
Get pending appeals

**Response** (200):
```json
{
  "success": true,
  "appeals": [...],
  "pagination": {
    "total": 12,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### POST /admin/control-center/appeals/:appealId/assign
Assign reviewer

**Request**:
```json
{
  "assignedTo": "reviewer@company.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "appeal": {
    "id": 789,
    "status": "UNDER_REVIEW",
    "assignedTo": "reviewer@company.com",
    "assignedAt": "2026-01-09T10:05:00Z"
  },
  "message": "Reviewer assigned successfully"
}
```

#### POST /admin/control-center/appeals/:appealId/approve
Approve appeal (dual approval required)

**Request**:
```json
{
  "justification": "Evidence supports the appeal. Original enforcement was based on incomplete information.",
  "secondApprovedBy": "reviewer2@company.com"
}
```

**Response** (200):
```json
{
  "success": true,
  "appeal": {
    "id": 789,
    "status": "APPROVED",
    "decidedBy": "reviewer1@company.com",
    "decidedAt": "2026-01-09T10:10:00Z"
  },
  "reversalAction": {
    "id": 999,
    "actionType": "UNFREEZE_WALLET",
    "status": "ACTIVE",
    "metadata": {
      "appealId": 789,
      "originalActionId": 123
    }
  },
  "message": "Appeal approved and reversal action created"
}
```

#### POST /admin/control-center/appeals/:appealId/reject
Reject appeal

**Request**:
```json
{
  "justification": "Appeal does not meet criteria for reversal. Original enforcement remains valid."
}
```

**Response** (200):
```json
{
  "success": true,
  "appeal": {
    "id": 789,
    "status": "REJECTED",
    "decidedBy": "reviewer@company.com",
    "decidedAt": "2026-01-09T10:10:00Z"
  },
  "message": "Appeal rejected"
}
```

#### GET /admin/control-center/appeals/:appealId/timeline
Get appeal timeline

**Response** (200):
```json
{
  "success": true,
  "appealId": 789,
  "timeline": [
    {
      "timestamp": "2026-01-09T09:00:00Z",
      "type": "ENFORCEMENT_ACTIVATED",
      "actionType": "FREEZE_WALLET",
      "severity": "HIGH"
    },
    {
      "timestamp": "2026-01-09T10:00:00Z",
      "type": "APPEAL_SUBMITTED",
      "reason": "INCORRECT_ENFORCEMENT"
    },
    {
      "timestamp": "2026-01-09T10:05:00Z",
      "type": "APPEAL_LOG",
      "action": "ASSIGNED"
    },
    {
      "timestamp": "2026-01-09T10:10:00Z",
      "type": "APPEAL_LOG",
      "action": "APPROVED"
    }
  ],
  "appeal": {...}
}
```

---

## INTEGRATION POINTS

### With TrustAction Service
- Appeals reference TrustAction
- Reversals create new TrustAction
- Original TrustAction never modified

### With Wallet Service
- Wallet checks TrustAction status before operations
- Reversal action updates wallet restrictions
- No direct ledger mutation from appeals

### With Escrow Service
- Escrow checks TrustAction status before release
- Reversal action updates escrow restrictions
- No direct escrow release from appeals

### With Auction Service
- Auction checks TrustAction status before bid acceptance
- Reversal action updates auction restrictions
- No direct bid acceptance from appeals

---

## SAFETY TESTS

### Test Suite: appeal-trust-action-safety-phase-6.3.test.ts

**12 Comprehensive Safety Tests**:

1. ✅ Appeal cannot change enforcement state
2. ✅ Appeal cannot create ledger entries
3. ✅ Appeal cannot release escrow
4. ✅ Reversal requires dual approval
5. ✅ Original TrustAction never modified
6. ✅ Duplicate appeals rejected
7. ✅ Frontend cannot trigger resolution
8. ✅ Full timeline tracking
9. ✅ Appeal immutability after submission
10. ✅ Reversal creates new action, not edit
11. ✅ All actions logged immutably
12. ✅ Rejection keeps enforcement active

**Run Tests**:
```bash
npm test -- appeal-trust-action-safety-phase-6.3.test.ts
```

---

## DEPLOYMENT CHECKLIST

- [x] Appeal and AppealDecisionLog models added to schema
- [x] Prisma migration created (20260109_phase_6_3_appeals)
- [x] AppealTrustActionService implemented (300+ lines)
- [x] AppealReviewService implemented (300+ lines)
- [x] AppealTrustActionController implemented (400+ lines)
- [x] Appeal routes created (user and admin)
- [x] Safety tests implemented (12 tests, 500+ lines)
- [x] Documentation complete

---

## VERIFICATION CHECKLIST

### Data Integrity
- [x] Appeal cannot modify TrustAction
- [x] Appeal cannot create ledger entries
- [x] Appeal cannot release escrow
- [x] Reversal creates new action
- [x] Original action immutable

### Access Control
- [x] User can only see own appeals
- [x] Admin can see all appeals
- [x] Approval endpoints admin-only
- [x] Frontend cannot trigger resolution

### Audit Trail
- [x] All submissions logged
- [x] All assignments logged
- [x] All decisions logged
- [x] Timeline complete and chronological
- [x] No deletes or updates to logs

### Dual Approval
- [x] Approval requires two reviewers
- [x] Same reviewer cannot approve twice
- [x] Rejection does not require dual approval

---

## MONITORING & ALERTS

### Key Metrics
- Appeal submission rate
- Appeal approval rate
- Appeal rejection rate
- Average review time
- Reversal action creation rate

### Alerts
- Unusual appeal spike
- Approval without dual approval (should never happen)
- Appeal without audit log (should never happen)
- TrustAction modified after appeal (should never happen)

---

## FUTURE ENHANCEMENTS

1. **Appeal Evidence Upload**: Allow users to upload supporting documents
2. **Appeal Escalation**: Escalate to higher authority if needed
3. **Appeal Deadline**: Enforce appeal window (e.g., 30 days)
4. **Appeal Notifications**: Notify user of appeal status changes
5. **Appeal Analytics**: Track appeal patterns and outcomes
6. **Appeal Reasoning**: Provide detailed reasoning for decisions

---

## CONCLUSION

Phase 6.3 implements a formal, auditable appeals workflow that:
- ✅ Allows users to contest enforcement
- ✅ Maintains enforcement authority
- ✅ Preserves full audit trail
- ✅ Prevents financial mutations
- ✅ Requires dual approval for reversals
- ✅ Keeps all actions immutable

**Status**: ✅ COMPLETE AND VERIFIED
