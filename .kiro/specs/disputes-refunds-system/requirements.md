# Disputes & Refunds System - Requirements

## Feature Overview

A comprehensive dispute resolution and refund management system that allows buyers and sellers to resolve issues with delivered requests. The system provides a structured workflow for opening disputes, submitting evidence, admin review, and automated refund processing.

## User Stories

### As a Buyer

**US-1: Open Dispute**
- As a buyer, I want to open a dispute for a delivered request
- So that I can get a refund if the item was not delivered, wrong, or damaged

**US-2: Submit Evidence**
- As a buyer, I want to upload photos and documents as evidence
- So that I can prove my claim

**US-3: Track Dispute Status**
- As a buyer, I want to see the status of my disputes
- So that I know when they will be resolved

**US-4: Receive Refund**
- As a buyer, I want to receive an automatic refund when dispute is resolved in my favor
- So that I get my money back quickly

### As a Seller

**US-5: View Disputes Against Me**
- As a seller, I want to see disputes opened against my deliveries
- So that I can respond and provide my side of the story

**US-6: Submit Counter-Evidence**
- As a seller, I want to upload proof of delivery
- So that I can defend against false claims

**US-7: Receive Payment**
- As a seller, I want to receive payment when dispute is resolved in my favor
- So that I get paid for legitimate deliveries

### As an Administrator

**US-8: Review Disputes**
- As an admin, I want to review all open disputes
- So that I can make fair decisions

**US-9: Resolve Disputes**
- As an admin, I want to resolve disputes with different outcomes
- So that I can handle various scenarios (full refund, partial refund, release to seller)

**US-10: Monitor Dispute Metrics**
- As an admin, I want to see dispute statistics
- So that I can identify problematic users or patterns

## Acceptance Criteria

### 1. Dispute Creation

**AC-1.1: Time Window Validation**
- System MUST allow disputes only within 48 hours of DELIVERED status
- System MUST reject disputes after 48-hour window
- System MUST display clear error message with remaining time

**AC-1.2: Request Status Validation**
- System MUST only allow disputes for requests in DELIVERED status
- System MUST prevent duplicate disputes for same request
- System MUST validate request belongs to user

**AC-1.3: Dispute Reasons**
- System MUST support reason: NOT_DELIVERED
- System MUST support reason: WRONG_ITEM
- System MUST support reason: DAMAGED
- System MUST support reason: OTHER
- System MUST require description for OTHER reason

**AC-1.4: Evidence Upload**
- System MUST allow uploading up to 5 images per dispute
- System MUST support formats: JPG, PNG, PDF
- System MUST limit file size to 5MB per file
- System MUST store evidence URLs in JSON array
- System MUST validate file types and sizes

**AC-1.5: Escrow Hold**
- System MUST prevent escrow release when dispute is opened
- System MUST update request status to DISPUTED
- System MUST lock funds until resolution

### 2. Dispute Status Workflow

**AC-2.1: Status Transitions**
- System MUST follow flow: OPEN → UNDER_REVIEW → RESOLVED → CLOSED
- System MUST allow admin to move from OPEN to UNDER_REVIEW
- System MUST allow admin to move from UNDER_REVIEW to RESOLVED
- System MUST auto-close after 30 days of RESOLVED status

**AC-2.2: Timestamps**
- System MUST record opened_at timestamp
- System MUST record resolved_at timestamp
- System MUST track time in each status

**AC-2.3: Status Notifications**
- System MUST notify both parties when status changes
- System MUST send email notifications
- System MUST send in-app notifications

### 3. Evidence Management

**AC-3.1: Additional Evidence**
- System MUST allow adding evidence after dispute creation
- System MUST allow both buyer and seller to add evidence
- System MUST limit total evidence to 10 files per party
- System MUST timestamp each evidence submission

**AC-3.2: Evidence Display**
- System MUST display all evidence to admin
- System MUST show who submitted each evidence
- System MUST show submission timestamp
- System MUST allow downloading evidence

### 4. Admin Resolution

**AC-4.1: Resolution Options**
- System MUST support resolution: REFUND_BUYER (full refund)
- System MUST support resolution: RELEASE_TO_SELLER (no refund)
- System MUST support resolution: PARTIAL_REFUND (percentage-based)

**AC-4.2: Refund to Buyer Flow**
- System MUST call Stripe refund API
- System MUST credit buyer's wallet
- System MUST update wallet_transactions
- System MUST release escrow hold
- System MUST update request status to REFUNDED
- System MUST notify both parties

**AC-4.3: Release to Seller Flow**
- System MUST release escrow to seller
- System MUST credit seller's wallet
- System MUST update wallet_transactions
- System MUST update request status to COMPLETED
- System MUST notify both parties

**AC-4.4: Partial Refund Flow**
- System MUST calculate refund amount (percentage of total)
- System MUST refund partial amount to buyer via Stripe
- System MUST release remaining amount to seller
- System MUST update both wallets
- System MUST record both transactions
- System MUST notify both parties with amounts

**AC-4.5: Admin Notes**
- System MUST allow admin to add resolution notes
- System MUST store notes with resolution
- System MUST display notes to admin only
- System MUST preserve notes in audit trail

### 5. Webhook Integration

**AC-5.1: Admin Notification**
- System MUST send webhook to admin system when dispute opened
- System MUST include dispute details in webhook
- System MUST include request details in webhook
- System MUST retry webhook on failure (3 attempts)

