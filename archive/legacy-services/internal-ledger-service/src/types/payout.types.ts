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

export interface BankAccountDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
  swiftCode?: string;
}

export interface PayPalDetails {
  email: string;
}

export interface StripeDetails {
  accountId: string;
}

export type PayoutAccountDetails = BankAccountDetails | PayPalDetails | StripeDetails;

export interface CreatePayoutRequestData {
  userId: number;
  walletId: number;
  amount: number;
  currency: string;
  method: PayoutMethod;
  accountDetails: PayoutAccountDetails;
}

export interface PayoutRequest {
  id: string;
  userId: number;
  walletId: number;
  amount: number;
  currency: string;
  status: PayoutStatus;
  method: PayoutMethod;
  accountDetails: string; // Encrypted
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  rejectedAt?: Date;
  processedByAdminId?: number;
  approvedByAdminId?: number;
  rejectedByAdminId?: number;
  notes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutFilters {
  userId?: number;
  status?: PayoutStatus;
  method?: PayoutMethod;
  fromDate?: Date;
  toDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}
