import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateReviewInput {
  productId: string;
  userId: string;
  orderId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface ReviewFilters {
  productId?: string;
  userId?: string;
  rating?: number;
  verified?: boolean;
  sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  page?: number;
  limit?: number;
}

export class ReviewService {
  // Create review
  async createReview(input: CreateReviewInput, verified: boolean = false) {
    try {
      // Check if already reviewed
      const existing = await prisma.review.findUnique({
        where: { orderId: input.orderId }
      });

      if (existing) {
        throw new Error('Order already reviewed');
      }

      // Validate rating
      if (input.rating < 1 || input.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const review = await prisma.review.create({
        data: {
          ...input,
          verified,
          images: input.images || []
        }
      });

      // Update product rating (would call product service)
      await this.updateProductRating(input.productId);

      logger.info(`Review created: ${review.id}`);
      return review;
    } catch (error) {
      logger.error('Create review error:', error);
      throw error;
    }
  }

  // Get reviews
  async getReviews(filters: ReviewFilters) {
    try {
      const {
        productId,
        userId,
        rating,
        verified,
        sortBy = 'recent',
        page = 1,
        limit = 10
      } = filters;

      const where: any = {};
      if (productId) where.productId = productId;
      if (userId) where.userId = userId;
      if (rating) where.rating = rating;
      if (verified !== undefined) where.verified = verified;

      const orderBy: any = {
        recent: { createdAt: 'desc' },
        helpful: { helpful: 'desc' },
        rating_high: { rating: 'desc' },
        rating_low: { rating: 'asc' }
      }[sortBy];

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            votes: {
              select: { userId: true, helpful: true }
            }
          }
        }),
        prisma.review.count({ where })
      ]);

      return {
        reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get reviews error:', error);
      throw error;
    }
  }

  // Get single review
  async getReview(id: string) {
    try {
      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          votes: true
        }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      return review;
    } catch (error) {
      logger.error('Get review error:', error);
      throw error;
    }
  }

  // Update review
  async updateReview(id: string, userId: string, updates: Partial<CreateReviewInput>) {
    try {
      const review = await prisma.review.findUnique({ where: { id } });

      if (!review) {
        throw new Error('Review not found');
      }

      if (review.userId !== userId) {
        throw new Error('Unauthorized');
      }

      // Validate rating if provided
      if (updates.rating && (updates.rating < 1 || updates.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      const updated = await prisma.review.update({
        where: { id },
        data: updates
      });

      // Update product rating if rating changed
      if (updates.rating) {
        await this.updateProductRating(review.productId);
      }

      logger.info(`Review updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error('Update review error:', error);
      throw error;
    }
  }

  // Delete review
  async deleteReview(id: string, userId: string) {
    try {
      const review = await prisma.review.findUnique({ where: { id } });

      if (!review) {
        throw new Error('Review not found');
      }

      if (review.userId !== userId) {
        throw new Error('Unauthorized');
      }

      await prisma.review.delete({ where: { id } });

      // Update product rating
      await this.updateProductRating(review.productId);

      logger.info(`Review deleted: ${id}`);
    } catch (error) {
      logger.error('Delete review error:', error);
      throw error;
    }
  }

  // Vote helpful
  async voteHelpful(reviewId: string, userId: string, helpful: boolean) {
    try {
      await prisma.reviewVote.upsert({
        where: {
          reviewId_userId: { reviewId, userId }
        },
        create: { reviewId, userId, helpful },
        update: { helpful }
      });

      // Update helpful count
      const helpfulCount = await prisma.reviewVote.count({
        where: { reviewId, helpful: true }
      });

      await prisma.review.update({
        where: { id: reviewId },
        data: { helpful: helpfulCount }
      });

      logger.info(`Vote recorded for review: ${reviewId}`);
    } catch (error) {
      logger.error('Vote helpful error:', error);
      throw error;
    }
  }

  // Report review
  async reportReview(id: string, userId: string) {
    try {
      await prisma.review.update({
        where: { id },
        data: { reported: true }
      });

      logger.info(`Review reported: ${id} by user: ${userId}`);
    } catch (error) {
      logger.error('Report review error:', error);
      throw error;
    }
  }

  // Get product rating summary
  async getProductRatingSummary(productId: string) {
    try {
      const reviews = await prisma.review.findMany({
        where: { productId },
        select: { rating: true }
      });

      if (reviews.length === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / reviews.length;

      const ratingDistribution = reviews.reduce((dist, r) => {
        dist[r.rating] = (dist[r.rating] || 0) + 1;
        return dist;
      }, {} as Record<number, number>);

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        ratingDistribution: {
          1: ratingDistribution[1] || 0,
          2: ratingDistribution[2] || 0,
          3: ratingDistribution[3] || 0,
          4: ratingDistribution[4] || 0,
          5: ratingDistribution[5] || 0
        }
      };
    } catch (error) {
      logger.error('Get rating summary error:', error);
      throw error;
    }
  }

  // Update product rating (would call product service in real implementation)
  private async updateProductRating(productId: string) {
    try {
      const summary = await this.getProductRatingSummary(productId);
      
      // In real implementation, call product service API
      logger.info(`Product ${productId} rating updated: ${summary.averageRating}`);
      
      // TODO: Call product service
      // await axios.put(`${PRODUCT_SERVICE_URL}/products/${productId}/rating`, {
      //   rating: summary.averageRating,
      //   reviewCount: summary.totalReviews
      // });
    } catch (error) {
      logger.error('Update product rating error:', error);
    }
  }

  // Get user's review for product
  async getUserReviewForProduct(userId: string, productId: string) {
    try {
      const review = await prisma.review.findFirst({
        where: { userId, productId }
      });

      return review;
    } catch (error) {
      logger.error('Get user review error:', error);
      throw error;
    }
  }
}
