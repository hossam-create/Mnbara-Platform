// ============================================================
// PHASE 4.1 — Wallet Service (v2)
// Business logic layer - ledger-first, integer money
// ============================================================

import { walletRepository } from '../repositories/wallet.repository';
import {
  Wallet,
  WalletWithBalance,
  LedgerEntry,
  OwnerType,
  WalletStatus,
  LedgerFilterOptions,
  PaginatedResponse,
} from '../types';
import {
  CreateWalletDto,
  WalletResponseDto,
  LedgerEntryResponseDto,
  WalletValidation,
} from '../dto/wallet.dto';
import {
  WalletNotFoundError,
  InvalidCurrencyError,
  ValidationError,
} from '../errors/wallet.errors';
import { formatMoney, formatDecimal } from '../utils/money';

/**
 * Wallet Service - Phase 4.1
 * 
 * Core operations:
 * - createWallet: Create new wallet for owner
 * - getWallet: Get wallet by ID
 * - getWalletBalance: Get balance (computed from ledger)
 * - listWalletLedgers: Get ledger entries with filtering
 */
export const walletServiceV2 = {
  // ============================================================
  // WALLET OPERATIONS
  // ============================================================

  /**
   * Create a new wallet
   * 
   * @param dto - Create wallet parameters
   * @returns Created wallet with zero balance
   */
  async createWallet(dto: CreateWalletDto): Promise<WalletResponseDto> {
    // Validate owner type
    if (!WalletValidation.isValidOwnerType(dto.ownerType)) {
      throw new ValidationError(
        `Invalid owner type: ${dto.ownerType}. Must be one of: USER, SELLER, TRAVELER, SYSTEM`,
        'نوع المالك غير صالح'
      );
    }

    // Validate owner ID
    if (!dto.ownerId || dto.ownerId.trim().length === 0) {
      throw new ValidationError('Owner ID is required', 'معرف المالك مطلوب');
    }

    // Validate currency (default to EGP)
    const currency = (dto.currency || 'EGP').toUpperCase();
    if (!WalletValidation.isValidCurrency(currency)) {
      throw new InvalidCurrencyError(currency);
    }

    // Create wallet
    const wallet = await walletRepository.createWallet(
      dto.ownerType as OwnerType,
      dto.ownerId.trim(),
      currency
    );

    // Return with zero balance (new wallet)
    return this.toWalletResponse(wallet, BigInt(0));
  },

  /**
   * Get wallet by ID
   * 
   * @param walletId - Wallet unique identifier
   * @returns Wallet with current balance
   */
  async getWallet(walletId: string): Promise<WalletResponseDto> {
    // Validate wallet ID
    if (!walletId || walletId.trim().length === 0) {
      throw new ValidationError('Wallet ID is required', 'معرف المحفظة مطلوب');
    }

    // Get wallet with balance
    const walletWithBalance = await walletRepository.getWalletWithBalance(walletId);

    if (!walletWithBalance) {
      throw new WalletNotFoundError(walletId);
    }

    return this.toWalletResponse(walletWithBalance, walletWithBalance.balance);
  },

  /**
   * Get wallet by owner
   * 
   * @param ownerType - Type of owner
   * @param ownerId - Owner identifier
   * @param currency - Currency code (default: EGP)
   * @returns Wallet with current balance
   */
  async getWalletByOwner(
    ownerType: OwnerType,
    ownerId: string,
    currency: string = 'EGP'
  ): Promise<WalletResponseDto | null> {
    const wallet = await walletRepository.getWalletByOwner(ownerType, ownerId, currency);

    if (!wallet) {
      return null;
    }

    const balance = await walletRepository.computeBalance(wallet.id);
    return this.toWalletResponse(wallet, balance);
  },

  /**
   * Get wallet balance (computed from ledger)
   * 
   * @param walletId - Wallet unique identifier
   * @returns Balance in minor units
   */
  async getWalletBalance(walletId: string): Promise<{
    walletId: string;
    balance: string;
    balanceFormatted: string;
    currency: string;
  }> {
    // Validate wallet ID
    if (!walletId || walletId.trim().length === 0) {
      throw new ValidationError('Wallet ID is required', 'معرف المحفظة مطلوب');
    }

    // Get wallet to verify it exists and get currency
    const wallet = await walletRepository.getWalletById(walletId);

    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    // Compute balance from ledger
    const balance = await walletRepository.computeBalance(walletId);

    return {
      walletId,
      balance: balance.toString(),
      balanceFormatted: formatMoney(balance, wallet.currency),
      currency: wallet.currency,
    };
  },

  /**
   * List wallet ledger entries with filtering
   * 
   * @param walletId - Wallet unique identifier
   * @param options - Filter and pagination options
   * @returns Paginated ledger entries
   */
  async listWalletLedgers(
    walletId: string,
    options: LedgerFilterOptions = {}
  ): Promise<PaginatedResponse<LedgerEntryResponseDto>> {
    // Validate wallet ID
    if (!walletId || walletId.trim().length === 0) {
      throw new ValidationError('Wallet ID is required', 'معرف المحفظة مطلوب');
    }

    // Verify wallet exists
    const wallet = await walletRepository.getWalletById(walletId);

    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    // Apply defaults and limits
    const safeOptions: LedgerFilterOptions = {
      ...options,
      limit: Math.min(options.limit || 20, 100), // Max 100 per page
      offset: options.offset || 0,
    };

    // Get ledger entries
    const result = await walletRepository.listLedgerEntries(walletId, safeOptions);

    // Map to response DTOs
    return {
      data: result.data.map((entry) => this.toLedgerEntryResponse(entry, wallet.currency)),
      pagination: result.pagination,
    };
  },

  /**
   * Verify wallet balance integrity
   * Compares running balance with sum of all entries
   * 
   * @param walletId - Wallet unique identifier
   * @returns Integrity check result
   */
  async verifyBalanceIntegrity(walletId: string): Promise<{
    walletId: string;
    runningBalance: string;
    computedBalance: string;
    isValid: boolean;
  }> {
    const wallet = await walletRepository.getWalletById(walletId);

    if (!wallet) {
      throw new WalletNotFoundError(walletId);
    }

    const runningBalance = await walletRepository.computeBalance(walletId);
    const computedBalance = await walletRepository.verifyBalance(walletId);

    return {
      walletId,
      runningBalance: runningBalance.toString(),
      computedBalance: computedBalance.toString(),
      isValid: runningBalance === computedBalance,
    };
  },

  // ============================================================
  // RESPONSE MAPPERS
  // ============================================================

  /**
   * Map wallet entity to response DTO
   */
  toWalletResponse(wallet: Wallet, balance: bigint): WalletResponseDto {
    return {
      id: wallet.id,
      ownerType: wallet.ownerType,
      ownerId: wallet.ownerId,
      currency: wallet.currency,
      status: wallet.status,
      balance: balance.toString(),
      balanceFormatted: formatMoney(balance, wallet.currency),
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
    };
  },

  /**
   * Map ledger entry entity to response DTO
   */
  toLedgerEntryResponse(entry: LedgerEntry, currency: string): LedgerEntryResponseDto {
    return {
      id: entry.id,
      walletId: entry.walletId,
      entryType: entry.entryType,
      amount: entry.amount.toString(),
      amountFormatted: formatMoney(entry.amount, currency),
      reason: entry.reason,
      description: entry.description,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      balanceAfter: entry.balanceAfter.toString(),
      balanceAfterFormatted: formatMoney(entry.balanceAfter, currency),
      createdAt: entry.createdAt.toISOString(),
      createdBy: entry.createdBy,
    };
  },
};
