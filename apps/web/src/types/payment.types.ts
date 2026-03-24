/**
 * Payment Types and Enums
 * Foundation for payment UI without processing money
 */

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CHARGEBACK = 'CHARGEBACK'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CRYPTO = 'CRYPTO',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYMOB = 'PAYMOB',
  PAYPAL = 'PAYPAL',
  SQUARE = 'SQUARE',
  MANUAL = 'MANUAL'
}

export enum EscrowStatus {
  PENDING = 'PENDING',
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_RELEASED = 'PARTIALLY_RELEASED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED'
}

export enum WalletTransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  ESCROW_HOLD = 'ESCROW_HOLD',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  FEE = 'FEE',
  BONUS = 'BONUS',
  ADJUSTMENT = 'ADJUSTMENT'
}

export interface PaymentProviderConfig {
  provider: PaymentProvider;
  name: string;
  displayName: string;
  supportedMethods: PaymentMethod[];
  currencies: string[];
  enabled: boolean;
  isTestMode: boolean;
  config?: {
    publicKey?: string;
    apiKey?: string;
    webhookSecret?: string;
    merchantId?: string;
  };
}

export interface PaymentState {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  orderId?: string;
  escrowId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  metadata?: {
    description?: string;
    reference?: string;
    gatewayTransactionId?: string;
    failureReason?: string;
    refundReason?: string;
    chargebackReason?: string;
  };
}

export interface WalletBalance {
  userId: string;
  currency: string;
  available: number;
  held: number;
  pending: number;
  total: number;
  lastUpdated: string;
  isReadOnly: boolean;
}

export interface EscrowHold {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  expiresAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  disputedAt?: string;
  conditions: {
    deliveryConfirmation: boolean;
    inspectionPeriod: number; // days
    autoRelease: boolean;
  };
  metadata?: {
    orderType?: string;
    guaranteeLevel?: string;
    specialConditions?: string[];
  };
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  orderId?: string;
  escrowId?: string;
  paymentId?: string;
  createdAt: string;
  metadata?: {
    reference?: string;
    category?: string;
    tags?: string[];
    notes?: string;
  };
}

export interface PaymentMethodConfig {
  method: PaymentMethod;
  name: string;
  displayName: string;
  icon: string;
  enabled: boolean;
  provider: PaymentProvider;
  config?: {
    minAmount?: number;
    maxAmount?: number;
    fees?: {
      fixed?: number;
      percentage?: number;
    };
    processingTime?: string;
  };
}

export interface OrderPaymentSummary {
  orderId: string;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  escrowStatus: EscrowStatus;
  paymentMethod?: PaymentMethod;
  paymentProvider?: PaymentProvider;
  escrowAmount?: number;
  refundAmount?: number;
  fees?: {
    paymentFee?: number;
    platformFee?: number;
    guaranteeFee?: number;
  };
  timeline: {
    paymentInitiated?: string;
    paymentCompleted?: string;
    escrowHeld?: string;
    escrowReleased?: string;
    refundProcessed?: string;
  };
}

// UI State Types
export interface PaymentUIState {
  selectedProvider?: PaymentProvider;
  selectedMethod?: PaymentMethod;
  isProcessing: boolean;
  error?: string;
  showProviderModal: boolean;
  showMethodModal: boolean;
}

export interface WalletUIState {
  activeTab: 'overview' | 'transactions' | 'escrow';
  selectedTransaction?: WalletTransaction;
  selectedEscrow?: EscrowHold;
  showTransactionDetails: boolean;
  showEscrowDetails: boolean;
}

// Control Center Finance Types (Read-Only)
export interface ControlCenterFinanceSummary {
  totalVolume: number;
  currency: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    refundRate: number;
    chargebackRate: number;
    averageProcessingTime: number; // hours
  };
  breakdown: {
    byProvider: Record<PaymentProvider, {
      volume: number;
      count: number;
      successRate: number;
    }>;
    byMethod: Record<PaymentMethod, {
      volume: number;
      count: number;
      successRate: number;
    }>;
    byCurrency: Record<string, {
      volume: number;
      count: number;
    }>;
  };
  escrowMetrics: {
    totalHeld: number;
    totalReleased: number;
    totalRefunded: number;
    averageHoldTime: number; // days
    activeEscrows: number;
  };
}

// Helper Functions
export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PENDING:
      return 'Pending';
    case PaymentStatus.PROCESSING:
      return 'Processing';
    case PaymentStatus.COMPLETED:
      return 'Completed';
    case PaymentStatus.FAILED:
      return 'Failed';
    case PaymentStatus.CANCELLED:
      return 'Cancelled';
    case PaymentStatus.REFUNDED:
      return 'Refunded';
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'Partially Refunded';
    case PaymentStatus.CHARGEBACK:
      return 'Chargeback';
    default:
      return 'Unknown';
  }
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case PaymentStatus.PROCESSING:
      return 'bg-blue-100 text-blue-800';
    case PaymentStatus.COMPLETED:
      return 'bg-green-100 text-green-800';
    case PaymentStatus.FAILED:
      return 'bg-red-100 text-red-800';
    case PaymentStatus.CANCELLED:
      return 'bg-gray-100 text-gray-800';
    case PaymentStatus.REFUNDED:
      return 'bg-orange-100 text-orange-800';
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'bg-orange-100 text-orange-800';
    case PaymentStatus.CHARGEBACK:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getEscrowStatusLabel = (status: EscrowStatus): string => {
  switch (status) {
    case EscrowStatus.PENDING:
      return 'Pending';
    case EscrowStatus.HELD:
      return 'Held';
    case EscrowStatus.RELEASED:
      return 'Released';
    case EscrowStatus.REFUNDED:
      return 'Refunded';
    case EscrowStatus.PARTIALLY_RELEASED:
      return 'Partially Released';
    case EscrowStatus.DISPUTED:
      return 'Disputed';
    case EscrowStatus.EXPIRED:
      return 'Expired';
    default:
      return 'Unknown';
  }
};

export const getEscrowStatusColor = (status: EscrowStatus): string => {
  switch (status) {
    case EscrowStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case EscrowStatus.HELD:
      return 'bg-blue-100 text-blue-800';
    case EscrowStatus.RELEASED:
      return 'bg-green-100 text-green-800';
    case EscrowStatus.REFUNDED:
      return 'bg-orange-100 text-orange-800';
    case EscrowStatus.PARTIALLY_RELEASED:
      return 'bg-blue-100 text-blue-800';
    case EscrowStatus.DISPUTED:
      return 'bg-red-100 text-red-800';
    case EscrowStatus.EXPIRED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getProviderDisplayName = (provider: PaymentProvider): string => {
  switch (provider) {
    case PaymentProvider.STRIPE:
      return 'Stripe';
    case PaymentProvider.PAYMOB:
      return 'Paymob';
    case PaymentProvider.PAYPAL:
      return 'PayPal';
    case PaymentProvider.SQUARE:
      return 'Square';
    case PaymentProvider.MANUAL:
      return 'Manual Processing';
    default:
      return 'Unknown Provider';
  }
};

export const getMethodDisplayName = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.CREDIT_CARD:
      return 'Credit Card';
    case PaymentMethod.DEBIT_CARD:
      return 'Debit Card';
    case PaymentMethod.BANK_TRANSFER:
      return 'Bank Transfer';
    case PaymentMethod.DIGITAL_WALLET:
      return 'Digital Wallet';
    case PaymentMethod.CRYPTO:
      return 'Cryptocurrency';
    case PaymentMethod.CASH_ON_DELIVERY:
      return 'Cash on Delivery';
    default:
      return 'Unknown Method';
  }
};
