# Disputes & Refunds System - Design Document

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
│  - User Portal  │
│  - Admin Panel  │
└────────┬────────┘
         │ HTTPS/REST
         ▼
┌─────────────────┐
│  API Gateway    │
│  - Auth         │
│  - Rate Limit   │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Request Engine Service              │
│  - Dispute Service                   │
│  - Evidence Service                  │
│  - Resolution Service                │
└────────┬─────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Payment     │ │  Internal    │ │  Notification│ │  File        │
│  Service     │ │  Ledger      │ │  Service     │ │  Storage     │
│  (Stripe)    │ │  (Wallets)   │ │  (Email)     │ │  (S3/Local)  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

## Database Design

### Schema: disputes

```sql
CREATE TABLE disputes (
  id VARCHAR(36) PRIMARY KEY,
  request_id INTEGER NOT NULL,
  opened_by VARCHAR(10) NOT NULL, -- 'BUYER' or 'SELLER'
  reason VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  evidence_urls JSON, -- Array of URLs
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  resolution VARCHAR(30),
  resolution_percentage DECIMAL(5,2), -- For PARTIAL_REFUND (0-100)
  admin_notes TEXT,
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  reviewed_by_admin_id INTEGER,
  resolved_by_admin_id INTEGER,
  stripe_refund_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_request FOREIGN KEY (request_id) REFERENCES requests(id),
  CONSTRAINT chk_opened_by CHECK (opened_by IN ('BUYER', 'SELLER')),
  CONSTRAINT chk_reason CHECK (reason IN ('NOT_DELIVERED', 'WRONG_ITEM', 'DAMAGED', 'OTHER')),
  CONSTRAINT chk_status CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED')),
  CONSTRAINT chk_resolution CHECK (resolution IN ('REFUND_BUYER', 'RELEASE_TO_SELLER', 'PARTIAL_REFUND')),
  CONSTRAINT chk_percentage CHECK (resolution_percentage >= 0 AND resolution_percentage <= 100),
  UNIQUE (request_id) -- One dispute per request
);

CREATE INDEX idx_dispute_request_id ON disputes(request_id);
CREATE INDEX idx_dispute_status ON disputes(status);
CREATE INDEX idx_dispute_opened_at ON disputes(opened_at);
CREATE INDEX idx_dispute_opened_by ON disputes(opened_by);
```

### Schema: dispute_evidence

```sql
CREATE TABLE dispute_evidence (
  id SERIAL PRIMARY KEY,
  dispute_id VARCHAR(36) NOT NULL,
  submitted_by VARCHAR(10) NOT NULL, -- 'BUYER' or 'SELLER'
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(10) NOT NULL, -- 'IMAGE' or 'DOCUMENT'
  file_size INTEGER NOT NULL, -- in bytes
  original_filename VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_dispute FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
  CONSTRAINT chk_submitted_by CHECK (submitted_by IN ('BUYER', 'SELLER')),
  CONSTRAINT chk_file_type CHECK (file_type IN ('IMAGE', 'DOCUMENT'))
);

CREATE INDEX idx_evidence_dispute_id ON dispute_evidence(dispute_id);
CREATE INDEX idx_evidence_submitted_by ON dispute_evidence(submitted_by);
```

### Enums

```typescript
enum DisputeReason {
  NOT_DELIVERED = 'NOT_DELIVERED',
  WRONG_ITEM = 'WRONG_ITEM',
  DAMAGED = 'DAMAGED',
  OTHER = 'OTHER'
}

enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

enum DisputeResolution {
  REFUND_BUYER = 'REFUND_BUYER',
  RELEASE_TO_SELLER = 'RELEASE_TO_SELLER',
  PARTIAL_REFUND = 'PARTIAL_REFUND'
}

enum DisputeParty {
  BUYER = 'BUYER',
  SELLER = 'SELLER'
}

enum EvidenceType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT'
}
```

## State Machine

### Dispute Status Flow

```
                    ┌──────┐
                    │ OPEN │
                    └───┬──┘
                        │
                        ▼
                ┌───────────────┐
                │ UNDER_REVIEW  │
                └───────┬───────┘
                        │
                        ▼
                  ┌──────────┐
                  │ RESOLVED │
                  └─────┬────┘
                        │
                        ▼
                   ┌────────┐
                   │ CLOSED │
                   └────────┘
                      (END)
```

