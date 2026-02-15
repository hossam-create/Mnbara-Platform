/**
 * Stripe Connect Service
 * Handles connected account creation, onboarding, and management
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const prisma = new PrismaClient();

export class StripeConnectService {
  /**
   * Create a connected account for a seller/traveler
   */
  async createConnectedAccount(userId: number, email: string, accountType: 'standard' | 'express' = 'standard') {
    try {
      // Check if account already exists
      const existing = await prisma.connectedAccount.findUnique({
        where: { userId },
      });

      if (existing) {
        logger.info(`Connected account already exists for user ${userId}`);
        return existing;
      }

      // Create Stripe connected account
      const account = await stripe.accounts.create({
        type: accountType,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Store in database
      const connectedAccount = await prisma.connectedAccount.create({
        data: {
          userId,
          stripeAccountId: account.id,
          accountType,
          email,
          onboardingStatus: 'PENDING',
          detailsSubmitted: account.details_submitted || false,
          chargesEnabled: account.charges_enabled || false,
          payoutsEnabled: account.payouts_enabled || false,
          country: account.country,
          currency: account.default_currency || 'usd',
        },
      });

      logger.info(`Created connected account ${account.id} for user ${userId}`);
      return connectedAccount;
    } catch (error) {
      logger.error('Error creating connected account:', error);
      throw error;
    }
  }

  /**
   * Create account link for onboarding
   */
  async createAccountLink(userId: number, refreshUrl: string, returnUrl: string) {
    try {
      const connectedAccount = await prisma.connectedAccount.findUnique({
        where: { userId },
      });

      if (!connectedAccount) {
        throw new Error('Connected account not found');
      }

      const accountLink = await stripe.accountLinks.create({
        account: connectedAccount.stripeAccountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      // Update status
      await prisma.connectedAccount.update({
        where: { userId },
        data: { onboardingStatus: 'IN_PROGRESS' },
      });

      logger.info(`Created account link for user ${userId}`);
      return accountLink;
    } catch (error) {
      logger.error('Error creating account link:', error);
      throw error;
    }
  }

  /**
   * Get connected account status
   */
  async getAccountStatus(userId: number) {
    try {
      const connectedAccount = await prisma.connectedAccount.findUnique({
        where: { userId },
      });

      if (!connectedAccount) {
        return null;
      }

      // Fetch latest from Stripe
      const account = await stripe.accounts.retrieve(connectedAccount.stripeAccountId);

      // Update database
      await prisma.connectedAccount.update({
        where: { userId },
        data: {
          detailsSubmitted: account.details_submitted || false,
          chargesEnabled: account.charges_enabled || false,
          payoutsEnabled: account.payouts_enabled || false,
          onboardingStatus: account.details_submitted ? 'COMPLETED' : 'IN_PROGRESS',
          cardPayments: account.capabilities?.card_payments,
          transfers: account.capabilities?.transfers,
        },
      });

      return {
        ...connectedAccount,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
      };
    } catch (error) {
      logger.error('Error getting account status:', error);
      throw error;
    }
  }

  /**
   * Create transfer to connected account
   */
  async createTransfer(
    userId: number,
    amount: number,
    currency: string = 'usd',
    description?: string,
    sourceTransaction?: string,
  ) {
    try {
      const connectedAccount = await prisma.connectedAccount.findUnique({
        where: { userId },
      });

      if (!connectedAccount) {
        throw new Error('Connected account not found');
      }

      if (!connectedAccount.chargesEnabled) {
        throw new Error('Account not ready for transfers');
      }

      // Create transfer
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        destination: connectedAccount.stripeAccountId,
        description,
        source_transaction: sourceTransaction,
      });

      // Store in database
      const dbTransfer = await prisma.transfer.create({
        data: {
          connectedAccountId: connectedAccount.id,
          stripeTransferId: transfer.id,
          amount,
          currency,
          description,
          sourceTransaction,
          status: 'pending',
        },
      });

      logger.info(`Created transfer ${transfer.id} for user ${userId}`);
      return dbTransfer;
    } catch (error) {
      logger.error('Error creating transfer:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(userId: number) {
    try {
      const connectedAccount = await prisma.connectedAccount.findUnique({
        where: { userId },
      });

      if (!connectedAccount) {
        throw new Error('Connected account not found');
      }

      const balance = await stripe.balance.retrieve({
        stripeAccount: connectedAccount.stripeAccountId,
      });

      return balance;
    } catch (error) {
      logger.error('Error getting account balance:', error);
      throw error;
    }
  }

  /**
   * List payouts for connected account
   */
  async listPayouts(userId: number, limit: number = 10) {
    try {
      const connectedAccount = await prisma.connectedAccount.findUnique({
        where: { userId },
      });

      if (!connectedAccount) {
        throw new Error('Connected account not found');
      }

      const payouts = await stripe.payouts.list(
        { limit },
        { stripeAccount: connectedAccount.stripeAccountId },
      );

      return payouts.data;
    } catch (error) {
      logger.error('Error listing payouts:', error);
      throw error;
    }
  }

  /**
   * Create login link for connected account dashboard
   */
  async createLoginLink(userId: number) {
    try {
      const connectedAccount = await prisma.connectedAccount.findUnique({
        where: { userId },
      });

      if (!connectedAccount) {
        throw new Error('Connected account not found');
      }

      const loginLink = await stripe.accounts.createLoginLink(
        connectedAccount.stripeAccountId,
      );

      logger.info(`Created login link for user ${userId}`);
      return loginLink;
    } catch (error) {
      logger.error('Error creating login link:', error);
      throw error;
    }
  }
}
