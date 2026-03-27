import {
  ExchangeRequest,
  ExchangeMatch,
  Settlement,
  ProofOfPayment,
  SecurityDeposit,
  TrustLevel,
  Message,
  ExternalEscrowProvider,
  ExchangeStatus,
  MatchStatus,
  SettlementStatus,
  VerificationStatus,
  DepositStatus,
  MatchType,
  SettlementMethod,
  ProviderType,
  DepositSource,
} from '../../types/p2p-exchange.types';

// ============================================================
// EXCHANGE REQUEST FIXTURES
// ============================================================

export const mockExchangeRequest: ExchangeRequest = {
  id: 1,
  userId: 1,
  fromCurrency: 'USD',
  toCurrency: 'SAR',
  fromAmount: '100',
  toAmount: '375',
  desiredRate: '3.75',
  actualRate: '3.75',
  platformFee: '2.50',
  protectionFee: '1.00',
  status: ExchangeStatus.OPEN,
  trustLevel: 5,
  securityDeposit: '50',
  useExternalEscrow: false,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  matchedAt: null,
  completedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockExchangeRequestMatched: ExchangeRequest = {
  ...mockExchangeRequest,
  id: 2,
  status: ExchangeStatus.MATCHED,
  matchedAt: new Date().toISOString(),
};

export const mockExchangeRequestCompleted: ExchangeRequest = {
  ...mockExchangeRequest,
  id: 3,
  status: ExchangeStatus.COMPLETED,
  matchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  completedAt: new Date().toISOString(),
};

// ============================================================
// EXCHANGE MATCH FIXTURES
// ============================================================

export const mockExchangeMatch: ExchangeMatch = {
  id: 1,
  requestId: 1,
  counterRequestId: 2,
  matchType: MatchType.AUTOMATIC,
  matchScore: '0.95',
  status: MatchStatus.PENDING,
  escrowHoldId: null,
  externalEscrowId: null,
  settlementMethod: SettlementMethod.INTERNAL,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  request: mockExchangeRequest,
  counterRequest: mockExchangeRequestMatched,
};

export const mockExchangeMatchEscrowed: ExchangeMatch = {
  ...mockExchangeMatch,
  id: 2,
  status: MatchStatus.ESCROWED,
  escrowHoldId: 1,
};

export const mockExchangeMatchCompleted: ExchangeMatch = {
  ...mockExchangeMatch,
  id: 3,
  status: MatchStatus.COMPLETED,
  escrowHoldId: 1,
};

// ============================================================
// SETTLEMENT FIXTURES
// ============================================================

export const mockSettlement: Settlement = {
  id: 1,
  matchId: 1,
  method: SettlementMethod.INTERNAL,
  pspProvider: null,
  pspTransactionId: null,
  pspStatus: null,
  externalEscrowProvider: null,
  externalEscrowId: null,
  status: SettlementStatus.PENDING,
  initiatedAt: new Date().toISOString(),
  completedAt: null,
  failedAt: null,
  failureReason: null,
  retryCount: 0,
};

export const mockSettlementCompleted: Settlement = {
  ...mockSettlement,
  id: 2,
  status: SettlementStatus.COMPLETED,
  completedAt: new Date().toISOString(),
};

// ============================================================
// PROOF OF PAYMENT FIXTURES
// ============================================================

export const mockProofOfPayment: ProofOfPayment = {
  id: 1,
  requestId: 1,
  userId: 1,
  photoUrl: 'https://example.com/proof.jpg',
  videoUrl: null,
  timestamp: new Date().toISOString(),
  referenceId: 'REF-123456',
  recipientName: 'John Doe',
  paymentMethod: 'Bank Transfer',
  metadata: { bankName: 'Example Bank' },
  verificationStatus: VerificationStatus.PENDING,
  verifiedBy: null,
  verifiedAt: null,
  rejectionReason: null,
  createdAt: new Date().toISOString(),
};

export const mockProofOfPaymentVerified: ProofOfPayment = {
  ...mockProofOfPayment,
  id: 2,
  verificationStatus: VerificationStatus.VERIFIED,
  verifiedBy: 100,
  verifiedAt: new Date().toISOString(),
};

// ============================================================
// SECURITY DEPOSIT FIXTURES
// ============================================================

export const mockSecurityDeposit: SecurityDeposit = {
  id: 1,
  userId: 1,
  amount: '50',
  currency: 'USD',
  source: DepositSource.INITIAL_DEPOSIT,
  status: DepositStatus.ACTIVE,
  frozenAmount: '0',
  frozenReason: null,
  frozenAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockSecurityDepositFrozen: SecurityDeposit = {
  ...mockSecurityDeposit,
  id: 2,
  status: DepositStatus.FROZEN,
  frozenAmount: '50',
  frozenReason: 'Dispute under investigation',
  frozenAt: new Date().toISOString(),
};

// ============================================================
// TRUST LEVEL FIXTURES
// ============================================================

export const mockTrustLevel: TrustLevel = {
  id: 1,
  userId: 1,
  level: 5,
  maxTransactionAmount: '10000',
  successfulExchanges: 25,
  totalVolume: '50000',
  disputeCount: 0,
  timeoutCount: 1,
  lastLevelUpAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockTrustLevelLow: TrustLevel = {
  ...mockTrustLevel,
  id: 2,
  level: 1,
  maxTransactionAmount: '500',
  successfulExchanges: 0,
  totalVolume: '0',
};

// ============================================================
// MESSAGE FIXTURES
// ============================================================

export const mockMessage: Message = {
  id: '1',
  matchId: '1',
  senderId: '1',
  senderName: 'John Doe',
  content: 'Hello, are you ready to proceed?',
  containsExternalContact: false,
  isFlagged: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockMessageWithExternalContact: Message = {
  ...mockMessage,
  id: '2',
  content: 'Contact me at john@example.com',
  containsExternalContact: true,
  isFlagged: true,
  flagReason: 'External contact detected',
};

// ============================================================
// EXTERNAL ESCROW PROVIDER FIXTURES
// ============================================================

export const mockExternalEscrowProvider: ExternalEscrowProvider = {
  id: 1,
  name: 'Tatum',
  type: ProviderType.BLOCKCHAIN,
  country: 'Global',
  supportedCurrencies: ['USD', 'SAR', 'AED', 'EUR'],
  minAmount: '10',
  maxAmount: '100000',
  feePercentage: '0.5',
  feeFixed: '0',
  settlementTime: 3600,
  isActive: true,
  enabled: true,
  priority: 1,
};

export const mockExternalEscrowProviderSecondary: ExternalEscrowProvider = {
  ...mockExternalEscrowProvider,
  id: 2,
  name: 'Stripe',
  type: ProviderType.PAYMENT_PROCESSOR,
  priority: 2,
};

// ============================================================
// COLLECTION FIXTURES
// ============================================================

export const mockExchangeRequests: ExchangeRequest[] = [
  mockExchangeRequest,
  mockExchangeRequestMatched,
  mockExchangeRequestCompleted,
];

export const mockExchangeMatches: ExchangeMatch[] = [
  mockExchangeMatch,
  mockExchangeMatchEscrowed,
  mockExchangeMatchCompleted,
];

export const mockProofsOfPayment: ProofOfPayment[] = [
  mockProofOfPayment,
  mockProofOfPaymentVerified,
];

export const mockSecurityDeposits: SecurityDeposit[] = [
  mockSecurityDeposit,
  mockSecurityDepositFrozen,
];

export const mockMessages: Message[] = [
  mockMessage,
  mockMessageWithExternalContact,
];

export const mockExternalEscrowProviders: ExternalEscrowProvider[] = [
  mockExternalEscrowProvider,
  mockExternalEscrowProviderSecondary,
];

// Alias for backward compatibility
export const mockMatches = mockExchangeMatches;


// ============================================================
// FACTORY FUNCTIONS FOR CREATING MOCK DATA WITH OVERRIDES
// ============================================================

/**
 * Create a mock external escrow provider with optional overrides
 * @param overrides - Partial provider properties to override
 * @returns ExternalEscrowProvider with merged properties
 */
export const createMockExternalEscrowProvider = (
  overrides: Partial<ExternalEscrowProvider> = {}
): ExternalEscrowProvider => ({
  ...mockExternalEscrowProvider,
  ...overrides,
});/**
 * Create a mock exchange request with optional overrides
 * @param overrides - Partial properties to override defaults
 * @returns ExchangeRequest with merged properties
 */
export const createMockExchangeRequest = (
  overrides: Partial<ExchangeRequest> = {}
): ExchangeRequest => ({
  ...mockExchangeRequest,
  ...overrides,
});

/**
 * Create a mock exchange match with optional overrides
 * @param overrides - Partial properties to override defaults
 * @returns ExchangeMatch with merged properties
 */
export const createMockExchangeMatch = (
  overrides: Partial<ExchangeMatch> = {}
): ExchangeMatch => ({
  ...mockExchangeMatch,
  ...overrides,
});

/**
 * Create a mock settlement with optional overrides
 * @param overrides - Partial properties to override defaults
 * @returns Settlement with merged properties
 */
export const createMockSettlement = (
  overrides: Partial<Settlement> = {}
): Settlement => ({
  ...mockSettlement,
  ...overrides,
});

/**
 * Create a mock proof of payment with optional overrides
 * @param overrides - Partial properties to override defaults
 * @returns ProofOfPayment with merged properties
 */
export const createMockProofOfPayment = (
  overrides: Partial<ProofOfPayment> = {}
): ProofOfPayment => ({
  ...mockProofOfPayment,
  ...overrides,
});

/**
 * Create a mock security deposit with optional overrides
 * @param overrides - Partial properties to override defaults
 * @returns SecurityDeposit with merged properties
 */
export const createMockSecurityDeposit = (
  overrides: Partial<SecurityDeposit> = {}
): SecurityDeposit => ({
  ...mockSecurityDeposit,
  ...overrides,
});

/**
 * Create a mock message with optional overrides
 * @param overrides - Partial properties to override defaults
 * @returns Message with merged properties
 */
export const createMockMessage = (
  overrides: Partial<Message> = {}
): Message => ({
  ...mockMessage,
  ...overrides,
});
