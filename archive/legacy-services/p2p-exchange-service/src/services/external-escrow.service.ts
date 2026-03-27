import { Decimal } from 'decimal.js';
import { PrismaClient } from '@prisma/client';
import {
  ExternalEscrowAdapter,
  EscrowMetadata,
  EscrowCreationResult,
  EscrowStatus,
  EscrowStatusResult,
  WebhookPayload,
  WebhookResult
} from '../adapters/escrow/ExternalEscrowAdapter';
import { TatumEscrowAdapter } from '../adapters/escrow/TatumEscrowAdapter';

const prisma = new PrismaClient();

/**
 * External Escrow Provider Information
 */
export interface ExternalEscrowProvider {
  id: number;
  name: string;
  type: string;
  feePercentage: Decimal;
  feeFixed?: Decimal;
  minAmount?: Decimal;
  maxAmount?: Decimal;
  settlementTime: number; // in minutes
  country?: string;
  priority: number;
  enabled: boolean;
  recommended?: boolean;
}

/**
 * External Escrow Service
 * 
 * Manages external escrow providers and coordinates escrow operations.
 * Supports multiple providers (Tatum, Stripe, PayPal, etc.) through adapters.
 * 
 * Features:
 * - Multi-provider support
 * - Provider selection and recommendation
 * - Escrow lifecycle management
 * - Webhook handling
 * - Fee calculation
 */
export class ExternalEscrowService {
  private adapters: Map<string, ExternalEscrowAdapter> = new Map();

  constructor() {
    this.initializeAdapters();
  }

  /**
   * Initialize escrow provider adapters
   */
  private initializeAdapters(): void {
    // Initialize Tatum adapter
    if (process.env.TATUM_API_KEY && process.env.TATUM_WEBHOOK_SECRET) {
      const tatumAdapter = new TatumEscrowAdapter(
        process.env.TATUM_API_KEY,
        process.env.TATUM_WEBHOOK_SECRET
      );
      this.adapters.set('tatum', tatumAdapter);
    }

    // Add more adapters here (Stripe, PayPal, etc.)
  }

