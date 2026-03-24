import { z } from 'zod';

// ============================================
// Enums matching payment.types.ts
// ============================================

export const PaymentMethodTypeEnum = z.enum([
  'card',
  'wallet',
  'bank_transfer',
  'cash_on_delivery',
  'escrow',
  'mobile_money',
  'crypto'
]);
export type PaymentMethodType = z.infer<typeof PaymentMethodTypeEnum>;

export const PaymentStatusEnum = z.enum([
  'pending',
  'authorized',
  'captured',
  'paid',
  'processing',
  'failed',
  'refunded',
  'partially_refunded',
  'cancelled',
  'expired',
  'declined'
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const PaymentProviderEnum = z.enum([
  'stripe',
  'paypal',
  'square',
  'internal_wallet',
  'bank_transfer',
  'cash',
  'escrow'
]);
export type PaymentProvider = z.infer<typeof PaymentProviderEnum>;

export const CardTypeEnum = z.enum([
  'visa',
  'mastercard',
  'amex',
  'discover',
  'diners',
  'jcb',
  'unionpay',
  'unknown'
]);
export type CardType = z.infer<typeof CardTypeEnum>;

export const CurrencyEnum = z.enum([
  'USD',
  'EUR',
  'GBP',
  'SAR',
  'AED',
  'EGP',
  'JPY',
  'CNY'
]);
export type Currency = z.infer<typeof CurrencyEnum>;

export const TransactionTypeEnum = z.enum([
  'payment',
  'refund',
  'payout',
  'transfer',
  'deposit',
  'withdrawal',
  'fee',
  'adjustment',
  'chargeback'
]);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const RefundStatusEnum = z.enum([
  'pending',
  'processing',
  'succeeded',
  'failed',
  'cancelled'
]);
export type RefundStatus = z.infer<typeof RefundStatusEnum>;

export const PayoutStatusEnum = z.enum([
  'pending',
  'in_transit',
  'paid',
  'failed',
  'cancelled'
]);
export type PayoutStatus = z.infer<typeof PayoutStatusEnum>;

// ============================================
// Card Information Schema
// ============================================

export const cardInfoSchema = z.object({
  brand: CardTypeEnum,
  last4: z.string().length(4, 'Card last 4 digits must be 4 characters'),
  expiryMonth: z.number().int().min(1).max(12, 'Invalid expiry month'),
  expiryYear: z.number().int().min(2024, 'Invalid expiry year'),
  holderName: z.string().optional(),
  country: z.string().length(2).optional(),
  fingerprint: z.string().optional(),
});
export type CardInfo = z.infer<typeof cardInfoSchema>;

// ============================================
// Bank Account Schema
// ============================================

export const bankAccountSchema = z.object({
  id: z.string().uuid('Invalid bank account ID'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  routingNumber: z.string().optional(),
  bankName: z.string().min(1, 'Bank name is required'),
  bankCode: z.string().optional(),
  country: z.string().length(2, 'Invalid country code'),
  currency: CurrencyEnum,
  accountType: z.enum(['checking', 'savings']).optional(),
  isVerified: z.boolean(),
  isDefault: z.boolean(),
});
export type BankAccount = z.infer<typeof bankAccountSchema>;

// ============================================
// Payment Method Schema
// ============================================

export const paymentMethodSchema = z.object({
  id: z.string().uuid('Invalid payment method ID'),
  userId: z.string().uuid('Invalid user ID'),
  type: PaymentMethodTypeEnum,
  provider: PaymentProviderEnum,
  isDefault: z.boolean(),
  isVerified: z.boolean(),
  card: cardInfoSchema.optional(),
  bankAccount: bankAccountSchema.optional(),
  walletId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

// ============================================
// Payment Intent Schema
// ============================================

export const paymentIntentSchema = z.object({
  id: z.string().uuid('Invalid payment intent ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: CurrencyEnum,
  status: PaymentStatusEnum,
  paymentMethodId: z.string().uuid().optional(),
  customerId: z.string().uuid('Invalid customer ID'),
  orderId: z.string().uuid().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  clientSecret: z.string().optional(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
});
export type PaymentIntent = z.infer<typeof paymentIntentSchema>;

// ============================================
// Fraud Check Result Schema
// ============================================

export const fraudCheckResultSchema = z.object({
  score: z.number().min(0).max(100, 'Fraud score must be between 0 and 100'),
  level: z.enum(['low', 'medium', 'high']),
  passed: z.boolean(),
  checks: z.array(z.object({
    type: z.string(),
    passed: z.boolean(),
    message: z.string().optional(),
  })),
  timestamp: z.string().datetime(),
});
export type FraudCheckResult = z.infer<typeof fraudCheckResultSchema>;

// ============================================
// Payment Metadata Schema
// ============================================

export const paymentMetadataSchema = z.object({
  orderId: z.string().uuid().optional(),
  orderNumber: z.string().optional(),
  customerId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  deviceId: z.string().optional(),
  riskScore: z.number().min(0).max(100).optional(),
  fraudCheck: fraudCheckResultSchema.optional(),
  customFields: z.record(z.unknown()).optional(),
});
export type PaymentMetadata = z.infer<typeof paymentMetadataSchema>;

// ============================================
// Payment Transaction Schema
// ============================================

export const paymentTransactionSchema = z.object({
  id: z.string().uuid('Invalid transaction ID'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  type: TransactionTypeEnum,
  status: PaymentStatusEnum,
  amount: z.number().positive('Amount must be positive'),
  currency: CurrencyEnum,
  fee: z.number().min(0).optional(),
  netAmount: z.number().min(0, 'Net amount cannot be negative'),
  userId: z.string().uuid('Invalid user ID'),
  orderId: z.string().uuid().optional(),
  paymentMethodId: z.string().uuid().optional(),
  provider: PaymentProviderEnum,
  providerTransactionId: z.string().optional(),
  description: z.string().optional(),
  metadata: paymentMetadataSchema.optional(),
  failureReason: z.string().optional(),
  processedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentTransaction = z.infer<typeof paymentTransactionSchema>;

// ============================================
// Payment Refund Schema
// ============================================

export const paymentRefundSchema = z.object({
  id: z.string().uuid('Invalid refund ID'),
  refundId: z.string().min(1, 'Refund ID is required'),
  paymentTransactionId: z.string().uuid('Invalid payment transaction ID'),
  amount: z.number().positive('Refund amount must be positive'),
  currency: CurrencyEnum,
  status: RefundStatusEnum,
  reason: z.string().min(1, 'Refund reason is required').max(500),
  requestedBy: z.string().uuid('Invalid user ID'),
  processedAt: z.string().datetime().optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentRefund = z.infer<typeof paymentRefundSchema>;

// ============================================
// Payment Payout Schema
// ============================================

export const paymentPayoutSchema = z.object({
  id: z.string().uuid('Invalid payout ID'),
  payoutId: z.string().min(1, 'Payout ID is required'),
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Payout amount must be positive'),
  currency: CurrencyEnum,
  status: PayoutStatusEnum,
  bankAccountId: z.string().uuid('Invalid bank account ID'),
  provider: PaymentProviderEnum,
  providerPayoutId: z.string().optional(),
  description: z.string().optional(),
  estimatedArrival: z.string().datetime().optional(),
  arrivedAt: z.string().datetime().optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentPayout = z.infer<typeof paymentPayoutSchema>;

// ============================================
// Escrow Payment Schema
// ============================================

export const escrowPaymentSchema = z.object({
  id: z.string().uuid('Invalid escrow ID'),
  escrowId: z.string().min(1, 'Escrow ID is required'),
  orderId: z.string().uuid('Invalid order ID'),
  buyerId: z.string().uuid('Invalid buyer ID'),
  sellerId: z.string().uuid('Invalid seller ID'),
  amount: z.number().positive('Escrow amount must be positive'),
  currency: CurrencyEnum,
  status: z.enum(['held', 'released', 'refunded', 'disputed']),
  heldAt: z.string().datetime(),
  releasedAt: z.string().datetime().optional(),
  releaseConditions: z.array(z.string()).optional(),
  disputeId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type EscrowPayment = z.infer<typeof escrowPaymentSchema>;

// ============================================
// Payment Fee Configuration Schema
// ============================================

export const paymentFeeConfigSchema = z.object({
  fixedFee: z.number().min(0, 'Fixed fee cannot be negative'),
  percentageFee: z.number().min(0).max(1, 'Percentage fee must be between 0 and 1'),
  currency: CurrencyEnum,
  minFee: z.number().min(0).optional(),
  maxFee: z.number().min(0).optional(),
});
export type PaymentFeeConfig = z.infer<typeof paymentFeeConfigSchema>;

// ============================================
// Payment Gateway Configuration Schema
// ============================================

export const paymentGatewayConfigSchema = z.object({
  provider: PaymentProviderEnum,
  enabled: z.boolean(),
  publicKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  supportedCurrencies: z.array(CurrencyEnum),
  supportedPaymentMethods: z.array(PaymentMethodTypeEnum),
  fees: paymentFeeConfigSchema,
  settings: z.record(z.unknown()).optional(),
});
export type PaymentGatewayConfig = z.infer<typeof paymentGatewayConfigSchema>;

// ============================================
// Invoice Item Schema
// ============================================

export const invoiceItemSchema = z.object({
  id: z.string().uuid('Invalid invoice item ID'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  totalPrice: z.number().min(0, 'Total price cannot be negative'),
  taxRate: z.number().min(0).max(1).optional(),
  taxAmount: z.number().min(0).optional(),
});
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

// ============================================
// Payment Invoice Schema
// ============================================

export const paymentInvoiceSchema = z.object({
  id: z.string().uuid('Invalid invoice ID'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  userId: z.string().uuid('Invalid user ID'),
  orderId: z.string().uuid().optional(),
  amount: z.number().positive('Invoice amount must be positive'),
  currency: CurrencyEnum,
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  dueDate: z.string().datetime(),
  paidAt: z.string().datetime().optional(),
  items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item'),
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  total: z.number().min(0, 'Total cannot be negative'),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentInvoice = z.infer<typeof paymentInvoiceSchema>;

// ============================================
// Payment Receipt Schema
// ============================================

export const paymentReceiptSchema = z.object({
  receiptNumber: z.string().min(1, 'Receipt number is required'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  paymentDate: z.string().datetime(),
  amount: z.number().positive('Amount must be positive'),
  currency: CurrencyEnum,
  paymentMethod: PaymentMethodTypeEnum,
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid customer email'),
  items: z.array(invoiceItemSchema).optional(),
  subtotal: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  total: z.number().positive('Total must be positive'),
  metadata: z.record(z.unknown()).optional(),
});
export type PaymentReceipt = z.infer<typeof paymentReceiptSchema>;

// ============================================
// Payment Balance Schema
// ============================================

export const paymentBalanceSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  available: z.number().min(0, 'Available balance cannot be negative'),
  pending: z.number().min(0, 'Pending balance cannot be negative'),
  reserved: z.number().min(0, 'Reserved balance cannot be negative'),
  total: z.number().min(0, 'Total balance cannot be negative'),
  currency: CurrencyEnum,
  lastUpdated: z.string().datetime(),
});
export type PaymentBalance = z.infer<typeof paymentBalanceSchema>;

// ============================================
// Dispute Evidence Schema
// ============================================

export const disputeEvidenceSchema = z.object({
  id: z.string().uuid('Invalid evidence ID'),
  type: z.enum(['document', 'image', 'text', 'tracking']),
  content: z.string().min(1, 'Evidence content is required'),
  description: z.string().optional(),
  uploadedAt: z.string().datetime(),
  uploadedBy: z.string().uuid('Invalid user ID'),
});
export type DisputeEvidence = z.infer<typeof disputeEvidenceSchema>;

// ============================================
// Payment Dispute Schema
// ============================================

export const paymentDisputeSchema = z.object({
  id: z.string().uuid('Invalid dispute ID'),
  disputeId: z.string().min(1, 'Dispute ID is required'),
  transactionId: z.string().uuid('Invalid transaction ID'),
  orderId: z.string().uuid().optional(),
  amount: z.number().positive('Dispute amount must be positive'),
  currency: CurrencyEnum,
  status: z.enum(['open', 'under_review', 'resolved', 'won', 'lost']),
  reason: z.string().min(1, 'Dispute reason is required').max(500),
  evidence: z.array(disputeEvidenceSchema).optional(),
  openedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  resolution: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentDispute = z.infer<typeof paymentDisputeSchema>;

// ============================================
// Payment Webhook Event Schema
// ============================================

export const paymentWebhookEventSchema = z.object({
  id: z.string().uuid('Invalid webhook event ID'),
  type: z.string().min(1, 'Event type is required'),
  provider: PaymentProviderEnum,
  data: z.record(z.unknown()),
  receivedAt: z.string().datetime(),
  processed: z.boolean(),
  processedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});
export type PaymentWebhookEvent = z.infer<typeof paymentWebhookEventSchema>;

// ============================================
// DTO Schemas
// ============================================

// Create Payment DTO
export const createPaymentDtoSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  currency: CurrencyEnum,
  paymentMethodId: z.string().uuid('Invalid payment method ID'),
  orderId: z.string().uuid().optional(),
  customerId: z.string().uuid('Invalid customer ID'),
  description: z.string().max(500, 'Description too long').optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type CreatePaymentDto = z.infer<typeof createPaymentDtoSchema>;

// Create Payment Method DTO
export const createPaymentMethodDtoSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  type: PaymentMethodTypeEnum,
  provider: PaymentProviderEnum,
  cardToken: z.string().optional(),
  bankAccountDetails: z.object({
    accountHolderName: z.string().min(1, 'Account holder name is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    routingNumber: z.string().optional(),
    bankName: z.string().min(1, 'Bank name is required'),
    country: z.string().length(2, 'Invalid country code'),
  }).optional(),
  isDefault: z.boolean().optional(),
});
export type CreatePaymentMethodDto = z.infer<typeof createPaymentMethodDtoSchema>;

// Update Payment Method DTO
export const updatePaymentMethodDtoSchema = z.object({
  isDefault: z.boolean().optional(),
  card: z.object({
    expiryMonth: z.number().int().min(1).max(12).optional(),
    expiryYear: z.number().int().min(2024).optional(),
    holderName: z.string().optional(),
  }).optional(),
  bankAccount: z.object({
    accountHolderName: z.string().optional(),
    isDefault: z.boolean().optional(),
  }).optional(),
});
export type UpdatePaymentMethodDto = z.infer<typeof updatePaymentMethodDtoSchema>;

// Create Refund DTO
export const createRefundDtoSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(1, 'Refund reason is required').max(500),
  notifyCustomer: z.boolean().default(true),
});
export type CreateRefundDto = z.infer<typeof createRefundDtoSchema>;

// Create Payout DTO
export const createPayoutDtoSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Payout amount must be positive'),
  currency: CurrencyEnum,
  bankAccountId: z.string().uuid('Invalid bank account ID'),
  description: z.string().max(500).optional(),
});
export type CreatePayoutDto = z.infer<typeof createPayoutDtoSchema>;

// ============================================
// Payment Search Filters Schema
// ============================================

export const paymentSearchFiltersSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  orderId: z.string().uuid('Invalid order ID').optional(),
  status: z.array(PaymentStatusEnum).optional(),
  type: z.array(TransactionTypeEnum).optional(),
  provider: z.array(PaymentProviderEnum).optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  currency: CurrencyEnum.optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  searchQuery: z.string().optional(),
});
export type PaymentSearchFilters = z.infer<typeof paymentSearchFiltersSchema>;

// ============================================
// Payment Verification Result Schema
// ============================================

export const paymentVerificationResultSchema = z.object({
  verified: z.boolean(),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  status: PaymentStatusEnum,
  amount: z.number().positive('Amount must be positive'),
  currency: CurrencyEnum,
  verifiedAt: z.string().datetime(),
  message: z.string().optional(),
});
export type PaymentVerificationResult = z.infer<typeof paymentVerificationResultSchema>;

// ============================================
// Payment Idempotency Key Schema
// ============================================

export const paymentIdempotencyKeySchema = z.object({
  key: z.string().min(1, 'Idempotency key is required'),
  transactionId: z.string().uuid().optional(),
  status: z.enum(['pending', 'completed', 'failed']),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type PaymentIdempotencyKey = z.infer<typeof paymentIdempotencyKeySchema>;

// ============================================
// Recurring Payment Schema
// ============================================

export const recurringPaymentSchema = z.object({
  id: z.string().uuid('Invalid recurring payment ID'),
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: CurrencyEnum,
  interval: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  paymentMethodId: z.string().uuid('Invalid payment method ID'),
  status: z.enum(['active', 'paused', 'cancelled', 'expired']),
  nextPaymentDate: z.string().datetime(),
  lastPaymentDate: z.string().datetime().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  failedAttempts: z.number().int().min(0),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type RecurringPayment = z.infer<typeof recurringPaymentSchema>;

// ============================================
// Payment Settlement Schema
// ============================================

export const paymentSettlementSchema = z.object({
  id: z.string().uuid('Invalid settlement ID'),
  settlementId: z.string().min(1, 'Settlement ID is required'),
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Settlement amount must be positive'),
  currency: CurrencyEnum,
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  transactionIds: z.array(z.string().uuid('Invalid transaction ID')),
  bankAccountId: z.string().uuid('Invalid bank account ID'),
  scheduledDate: z.string().datetime(),
  completedDate: z.string().datetime().optional(),
  failureReason: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentSettlement = z.infer<typeof paymentSettlementSchema>;

// ============================================
// Payment Authorization Schema
// ============================================

export const paymentAuthorizationSchema = z.object({
  authorizationId: z.string().min(1, 'Authorization ID is required'),
  amount: z.number().positive('Authorization amount must be positive'),
  currency: CurrencyEnum,
  status: z.enum(['authorized', 'captured', 'voided', 'expired']),
  paymentMethodId: z.string().uuid('Invalid payment method ID'),
  authorizedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  capturedAt: z.string().datetime().optional(),
  capturedAmount: z.number().positive().optional(),
  voidedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type PaymentAuthorization = z.infer<typeof paymentAuthorizationSchema>;

// ============================================
// Payment Chargeback Schema
// ============================================

export const paymentChargebackSchema = z.object({
  id: z.string().uuid('Invalid chargeback ID'),
  chargebackId: z.string().min(1, 'Chargeback ID is required'),
  transactionId: z.string().uuid('Invalid transaction ID'),
  amount: z.number().positive('Chargeback amount must be positive'),
  currency: CurrencyEnum,
  status: z.enum(['pending', 'under_review', 'won', 'lost']),
  reason: z.string().min(1, 'Chargeback reason is required'),
  reasonCode: z.string().optional(),
  evidence: z.array(disputeEvidenceSchema).optional(),
  dueDate: z.string().datetime().optional(),
  resolvedAt: z.string().datetime().optional(),
  resolution: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentChargeback = z.infer<typeof paymentChargebackSchema>;

// ============================================
// Payment Fee Breakdown Schema
// ============================================

export const paymentFeeBreakdownSchema = z.object({
  subtotal: z.number().min(0, 'Subtotal cannot be negative'),
  platformFee: z.number().min(0, 'Platform fee cannot be negative'),
  processingFee: z.number().min(0, 'Processing fee cannot be negative'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  total: z.number().min(0, 'Total cannot be negative'),
  currency: CurrencyEnum,
  feePercentage: z.number().min(0).max(1, 'Fee percentage must be between 0 and 1'),
});
export type PaymentFeeBreakdown = z.infer<typeof paymentFeeBreakdownSchema>;

// ============================================
// Payment Link Schema
// ============================================

export const paymentLinkSchema = z.object({
  id: z.string().uuid('Invalid payment link ID'),
  linkId: z.string().min(1, 'Link ID is required'),
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Payment link amount must be positive'),
  currency: CurrencyEnum,
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'paid', 'expired', 'cancelled']),
  url: z.string().url('Invalid payment link URL'),
  expiresAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  transactionId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PaymentLink = z.infer<typeof paymentLinkSchema>;

// ============================================
// Payment Notification Preferences Schema
// ============================================

export const paymentNotificationPreferencesSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  emailOnPayment: z.boolean().default(true),
  emailOnRefund: z.boolean().default(true),
  emailOnPayout: z.boolean().default(true),
  smsOnPayment: z.boolean().default(false),
  smsOnRefund: z.boolean().default(false),
  pushOnPayment: z.boolean().default(true),
  pushOnRefund: z.boolean().default(true),
});
export type PaymentNotificationPreferences = z.infer<typeof paymentNotificationPreferencesSchema>;

// ============================================
// Original Schemas (kept for backward compatibility)
// ============================================

export const creditCardSchema = z.object({
  cardNumber: z.string().regex(/^\d{13,19}$/),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(2024).max(2100),
  cvv: z.string().regex(/^\d{3,4}$/),
  cardholderName: z.string().min(1).max(100),
  billingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().length(2),
  }),
});
export type CreditCard = z.infer<typeof creditCardSchema>;

export const paymentMethodCreateSchema = z.object({
  type: z.enum(['card', 'wallet', 'bank_transfer', 'cash_on_delivery', 'escrow']),
  provider: z.enum(['stripe', 'paypal', 'square', 'internal_wallet', 'bank_transfer', 'cash', 'escrow']),
  cardToken: z.string().optional(),
  bankAccountDetails: z.object({
    accountHolderName: z.string(),
    accountNumber: z.string(),
    routingNumber: z.string().optional(),
    bankName: z.string(),
    country: z.string().length(2),
  }).optional(),
  isDefault: z.boolean().optional(),
});
export type PaymentMethodCreate = z.infer<typeof paymentMethodCreateSchema>;

export const paymentProcessSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY']),
  paymentMethodId: z.string().uuid('Invalid payment method ID'),
  orderId: z.string().uuid('Invalid order ID').optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type PaymentProcess = z.infer<typeof paymentProcessSchema>;

export const paymentRefundRequestSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(1, 'Refund reason is required').max(500),
  notifyCustomer: z.boolean().default(true),
});
export type PaymentRefundRequest = z.infer<typeof paymentRefundRequestSchema>;

export const paymentPayoutRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  amount: z.number().positive('Payout amount must be positive'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY']),
  bankAccountId: z.string().uuid('Invalid bank account ID'),
  description: z.string().max(500).optional(),
});
export type PaymentPayoutRequest = z.infer<typeof paymentPayoutRequestSchema>;

export const paymentFilterSchema = z.object({
  status: z.array(z.enum(['pending', 'authorized', 'captured', 'paid', 'processing', 'failed', 'refunded', 'partially_refunded', 'cancelled', 'expired', 'declined'])).optional(),
  type: z.array(z.enum(['payment', 'refund', 'payout', 'transfer', 'deposit', 'withdrawal', 'fee', 'adjustment', 'chargeback'])).optional(),
  provider: z.array(z.enum(['stripe', 'paypal', 'square', 'internal_wallet', 'bank_transfer', 'cash', 'escrow'])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'amount', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type PaymentFilter = z.infer<typeof paymentFilterSchema>;

export const subscriptionCreateSchema = z.object({
  priceId: z.string().min(1),
  paymentMethodId: z.string().uuid(),
  couponCode: z.string().optional(),
  trialDays: z.number().int().min(0).max(365).optional(),
});
export type SubscriptionCreate = z.infer<typeof subscriptionCreateSchema>;

export const subscriptionUpdateSchema = z.object({
  subscriptionId: z.string().uuid(),
  newPriceId: z.string().min(1),
  prorationBehavior: z.enum(['create_prorations', 'none', 'always_invoice']).default('create_prorations'),
});
export type SubscriptionUpdate = z.infer<typeof subscriptionUpdateSchema>;

export const invoiceFilterSchema = z.object({
  customerId: z.string().uuid().optional(),
  status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type InvoiceFilter = z.infer<typeof invoiceFilterSchema>;

// ============================================
// Index Export
// ============================================

export * from './index';