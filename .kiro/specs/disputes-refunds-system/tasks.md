# Disputes & Refunds System - Implementation Tasks

## Status: 🚧 IN PROGRESS - Phase 1 & 2 Started

---

## Phase 1: Database Foundation

### 1.1 Database Schema
- [ ] Create disputes table migration
- [ ] Create dispute_evidence table migration
- [ ] Add foreign key constraints
- [ ] Create indexes for performance
- [ ] Add check constraints for enums
- [ ] Update Prisma schema with Dispute model
- [ ] Update Prisma schema with DisputeEvidence model
- [ ] Generate Prisma Client

**Files to Create:**
- `backend/services/request-engine/prisma/migrations/003_disputes_system/migration.sql`
- `backend/services/request-engine/prisma/schema.prisma` (update)

### 1.2 Type Definitions ✅ COMPLETED
- [x] Create DisputeReason enum
- [x] Create DisputeStatus enum
- [x] Create DisputeResolution enum
- [x] Create DisputeParty enum
- [x] Create EvidenceType enum
- [x] Create Dispute interface
- [x] Create DisputeEvidence interface
- [x] Create DisputeFilters interface
- [x] Create ResolutionResult interface

**Files Created:**
- `backend/services/request-engine/src/types/dispute.types.ts`

### 1.3 Error Classes ✅ COMPLETED
- [x] Create DisputeError base class
- [x] Create DisputeWindowExpiredError
- [x] Create DuplicateDisputeError
- [x] Create InvalidDisputeStatusError
- [x] Create RefundFailedError
- [x] Create InvalidFileTypeError
- [x] Create FileTooLargeError
- [x] Create TooManyFilesError

**Files Created:**
- `backend/services/request-engine/src/errors/DisputeErrors.ts`

---

## Phase 2: File Upload Infrastructure

### 2.1 File Storage Service ✅ COMPLETED
- [x] Create FileStorageService interface
- [x] Implement S3StorageService
- [x] Implement LocalStorageService
- [x] Add file validation utilities
- [x] Add filename sanitization
- [x] Add unique filename generation
- [x] Add file type detection

**Files Created:**
- `backend/services/request-engine/src/services/storage/FileStorageService.ts`
- `backend/services/request-engine/src/services/storage/S3StorageService.ts`
- `backend/services/request-engine/src/services/storage/LocalStorageService.ts`
- `backend/services/request-engine/src/utils/fileValidation.ts`

### 2.2 Multer Configuration
- [ ] Configure multer for memory storage
- [ ] Add file size limits
- [ ] Add file type filtering
- [ ] Add file count limits
- [ ] Create upload middleware

**Files to Create:**
- `backend/services/request-engine/src/middleware/upload.ts`

---

## Phase 3: Core Services

### 3.1 Evidence Service
- [ ] Implement uploadEvidence()
  - [ ] Validate file types and sizes
  - [ ] Generate unique filenames
  - [ ] Upload to storage
  - [ ] Create evidence records
  - [ ] Return evidence URLs
- [ ] Implement getDisputeEvidence()
- [ ] Implement deleteEvidence()
- [ ] Add comprehensive logging

**Files to Create:**
- `backend/services/request-engine/src/services/EvidenceService.ts`

### 3.2 Dispute Service
- [ ] Implement openDispute()
  - [ ] Validate user authentication
  - [ ] Validate request exists and belongs to user
  - [ ] Validate request status is DELIVERED
  - [ ] Validate 48-hour window
  - [ ] Validate no existing dispute
  - [ ] Upload evidence files
  - [ ] Create dispute record
  - [ ] Update request status to DISPUTED
  - [ ] Send webhook to admin
  - [ ] Send notifications
- [ ] Implement getUserDisputes()
- [ ] Implement getDisputeById()
- [ ] Implement addEvidence()
  - [ ] Validate user is party to dispute
  - [ ] Validate dispute status
  - [ ] Validate evidence count limit
  - [ ] Upload files
  - [ ] Create evidence records
  - [ ] Notify other party
- [ ] Implement getAllDisputes() (admin)
- [ ] Implement getDisputeDetailsForAdmin()
- [ ] Implement markUnderReview()
- [ ] Implement getDisputeStats()
- [ ] Add comprehensive logging

