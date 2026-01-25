# Manual Payout System - Requirements

## Feature Overview

A secure, admin-approved manual payout system that allows travelers to withdraw funds from their internal wallets. All payouts are processed manually by administrators to ensure security, compliance, and fraud prevention.

## User Stories

### As a Traveler (User)

**US-1: Request Payout**
- As a verified traveler, I want to request a payout from my wallet
- So that I can withdraw my earned funds to my bank account or payment provider

**US-2: View Payout Status**
- As a traveler, I want to view the status of my payout requests
- So that I can track when my funds will be transferred

**US-3: View Payout History**
- As a traveler, I want to see all my past payout requests
- So that I can keep records of my withdrawals

### As an Administrator

**US-4: Review Pending Payouts**
- As an admin, I want to see all pending payout requests
- So that I can review and approve legitimate withdrawals

**US-5: Approve/Reject Payouts**
- As an admin, I want to approve or reject payout requests
- So that I can prevent fraudulent withdrawals and ensure compliance

**US-6: Process Payouts**
- As an admin, I want to mark payouts as processing and completed
- So that I can track the manual transfer workflow

**US-7: View User Details**
- As an admin, I want to see user verification status and wallet history
- So that I can make informed approval decisions

**US-8: Monitor Payout Statistics**
- As an admin, I want to see payout statistics and metrics
- So that I can monitor system health and detect anomalies

## Acceptance Criteria

### 1. Payout Request Creation

**AC-1.1: Minimum Amount Validation**
- System MUST enforce minimum payout amount of $10
- System MUST display clear error message if amount is below minimum

**AC-1.2: Balance Validation**
- System MUST verify user has sufficient available balance
- System MUST prevent payout if balance is insufficient

**AC-1.3: User Verification Requirement**
- System MUST require user to be verified (KYC completed)
- System MUST reject payout requests from unverified users

**AC-1.4: Two-Factor Authentication**
- System MUST require 2FA for payouts over $500
- System MUST validate 2FA token before creating payout

**AC-1.5: Fund Locking**
- System MUST immediately lock funds when payout is requested
- Locked funds MUST NOT be available for other transactions
- System MUST update wallet balances atomically

**AC-1.6: Account Details Encryption**
- System MUST encrypt all account details using AES-256-CBC
- System MUST store encryption key securely in environment variables
- System MUST NOT expose unencrypted account details to users

### 2. Payout Status Workflow

**AC-2.1: Status Transitions**
- System MUST follow status flow: PENDING → APPROVED → PROCESSING → COMPLETED
- System MUST allow rejection from PENDING status only
- System MUST prevent invalid status transitions

**AC-2.2: Timestamps**
- System MUST record timestamp for each status change
- System MUST track which admin performed each action

**AC-2.3: Rejection Handling**
- System MUST unlock funds when payout is rejected
- System MUST require rejection reason from admin
- System MUST notify user of rejection with reason

### 3. Admin Approval Workflow

**AC-3.1: Admin Authorization**
- System MUST verify admin role for all admin endpoints
- System MUST use JWT authentication
- System MUST log all admin actions with admin ID

**AC-3.2: Payout Details Access**
- System MUST decrypt account details for admin view only
- System MUST display user verification status
- System MUST show user wallet transaction history

**AC-3.3: Approval Actions**
- Admin MUST be able to approve pending payouts
- Admin MUST be able to reject pending payouts with reason
- Admin MUST be able to mark approved payouts as processing
- Admin MUST be able to complete processing payouts

**AC-3.4: Notes and Tracking**
- System MUST allow admin to add notes at any stage
- System MUST preserve all notes in audit trail
- System MUST display notes in admin dashboard

### 4. Payment Methods

**AC-4.1: Bank Transfer Support**
- System MUST support bank transfer method
- System MUST collect: account holder name, bank name, account number
- System MUST support optional fields: routing number, IBAN, SWIFT code

**AC-4.2: PayPal Support**
- System MUST support PayPal method
- System MUST collect PayPal email address
- System MUST validate email format

**AC-4.3: Stripe Transfer Support**
- System MUST support Stripe Connect transfers
- System MUST collect Stripe account ID
- System MUST validate account ID format

### 5. Admin Dashboard

**AC-5.1: Payout Table Display**
- Dashboard MUST display all payout requests in table format
- Table MUST show: user info, amount, status, method, date, actions
- Table MUST support sorting by all columns
- Table MUST support pagination

**AC-5.2: Filtering**
- Dashboard MUST support filtering by status
- Dashboard MUST support filtering by payment method
- Dashboard MUST support date range filtering
- Dashboard MUST support amount range filtering
- Dashboard MUST support search by user name or email