  /**
   * Get available escrow providers
   */
  async getAvailableProviders(
    amount: Decimal,
    currency: string,
    country?: string
  ): Promise<ExternalEscrowProvider[]> {
    // Get all enabled providers from database
    const providers = await prisma.externalEscrowProvider.findMany({
      where: {
        enabled: true,
        OR: [
          { minAmount: null },
          { minAmount: { lte: amount } }
        ],
        AND: [
          {
            OR: [
              { maxAmount: null },
              { maxAmount: { gte: amount } }
            ]
          }
        ]
      },
      orderBy: {
        priority: 'desc'
      }
    });

    return providers.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      feePercentage: new Decimal(p.feePercentage),
      feeFixed: p.feeFixed ? new Decimal(p.feeFixed) : undefined,
      minAmount: p.minAmount ? new Decimal(p.minAmount) : undefined,
      maxAmount: p.maxAmount ? new Decimal(p.maxAmount) : undefined,
      settlementTime: p.settlementTime,
      country: p.country || undefined,
      priority: p.priority,
      enabled: p.enabled
    }));
  }

  /**
   * Get a specific provider by ID
   */
  async getProvider(providerId: number): Promise<ExternalEscrowProvider> {
    const provider = await prisma.externalEscrowProvider.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      feePercentage: new Decimal(provider.feePercentage),
      feeFixed: provider.feeFixed ? new Decimal(provider.feeFixed) : undefined,
      minAmount: provider.minAmount ? new Decimal(provider.minAmount) : undefined,
      maxAmount: provider.maxAmount ? new Decimal(provider.maxAmount) : undefined,
      settlementTime: provider.settlementTime,
      country: provider.country || undefined,
      priority: provider.priority,
      enabled: provider.enabled
    };
  }

  /**
   * Create external escrow
   */
  async createExternalEscrow(
    matchId: number,
    providerId: number,
    amount: Decimal,
    currency: string,
    metadata: EscrowMetadata
  ): Promise<string> {
    // Get provider
    const provider = await this.getProvider(providerId);

    if (!provider.enabled) {
      throw new Error(`Provider is disabled: ${provider.name}`);
    }

    // Get adapter
    const adapter = this.adapters.get(provider.type.toLowerCase());
    if (!adapter) {
      throw new Error(`No adapter found for provider type: ${provider.type}`);
    }

    // Create escrow
    const result = await adapter.createEscrow(amount, currency, metadata);

    // Save to database
    await prisma.externalEscrow.create({
      data: {
        matchId,
        providerId,
        externalEscrowId: result.escrowId,
        amount,
        currency,
        status: result.status,
        createdAt: result.createdAt,
        expiresAt: result.expiresAt
      }
    });

    return result.escrowId;
  }

  /**
   * Release external escrow
   */
  async releaseExternalEscrow(escrowId: string, providerId: number): Promise<void> {
    // Get provider
    const provider = await this.getProvider(providerId);

    // Get adapter
    const adapter = this.adapters.get(provider.type.toLowerCase());
    if (!adapter) {
      throw new Error(`No adapter found for provider type: ${provider.type}`);
    }

    // Release escrow
    await adapter.releaseEscrow(escrowId);

    // Update database
    await prisma.externalEscrow.updateMany({
      where: { externalEscrowId: escrowId },
      data: {
        status: EscrowStatus.RELEASED,
        releasedAt: new Date()
      }
    });
  }

  /**
   * Refund external escrow
   */
  async refundExternalEscrow(escrowId: string, providerId: number): Promise<void> {
    // Get provider
    const provider = await this.getProvider(providerId);

    // Get adapter
    const adapter = this.adapters.get(provider.type.toLowerCase());
    if (!adapter) {
      throw new Error(`No adapter found for provider type: ${provider.type}`);
    }

    // Refund escrow
    await adapter.refundEscrow(escrowId);

    // Update database
    await prisma.externalEscrow.updateMany({
      where: { externalEscrowId: escrowId },
      data: {
        status: EscrowStatus.REFUNDED,
        refundedAt: new Date()
      }
    });
  }

  /**
   * Get escrow status
   */
  async getEscrowStatus(escrowId: string, providerId: number): Promise<EscrowStatusResult> {
    // Get provider
    const provider = await this.getProvider(providerId);

    // Get adapter
    const adapter = this.adapters.get(provider.type.toLowerCase());
    if (!adapter) {
      throw new Error(`No adapter found for provider type: ${provider.type}`);
    }

    // Get status from provider
    const status = await adapter.getStatus(escrowId);

    // Update database
    await prisma.externalEscrow.updateMany({
      where: { externalEscrowId: escrowId },
      data: {
        status: status.status,
        updatedAt: status.updatedAt
      }
    });

    return status;
  }

  /**
   * Handle provider webhook
   */
  async handleProviderWebhook(
    providerType: string,
    payload: WebhookPayload
  ): Promise<WebhookResult> {
    // Get adapter
    const adapter = this.adapters.get(providerType.toLowerCase());
    if (!adapter) {
      throw new Error(`No adapter found for provider type: ${providerType}`);
    }

    // Handle webhook
    const result = await adapter.handleWebhook(payload);

    // Update database if processed successfully
    if (result.processed && result.escrowId && result.status) {
      await prisma.externalEscrow.updateMany({
        where: { externalEscrowId: result.escrowId },
        data: {
          status: result.status,
          updatedAt: new Date()
        }
      });
    }

    return result;
  }

  /**
   * Calculate provider fee
   */
  calculateProviderFee(amount: Decimal, provider: ExternalEscrowProvider): Decimal {
    let fee = amount.mul(provider.feePercentage).div(100);
    if (provider.feeFixed) {
      fee = fee.plus(provider.feeFixed);
    }
    return fee;
  }

  /**
   * Recommend best provider for transaction
   */
  async recommendProvider(
    amount: Decimal,
    currency: string,
    country?: string
  ): Promise<ExternalEscrowProvider | null> {
    const providers = await this.getAvailableProviders(amount, currency, country);

    if (providers.length === 0) {
      return null;
    }

    // Calculate score for each provider
    const providersWithScore = providers.map(p => ({
      ...p,
      score: this.calculateProviderScore(p, amount, country)
    }));

    // Sort by score (highest first)
    providersWithScore.sort((a, b) => b.score - a.score);

    // Mark as recommended
    const recommended = providersWithScore[0];
    recommended.recommended = true;

    return recommended;
  }

  /**
   * Calculate provider score for recommendation
   */
  private calculateProviderScore(
    provider: ExternalEscrowProvider,
    amount: Decimal,
    country?: string
  ): number {
    let score = 0;

    // Priority weight (0-100)
    score += provider.priority * 10;

    // Local provider bonus (+20)
    if (country && provider.country === country) {
      score += 20;
    }

    // Settlement time (faster is better, 0-20)
    score += Math.max(0, 20 - (provider.settlementTime / 60));

    // Fee (lower is better, 0-20)
    const feePercentage = provider.feePercentage.toNumber();
    score += Math.max(0, 20 - (feePercentage * 4));

    return score;
  }
}