**Files to Create:**
- `backend/services/request-engine/src/services/DisputeService.ts`

### 3.3 Resolution Service
- [ ] Implement refundBuyer()
  - [ ] Call Stripe refund API
  - [ ] Credit buyer's wallet
  - [ ] Release escrow hold
  - [ ] Update request status
  - [ ] Update dispute status
  - [ ] Send notifications
- [ ] Implement releaseToSeller()
  - [ ] Release escrow to seller
  - [ ] Credit seller's wallet
  - [ ] Update request status
  - [ ] Update dispute status
  - [ ] Send notifications
- [ ] Implement partialRefund()
  - [ ] Calculate amounts
  - [ ] Call Stripe refund API
  - [ ] Credit buyer's wallet
  - [ ] Release remaining to seller
  - [ ] Update request status
  - [ ] Update dispute status
  - [ ] Send notifications
- [ ] Implement processStripeRefund()
- [ ] Implement creditWallet()
- [ ] Implement releaseEscrow()
- [ ] Add retry logic for failures
- [ ] Add comprehensive logging

**Files to Create:**
- `backend/services/request-engine/src/services/ResolutionService.ts`

---

## Phase 4: API Layer

### 4.1 User Controllers
- [ ] POST /api/requests/:id/dispute
  - [ ] Request validation
  - [ ] Authentication check
  - [ ] File upload handling
  - [ ] Call DisputeService.openDispute()
  - [ ] Error handling
- [ ] GET /api/disputes/my-disputes
  - [ ] Query parameter parsing
  - [ ] Authentication check
  - [ ] Call DisputeService.getUserDisputes()
- [ ] GET /api/disputes/:id
  - [ ] Authentication check
  - [ ] Authorization check
  - [ ] Call DisputeService.getDisputeById()
- [ ] POST /api/disputes/:id/add-evidence
  - [ ] Authentication check
  - [ ] Authorization check
  - [ ] File upload handling
  - [ ] Call DisputeService.addEvidence()

**Files to Create:**
- `backend/services/request-engine/src/controllers/DisputeController.ts`

### 4.2 Admin Controllers
- [ ] GET /api/admin/disputes
  - [ ] Admin authorization check
  - [ ] Query parameter parsing
  - [ ] Call DisputeService.getAllDisputes()
- [ ] GET /api/admin/disputes/:id
  - [ ] Admin authorization check
  - [ ] Call DisputeService.getDisputeDetailsForAdmin()
- [ ] POST /api/admin/disputes/:id/review
  - [ ] Admin authorization check
  - [ ] Call DisputeService.markUnderReview()
- [ ] POST /api/admin/disputes/:id/resolve
  - [ ] Admin authorization check
  - [ ] Request validation
  - [ ] Call ResolutionService based on resolution type
  - [ ] Error handling
- [ ] GET /api/admin/disputes/stats
  - [ ] Admin authorization check
  - [ ] Call DisputeService.getDisputeStats()

**Files to Create:**
- `backend/services/request-engine/src/controllers/AdminDisputeController.ts`

### 4.3 Routes
- [ ] Create user dispute routes
- [ ] Create admin dispute routes
- [ ] Apply authentication middleware
- [ ] Apply admin authorization middleware
- [ ] Apply upload middleware
- [ ] Apply rate limiting

**Files to Create:**
- `backend/services/request-engine/src/routes/disputeRoutes.ts`
- `backend/services/request-engine/src/routes/adminDisputeRoutes.ts`

---

## Phase 5: Integration ✅ COMPLETED

### 5.1 Stripe Integration ✅
- [x] Create StripeRefundService
- [x] Implement full refund
- [x] Implement partial refund
- [x] Handle refund webhooks
- [x] Add retry logic
- [x] Add error handling
- [x] Add logging

**Files Created:**
- `backend/services/request-engine/src/services/StripeRefundService.ts`
- `backend/services/request-engine/src/controllers/RefundWebhookController.ts`

### 5.2 Wallet Integration ✅
- [x] Integrate with WalletService for credits (mock)
- [x] Integrate with EscrowService for releases (mock)
- [x] Add transaction metadata
- [x] Handle wallet errors
- [x] Add rollback logic

