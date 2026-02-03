# Phase 7 - Day 1: Unit Tests Plan

**Date**: January 29, 2026  
**Phase**: 7.1 - Unit Tests  
**Status**: 🚀 STARTING  
**Tasks**: 5 total  
**Target Coverage**: 90%+

---

## Day 1 Objectives

1. Write comprehensive unit tests for DecisionAuthorityService
2. Write unit tests for all decision sources (Internal, Mock, Custodii)
3. Write unit tests for all controllers (Decision, AuditLog, Health)
4. Achieve 90%+ code coverage
5. Fix any failing tests

---

## Task 7.1.1: Service Unit Tests

### DecisionAuthorityService Tests

**File**: `backend/services/decision-authority-service/src/services/__tests__/DecisionAuthorityService.test.ts`

**Test Cases**:
1. `requestDecision()` - Create new decision
   - Valid request → decision created
   - Invalid assetType → error
   - Missing assetId → error
   - Metadata validation

2. `getDecision()` - Retrieve decision
   - Valid ID → decision returned
   - Invalid ID → not found error
   - Expired decision → handled
   - Cancelled decision → handled

3. `getDecisionByDecisionId()` - Retrieve by source ID
   - Valid source ID → decision returned
   - Invalid source ID → not found error
   - Multiple decisions → first returned

4. `getDecisionsByAsset()` - List decisions for asset
   - Valid asset → decisions returned
   - Invalid asset → empty list
   - Pagination → working
   - Filtering → working

5. `listDecisions()` - List with filters
   - No filters → all decisions
   - Status filter → filtered results
   - Date range filter → filtered results
   - Pagination → working
   - Sorting → working

6. `overrideDecision()` - Admin override
   - Valid override → decision updated
   - Invalid status → error
   - Unauthorized → error
   - Audit log created

**Coverage Target**: 95%+

---

## Task 7.1.2: Decision Source Unit Tests

### InternalDecisionSource Tests

**File**: `backend/services/decision-authority-service/src/sources/__tests__/InternalDecisionSource.test.ts`

**Test Cases**:
1. `requestDecision()` - Auto-approve
   - Returns APPROVED immediately
   - Sets correct timestamp
   - Includes metadata

2. `getDecision()` - Retrieve decision
   - Returns decision by ID
   - Handles not found

### MockDecisionSource Tests

**File**: `backend/services/decision-authority-service/src/sources/__tests__/MockDecisionSource.test.ts`

**Test Cases**:
1. `requestDecision()` - Simulate delay
   - Returns PENDING initially
   - Configurable delay
   - Transitions to APPROVED

2. `getDecision()` - Retrieve decision
   - Returns decision by ID
   - Simulates status transitions

### CustodiiDecisionSource Tests

**File**: `backend/services/decision-authority-service/src/sources/__tests__/CustodiiDecisionSource.test.ts`

**Test Cases**:
1. `requestDecision()` - API call
   - Valid request → decision created
   - API error → handled
   - Network error → handled
   - Retry logic → working

2. `getDecision()` - API call
   - Valid ID → decision returned
   - API error → handled
   - Network error → handled

3. Authentication
   - Bearer token included
   - Token format correct
   - Unauthorized → error

**Coverage Target**: 90%+

---

## Task 7.1.3: Controller Unit Tests

### DecisionController Tests

**File**: `backend/services/decision-authority-service/src/api/controllers/__tests__/DecisionController.test.ts`

**Test Cases**:
1. `POST /api/v1/decisions` - Create decision
   - Valid request → 201 created
   - Invalid request → 400 bad request
   - Missing fields → 400 bad request
   - Error handling → 500 error

2. `GET /api/v1/decisions/:id` - Get decision
   - Valid ID → 200 ok
   - Invalid ID → 404 not found
   - Error handling → 500 error

3. `GET /api/v1/decisions/by-decision-id/:decisionId` - Get by source ID
   - Valid ID → 200 ok
   - Invalid ID → 404 not found

4. `GET /api/v1/decisions/asset/:assetType/:assetId` - Get by asset
   - Valid asset → 200 ok
   - Invalid asset → 404 not found

5. `GET /api/v1/decisions` - List decisions
   - No filters → 200 ok
   - With filters → 200 ok
   - Pagination → working

### AuditLogController Tests

**File**: `backend/services/decision-authority-service/src/api/controllers/__tests__/AuditLogController.test.ts`

**Test Cases**:
1. `GET /api/v1/audit-logs` - List audit logs
   - Valid request → 200 ok
   - Filtering → working
   - Pagination → working

