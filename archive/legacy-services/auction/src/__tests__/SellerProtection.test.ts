import { SellerProtectionService } from '../services/SellerProtection.service';
import { SellerProtectionTrigger, SellerProtectionStatus, AutoRelistStatus } from '../types/SellerProtection.types';
import { sellerProtectionConfig } from '../config/sellerProtection.config';

describe('Seller Protection Service', () => {
  let sellerProtectionService: SellerProtectionService;

  beforeEach(() => {
    sellerProtectionService = new SellerProtectionService();
  });

  afterEach(() => {
    sellerProtectionService.reset();
  });

  describe('Seller Protection Creation', () => {
    it('should create seller protection for payment failure', async () => {
      const request = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const result = sellerProtectionService.createSellerProtection(request);

      expect(result.success).toBe(true);
      expect(result.sellerProtection).toBeDefined();
      expect(result.sellerProtection?.trigger).toBe(SellerProtectionTrigger.PAYMENT_FAILURE);
      expect(result.sellerProtection?.status).toBe(SellerProtectionStatus.PROTECTED);
      expect(result.sellerProtection?.protectionData.paymentFailureReason).toBe('Payment method declined');
    });

    it('should create seller protection for settlement expiry', async () => {
      const request = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.SETTLEMENT_EXPIRED,
        triggerData: {
          settlementExpiryReason: 'Settlement expired without completion'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const result = sellerProtectionService.createSellerProtection(request);

      expect(result.success).toBe(true);
      expect(result.sellerProtection?.trigger).toBe(SellerProtectionTrigger.SETTLEMENT_EXPIRED);
      expect(result.sellerProtection?.protectionData.settlementExpiryReason).toBe('Settlement expired without completion');
    });

    it('should create seller protection for buyer blocked', async () => {
      const request = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.BUYER_BLOCKED,
        triggerData: {
          buyerBlockReason: 'Buyer violated terms of service'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const result = sellerProtectionService.createSellerProtection(request);

      expect(result.success).toBe(true);
      expect(result.sellerProtection?.trigger).toBe(SellerProtectionTrigger.BUYER_BLOCKED);
      expect(result.sellerProtection?.protectionData.buyerBlockReason).toBe('Buyer violated terms of service');
    });

    it('should reject duplicate protection for same auction', async () => {
      const request = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      // First protection should succeed
      const firstResult = sellerProtectionService.createSellerProtection(request);
      expect(firstResult.success).toBe(true);

      // Second protection should fail
      const secondResult = sellerProtectionService.createSellerProtection(request);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const invalidRequest = {
        originalAuctionId: '',
        sellerId: '',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {},
        originalAuctionData: {
          title: '',
          description: '',
          images: [],
          category: '',
          condition: ''
        }
      };

      const result = sellerProtectionService.createSellerProtection(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });
  });

  describe('Auto-Relist Processing', () => {
    let protectionId: string;

    beforeEach(() => {
      const protectionRequest = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new',
          reservePrice: 100
        }
      };

      const result = sellerProtectionService.createSellerProtection(protectionRequest);
      protectionId = result.sellerProtection!.id;
    });

    it('should process auto-relist without confirmation', async () => {
      const autoRelistRequest = {
        sellerProtectionId: protectionId,
        requireConfirmation: false,
        startStatus: 'ACTIVE' as const
      };

      const result = sellerProtectionService.processAutoRelist(autoRelistRequest);

      expect(result.success).toBe(true);
      expect(result.newAuctionId).toBeDefined();
      expect(result.newAuctionId).toContain('auction_auto_relist_');
      expect(result.requiresConfirmation).toBe(false);
      expect(result.sellerProtection?.autoRelistStatus).toBe(AutoRelistStatus.RELISTED);
    });

    it('should require confirmation when configured', async () => {
      // Mock config to require confirmation
      const originalConfig = sellerProtectionConfig.requireSellerConfirmation;
      (sellerProtectionConfig as any).requireSellerConfirmation = true;

      const autoRelistRequest = {
        sellerProtectionId: protectionId,
        requireConfirmation: true,
        startStatus: 'ACTIVE' as const
      };

      const result = sellerProtectionService.processAutoRelist(autoRelistRequest);

      expect(result.success).toBe(true);
      expect(result.requiresConfirmation).toBe(true);
      expect(result.confirmationDeadline).toBeDefined();
      expect(result.sellerProtection?.autoRelistStatus).toBe(AutoRelistStatus.PENDING_CONFIRMATION);

      // Restore original config
      (sellerProtectionConfig as any).requireSellerConfirmation = originalConfig;
    });

    it('should reject auto-relist for non-existent protection', async () => {
      const autoRelistRequest = {
        sellerProtectionId: 'non-existent',
        requireConfirmation: false,
        startStatus: 'ACTIVE' as const
      };

      const result = sellerProtectionService.processAutoRelist(autoRelistRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should copy only metadata, not bid history', async () => {
      const autoRelistRequest = {
        sellerProtectionId: protectionId,
        requireConfirmation: false,
        startStatus: 'ACTIVE' as const
      };

      const result = sellerProtectionService.processAutoRelist(autoRelistRequest);

      expect(result.success).toBe(true);
      expect(result.newAuctionData).toBeDefined();
      expect(result.newAuctionData?.title).toBe('Test Auction');
      expect(result.newAuctionData?.description).toBe('Test Description');
      expect(result.newAuctionData?.images).toEqual(['image1.jpg']);
      expect(result.newAuctionData?.category).toBe('electronics');
      expect(result.newAuctionData?.condition).toBe('new');
      // Should not have bid history, watchers, or current bid
      expect(result.newAuctionData?.bidHistory).toBeUndefined();
      expect(result.newAuctionData?.watchers).toBeUndefined();
      expect(result.newAuctionData?.currentBid).toBe(0);
      expect(result.newAuctionData?.bidCount).toBe(0);
    });
  });

  describe('Auto-Relist Eligibility', () => {
    let protectionId: string;

    beforeEach(() => {
      const protectionRequest = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const result = sellerProtectionService.createSellerProtection(protectionRequest);
      protectionId = result.sellerProtection!.id;
    });

    it('should check auto-relist eligibility correctly', async () => {
      const eligibility = sellerProtectionService.checkAutoRelistEligibility(protectionId);

      expect(eligibility.eligible).toBe(true);
      expect(eligibility.requiresConfirmation).toBeDefined();
      expect(eligibility.cooldownActive).toBe(false);
      expect(eligibility.remainingAutoRelists).toBeGreaterThan(0);
    });

    it('should reject auto-relist for already relisted auction', async () => {
      // First, process auto-relist
      sellerProtectionService.processAutoRelist({
        sellerProtectionId: protectionId,
        requireConfirmation: false,
        startStatus: 'ACTIVE'
      });

      // Then check eligibility
      const eligibility = sellerProtectionService.checkAutoRelistEligibility(protectionId);

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('already relisted');
    });

    it('should enforce maximum auto-relist limit', async () => {
      // Create multiple protections and relist them
      for (let i = 0; i < sellerProtectionConfig.maxAutoRelistPerSeller; i++) {
        const protectionRequest = {
          originalAuctionId: `auction-${i}`,
          sellerId: 'seller-1',
          buyerId: 'buyer-1',
          trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
          triggerData: {
            paymentFailureReason: 'Payment method declined'
          },
          originalAuctionData: {
            title: `Test Auction ${i}`,
            description: 'Test Description',
            images: ['image1.jpg'],
            category: 'electronics',
            condition: 'new'
          }
        };

        const result = sellerProtectionService.createSellerProtection(protectionRequest);
        sellerProtectionService.processAutoRelist({
          sellerProtectionId: result.sellerProtection!.id,
          requireConfirmation: false,
          startStatus: 'ACTIVE'
        });
      }

      // Try one more
      const lastProtectionRequest = {
        originalAuctionId: 'auction-last',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Last Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const lastResult = sellerProtectionService.createSellerProtection(lastProtectionRequest);
      const eligibility = sellerProtectionService.checkAutoRelistEligibility(lastResult.sellerProtection!.id);

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('Maximum auto-relist limit reached');
    });
  });

  describe('Event Logging', () => {
    it('should log seller protection events', async () => {
      const request = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      sellerProtectionService.createSellerProtection(request);

      const events = sellerProtectionService.getEventLog();
      const protectionEvent = events.find(e => e.type === 'SELLER_PROTECTED');

      expect(protectionEvent).toBeDefined();
      expect(protectionEvent?.category).toBe('SELLER_PROTECTION');
      expect(protectionEvent?.data.originalAuctionId).toBe('auction-1');
      expect(protectionEvent?.data.sellerId).toBe('seller-1');
      expect(protectionEvent?.data.trigger).toBe(SellerProtectionTrigger.PAYMENT_FAILURE);
    });

    it('should log auto-relist events', async () => {
      const protectionRequest = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const protectionResult = sellerProtectionService.createSellerProtection(protectionRequest);
      sellerProtectionService.processAutoRelist({
        sellerProtectionId: protectionResult.sellerProtection!.id,
        requireConfirmation: false,
        startStatus: 'ACTIVE'
      });

      const events = sellerProtectionService.getEventLog();
      const autoRelistEvent = events.find(e => e.type === 'AUCTION_AUTO_RELISTED');

      expect(autoRelistEvent).toBeDefined();
      expect(autoRelistEvent?.category).toBe('SELLER_PROTECTION');
      expect(autoRelistEvent?.data.originalAuctionId).toBe('auction-1');
      expect(autoRelistEvent?.data.newAuctionId).toBeDefined();
    });
  });

  describe('Statistics', () => {
    it('should track protection statistics correctly', async () => {
      const request = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      sellerProtectionService.createSellerProtection(request);

      const stats = sellerProtectionService.getStatistics();

      expect(stats.totalProtections).toBe(1);
      expect(stats.activeProtections).toBe(1);
      expect(stats.triggerBreakdown[SellerProtectionTrigger.PAYMENT_FAILURE]).toBe(1);
    });

    it('should track auto-relist statistics correctly', async () => {
      const protectionRequest = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const protectionResult = sellerProtectionService.createSellerProtection(protectionRequest);
      sellerProtectionService.processAutoRelist({
        sellerProtectionId: protectionResult.sellerProtection!.id,
        requireConfirmation: false,
        startStatus: 'ACTIVE'
      });

      const stats = sellerProtectionService.getStatistics();

      expect(stats.autoRelisted).toBe(1);
    });
  });

  describe('Data Retrieval', () => {
    let protectionId: string;

    beforeEach(() => {
      const protectionRequest = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction',
          description: 'Test Description',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const result = sellerProtectionService.createSellerProtection(protectionRequest);
      protectionId = result.sellerProtection!.id;
    });

    it('should retrieve protection by ID', async () => {
      const protection = sellerProtectionService.getSellerProtection(protectionId);

      expect(protection).toBeDefined();
      expect(protection?.id).toBe(protectionId);
      expect(protection?.originalAuctionId).toBe('auction-1');
      expect(protection?.sellerId).toBe('seller-1');
    });

    it('should retrieve protections for seller', async () => {
      const protections = sellerProtectionService.getProtectionsForSeller('seller-1');

      expect(protections).toHaveLength(1);
      expect(protections[0].sellerId).toBe('seller-1');
    });

    it('should retrieve protection for auction', async () => {
      const protection = sellerProtectionService.getProtectionForAuction('auction-1');

      expect(protection).toBeDefined();
      expect(protection?.originalAuctionId).toBe('auction-1');
    });

    it('should return null for non-existent records', async () => {
      const nonExistentProtection = sellerProtectionService.getSellerProtection('non-existent');
      const nonExistentAuctionProtection = sellerProtectionService.getProtectionForAuction('non-existent');

      expect(nonExistentProtection).toBeNull();
      expect(nonExistentAuctionProtection).toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should use configuration values correctly', () => {
      expect(sellerProtectionConfig.autoRelistEnabled).toBeDefined();
      expect(sellerProtectionConfig.requireSellerConfirmation).toBeDefined();
      expect(sellerProtectionConfig.maxAutoRelistPerSeller).toBeGreaterThan(0);
      expect(sellerProtectionConfig.confirmationDeadlineHours).toBeGreaterThan(0);
      expect(sellerProtectionConfig.autoRelistCooldownHours).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedRequest = {
        originalAuctionId: '',
        sellerId: '',
        trigger: 'INVALID_TRIGGER' as any,
        triggerData: {},
        originalAuctionData: {}
      };

      const result = sellerProtectionService.createSellerProtection(malformedRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle auto-relist errors gracefully', async () => {
      const invalidAutoRelistRequest = {
        sellerProtectionId: 'non-existent',
        requireConfirmation: false,
        startStatus: 'INVALID_STATUS' as any
      };

      const result = sellerProtectionService.processAutoRelist(invalidAutoRelistRequest);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Multiple Sellers and Auctions', () => {
    it('should handle multiple sellers independently', async () => {
      const seller1Request = {
        originalAuctionId: 'auction-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction 1',
          description: 'Test Description 1',
          images: ['image1.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const seller2Request = {
        originalAuctionId: 'auction-2',
        sellerId: 'seller-2',
        buyerId: 'buyer-2',
        trigger: SellerProtectionTrigger.PAYMENT_FAILURE,
        triggerData: {
          paymentFailureReason: 'Payment method declined'
        },
        originalAuctionData: {
          title: 'Test Auction 2',
          description: 'Test Description 2',
          images: ['image2.jpg'],
          category: 'electronics',
          condition: 'new'
        }
      };

      const result1 = sellerProtectionService.createSellerProtection(seller1Request);
      const result2 = sellerProtectionService.createSellerProtection(seller2Request);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.sellerProtection?.id).not.toBe(result2.sellerProtection?.id);

      const seller1Protections = sellerProtectionService.getProtectionsForSeller('seller-1');
      const seller2Protections = sellerProtectionService.getProtectionsForSeller('seller-2');

      expect(seller1Protections).toHaveLength(1);
      expect(seller2Protections).toHaveLength(1);
      expect(seller1Protections[0].sellerId).toBe('seller-1');
      expect(seller2Protections[0].sellerId).toBe('seller-2');
    });
  });
});
