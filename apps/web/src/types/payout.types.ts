// Payout Types for Frontend
export enum PayoutStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL',
  STRIPE_TRANSFER = 'STRIPE_TRANSFER',
}

export interface PayoutRequest {
  id: string;
  userId: number;
  walletId: number;
  amount: number;
  currency: string;
  status: PayoutStatus;
  method: PayoutMethod;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  processedByAdminId?: number;
  approvedByAdminId?: number;
  rejectedByAdminId?: number;
  notes?: string;
  rejectionReason?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    isVerified: boolean;
  };
  accountDetails?: BankAccountDetails | PayPalAccountDetails | StripeAccountDetails;
}

export interface BankAccountDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
  swiftCode?: string;
}

export interface PayPalAccountDetails {
  email: string;
}

export interface StripeAccountDetails {
  accountId: string;
}

export interface PayoutFilters {
  status?: PayoutStatus;
  method?: PayoutMethod;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface PayoutStats {
  pendingAmount: number;
  pendingCount: number;
  approvedToday: number;
  completedThisWeek: number;
  totalProcessed: number;
}

export interface WalletTransaction {
  id: number;
  amount: number;
  transactionType: string;
  status: string;
  createdAt: string;
  referenceType?: string;
  referenceId?: string;
}