**Files Updated:**
- `backend/services/request-engine/src/services/ResolutionService.ts`

### 5.3 Notification Integration ✅
- [x] Create dispute notification templates (placeholders)
- [x] Implement notifyDisputeOpened()
- [x] Implement notifyEvidenceAdded()
- [x] Implement notifyDisputeResolved()
- [x] Add email notifications (mock)
- [x] Add in-app notifications (mock)
- [x] Add webhook to admin system

**Files Created:**
- `backend/services/request-engine/src/services/DisputeNotificationService.ts`

**Index File:**
- `backend/services/request-engine/src/services/index.ts`

---

## Phase 6: Testing

### 6.1 Unit Tests
- [ ] DisputeService.openDispute() tests
  - [ ] Success case
  - [ ] Outside 48-hour window
  - [ ] Duplicate dispute
  - [ ] Invalid request status
  - [ ] Invalid file types
  - [ ] File size exceeded
- [ ] DisputeService.addEvidence() tests
  - [ ] Success case
  - [ ] Evidence limit exceeded
  - [ ] Invalid dispute status
- [ ] ResolutionService.refundBuyer() tests
  - [ ] Success case
  - [ ] Stripe refund failure
  - [ ] Wallet credit failure
- [ ] ResolutionService.releaseToSeller() tests
- [ ] ResolutionService.partialRefund() tests
  - [ ] Correct amount calculation
  - [ ] Both parties credited
- [ ] EvidenceService.uploadEvidence() tests
- [ ] File validation tests

**Files to Create:**
- `backend/services/request-engine/src/services/__tests__/DisputeService.test.ts`
- `backend/services/request-engine/src/services/__tests__/ResolutionService.test.ts`
- `backend/services/request-engine/src/services/__tests__/EvidenceService.test.ts`

### 6.2 Integration Tests
- [ ] Complete dispute workflow test
  - [ ] Open dispute → Review → Resolve → Refund
- [ ] Seller wins workflow test
  - [ ] Open dispute → Review → Release to seller
- [ ] Partial refund workflow test
  - [ ] Open dispute → Review → Partial refund → Both credited
- [ ] Evidence upload workflow test
  - [ ] Upload → Store → Retrieve
- [ ] Notification workflow test
  - [ ] All notifications sent correctly

**Files to Create:**
- `backend/services/request-engine/src/services/__tests__/dispute-workflow.integration.test.ts`

---

## Phase 7: Admin Dashboard (Frontend)

### 7.1 Type Definitions
- [ ] Create frontend Dispute types
- [ ] Create frontend DisputeEvidence types
- [ ] Create frontend DisputeFilters types
- [ ] Create frontend DisputeStats types

**Files to Create:**
- `frontend/web-app/src/types/dispute.types.ts`

### 7.2 API Client
- [ ] Create DisputeAPI client
- [ ] Implement getAllDisputes()
- [ ] Implement getDisputeDetails()
- [ ] Implement markUnderReview()
- [ ] Implement resolveDispute()
- [ ] Implement getDisputeStats()
- [ ] Add error handling

**Files to Create:**
- `frontend/web-app/src/api/disputeApi.ts`

### 7.3 React Query Hooks
- [ ] Create useDisputes() hook
- [ ] Create useDisputeDetails() hook
- [ ] Create useDisputeStats() hook
- [ ] Create useMarkUnderReview() mutation
- [ ] Create useResolveDispute() mutation
- [ ] Configure cache invalidation

**Files to Create:**
- `frontend/web-app/src/hooks/useDisputes.ts`

### 7.4 Components
- [ ] Create DisputeDashboard component
- [ ] Create DisputeStatsCards component
- [ ] Create DisputeFiltersBar component
- [ ] Create DisputeTable component
- [ ] Create DisputeDetailsModal component
- [ ] Create EvidenceGallery component
- [ ] Create ResolutionForm component
- [ ] Add responsive design
- [ ] Add loading states
- [ ] Add error handling