### Valid Transitions

| From         | To           | Trigger              | Actor |
|--------------|--------------|----------------------|-------|
| OPEN         | UNDER_REVIEW | Admin starts review  | Admin |
| UNDER_REVIEW | RESOLVED     | Admin resolves       | Admin |
| RESOLVED     | CLOSED       | Auto after 30 days   | System|

## API Design

### User Endpoints

#### POST /api/requests/:id/dispute
Open a new dispute for a request.

**Request:**
```typescript
{
  reason: DisputeReason;
  description: string;
  evidence?: File[]; // Multipart form data
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    id: string;
    requestId: number;
    openedBy: DisputeParty;
    reason: DisputeReason;
    description: string;
    evidenceUrls: string[];
    status: DisputeStatus;
    openedAt: string;
  }
}
```

**Business Logic:**
1. Validate user is authenticated
2. Validate request exists and belongs to user
3. Validate request status is DELIVERED
4. Validate within 48-hour window
5. Validate no existing dispute
6. Validate evidence files (type, size)
7. Upload evidence to storage
8. Create dispute record
9. Update request status to DISPUTED
10. Send webhook to admin
11. Send notifications to both parties
12. Return dispute details

#### GET /api/disputes/my-disputes
Get user's disputes.

**Query Parameters:**
- status?: DisputeStatus
- limit?: number (default: 20)
- offset?: number (default: 0)

**Response:**
```typescript
{
  success: boolean;
  data: Dispute[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  }
}
```

#### GET /api/disputes/:id
Get specific dispute details.

**Response:**
```typescript
{
  success: boolean;
  data: {
    ...Dispute;
    request: {
      id: number;
      title: string;
      amount: number;
      buyer: { id: number; name: string; };
      seller: { id: number; name: string; };
    };
    evidence: DisputeEvidence[];
  }
}
```

#### POST /api/disputes/:id/add-evidence
Add additional evidence to dispute.

**Request:**
```typescript
{
  evidence: File[]; // Multipart form data
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    evidenceUrls: string[];
    totalEvidence: number;
  }
}
```

**Business Logic:**
1. Validate user is party to dispute
2. Validate dispute is OPEN or UNDER_REVIEW
3. Validate total evidence count < 10
4. Validate files (type, size)
5. Upload files to storage
6. Create evidence records
7. Notify other party
8. Return evidence URLs

### Admin Endpoints

#### GET /api/admin/disputes
Get all disputes with filters.

**Query Parameters:**
- status?: DisputeStatus
- reason?: DisputeReason
- dateFrom?: string (ISO date)
- dateTo?: string (ISO date)
- search?: string (request ID or user name)
- limit?: number (default: 50)
- offset?: number (default: 0)

**Response:**
```typescript
{
  success: boolean;
  data: Dispute[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  }
}
```

#### GET /api/admin/disputes/:id
Get dispute details with full information.

**Response:**
```typescript
{
  success: boolean;
  data: {
    ...Dispute;
    request: RequestDetails;
    buyer: UserDetails;
    seller: UserDetails;
    evidence: DisputeEvidence[];
    timeline: DisputeEvent[];
  }
}
```

#### POST /api/admin/disputes/:id/review
Mark dispute as under review.

**Response:**
```typescript
{
  success: boolean;
  data: Dispute;
}
```

**Business Logic:**
1. Validate admin authentication
2. Validate dispute exists
3. Validate status is OPEN
4. Update status to UNDER_REVIEW
5. Record admin ID and timestamp
6. Notify both parties
7. Return updated dispute

#### POST /api/admin/disputes/:id/resolve
Resolve a dispute.

**Request:**
```typescript
{
  resolution: DisputeResolution;
  percentage?: number; // Required for PARTIAL_REFUND (0-100)
  notes?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    dispute: Dispute;
    refund?: {
      amount: number;
      stripeRefundId: string;
    };
    escrowRelease?: {
      amount: number;
      transactionId: string;
    };
  }
}
```

**Business Logic:**

**For REFUND_BUYER:**
1. Validate admin authentication
2. Validate dispute status is UNDER_REVIEW
3. Get request payment details
4. Call Stripe refund API (full amount)
5. Credit buyer's wallet
6. Release escrow hold
7. Update request status to REFUNDED
8. Update dispute status to RESOLVED
9. Record resolution details
10. Send notifications to both parties
11. Return resolution details

