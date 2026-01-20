import { RoleExpansionService } from '../services/RoleExpansion.service';
import { SellerProfileState, StoreState, FulfillmentMethod } from '../types/RoleExpansion.types';
import { roleExpansionConfig } from '../config/roleExpansion.config';

describe('Role Expansion Service', () => {
  let roleExpansionService: RoleExpansionService;

  beforeEach(() => {
    roleExpansionService = new RoleExpansionService();
  });

  afterEach(() => {
    roleExpansionService.reset();
  });

  describe('Buyer → Seller Activation', () => {
    it('should create seller application successfully', async () => {
      // Add a user first
      roleExpansionService.addUser({
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const application = {
        displayName: 'Test Seller',
        businessName: 'Test Business',
        country: 'USA',
        city: 'New York',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        description: 'Test seller description',
        contactEmail: 'seller@example.com',
        phone: '+1234567890',
        website: 'https://example.com'
      };

      const result = roleExpansionService.createSellerApplication(application, 'user-1');

      expect(result.success).toBe(true);
      expect(result.sellerProfile).toBeDefined();
      expect(result.sellerProfile?.displayName).toBe('Test Seller');
      expect(result.sellerProfile?.userId).toBe('user-1');
      expect(result.sellerProfile?.state).toBe(SellerProfileState.SELLER_PENDING);
      expect(result.sellerProfile?.trustMetrics.sellerTrustScore).toBe(50);
    });

    it('should reject invalid seller application', async () => {
      const invalidApplication = {
        displayName: '',
        businessName: '',
        country: '',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: ''
      };

      const result = roleExpansionService.createSellerApplication(invalidApplication, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject seller application for user with insufficient trust score', async () => {
      // Add a user with low trust score
      roleExpansionService.addUser({
        id: 'user-low-trust',
        email: 'lowtrust@example.com',
        username: 'lowtrust',
        roles: ['BUYER'],
        trustScore: 25,
        buyerTrustScore: 25,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const application = {
        displayName: 'Low Trust Seller',
        country: 'USA',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: 'lowtrust@example.com'
      };

      const result = roleExpansionService.createSellerApplication(application, 'user-low-trust');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient buyer trust score');
    });

    it('should reject duplicate seller application', async () => {
      // Add a user
      roleExpansionService.addUser({
        id: 'user-duplicate',
        email: 'duplicate@example.com',
        username: 'duplicate',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const application = {
        displayName: 'Duplicate Seller',
        country: 'USA',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: 'duplicate@example.com'
      };

      // First application should succeed
      const firstResult = roleExpansionService.createSellerApplication(application, 'user-duplicate');
      expect(firstResult.success).toBe(true);

      // Second application should fail
      const secondResult = roleExpansionService.createSellerApplication(application, 'user-duplicate');
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already has a seller profile');
    });
  });

  describe('Seller Dashboard (READ ONLY Financial)', () => {
    let sellerId: string;

    beforeEach(() => {
      // Create a seller profile
      roleExpansionService.addUser({
        id: 'seller-user',
        email: 'seller@example.com',
        username: 'seller',
        roles: ['BUYER', 'SELLER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const sellerResult = roleExpansionService.createSellerApplication({
        displayName: 'Dashboard Seller',
        country: 'USA',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: 'seller@example.com'
      }, 'seller-user');

      sellerId = sellerResult.sellerProfile!.id;
    });

    it('should get seller dashboard successfully', async () => {
      const dashboard = roleExpansionService.getSellerDashboard(sellerId);

      expect(dashboard).toBeDefined();
      expect(dashboard?.sellerId).toBe(sellerId);
      expect(dashboard?.userId).toBe('seller-user');
      expect(dashboard?.overview.totalListings).toBe(0);
      expect(dashboard?.overview.activeListings).toBe(0);
      expect(dashboard?.overview.totalSales).toBe(0);
      expect(dashboard?.overview.totalRevenue).toBe(0);
      expect(dashboard?.listings).toHaveLength(0);
      expect(dashboard?.sales).toHaveLength(0);
      expect(dashboard?.settlements).toHaveLength(0);
    });

    it('should return null for non-existent seller dashboard', async () => {
      const dashboard = roleExpansionService.getSellerDashboard('non-existent-seller');
      expect(dashboard).toBeNull();
    });

    it('should update dashboard view metadata', async () => {
      const firstDashboard = roleExpansionService.getSellerDashboard(sellerId);
      const firstViewTime = firstDashboard?.metadata.lastViewedAt;

      // Wait a bit and view again
      await new Promise(resolve => setTimeout(resolve, 10));
      const secondDashboard = roleExpansionService.getSellerDashboard(sellerId);
      const secondViewTime = secondDashboard?.metadata.lastViewedAt;

      expect(secondViewTime?.getTime()).toBeGreaterThan(firstViewTime?.getTime() || 0);
      expect(secondDashboard?.metadata.totalViews).toBe(2);
    });
  });

  describe('External Seller / Store Mode', () => {
    it('should create store successfully', async () => {
      // Add a user
      roleExpansionService.addUser({
        id: 'store-owner',
        email: 'store@example.com',
        username: 'storeowner',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const storeRequest = {
        ownerId: 'store-owner',
        name: 'Test Store',
        slug: 'test-store',
        description: 'Test store description',
        country: 'USA',
        city: 'New York',
        contactEmail: 'store@example.com',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        settings: {
          autoAcceptOffers: true,
          requireVerification: false,
          allowInternationalShipping: true,
          supportedPaymentMethods: ['credit_card', 'paypal']
        }
      };

      const result = roleExpansionService.createStore(storeRequest);

      expect(result.success).toBe(true);
      expect(result.store).toBeDefined();
      expect(result.store?.name).toBe('Test Store');
      expect(result.store?.slug).toBe('test-store');
      expect(result.store?.ownerId).toBe('store-owner');
      expect(result.store?.state).toBe(StoreState.STORE_PENDING);
      expect(result.store?.trustMetrics.storeTrustScore).toBe(50);
    });

    it('should reject invalid store creation', async () => {
      const invalidStoreRequest = {
        ownerId: 'user-1',
        name: '',
        slug: '',
        description: '',
        country: '',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: ''
      };

      const result = roleExpansionService.createStore(invalidStoreRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject duplicate store slug', async () => {
      // Add a user
      roleExpansionService.addUser({
        id: 'duplicate-owner',
        email: 'duplicate@example.com',
        username: 'duplicate',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const storeRequest = {
        ownerId: 'duplicate-owner',
        name: 'Duplicate Store',
        slug: 'duplicate-slug',
        description: 'Duplicate store description',
        country: 'USA',
        contactEmail: 'duplicate@example.com',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING
      };

      // First store should succeed
      const firstResult = roleExpansionService.createStore(storeRequest);
      expect(firstResult.success).toBe(true);

      // Second store with same slug should fail
      const secondResult = roleExpansionService.createStore(storeRequest);
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('Store slug already exists');
    });

    it('should get store by slug', async () => {
      // Add a user and create a store
      roleExpansionService.addUser({
        id: 'slug-owner',
        email: 'slug@example.com',
        username: 'slugowner',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const storeRequest = {
        ownerId: 'slug-owner',
        name: 'Slug Store',
        slug: 'slug-store',
        description: 'Slug store description',
        country: 'USA',
        contactEmail: 'slug@example.com',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING
      };

      const createStoreResult = roleExpansionService.createStore(storeRequest);
      expect(createStoreResult.success).toBe(true);

      const store = roleExpansionService.getStoreBySlug('slug-store');
      expect(store).toBeDefined();
      expect(store?.slug).toBe('slug-store');
      expect(store?.name).toBe('Slug Store');
    });
  });

  describe('Shipping & Fulfillment Signals (NO LOGIC)', () => {
    let sellerId: string;

    beforeEach(() => {
      // Create a seller
      roleExpansionService.addUser({
        id: 'fulfillment-user',
        email: 'fulfillment@example.com',
        username: 'fulfillment',
        roles: ['BUYER', 'SELLER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const sellerResult = roleExpansionService.createSellerApplication({
        displayName: 'Fulfillment Seller',
        country: 'USA',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: 'fulfillment@example.com'
      }, 'fulfillment-user');

      sellerId = sellerResult.sellerProfile!.id;
    });

    it('should create fulfillment method signal successfully', async () => {
      const fulfillmentRequest = {
        sellerId,
        listingId: 'listing-123',
        method: FulfillmentMethod.DIRECT_SHIPPING,
        configuration: {
          directShipping: {
            supportedCountries: ['USA', 'Canada'],
            shippingZones: [
              {
                zone: 'North America',
                countries: ['USA', 'Canada'],
                cost: 10,
                estimatedDays: 5
              }
            ],
            freeShippingThreshold: 100
          }
        },
        restrictions: {
          prohibitedItems: ['weapons', 'hazardous materials'],
          restrictedCategories: ['adult'],
          maxWeight: 50,
          maxDimensions: {
            length: 100,
            width: 80,
            height: 60
          }
        }
      };

      const result = roleExpansionService.createFulfillmentMethodSignal(fulfillmentRequest);

      expect(result.success).toBe(true);
      expect(result.fulfillmentMethod).toBeDefined();
      expect(result.fulfillmentMethod?.sellerId).toBe(sellerId);
      expect(result.fulfillmentMethod?.listingId).toBe('listing-123');
      expect(result.fulfillmentMethod?.method).toBe(FulfillmentMethod.DIRECT_SHIPPING);
      expect(result.fulfillmentMethod?.configuration.directShipping?.supportedCountries).toEqual(['USA', 'Canada']);
    });

    it('should reject invalid fulfillment method signal', async () => {
      const invalidFulfillmentRequest = {
        sellerId: '',
        listingId: '',
        method: FulfillmentMethod.DIRECT_SHIPPING,
        configuration: {}
      };

      const result = roleExpansionService.createFulfillmentMethodSignal(invalidFulfillmentRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject fulfillment method for non-existent seller', async () => {
      const fulfillmentRequest = {
        sellerId: 'non-existent-seller',
        listingId: 'listing-123',
        method: FulfillmentMethod.DIRECT_SHIPPING,
        configuration: {
          directShipping: {
            supportedCountries: ['USA'],
            shippingZones: []
          }
        }
      };

      const result = roleExpansionService.createFulfillmentMethodSignal(fulfillmentRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Seller not found');
    });

    it('should get fulfillment methods by seller', async () => {
      // Create multiple fulfillment methods
      const fulfillmentRequest1 = {
        sellerId,
        listingId: 'listing-1',
        method: FulfillmentMethod.DIRECT_SHIPPING,
        configuration: { directShipping: { supportedCountries: ['USA'] } }
      };

      const fulfillmentRequest2 = {
        sellerId,
        listingId: 'listing-2',
        method: FulfillmentMethod.TRAVELER_DELIVERY,
        configuration: { travelerDelivery: { maxDistance: 100 } }
      };

      roleExpansionService.createFulfillmentMethodSignal(fulfillmentRequest1);
      roleExpansionService.createFulfillmentMethodSignal(fulfillmentRequest2);

      const fulfillmentMethods = roleExpansionService.getFulfillmentMethodsBySeller(sellerId);

      expect(fulfillmentMethods).toHaveLength(2);
      expect(fulfillmentMethods[0].method).toBe(FulfillmentMethod.DIRECT_SHIPPING);
      expect(fulfillmentMethods[1].method).toBe(FulfillmentMethod.TRAVELER_DELIVERY);
    });

    it('should get fulfillment methods by listing', async () => {
      // Create fulfillment method for specific listing
      const fulfillmentRequest = {
        sellerId,
        listingId: 'specific-listing',
        method: FulfillmentMethod.BOTH,
        configuration: {
          directShipping: { supportedCountries: ['USA'] },
          travelerDelivery: { maxDistance: 50 }
        }
      };

      roleExpansionService.createFulfillmentMethodSignal(fulfillmentRequest);

      const fulfillmentMethods = roleExpansionService.getFulfillmentMethodsByListing('specific-listing');

      expect(fulfillmentMethods).toHaveLength(1);
      expect(fulfillmentMethods[0].listingId).toBe('specific-listing');
      expect(fulfillmentMethods[0].method).toBe(FulfillmentMethod.BOTH);
    });
  });

  describe('Admin Visibility (READ ONLY)', () => {
    it('should activate seller profile successfully', async () => {
      // Create a pending seller
      roleExpansionService.addUser({
        id: 'activate-user',
        email: 'activate@example.com',
        username: 'activate',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const sellerResult = roleExpansionService.createSellerApplication({
        displayName: 'Activate Seller',
        country: 'USA',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: 'activate@example.com'
      }, 'activate-user');

      const sellerId = sellerResult.sellerProfile!.id;

      const result = roleExpansionService.activateSeller(sellerId, 'admin-123');

      expect(result.success).toBe(true);
      
      const sellerProfile = roleExpansionService.getSellerProfile(sellerId);
      expect(sellerProfile?.state).toBe(SellerProfileState.SELLER_ACTIVE);
      expect(sellerProfile?.metadata.activatedAt).toBeDefined();
    });

    it('should activate store successfully', async () => {
      // Create a pending store
      roleExpansionService.addUser({
        id: 'activate-store-user',
        email: 'activatestore@example.com',
        username: 'activatestore',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const storeRequest = {
        ownerId: 'activate-store-user',
        name: 'Activate Store',
        slug: 'activate-store',
        description: 'Activate store description',
        country: 'USA',
        contactEmail: 'activatestore@example.com',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING
      };

      const storeResult = roleExpansionService.createStore(storeRequest);
      const storeId = storeResult.store!.id;

      const result = roleExpansionService.activateStore(storeId, 'admin-123');

      expect(result.success).toBe(true);
      
      const store = roleExpansionService.getStore(storeId);
      expect(store?.state).toBe(StoreState.STORE_ACTIVE);
      expect(store?.metadata.activatedAt).toBeDefined();
    });

    it('should suspend seller profile successfully', async () => {
      // Create a seller
      roleExpansionService.addUser({
        id: 'suspend-user',
        email: 'suspend@example.com',
        username: 'suspend',
        roles: ['BUYER', 'SELLER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const sellerResult = roleExpansionService.createSellerApplication({
        displayName: 'Suspend Seller',
        country: 'USA',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: 'suspend@example.com'
      }, 'suspend-user');

      // Activate first
      const sellerId = sellerResult.sellerProfile!.id;
      roleExpansionService.activateSeller(sellerId, 'admin-123');

      const result = roleExpansionService.suspendSeller(sellerId, 'Violation of terms');

      expect(result.success).toBe(true);
      
      const sellerProfile = roleExpansionService.getSellerProfile(sellerId);
      expect(sellerProfile?.state).toBe(SellerProfileState.SELLER_SUSPENDED);
      expect(sellerProfile?.metadata.suspendedAt).toBeDefined();
    });
  });

  describe('Event Logging', () => {
    it('should log seller application created event', async () => {
      roleExpansionService.addUser({
        id: 'event-user',
        email: 'event@example.com',
        username: 'event',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      roleExpansionService.createSellerApplication({
        displayName: 'Event Seller',
        country: 'USA',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: 'event@example.com'
      }, 'event-user');

      const events = roleExpansionService.getEventLog();
      const applicationEvent = events.find(e => e.type === 'SELLER_APPLICATION_CREATED');

      expect(applicationEvent).toBeDefined();
      expect(applicationEvent?.category).toBe('SELLER_PROFILE');
      expect(applicationEvent?.data.userId).toBe('event-user');
      expect(applicationEvent?.data.metadata.displayName).toBe('Event Seller');
    });

    it('should log store created event', async () => {
      roleExpansionService.addUser({
        id: 'store-event-user',
        email: 'storeevent@example.com',
        username: 'storeevent',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      roleExpansionService.createStore({
        ownerId: 'store-event-user',
        name: 'Event Store',
        slug: 'event-store',
        description: 'Event store description',
        country: 'USA',
        contactEmail: 'storeevent@example.com',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING
      });

      const events = roleExpansionService.getEventLog();
      const storeEvent = events.find(e => e.type === 'STORE_CREATED');

      expect(storeEvent).toBeDefined();
      expect(storeEvent?.category).toBe('STORE');
      expect(storeEvent?.data.userId).toBe('store-event-user');
      expect(storeEvent?.data.metadata.name).toBe('Event Store');
    });

    it('should log fulfillment method selected event', async () => {
      roleExpansionService.addUser({
        id: 'fulfillment-event-user',
        email: 'fulfillmentevent@example.com',
        username: 'fulfillmentevent',
        roles: ['BUYER', 'SELLER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      const sellerResult = roleExpansionService.createSellerApplication({
        displayName: 'Fulfillment Event Seller',
        country: 'USA',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: 'fulfillmentevent@example.com'
      }, 'fulfillment-event-user');

      roleExpansionService.createFulfillmentMethodSignal({
        sellerId: sellerResult.sellerProfile!.id,
        listingId: 'event-listing',
        method: FulfillmentMethod.DIRECT_SHIPPING,
        configuration: {
          directShipping: {
            supportedCountries: ['USA']
          }
        }
      });

      const events = roleExpansionService.getEventLog();
      const fulfillmentEvent = events.find(e => e.type === 'FULFILLMENT_METHOD_SELECTED');

      expect(fulfillmentEvent).toBeDefined();
      expect(fulfillmentEvent?.category).toBe('FULFILLMENT');
      expect(fulfillmentEvent?.data.sellerId).toBe(sellerResult.sellerProfile!.id);
      expect(fulfillmentEvent?.data.listingId).toBe('event-listing');
      expect(fulfillmentEvent?.data.metadata.method).toBe(FulfillmentMethod.DIRECT_SHIPPING);
    });
  });

  describe('Statistics', () => {
    it('should track role expansion statistics correctly', async () => {
      // Add users
      roleExpansionService.addUser({
        id: 'stats-user-1',
        email: 'stats1@example.com',
        username: 'stats1',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      roleExpansionService.addUser({
        id: 'stats-user-2',
        email: 'stats2@example.com',
        username: 'stats2',
        roles: ['BUYER'],
        trustScore: 75,
        buyerTrustScore: 75,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'Test'
        },
        restrictions: {
          suspended: false,
          flagged: false
        }
      });

      // Create seller applications
      roleExpansionService.createSellerApplication({
        displayName: 'Stats Seller 1',
        country: 'USA',
        fulfillmentType: FulfillmentMethod.DIRECT_SHIPPING,
        contactEmail: 'stats1@example.com'
      }, 'stats-user-1');

      roleExpansionService.createSellerApplication({
        displayName: 'Stats Seller 2',
        country: 'Canada',
        fulfillmentType: FulfillmentMethod.TRAVELER_DELIVERY,
        contactEmail: 'stats2@example.com'
      }, 'stats-user-2');

      // Create store
      roleExpansionService.createStore({
        ownerId: 'stats-user-1',
        name: 'Stats Store',
        slug: 'stats-store',
        description: 'Stats store description',
        country: 'USA',
        contactEmail: 'stats1@example.com',
        fulfillmentType: FulfillmentMethod.BOTH
      });

      const statistics = roleExpansionService.getStatistics();

      expect(statistics.totalUsers).toBe(2);
      expect(statistics.totalBuyers).toBe(2);
      expect(statistics.totalSellers).toBe(2);
      expect(statistics.totalStores).toBe(1);
      expect(statistics.totalExternalSellers).toBe(1);
      expect(statistics.pendingSellerApplications).toBe(2);
      expect(statistics.pendingStoreApplications).toBe(1);
      expect(statistics.fulfillmentMethods.travelerDelivery).toBe(1);
      expect(statistics.fulfillmentMethods.directShipping).toBe(1);
      expect(statistics.fulfillmentMethods.both).toBe(1);
    });
  });

  describe('Configuration', () => {
    it('should use configuration values correctly', () => {
      expect(roleExpansionConfig.sellerApprovalRequired).toBeDefined();
      expect(roleExpansionConfig.storeApprovalRequired).toBeDefined();
      expect(roleExpansionConfig.minimumBuyerTrustScore).toBeGreaterThan(0);
      expect(roleExpansionConfig.defaultSellerCapabilities.maxActiveListings).toBeGreaterThan(0);
      expect(roleExpansionConfig.defaultStoreCapabilities.maxActiveListings).toBeGreaterThan(0);
      expect(roleExpansionConfig.supportedFulfillmentMethods.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedApplication = {
        displayName: null,
        businessName: undefined,
        country: '',
        fulfillmentType: 'INVALID_METHOD',
        contactEmail: 'invalid-email'
      };

      const result = roleExpansionService.createSellerApplication(malformedApplication, 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-existent entities gracefully', async () => {
      const nonExistentSeller = roleExpansionService.getSellerProfile('non-existent-seller');
      const nonExistentStore = roleExpansionService.getStore('non-existent-store');
      const nonExistentDashboard = roleExpansionService.getSellerDashboard('non-existent-seller');

      expect(nonExistentSeller).toBeNull();
      expect(nonExistentStore).toBeNull();
      expect(nonExistentDashboard).toBeNull();
    });

    it('should handle activation of non-existent entities gracefully', async () => {
      const activateNonExistentSeller = roleExpansionService.activateSeller('non-existent-seller', 'admin-123');
      const activateNonExistentStore = roleExpansionService.activateStore('non-existent-store', 'admin-123');

      expect(activateNonExistentSeller.success).toBe(false);
      expect(activateNonExistentStore.success).toBe(false);
    });
  });
});