**AC-5.3: Statistics Cards**
- Dashboard MUST display pending amount total
- Dashboard MUST display count of approvals today
- Dashboard MUST display count of completions this week
- Dashboard MUST display total processed count

**AC-5.4: Details Modal**
- Dashboard MUST show detailed modal on row click
- Modal MUST display user information and verification status
- Modal MUST display decrypted account details
- Modal MUST display wallet transaction history (last 5)
- Modal MUST show action buttons based on current status

**AC-5.5: Responsive Design**
- Dashboard MUST work on mobile, tablet, and desktop
- Dashboard MUST support RTL layout
- Dashboard MUST be accessible (ARIA labels, keyboard navigation)

### 6. Security Requirements

**AC-6.1: Data Encryption**
- System MUST use AES-256-CBC for account details encryption
- System MUST use unique encryption key per environment
- System MUST never log unencrypted account details

**AC-6.2: Authentication**
- System MUST use JWT tokens for authentication
- System MUST validate token on every request
- System MUST expire tokens after configured duration

**AC-6.3: Authorization**
- System MUST verify user owns wallet before payout request
- System MUST verify admin role before admin actions
- System MUST prevent privilege escalation

**AC-6.4: Audit Trail**
- System MUST log all payout state changes
- System MUST log all admin actions with timestamps
- System MUST preserve audit trail permanently

### 7. Error Handling

**AC-7.1: User-Friendly Errors**
- System MUST return clear error messages for validation failures
- System MUST return appropriate HTTP status codes
- System MUST not expose sensitive information in errors

**AC-7.2: Transaction Safety**
- System MUST use database transactions for fund operations
- System MUST rollback on any error during payout creation
- System MUST prevent race conditions with proper locking

### 8. Performance Requirements

**AC-8.1: Response Times**
- Payout creation MUST complete within 2 seconds
- Admin dashboard load MUST complete within 3 seconds
- Status updates MUST complete within 1 second

**AC-8.2: Scalability**
- System MUST handle 100 concurrent payout requests
- System MUST support 10,000+ payout records
- Dashboard MUST remain responsive with large datasets

### 9. Testing Requirements

**AC-9.1: Unit Tests**
- System MUST have unit tests for all service methods
- Tests MUST cover success and error scenarios
- Tests MUST achieve >80% code coverage

**AC-9.2: Integration Tests**
- System MUST have integration tests for complete workflows
- Tests MUST verify fund locking/unlocking
- Tests MUST verify status transitions
- Tests MUST verify encryption/decryption

## Non-Functional Requirements

### NFR-1: Availability
- System MUST have 99.9% uptime
- System MUST handle graceful degradation

### NFR-2: Data Integrity
- System MUST ensure atomic fund operations
- System MUST prevent double-spending
- System MUST maintain accurate audit trail

### NFR-3: Compliance
- System MUST support regulatory audit requirements
- System MUST retain records for 7 years
- System MUST support data export for compliance

### NFR-4: Maintainability
- Code MUST follow TypeScript best practices
- Code MUST be well-documented
- Code MUST use consistent error handling patterns

## Out of Scope

- Automated payout processing
- Batch payout operations
- Multi-currency support (future enhancement)
- Scheduled payouts
- Webhook notifications to users
- Real-time status updates via WebSocket

## Dependencies

### Backend Dependencies
- PostgreSQL database
- Prisma ORM
- Express.js
- jsonwebtoken for JWT
- crypto for encryption

### Frontend Dependencies
- React + TypeScript
- Next.js
- Tailwind CSS
- React Query (@tanstack/react-query)
- TanStack Table
- Headless UI
- Heroicons
- axios
- date-fns
- react-hot-toast

## Assumptions

1. Users have completed KYC verification before requesting payouts
2. Admins are trained on payout approval process
3. Manual bank transfers are performed outside the system
4. Encryption key is securely managed in production
5. Database backups are configured separately

## Risks and Mitigations

### Risk 1: Encryption Key Compromise
**Mitigation:** Use environment variables, rotate keys periodically, use key management service in production

### Risk 2: Fund Locking Failures
**Mitigation:** Use database transactions, implement retry logic, add monitoring alerts

### Risk 3: Admin Account Compromise
**Mitigation:** Require strong passwords, implement 2FA for admins, log all admin actions

### Risk 4: Race Conditions
**Mitigation:** Use database row-level locking, implement optimistic locking, add transaction isolation

## Success Metrics

- 95% of payouts approved within 24 hours
- 0% fund discrepancies
- <1% rejection rate
- 100% audit trail completeness
- <5 second average admin review time

---

**Document Version:** 1.0.0
**Last Updated:** January 24, 2026
**Status:** Implemented
