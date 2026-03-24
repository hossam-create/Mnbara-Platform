import { PrismaClient } from '@prisma/client';

// Using 'any' for PrismaClient here because we cannot run 'prisma generate' in this environment
// to pick up the new PaymentEvent model immediately.
const prisma = new PrismaClient();

export const paymentEventService = {
  /**
   * Check if a webhook event has already been recorded
   */
  async findEvent(gateway: string, eventId: string) {
    return (prisma as any).paymentEvent.findUnique({
      where: {
        gateway_eventId: {
          gateway,
          eventId,
        },
      },
    });
  },

  /**
   * Log a new webhook event before processing
   * If it fails with unique constraint, it means it already exists (race condition)
   */
  async createEvent(data: { gateway: string; eventId: string; eventType: string; payload: any }) {
    try {
      return await (prisma as any).paymentEvent.create({
        data: {
          gateway: data.gateway,
          eventId: data.eventId,
          eventType: data.eventType,
          payload: data.payload,
          processed: false,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Already exists, return null or fetch existing
        return this.findEvent(data.gateway, data.eventId);
      }
      throw error;
    }
  },

  /**
   * Mark event as processed (success or failed with error)
   */
  async markProcessed(id: string, error?: string, tx?: any) {
    const client = tx || prisma;
    return (client as any).paymentEvent.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date(),
        processingError: error || null,
      },
    });
  },
};
