import { PrismaClient, DisputeStatus, Rating, RatingAudit, RatingStatus, Dispute } from '@prisma/client';

const prisma = new PrismaClient();

export class RatingService {
  /**
   * Create a rating (immutable). One per rater per order.
   */
  static async createRating(params: {
    orderId: number;
    raterId: number;
    score: number;
    comment?: string;
  }): Promise<Rating> {
    const { orderId, raterId, score, comment } = params;

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new Error('Score must be an integer between 1 and 5');
    }
    if (comment && comment.length > 500) {
      throw new Error('Comment too long (max 500 chars)');
    }

    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, buyerId: true, travelerId: true },
      });
      if (!order) throw new Error('Order not found');
      if (order.status !== 'COMPLETED') {
        throw new Error('Rating allowed only after order completion');
      }

      // Block if active dispute
      const activeDispute = await tx.dispute.findFirst({
        where: {
          orderId,
          status: { in: ['OPEN', 'UNDER_REVIEW'] as DisputeStatus[] },
        },
      });
      if (activeDispute) {
        throw new Error('Cannot rate while a dispute is active');
      }

      // Determine ratee
      let rateeId: number | null = null;
      if (raterId === order.buyerId && order.travelerId) {
        rateeId = order.travelerId;
      } else if (raterId === order.travelerId) {
        rateeId = order.buyerId;
      } else {
        throw new Error('Rater is not part of this order');
      }

      // Ensure only one rating per rater/order
      const existing = await tx.rating.findUnique({
        where: { orderId_raterId: { orderId, raterId } },
      });
      if (existing) {
        throw new Error('Rating already submitted for this order');
      }

      // Create rating
      const rating = await tx.rating.create({
        data: {
          orderId,
          raterId,
          rateeId,
          score,
          comment: comment ?? null,
        },
      });

      // Update aggregates on ratee (simple average)
      const ratee = await tx.user.findUnique({ where: { id: rateeId } });
      if (!ratee) throw new Error('Ratee not found');

      const newCount = (ratee.ratingCount ?? 0) + 1;
      const newSum = (ratee.ratingSum ?? 0) + score;
      const newAvg = newCount > 0 ? (newSum / newCount).toFixed(2) : '0.00';

      await tx.user.update({
        where: { id: rateeId },
        data: {
          ratingCount: newCount,
          ratingSum: newSum,
          ratingAverage: newAvg,
        },
      });

      // Audit log
      await tx.ratingAudit.create({
        data: {
          ratingId: rating.id,
          action: 'CREATED',
          performedBy: raterId,
        },
      });

      return rating;
    });
  }

  static async listMyRatings(userId: number) {
    return prisma.rating.findMany({
      where: { raterId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}






