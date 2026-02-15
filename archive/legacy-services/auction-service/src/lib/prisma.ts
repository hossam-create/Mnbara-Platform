/**
 * Shared Prisma Client Instance
 * 
 * This module provides a singleton instance of PrismaClient to be used
 * across all services. This ensures:
 * - Single database connection pool
 * - Proper connection lifecycle management
 * - Better resource utilization
 * - Easier testing and mocking
 */

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

/**
 * Get or create the shared Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
    });
  }
  return prisma;
}

/**
 * Disconnect the Prisma client
 * Call this during application shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const prisma = getPrismaClient();

export default prisma;