2. `GET /api/v1/audit-logs/:id` - Get audit log
   - Valid ID → 200 ok
   - Invalid ID → 404 not found

### HealthController Tests

**File**: `backend/services/decision-authority-service/src/api/controllers/__tests__/HealthController.test.ts`

**Test Cases**:
1. `GET /health/live` - Liveness probe
   - Always returns 200 ok
   - Returns correct format

2. `GET /health/ready` - Readiness probe
   - Database connected → 200 ok
   - Database disconnected → 503 unavailable
   - Returns correct format

**Coverage Target**: 95%+

---

## Task 7.1.4: Error Handling & Edge Cases

### Error Scenario Tests

**Test Cases**:
1. Database errors
   - Connection timeout
   - Query timeout
   - Constraint violation

2. External API errors
   - Timeout
   - 4xx errors
   - 5xx errors
   - Network errors

3. Validation errors
   - Invalid input
   - Missing required fields
   - Type mismatches

4. Authorization errors
   - Missing token
   - Invalid token
   - Insufficient permissions

5. State transition errors
   - Invalid status transitions
   - Expired decisions
   - Cancelled decisions

**Coverage Target**: 90%+

---

## Task 7.1.5: Coverage Analysis & Fixes

### Coverage Report

**Target**: 90%+ overall coverage

**Breakdown**:
- Services: 95%+
- Controllers: 95%+
- Sources: 90%+
- Utils: 85%+
- Overall: 90%+

### Coverage Tools

```bash
# Run tests with coverage
npm run test:coverage

# Generate HTML report
npm run test:coverage:html

# View coverage report
open coverage/index.html
```

### Fixing Low Coverage

1. Identify uncovered lines
2. Write tests for uncovered code
3. Re-run coverage analysis
4. Verify 90%+ achieved

---

## Test Execution Plan

### Step 1: Setup (30 min)
```bash
cd backend/services/decision-authority-service
npm install
npm run test:setup
```

### Step 2: Write Tests (3 hours)
- DecisionAuthorityService tests
- Decision source tests
- Controller tests
- Error handling tests

### Step 3: Run Tests (30 min)
```bash
npm run test
npm run test:coverage
```

### Step 4: Fix Failures (1 hour)
- Review failing tests
- Fix test issues
- Fix code issues
- Re-run tests

### Step 5: Verify Coverage (30 min)
```bash
npm run test:coverage:report
# Verify 90%+ coverage
```

---

## Test File Structure

```
backend/services/decision-authority-service/
├── src/
│   ├── services/
│   │   ├── DecisionAuthorityService.ts
│   │   ├── AuditLogService.ts
│   │   └── __tests__/
│   │       ├── DecisionAuthorityService.test.ts
│   │       └── AuditLogService.test.ts
│   ├── sources/
│   │   ├── InternalDecisionSource.ts
│   │   ├── MockDecisionSource.ts
│   │   ├── CustodiiDecisionSource.ts
│   │   └── __tests__/
│   │       ├── InternalDecisionSource.test.ts
│   │       ├── MockDecisionSource.test.ts
│   │       └── CustodiiDecisionSource.test.ts
│   ├── api/
│   │   └── controllers/
│   │       ├── DecisionController.ts
│   │       ├── AuditLogController.ts
│   │       ├── HealthController.ts
│   │       └── __tests__/
│   │           ├── DecisionController.test.ts
│   │           ├── AuditLogController.test.ts
│   │           └── HealthController.test.ts
```

---

## Jest Configuration

**File**: `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

---

## Success Criteria

✅ All unit tests written  
✅ All tests passing  
✅ 90%+ code coverage achieved  
✅ No flaky tests  
✅ Error scenarios covered  
✅ Edge cases tested  

---

## Deliverables

1. Unit test files (5+ files)
2. Coverage report (HTML)
3. Test execution log
4. Issues found and fixed
5. Day 1 summary report

---

## Timeline

- 09:00 - Setup & planning (30 min)
- 09:30 - Write service tests (1.5 hours)
- 11:00 - Write source tests (1 hour)
- 12:00 - Lunch break (1 hour)
- 13:00 - Write controller tests (1.5 hours)
- 14:30 - Run tests & fix failures (1 hour)
- 15:30 - Coverage analysis & fixes (1 hour)
- 16:30 - Review & documentation (30 min)

---

## Notes

- Use Jest mocking for external dependencies
- Test both success and failure paths
- Include edge cases and error scenarios
- Aim for 95%+ coverage where possible
- Document any untestable code

---

**Status**: READY TO START  
**Date**: January 29, 2026  
**Next**: Day 2 - Integration Tests

