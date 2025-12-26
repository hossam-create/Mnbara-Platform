import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * Customer ID Service
 * Generates unique, memorable, and trackable customer IDs
 */

export class CustomerIDService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate unique Customer ID with multiple formats
   * 
   * Formats:
   * 1. Standard: MNB-2025-001234 (Mnbara-Year-Sequential)
   * 2. Short: MNB001234 (Compact)
   * 3. UUID: mnb_550e8400-e29b-41d4-a716-446655440000 (Unique)
   * 4. Numeric: 1704067200001234 (Timestamp-based)
   */
  async generateCustomerID(userId: string, userType: 'buyer' | 'seller' | 'traveler') {
    try {
      // Get sequential number
      const sequentialNumber = await this.getNextSequentialNumber(userType);
      
      // Generate all formats
      const year = new Date().getFullYear();
      const standardID = `MNB-${year}-${String(sequentialNumber).padStart(6, '0')}`;
      const shortID = `MNB${String(sequentialNumber).padStart(6, '0')}`;
      const uuidID = `mnb_${crypto.randomUUID()}`;
      const numericID = `${Date.now()}${String(sequentialNumber).padStart(6, '0')}`;
      
      // Store in database
      const customerID = await this.prisma.customerID.create({
        data: {
          userId,
          userType,
          standardID,
          shortID,
          uuidID,
          numericID,
          sequentialNumber,
          createdAt: new Date(),
          isActive: true,
        },
      });

      return {
        userId,
        standardID: customerID.standardID,      // MNB-2025-001234
        shortID: customerID.shortID,            // MNB001234
        uuidID: customerID.uuidID,              // mnb_550e8400...
        numericID: customerID.numericID,        // 1704067200001234
        sequentialNumber: customerID.sequentialNumber,
        createdAt: customerID.createdAt,
        qrCode: this.generateQRCode(customerID.standardID),
        barcode: this.generateBarcode(customerID.shortID),
      };
    } catch (error) {
      throw new Error(`Failed to generate Customer ID: ${error.message}`);
    }
  }

  /**
   * Get next sequential number for user type
   */
  private async getNextSequentialNumber(userType: string): Promise<number> {
    const counter = await this.prisma.customerIDCounter.findUnique({
      where: { userType },
    });

    if (!counter) {
      const newCounter = await this.prisma.customerIDCounter.create({
        data: {
          userType,
          currentNumber: 1,
        },
      });
      return 1;
    }

    const updated = await this.prisma.customerIDCounter.update({
      where: { userType },
      data: { currentNumber: counter.currentNumber + 1 },
    });

    return updated.currentNumber;
  }

  /**
   * Generate QR Code data
   */
  private generateQRCode(customerID: string): string {
    return `https://mnbara.com/customer/${customerID}`;
  }

  /**
   * Generate Barcode data
   */
  private generateBarcode(shortID: string): string {
    // Convert to barcode format (Code128)
    return shortID;
  }

  /**
   * Get customer by any ID format
   */
  async getCustomerByID(id: string) {
    return await this.prisma.customerID.findFirst({
      where: {
        OR: [
          { standardID: id },
          { shortID: id },
          { uuidID: id },
          { numericID: id },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    const totalCustomers = await this.prisma.customerID.count();
    const byType = await this.prisma.customerID.groupBy({
      by: ['userType'],
      _count: true,
    });

    const activeCustomers = await this.prisma.customerID.count({
      where: { isActive: true },
    });

    return {
      totalCustomers,
      activeCustomers,
      byType: byType.map(t => ({
        type: t.userType,
        count: t._count,
      })),
    };
  }

  /**
   * Deactivate customer ID
   */
  async deactivateCustomerID(customerID: string) {
    return await this.prisma.customerID.update({
      where: { standardID: customerID },
      data: { isActive: false },
    });
  }

  /**
   * Export customer IDs (for printing/distribution)
   */
  async exportCustomerIDs(limit: number = 100) {
    const customers = await this.prisma.customerID.findMany({
      take: limit,
      select: {
        standardID: true,
        shortID: true,
        userType: true,
        createdAt: true,
      },
    });

    return customers.map(c => ({
      'Customer ID': c.standardID,
      'Short ID': c.shortID,
      'Type': c.userType,
      'Created': c.createdAt.toISOString(),
    }));
  }
}