**For RELEASE_TO_SELLER:**
1. Validate admin authentication
2. Validate dispute status is UNDER_REVIEW
3. Release escrow to seller
4. Credit seller's wallet
5. Update request status to COMPLETED
6. Update dispute status to RESOLVED
7. Record resolution details
8. Send notifications to both parties
9. Return resolution details

**For PARTIAL_REFUND:**
1. Validate admin authentication
2. Validate dispute status is UNDER_REVIEW
3. Validate percentage (0-100)
4. Calculate refund amount (total * percentage / 100)
5. Calculate seller amount (total - refund amount)
6. Call Stripe refund API (partial amount)
7. Credit buyer's wallet with refund
8. Release remaining to seller's wallet
9. Update request status to PARTIALLY_REFUNDED
10. Update dispute status to RESOLVED
11. Record resolution details
12. Send notifications with amounts
13. Return resolution details

#### GET /api/admin/disputes/stats
Get dispute statistics.

**Response:**
```typescript
{
  success: boolean;
  data: {
    total: number;
    byStatus: {
      open: number;
      underReview: number;
      resolved: number;
      closed: number;
    };
    byReason: {
      notDelivered: number;
      wrongItem: number;
      damaged: number;
      other: number;
    };
    byResolution: {
      refundBuyer: number;
      releaseToSeller: number;
      partialRefund: number;
    };
    averageResolutionTime: number; // in hours
    refundRate: number; // percentage
  }
}
```

## Service Layer Design

### DisputeService

```typescript
class DisputeService {
  // User operations
  async openDispute(
    requestId: number,
    userId: number,
    reason: DisputeReason,
    description: string,
    evidenceFiles?: Express.Multer.File[]
  ): Promise<Dispute>;

  async getUserDisputes(
    userId: number,
    filters: DisputeFilters
  ): Promise<Dispute[]>;

  async getDisputeById(
    disputeId: string,
    userId: number
  ): Promise<DisputeWithDetails>;

  async addEvidence(
    disputeId: string,
    userId: number,
    evidenceFiles: Express.Multer.File[]
  ): Promise<DisputeEvidence[]>;

  // Admin operations
  async getAllDisputes(
    filters: AdminDisputeFilters
  ): Promise<Dispute[]>;

  async getDisputeDetailsForAdmin(
    disputeId: string
  ): Promise<DisputeWithFullDetails>;

  async markUnderReview(
    disputeId: string,
    adminId: number
  ): Promise<Dispute>;

  async resolveDispute(
    disputeId: string,
    adminId: number,
    resolution: DisputeResolution,
    percentage?: number,
    notes?: string
  ): Promise<ResolutionResult>;

  async getDisputeStats(): Promise<DisputeStats>;

  // Internal helpers
  private validateTimeWindow(request: Request): void;
  private validateNoExistingDispute(requestId: number): Promise<void>;
  private determineDisputeParty(requestId: number, userId: number): Promise<DisputeParty>;
}
```

### EvidenceService

```typescript
class EvidenceService {
  async uploadEvidence(
    disputeId: string,
    submittedBy: DisputeParty,
    files: Express.Multer.File[]
  ): Promise<DisputeEvidence[]>;

  async getDisputeEvidence(
    disputeId: string
  ): Promise<DisputeEvidence[]>;

  async deleteEvidence(
    evidenceId: number
  ): Promise<void>;

  // Internal helpers
  private validateFile(file: Express.Multer.File): void;
  private generateUniqueFilename(originalName: string): string;
  private uploadToStorage(file: Express.Multer.File, filename: string): Promise<string>;
  private getFileType(mimetype: string): EvidenceType;
}
```

### ResolutionService