**AC-5.2: Stripe Webhook**
- System MUST handle refund.succeeded webhook
- System MUST handle refund.failed webhook
- System MUST update dispute status based on webhook
- System MUST log all webhook events

### 6. Notifications

**AC-6.1: Email Notifications**
- System MUST send email when dispute opened (to both parties)
- System MUST send email when evidence added (to other party)
- System MUST send email when dispute resolved (to both parties)
- System MUST include dispute details in emails
- System MUST include resolution details in resolution email

**AC-6.2: In-App Notifications**
- System MUST create in-app notification for all dispute events
- System MUST mark notifications as unread
- System MUST allow marking as read
- System MUST link to dispute details

### 7. Security & Validation

**AC-7.1: Authorization**
- System MUST verify user owns request before opening dispute
- System MUST verify user is party to dispute before viewing
- System MUST require admin role for resolution
- System MUST log all admin actions

**AC-7.2: File Upload Security**
- System MUST validate file types (whitelist)
- System MUST scan files for malware
- System MUST generate unique filenames
- System MUST store files securely (S3 or encrypted local)
- System MUST prevent directory traversal attacks

**AC-7.3: Data Validation**
- System MUST validate all input fields
- System MUST sanitize description text
- System MUST validate refund percentages (0-100)
- System MUST prevent SQL injection
- System MUST prevent XSS attacks

### 8. Refund Integration

**AC-8.1: Stripe Refund**
- System MUST use Stripe refund API
- System MUST handle full refunds
- System MUST handle partial refunds
- System MUST store Stripe refund ID
- System MUST handle refund failures gracefully

**AC-8.2: Wallet Integration**
- System MUST call WalletService for credits
- System MUST use atomic transactions
- System MUST handle wallet errors
- System MUST rollback on failure

**AC-8.3: Transaction Logging**
- System MUST log all refund transactions
- System MUST log all escrow releases
- System MUST include dispute ID in transaction metadata
- System MUST preserve audit trail

### 9. Admin Dashboard

**AC-9.1: Dispute List**
- System MUST display all disputes
- System MUST support filtering by status
- System MUST support filtering by reason
- System MUST support filtering by date range
- System MUST support search by request ID or user

**AC-9.2: Dispute Details**
- System MUST display request details
- System MUST display buyer and seller information
- System MUST display all evidence with thumbnails
- System MUST display timeline of events
- System MUST display resolution options

**AC-9.3: Statistics**
- System MUST show total disputes count
- System MUST show disputes by status
- System MUST show disputes by reason
- System MUST show average resolution time
- System MUST show refund rate

### 10. Performance Requirements

**AC-10.1: Response Times**
- Dispute creation MUST complete within 3 seconds
- Evidence upload MUST complete within 5 seconds per file
- Admin dashboard MUST load within 2 seconds
- Resolution MUST complete within 5 seconds

**AC-10.2: File Upload**
- System MUST support concurrent uploads
- System MUST show upload progress
- System MUST handle upload failures gracefully
- System MUST resume failed uploads

### 11. Error Handling

**AC-11.1: User-Friendly Errors**
- System MUST return clear error messages
- System MUST return appropriate HTTP status codes
- System MUST not expose sensitive information
- System MUST log detailed errors for debugging

**AC-11.2: Refund Failures**
- System MUST handle Stripe API failures
- System MUST retry failed refunds (3 attempts)
- System MUST notify admin of failed refunds
- System MUST allow manual retry

## Non-Functional Requirements

### NFR-1: Availability
- System MUST have 99.9% uptime
- System MUST handle graceful degradation

### NFR-2: Data Integrity
- System MUST ensure atomic refund operations
- System MUST prevent double refunds
- System MUST maintain accurate audit trail

### NFR-3: Compliance
- System MUST support regulatory audit requirements
- System MUST retain dispute records for 7 years
- System MUST support data export for compliance

### NFR-4: Scalability
- System MUST handle 1000+ concurrent disputes
- System MUST support 10,000+ evidence files
- System MUST maintain performance under load

## Out of Scope

- Automated dispute resolution (AI-based)
- Buyer-seller direct messaging
- Dispute escalation to external arbitration
- Multi-currency refunds (future enhancement)
- Chargeback handling (separate system)

## Dependencies

### Backend Dependencies
- PostgreSQL database
- Prisma ORM
- Express.js
- Stripe API
- AWS S3 (or local file storage)
- Multer for file uploads
- Sharp for image processing

### Service Dependencies
- Request Engine (for request status)
- Payment Service (for Stripe refunds)
- Internal Ledger Service (for wallet operations)
- Notification Service (for emails and in-app)

## Assumptions

1. Requests have payment_intent_id stored
2. Escrow system is already implemented
3. Wallet system is operational
4. Notification service is available
5. Admin users have proper authentication

## Risks and Mitigations

### Risk 1: Fraudulent Disputes
**Mitigation:** Track dispute patterns, implement rate limiting, require evidence, admin review

### Risk 2: Refund Failures
**Mitigation:** Retry logic, manual fallback, admin notifications, transaction logging

### Risk 3: File Upload Abuse
**Mitigation:** File size limits, type validation, malware scanning, rate limiting

### Risk 4: Escrow Race Conditions
**Mitigation:** Database transactions, row-level locking, optimistic locking

## Success Metrics

- 95% of disputes resolved within 48 hours
- <5% refund failure rate
- 100% audit trail completeness
- <1% fraudulent dispute rate
- 90% user satisfaction with resolution

---

**Document Version:** 1.0.0
**Last Updated:** January 24, 2026
**Status:** Draft
