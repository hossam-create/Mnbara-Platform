/**
 * Refund & Chargeback Types
 * Visual-only refund and chargeback state management
 */

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum RefundReason {
  ITEM_NOT_AS_DESCRIBED = 'ITEM_NOT_AS_DESCRIBED',
  ITEM_NEVER_RECEIVED = 'ITEM_NEVER_RECEIVED',
  DAMAGED_DURING_SHIPPING = 'DAMAGED_DURING_SHIPPING',
  WRONG_ITEM_SHIPPED = 'WRONG_ITEM_SHIPPED',
  COUNTERFEIT_ITEM = 'COUNTERFEIT_ITEM',
  BUYER_REMORSE = 'BUYER_REMORSE',
  SELLER_FAULT = 'SELLER_FAULT',
  SHIPPING_DELAY = 'SHIPPING_DELAY',
  QUALITY_ISSUES = 'QUALITY_ISSUES',
  OTHER = 'OTHER'
}

export enum ChargebackStatus {
  NONE = 'NONE',
  INITIATED = 'INITIATED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  DISPUTED = 'DISPUTED',
  RESOLVED_BUYER = 'RESOLVED_BUYER',
  RESOLVED_SELLER = 'RESOLVED_SELLER',
  EXPIRED = 'EXPIRED'
}

export enum ChargebackReason {
  FRAUDULENT_TRANSACTION = 'FRAUDULENT_TRANSACTION',
  CREDIT_NOT_PROCESSED = 'CREDIT_NOT_PROCESSED',
  DUPLICATE_PROCESSING = 'DUPLICATE_PROCESSING',
  PRODUCT_NOT_RECEIVED = 'PRODUCT_NOT_RECEIVED',
  PRODUCT_DIFFERENT = 'PRODUCT_DIFFERENT',
  PRODUCT_NOT_AS_DESCRIBED = 'PRODUCT_NOT_AS_DESCRIBED',
  CANCELLATION_ISSUES = 'CANCELLATION_ISSUES',
  OTHER = 'OTHER'
}

export interface RefundRequest {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: RefundReason;
  description: string;
  status: RefundStatus;
  requestedBy: 'BUYER' | 'SELLER' | 'SYSTEM';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedAt?: string;
  completedAt?: string;
  failedAt?: string;
  rejectionReason?: string;
  processingDetails?: {
    method: 'ORIGINAL_PAYMENT_METHOD' | 'STORE_CREDIT' | 'BANK_TRANSFER';
    estimatedCompletion?: string;
    trackingNumber?: string;
  };
  guaranteeReference?: {
    guaranteeLevel: 'BASIC' | 'FULL' | 'TRAVELER';
    guaranteePolicy: string;
    coverageAmount: number;
  };
  evidence?: {
    files: Array<{
      id: string;
      fileName: string;
      fileType: 'image' | 'document' | 'video';
      uploadDate: string;
      url?: string;
    }>;
    description: string;
  };
}

export interface ChargebackCase {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: ChargebackReason;
  status: ChargebackStatus;
  initiatedBy: 'BUYER' | 'BANK' | 'PAYMENT_PROVIDER';
  initiatedAt: string;
  caseNumber?: string;
  deadline?: string;
  merchantResponse?: string;
  evidence?: {
    files: Array<{
      id: string;
      fileName: string;
      fileType: 'image' | 'document' | 'video';
      uploadDate: string;
      url?: string;
    }>;
    description: string;
  };
  resolution?: {
    outcome: 'BUYER_FAVOR' | 'SELLER_FAVOR' | 'SPLIT' | 'MERCHANT_WIN';
    amount?: number;
    reason?: string;
    resolvedAt?: string;
  };
}