```typescript
class ResolutionService {
  async refundBuyer(
    dispute: Dispute,
    request: Request,
    adminId: number,
    notes?: string
  ): Promise<ResolutionResult>;

  async releaseToSeller(
    dispute: Dispute,
    request: Request,
    adminId: number,
    notes?: string
  ): Promise<ResolutionResult>;

  async partialRefund(
    dispute: Dispute,
    request: Request,
    percentage: number,
    adminId: number,
    notes?: string
  ): Promise<ResolutionResult>;

  // Internal helpers
  private processStripeRefund(
    paymentIntentId: string,
    amount: number
  ): Promise<Stripe.Refund>;

  private creditWallet(
    userId: number,
    amount: number,
    referenceId: string,
    referenceType: string
  ): Promise<void>;

  private releaseEscrow(
    requestId: number,
    sellerId: number,
    amount: number
  ): Promise<void>;

  private updateRequestStatus(
    requestId: number,
    status: RequestStatus
  ): Promise<void>;
}
```

## File Upload Design

### Storage Options

**Option 1: AWS S3 (Recommended for Production)**
```typescript
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

async function uploadToS3(
  file: Express.Multer.File,
  filename: string
): Promise<string> {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `disputes/${filename}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}
```

**Option 2: Local Storage (Development)**
```typescript
import fs from 'fs/promises';
import path from 'path';

async function uploadToLocal(
  file: Express.Multer.File,
  filename: string
): Promise<string> {
  const uploadDir = path.join(__dirname, '../../uploads/disputes');
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filepath = path.join(uploadDir, filename);
  await fs.writeFile(filepath, file.buffer);
  
  return `/uploads/disputes/${filename}`;
}
```

### File Validation

```typescript
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES_PER_UPLOAD = 5;
const MAX_TOTAL_FILES = 10;

function validateFile(file: Express.Multer.File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new InvalidFileTypeError(file.mimetype);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new FileTooLargeError(file.size, MAX_FILE_SIZE);
  }
}
```

### Multer Configuration

```typescript
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_UPLOAD
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Usage in routes
router.post(
  '/disputes/:id/add-evidence',
  authenticate,
  upload.array('evidence', MAX_FILES_PER_UPLOAD),
  disputeController.addEvidence
);
```

## Integration Design

### Stripe Refund Integration

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

async function processRefund(
  paymentIntentId: string,
  amount: number, // in cents
  reason: string
): Promise<Stripe.Refund> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason: 'requested_by_customer',
      metadata: {
        dispute_reason: reason
      }
    });

    return refund;
  } catch (error) {
    logger.error('Stripe refund failed', { paymentIntentId, amount, error });
    throw new RefundFailedError(error.message);
  }
}
```

### Wallet Service Integration

```typescript
async function creditBuyerWallet(
  buyerId: number,
  amount: Decimal,
  disputeId: string
): Promise<void> {
  await walletService.credit(
    buyerId,
    amount,
    'REFUND',
    disputeId,
    'DISPUTE'
  );
}

async function releaseEscrowToSeller(
  requestId: number,
  sellerId: number,
  amount: Decimal
): Promise<void> {
  await escrowService.release(
    requestId,
    sellerId,
    amount,
    'DISPUTE_RESOLVED'
  );
}
```

### Notification Service Integration

```typescript
async function notifyDisputeOpened(
  dispute: Dispute,
  request: Request
): Promise<void> {
  // Email to buyer
  await emailService.send({
    to: request.buyer.email,
    template: 'dispute-opened-buyer',
    data: { dispute, request }
  });

  // Email to seller
  await emailService.send({
    to: request.seller.email,
    template: 'dispute-opened-seller',
    data: { dispute, request }
  });

  // In-app notifications
  await notificationService.create({
    userId: request.buyerId,
    type: 'DISPUTE_OPENED',
    title: 'Dispute Opened',
    message: `Your dispute for request #${request.id} has been opened`,
    link: `/disputes/${dispute.id}`
  });

  await notificationService.create({
    userId: request.sellerId,
    type: 'DISPUTE_OPENED',
    title: 'Dispute Against Your Delivery',
    message: `A dispute has been opened for request #${request.id}`,
    link: `/disputes/${dispute.id}`
  });
}
```

## Error Handling

### Custom Error Classes

```typescript
class DisputeError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DisputeError';
  }
}

class DisputeWindowExpiredError extends DisputeError {
  constructor(deliveredAt: Date) {
    const hoursElapsed = Math.floor(
      (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60)
    );
    super(
      `Dispute window expired. ${hoursElapsed} hours have passed since delivery. Disputes must be opened within 48 hours.`,
      'DISPUTE_WINDOW_EXPIRED'
    );
  }
}

