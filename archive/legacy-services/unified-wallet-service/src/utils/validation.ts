import Joi from 'joi';
import { Currency, WalletType, TransactionType } from '@prisma/client';

const currencies = Object.values(Currency);
const walletTypes = Object.values(WalletType);
const transactionTypes = Object.values(TransactionType);

// Wallet validation schemas
export const validateWalletCreation = Joi.object({
  userId: Joi.string().uuid().required(),
  currency: Joi.string().valid(...currencies).default('USD'),
  type: Joi.string().valid(...walletTypes).default('USER'),
});

export const validateWalletUpdate = Joi.object({
  creditLimit: Joi.number().positive().optional(),
  isActive: Joi.boolean().optional(),
}).min(1); // At least one field must be provided

// Transaction validation schemas
export const validateDeposit = Joi.object({
  walletId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(8).required(),
  currency: Joi.string().valid(...currencies).default('USD'),
  description: Joi.string().max(255).optional(),
  referenceId: Joi.string().max(100).optional(),
  metadata: Joi.object().optional(),
});

export const validateWithdrawal = Joi.object({
  walletId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(8).required(),
  currency: Joi.string().valid(...currencies).default('USD'),
  description: Joi.string().max(255).optional(),
  referenceId: Joi.string().max(100).optional(),
  metadata: Joi.object().optional(),
});

export const validateTransfer = Joi.object({
  sourceWalletId: Joi.string().uuid().required(),
  destinationWalletId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(8).required(),
  currency: Joi.string().valid(...currencies).default('USD'),
  description: Joi.string().max(255).optional(),
  referenceId: Joi.string().max(100).optional(),
  metadata: Joi.object().optional(),
});

// Exchange validation schemas
export const validateExchangeRate = Joi.object({
  fromCurrency: Joi.string().valid(...currencies).required(),
  toCurrency: Joi.string().valid(...currencies).required(),
  rate: Joi.number().positive().precision(8).required(),
  spread: Joi.number().min(0).max(1).default(0),
  effectiveFrom: Joi.date().iso().default(() => new Date().toISOString()),
  effectiveTo: Joi.date().iso().optional(),
});

export const validateExchange = Joi.object({
  sourceWalletId: Joi.string().uuid().required(),
  destinationWalletId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(8).required(),
  fromCurrency: Joi.string().valid(...currencies).required(),
  toCurrency: Joi.string().valid(...currencies).required(),
  description: Joi.string().max(255).optional(),
  referenceId: Joi.string().max(100).optional(),
  metadata: Joi.object().optional(),
});

// KYC validation schemas
export const validateKycDocument = Joi.object({
  type: Joi.string().valid('passport', 'drivers_license', 'national_id', 'utility_bill', 'bank_statement').required(),
  documentNumber: Joi.string().max(50).optional(),
  issuingCountry: Joi.string().length(2).uppercase().optional(), // ISO 3166-1 alpha-2
  expiryDate: Joi.date().iso().optional(),
  fileUrl: Joi.string().uri().required(),
  fileHash: Joi.string().hex().length(64).required(), // SHA256 hash
  metadata: Joi.object().optional(),
});

// Settlement validation schemas
export const validateSettlement = Joi.object({
  walletId: Joi.string().uuid().required(),
  batchId: Joi.string().max(50).required(),
  totalAmount: Joi.number().positive().precision(8).required(),
  currency: Joi.string().valid(...currencies).default('USD'),
  metadata: Joi.object().optional(),
});

// Pagination validation
export const validatePagination = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'amount', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Date range validation
export const validateDateRange = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
}).custom((value, helpers) => {
  if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
    return helpers.error('dateRange.invalid');
  }
  return value;
}).messages({
  'dateRange.invalid': 'startDate must be before endDate',
});

// Common query validation
export const validateCommonQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'amount', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  currency: Joi.string().valid(...currencies).optional(),
  type: Joi.string().valid(...transactionTypes).optional(),
  status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED').optional(),
}).custom((value, helpers) => {
  if (value.startDate && value.endDate && new Date(value.startDate) > new Date(value.endDate)) {
    return helpers.error('dateRange.invalid');
  }
  return value;
}).messages({
  'dateRange.invalid': 'startDate must be before endDate',
});

// Utility functions
export const validateRequest = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }
    
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }
    
    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid URL parameters',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }
    
    req.params = value;
    next();
  };
};