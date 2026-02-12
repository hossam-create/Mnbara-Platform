import { z } from 'zod';

export const paymentMethodSchema = z.object({
  type: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'apple_pay', 'google_pay']),
  cardLast4: z.string().length(4).optional(),
  cardBrand: z.enum(['visa', 'mastercard', 'amex', 'discover', 'jcb', 'unionpay']).optional(),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).max(2100).optional(),
  isDefault: z.boolean().optional(),
  billingAddressId: z.string().uuid().optional(),
});
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

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

export const paymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  paymentMethodId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string()).optional(),
});
export type PaymentIntent = z.infer<typeof paymentIntentSchema>;

export const refundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().optional(),
  reason: z.string().min(10).max(500),
  refundMethod: z.enum(['original', 'store_credit', 'bank_transfer']).default('original'),
});
export type Refund = z.infer<typeof refundSchema>;

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

export const payoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  destinationId: z.string().min(1),
  description: z.string().max(500).optional(),
});
export type Payout = z.infer<typeof payoutSchema>;

export const bankAccountSchema = z.object({
  accountHolderName: z.string().min(1),
  routingNumber: z.string().regex(/^\d{9}$/),
  accountNumber: z.string().regex(/^\d{4,17}$/),
  accountType: z.enum(['checking', 'savings']),
  country: z.string().length(2),
  currency: z.string().length(3).default('USD'),
});
export type BankAccount = z.infer<typeof bankAccountSchema>;