class DuplicateDisputeError extends DisputeError {
  constructor(requestId: number) {
    super(
      `A dispute already exists for request #${requestId}`,
      'DUPLICATE_DISPUTE'
    );
  }
}

class InvalidDisputeStatusError extends DisputeError {
  constructor(currentStatus: DisputeStatus, action: string) {
    super(
      `Cannot ${action} dispute in status: ${currentStatus}`,
      'INVALID_DISPUTE_STATUS'
    );
  }
}

class RefundFailedError extends DisputeError {
  constructor(reason: string) {
    super(
      `Refund failed: ${reason}`,
      'REFUND_FAILED'
    );
  }
}

class InvalidFileTypeError extends DisputeError {
  constructor(mimetype: string) {
    super(
      `Invalid file type: ${mimetype}. Allowed types: JPG, PNG, PDF`,
      'INVALID_FILE_TYPE'
    );
  }
}

class FileTooLargeError extends DisputeError {
  constructor(size: number, maxSize: number) {
    super(
      `File too large: ${size} bytes. Maximum size: ${maxSize} bytes`,
      'FILE_TOO_LARGE'
    );
  }
}

class TooManyFilesError extends DisputeError {
  constructor(count: number, maxCount: number) {
    super(
      `Too many files: ${count}. Maximum allowed: ${maxCount}`,
      'TOO_MANY_FILES'
    );
  }
}
```

## Security Design

### File Upload Security

```typescript
// Filename sanitization
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}

// Generate unique filename
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}-${random}${ext}`;
}

// Malware scanning (using ClamAV or similar)
async function scanFile(file: Express.Multer.File): Promise<boolean> {
  // Implementation depends on antivirus solution
  // Return true if clean, false if infected
  return true;
}
```

### Authorization Checks

```typescript
async function verifyDisputeAccess(
  disputeId: string,
  userId: number
): Promise<void> {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { request: true }
  });

  if (!dispute) {
    throw new DisputeNotFoundError(disputeId);
  }

  const isParty = 
    dispute.request.buyerId === userId ||
    dispute.request.sellerId === userId;

  if (!isParty) {
    throw new UnauthorizedAccessError('You are not a party to this dispute');
  }
}
```

## Testing Strategy

### Unit Tests

**DisputeService Tests:**
- ✅ Open dispute with valid data
- ✅ Reject dispute outside 48-hour window
- ✅ Reject duplicate dispute
- ✅ Reject dispute for non-DELIVERED request
- ✅ Validate evidence file types
- ✅ Validate evidence file sizes
- ✅ Add evidence to existing dispute
- ✅ Reject evidence when limit reached

**ResolutionService Tests:**
- ✅ Full refund to buyer
- ✅ Release to seller
- ✅ Partial refund calculation
- ✅ Handle Stripe refund failures
- ✅ Handle wallet credit failures
- ✅ Rollback on errors

### Integration Tests

**Complete Workflows:**
- ✅ Buyer opens dispute → Admin resolves → Refund processed
- ✅ Seller wins dispute → Escrow released
- ✅ Partial refund → Both parties credited
- ✅ Evidence upload → Storage → Retrieval
- ✅ Notifications sent at each stage

## Performance Optimization

### Database Optimization

**Indexes:**
```sql
CREATE INDEX idx_dispute_request_id ON disputes(request_id);
CREATE INDEX idx_dispute_status ON disputes(status);
CREATE INDEX idx_dispute_opened_at ON disputes(opened_at);
CREATE INDEX idx_evidence_dispute_id ON dispute_evidence(dispute_id);
```

**Query Optimization:**
- Use SELECT only needed columns
- Use pagination for large result sets
- Use database transactions for atomic operations
- Use connection pooling

### File Upload Optimization

- Use streaming for large files
- Implement upload progress tracking
- Use CDN for serving evidence files
- Implement lazy loading for thumbnails

## Deployment Considerations

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
STRIPE_SECRET_KEY=sk_test_...
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=disputes-evidence

# Optional
MAX_FILE_SIZE=5242880
MAX_FILES_PER_UPLOAD=5
MAX_TOTAL_FILES=10
DISPUTE_WINDOW_HOURS=48
```

### Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

**Document Version:** 1.0.0
**Last Updated:** January 24, 2026
**Status:** Draft