**Files to Create:**
- `frontend/web-app/src/components/admin/DisputeDashboard.tsx`
- `frontend/web-app/src/components/admin/DisputeStatsCards.tsx`
- `frontend/web-app/src/components/admin/DisputeFiltersBar.tsx`
- `frontend/web-app/src/components/admin/DisputeTable.tsx`
- `frontend/web-app/src/components/admin/DisputeDetailsModal.tsx`
- `frontend/web-app/src/components/admin/EvidenceGallery.tsx`
- `frontend/web-app/src/components/admin/ResolutionForm.tsx`

### 7.5 Page Integration
- [ ] Create admin disputes page
- [ ] Add to admin navigation
- [ ] Add route protection

**Files to Create:**
- `frontend/web-app/src/app/admin/disputes/page.tsx`

---

## Phase 8: User Portal (Frontend)

### 8.1 Components
- [ ] Create OpenDisputeForm component
- [ ] Create MyDisputesList component
- [ ] Create DisputeDetailsView component
- [ ] Create AddEvidenceForm component
- [ ] Create DisputeTimeline component
- [ ] Add file upload with preview
- [ ] Add drag-and-drop support
- [ ] Add responsive design

**Files to Create:**
- `frontend/web-app/src/components/disputes/OpenDisputeForm.tsx`
- `frontend/web-app/src/components/disputes/MyDisputesList.tsx`
- `frontend/web-app/src/components/disputes/DisputeDetailsView.tsx`
- `frontend/web-app/src/components/disputes/AddEvidenceForm.tsx`
- `frontend/web-app/src/components/disputes/DisputeTimeline.tsx`

### 8.2 Page Integration
- [ ] Create user disputes page
- [ ] Add to user navigation
- [ ] Add route protection

**Files to Create:**
- `frontend/web-app/src/app/disputes/page.tsx`
- `frontend/web-app/src/app/disputes/[id]/page.tsx`

---

## Phase 9: Documentation

### 9.1 API Documentation
- [ ] Document all endpoints
- [ ] Document request/response formats
- [ ] Document error codes
- [ ] Document file upload requirements
- [ ] Document webhook payloads

**Files to Create:**
- `backend/services/request-engine/DISPUTE_SYSTEM_DOCUMENTATION.md`

### 9.2 Deployment Guide
- [ ] Environment variables
- [ ] Database setup
- [ ] Migration steps
- [ ] S3 configuration
- [ ] Testing instructions

**Files to Create:**
- `backend/services/request-engine/DISPUTE_SYSTEM_DEPLOYMENT.md`

### 9.3 User Guide
- [ ] How to open a dispute
- [ ] How to add evidence
- [ ] What to expect during review
- [ ] Resolution outcomes

**Files to Create:**
- `docs/user-guides/DISPUTE_GUIDE.md`

---

## Phase 10: Deployment & Monitoring

### 10.1 Environment Setup
- [ ] Create .env.example
- [ ] Configure S3 bucket
- [ ] Configure Stripe webhooks
- [ ] Set up file upload limits
- [ ] Configure CORS for file uploads

### 10.2 Database Migration
- [ ] Run migrations in staging
- [ ] Verify schema changes
- [ ] Run migrations in production
- [ ] Verify data integrity

### 10.3 Monitoring
- [ ] Add dispute metrics to dashboard
- [ ] Set up alerts for failed refunds
- [ ] Set up alerts for high dispute rate
- [ ] Monitor file upload failures
- [ ] Monitor Stripe webhook failures

---

## Summary

### Total Tasks: ~150+

#### Backend (90+ tasks)
- Database: 8 tasks
- Types: 9 tasks
- Errors: 8 tasks
- File Storage: 8 tasks
- Services: 30+ tasks
- Controllers: 10 tasks
- Routes: 6 tasks
- Integration: 15 tasks
- Testing: 15+ tasks

#### Frontend (40+ tasks)
- Types: 4 tasks
- API Client: 7 tasks
- Hooks: 5 tasks
- Admin Components: 7 tasks
- User Components: 5 tasks
- Pages: 3 tasks

#### Documentation & Deployment (20+ tasks)
- Documentation: 4 tasks
- Deployment: 3 tasks
- Monitoring: 3 tasks

---

**Last Updated:** January 24, 2026
**Status:** 📋 READY FOR IMPLEMENTATION
