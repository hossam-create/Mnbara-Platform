export interface ConnectedAccountData {
  id: string;
  userId: number;
  stripeAccountId: string;
  accountType: 'standard' | 'express' | 'custom';
  onboardingStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  email?: string;
  country?: string;
  currency?: string;
}

export interface CreateAccountDto {
  userId: number;
  email: string;
  accountType?: 'standard' | 'express';
}

export interface TransferDto {
  userId: number;
  amount: number;
  currency?: string;
  description?: string;
  sourceTransaction?: string;
}

export interface AccountLinkResponse {
  url: string;
  expiresAt: number;
}