export interface RefundTimeline {
  id: string;
  refundId?: string;
  chargebackId?: string;
  eventType: 'REFUND_REQUESTED' | 'REFUND_APPROVED' | 'REFUND_REJECTED' | 'REFUND_PROCESSING' | 'REFUND_COMPLETED' | 'REFUND_FAILED' | 'CHARGEBACK_INITIATED' | 'CHARGEBACK_ACCEPTED' | 'CHARGEBACK_DISPUTED' | 'CHARGEBACK_RESOLVED';
  timestamp: string;
  actor: 'BUYER' | 'SELLER' | 'SYSTEM' | 'CONTROL_CENTER' | 'PAYMENT_PROVIDER' | 'BANK';
  description: string;
  metadata?: {
    amount?: number;
    currency?: string;
    reason?: string;
    evidenceCount?: number;
    processingMethod?: string;
    trackingNumber?: string;
    caseNumber?: string;
  };
}

// UI State Types
export interface RefundUIState {
  activeTab: 'refunds' | 'chargebacks' | 'timeline';
  selectedRefund?: RefundRequest;
  selectedChargeback?: ChargebackCase;
  showRefundDetails: boolean;
  showChargebackDetails: boolean;
  isSubmitting: boolean;
  submissionError?: string;
}

// Helper Functions
export const getRefundStatusLabel = (status: RefundStatus): string => {
  switch (status) {
    case RefundStatus.REQUESTED:
      return 'Requested';
    case RefundStatus.UNDER_REVIEW:
      return 'Under Review';
    case RefundStatus.APPROVED:
      return 'Approved';
    case RefundStatus.REJECTED:
      return 'Rejected';
    case RefundStatus.PROCESSING:
      return 'Processing';
    case RefundStatus.COMPLETED:
      return 'Completed';
    case RefundStatus.FAILED:
      return 'Failed';
    case RefundStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

export const getRefundStatusColor = (status: RefundStatus): string => {
  switch (status) {
    case RefundStatus.REQUESTED:
      return 'bg-yellow-100 text-yellow-800';
    case RefundStatus.UNDER_REVIEW:
      return 'bg-blue-100 text-blue-800';
    case RefundStatus.APPROVED:
      return 'bg-green-100 text-green-800';
    case RefundStatus.REJECTED:
      return 'bg-red-100 text-red-800';
    case RefundStatus.PROCESSING:
      return 'bg-purple-100 text-purple-800';
    case RefundStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    case RefundStatus.FAILED:
      return 'bg-red-100 text-red-800';
    case RefundStatus.CANCELLED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getChargebackStatusLabel = (status: ChargebackStatus): string => {
  switch (status) {
    case ChargebackStatus.NONE:
      return 'No Chargeback';
    case ChargebackStatus.INITIATED:
      return 'Chargeback Initiated';
    case ChargebackStatus.UNDER_REVIEW:
      return 'Under Review';
    case ChargebackStatus.ACCEPTED:
      return 'Accepted';
    case ChargebackStatus.DISPUTED:
      return 'Disputed';
    case ChargebackStatus.RESOLVED_BUYER:
      return 'Resolved (Buyer)';
    case ChargebackStatus.RESOLVED_SELLER:
      return 'Resolved (Seller)';
    case ChargebackStatus.EXPIRED:
      return 'Expired';
    default:
      return 'Unknown';
  }
};

export const getChargebackStatusColor = (status: ChargebackStatus): string => {
  switch (status) {
    case ChargebackStatus.NONE:
      return 'bg-green-100 text-green-800';
    case ChargebackStatus.INITIATED:
      return 'bg-red-100 text-red-800';
    case ChargebackStatus.UNDER_REVIEW:
      return 'bg-yellow-100 text-yellow-800';
    case ChargebackStatus.ACCEPTED:
      return 'bg-blue-100 text-blue-800';
    case ChargebackStatus.DISPUTED:
      return 'bg-orange-100 text-orange-800';
    case ChargebackStatus.RESOLVED_BUYER:
      return 'bg-green-100 text-green-800';
    case ChargebackStatus.RESOLVED_SELLER:
      return 'bg-green-100 text-green-800';
    case ChargebackStatus.EXPIRED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getRefundReasonLabel = (reason: RefundReason): string => {
  switch (reason) {
    case RefundReason.ITEM_NOT_AS_DESCRIBED:
      return 'Item not as described';
    case RefundReason.ITEM_NEVER_RECEIVED:
      return 'Item never received';
    case RefundReason.DAMAGED_DURING_SHIPPING:
      return 'Damaged during shipping';
    case RefundReason.WRONG_ITEM_SHIPPED:
      return 'Wrong item shipped';
    case RefundReason.COUNTERFEIT_ITEM:
      return 'Counterfeit item';
    case RefundReason.BUYER_REMORSE:
      return 'Buyer remorse';
    case RefundReason.SELLER_FAULT:
      return 'Seller fault';
    case RefundReason.SHIPPING_DELAY:
      return 'Shipping delay';
    case RefundReason.QUALITY_ISSUES:
      return 'Quality issues';
    case RefundReason.OTHER:
      return 'Other';
    default:
      return 'Unknown';
  }
};

export const getChargebackReasonLabel = (reason: ChargebackReason): string => {
  switch (reason) {
    case ChargebackReason.FRAUDULENT_TRANSACTION:
      return 'Fraudulent transaction';
    case ChargebackReason.CREDIT_NOT_PROCESSED:
      return 'Credit not processed';
    case ChargebackReason.DUPLICATE_PROCESSING:
      return 'Duplicate processing';
    case ChargebackReason.PRODUCT_NOT_RECEIVED:
      return 'Product not received';
    case ChargebackReason.PRODUCT_DIFFERENT:
      return 'Product different';
    case ChargebackReason.PRODUCT_NOT_AS_DESCRIBED:
      return 'Product not as described';
    case ChargebackReason.CANCELLATION_ISSUES:
      return 'Cancellation issues';
    case ChargebackReason.OTHER:
      return 'Other';
    default:
      return 'Unknown';
  }
};

export const getTimelineEventLabel = (eventType: RefundTimeline['eventType']): string => {
  switch (eventType) {
    case 'REFUND_REQUESTED':
      return 'Refund Requested';
    case 'REFUND_APPROVED':
      return 'Refund Approved';
    case 'REFUND_REJECTED':
      return 'Refund Rejected';
    case 'REFUND_PROCESSING':
      return 'Refund Processing';
    case 'REFUND_COMPLETED':
      return 'Refund Completed';
    case 'REFUND_FAILED':
      return 'Refund Failed';
    case 'CHARGEBACK_INITIATED':
      return 'Chargeback Initiated';
    case 'CHARGEBACK_ACCEPTED':
      return 'Chargeback Accepted';
    case 'CHARGEBACK_DISPUTED':
      return 'Chargeback Disputed';
    case 'CHARGEBACK_RESOLVED':
      return 'Chargeback Resolved';
    default:
      return eventType.replace(/_/g, ' ').charAt(0).toUpperCase() + eventType.replace(/_/g, ' ').slice(1);
  }
};

export const getTimelineEventIcon = (eventType: RefundTimeline['eventType']): string => {
  switch (eventType) {
    case 'REFUND_REQUESTED':
      return '↩️';
    case 'REFUND_APPROVED':
      return '✅';
    case 'REFUND_REJECTED':
      return '❌';
    case 'REFUND_PROCESSING':
      return '⚙️';
    case 'REFUND_COMPLETED':
      return '✅';
    case 'REFUND_FAILED':
      return '❌';
    case 'CHARGEBACK_INITIATED':
      return '⚠️';
    case 'CHARGEBACK_ACCEPTED':
      return '📋';
    case 'CHARGEBACK_DISPUTED':
      return '⚖️';
    case 'CHARGEBACK_RESOLVED':
      return '⚖️';
    default:
      return '📄';
  }
};
