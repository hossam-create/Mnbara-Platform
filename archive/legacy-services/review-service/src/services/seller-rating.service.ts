import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateSellerRatingInput {
  sellerId: string;
  buyerId: string;
  orderId: string;
  rating: number;
  categories: {
    communication: number;
    shipping: number;
    quality: number;
  };
  comment?: string;
}

export class SellerRatingService {
  // Create seller rating
  async createRating(input: CreateSellerRatingInput) {
    try {
      // Check if already rated
      const existing = await prisma.sellerRating.findUnique({
        where: { orderId: input.orderId }
      });

      if (existing) {
        throw new Error('Order already rated');
      }

      // Validate ratings
      if (input.rating < 1 || input.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const { communication, shipping, quality } = input.categories;
      if (
        communication < 1 || communication > 5 ||
        shipping < 1 || shipping > 5 ||
        quality < 1 || quality > 5
      ) {
        throw new Error('Category ratings must be between 1 and 5');
      }

      const rating = await prisma.sellerRating.create({
        data: input
      });

      logger.info(`Seller rating created: ${rating.id}`);
      return rating;
    } catch (error) {
      logger.error('Create seller rating error:', error);
      throw error;
    }
  }

  // Get seller ratings
  async getSellerRatings(sellerId: string, page: number = 1, limit: number = 10) {
    try {
      const [ratings, total] = await Promise.all([
        prisma.sellerRating.findMany({
          where: { sellerId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.sellerRating.count({ where: { sellerId } })
      ]);

      return {
        ratings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get seller ratings error:', error);
      throw error;
    }
  }

  // Get seller rating summary
  async getSellerRatingSummary(sellerId: string) {
    try {
      const ratings = await prisma.sellerRating.findMany({
        where: { sellerId },
        select: { rating: true, categories: true }
      });

      if (ratings.length === 0) {
        return {
          averageRating: 0,
          totalRatings: 0,
          categoryAverages: {
            communication: 0,
            shipping: 0,
            quality: 0
          }
        };
      }

      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / ratings.length;

      // Calculate category averages
      const categoryTotals = ratings.reduce(
        (totals, r) => {
          const cats = r.categories as any;
          return {
            communication: totals.communication + cats.communication,
            shipping: totals.shipping + cats.shipping,
            quality: totals.quality + cats.quality
          };
        },
        { communication: 0, shipping: 0, quality: 0 }
      );

      const categoryAverages = {
        communication: Math.round((categoryTotals.communication / ratings.length) * 10) / 10,
        shipping: Math.round((categoryTotals.shipping / ratings.length) * 10) / 10,
        quality: Math.round((categoryTotals.quality / ratings.length) * 10) / 10
      };

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: ratings.length,
        categoryAverages
      };
    } catch (error) {
      logger.error('Get seller rating summary error:', error);
      throw error;
    }
  }

  // Get buyer's rating for seller
  async getBuyerRatingForSeller(buyerId: string, sellerId: string) {
    try {
      const rating = await prisma.sellerRating.findFirst({
        where: { buyerId, sellerId }
      });

      return rating;
    } catch (error) {
      logger.error('Get buyer rating error:', error);
      throw error;
    }
  }
}
