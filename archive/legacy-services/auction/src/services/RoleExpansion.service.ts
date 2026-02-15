import {
  User,
  SellerProfile,
  Store,
  SellerDashboard,
  FulfillmentMethodSignal,
  UserRole,
  SellerProfileState,
  StoreState,
  FulfillmentMethod,
  RoleExpansionEventType,
  SellerApplicationRequest,
  SellerApplicationResult,
  StoreCreationRequest,
  StoreCreationResult,
  FulfillmentMethodRequest,
  FulfillmentMethodResult,
  RoleExpansionEvent,
  RoleExpansionStatistics
} from '../types/RoleExpansion.types';
import {
  roleExpansionConfig,
  isSellerApprovalRequired,
  isStoreApprovalRequired,
  isBuyerTrustScoreSufficient,
  isSellerAutoActivationEnabled,
  isStoreAutoActivationEnabled,
  isSellerVerificationRequired,
  isStoreVerificationRequired,
  isFulfillmentMethodSupported,
  getDefaultSellerCapabilities,
  getDefaultStoreCapabilities,
  validateSellerApplication,
  validateStoreCreation,
  validateFulfillmentMethod
} from '../config/roleExpansion.config';

/**
 * Role Expansion Service
 * 
 * Implements ROLE EXPANSION inside marketplace
 * Buyer → Seller → Storefront Transition System
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority
 * - Role transitions are BACKEND ONLY
 * - No wallet, escrow, or payout mutations here
 * - Seller identity is SEPARATE from buyer activity
 * - Every transition is logged
 * - No silent role upgrades
 */
export class RoleExpansionService {
  private users: Map<string, User> = new Map();
  private sellerProfiles: Map<string, SellerProfile> = new Map();
  private stores: Map<string, Store> = new Map();
  private sellerDashboards: Map<string, SellerDashboard> = new Map();
  private fulfillmentMethods: Map<string, FulfillmentMethodSignal> = new Map();
  private eventLog: RoleExpansionEvent[] = [];
  private statistics: RoleExpansionStatistics = {
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    totalExternalSellers: 0,
    totalStores: 0,
    activeSellers: 0,
    activeStores: 0,
    pendingSellerApplications: 0,
    pendingStoreApplications: 0,
    suspendedSellers: 0,
    suspendedStores: 0,
    averageSellerTrustScore: 0,
    averageStoreTrustScore: 0,
    topCountries: [],
    fulfillmentMethods: {
      travelerDelivery: 0,
      directShipping: 0,
      both: 0
    }
  };

  /**
   * Create seller application (Buyer → Seller activation)
   * 
   * @param request Seller application data
   * @param userId User ID applying to become seller
   * @returns Seller application result
   */
  createSellerApplication(request: SellerApplicationRequest, userId: string): SellerApplicationResult {
    try {
      // Validate request
      const validation = validateSellerApplication(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check if user exists
      const user = this.users.get(userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if user already has seller profile
      const existingProfile = Array.from(this.sellerProfiles.values()).find(
        profile => profile.userId === userId
      );
      if (existingProfile) {
        return {
          success: false,
          error: 'User already has a seller profile'
        };
      }

      // Check buyer trust score requirements
      if (!isBuyerTrustScoreSufficient(user.buyerTrustScore)) {
        return {
          success: false,
          error: `Insufficient buyer trust score. Required: ${roleExpansionConfig.minimumBuyerTrustScore}, Current: ${user.buyerTrustScore}`
        };
      }

      // Create seller profile
      const sellerId = `seller_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const sellerProfile: SellerProfile = {
        id: sellerId,
        userId,
        displayName: request.displayName,
        businessName: request.businessName,
        country: request.country,
        city: request.city,
        fulfillmentType: request.fulfillmentType,
        description: request.description,
        contactEmail: request.contactEmail,
        phone: request.phone,
        website: request.website,
        socialLinks: request.socialLinks,
        state: isSellerAutoActivationEnabled() ? SellerProfileState.SELLER_ACTIVE : SellerProfileState.SELLER_PENDING,
        trustMetrics: {
          sellerTrustScore: 50, // Start with neutral score
          totalSales: 0,
          successfulDeliveries: 0,
          averageRating: 0,
          responseTime: 0,
          disputeRate: 0,
          cancellationRate: 0
        },
        capabilities: {
          ...getDefaultSellerCapabilities(),
          canShipInternationally: true,
          canOfferInsurance: false,
          supportedCategories: []
        },
        verification: {
          emailVerified: false,
          phoneVerified: false,
          identityVerified: false,
          businessVerified: false
        },
        metadata: {
          createdAt: now,
          updatedAt: now,
          activatedAt: isSellerAutoActivationEnabled() ? now : undefined,
          applicationIp: '127.0.0.1', // Would come from request
          applicationUserAgent: 'RoleExpansion-Service' // Would come from request
        },
        requirements: {
          requiredVerifications: isSellerVerificationRequired() ? ['email', 'phone'] : []
        }
      };

      // Store seller profile
      this.sellerProfiles.set(sellerId, sellerProfile);

      // Update user roles
      user.roles.push(UserRole.SELLER);
      user.sellerTrustScore = sellerProfile.trustMetrics.sellerTrustScore;
      user.metadata.updatedAt = now;

      // Update statistics
      this.statistics.totalSellers++;
      if (isSellerAutoActivationEnabled()) {
        this.statistics.activeSellers++;
      } else {
        this.statistics.pendingSellerApplications++;
      }

      // Log events
      this.logRoleExpansionEvent(RoleExpansionEventType.SELLER_APPLICATION_CREATED, {
        userId,
        sellerId,
        metadata: {
          displayName: request.displayName,
          country: request.country,
          fulfillmentType: request.fulfillmentType,
          autoActivated: isSellerAutoActivationEnabled()
        }
      });

      if (isSellerAutoActivationEnabled()) {
        this.logRoleExpansionEvent(RoleExpansionEventType.SELLER_ACTIVATED, {
          userId,
          sellerId,
          metadata: {
            activatedAt: now.toISOString()
          }
        });
      }

      console.log(`[RoleExpansion] Created seller application ${sellerId} for user ${userId}`);

      return {
        success: true,
        sellerProfile,
        requiresVerification: isSellerVerificationRequired() ? ['email', 'phone'] : undefined
      };

    } catch (error) {
      console.error('[RoleExpansion] Error creating seller application:', error);
      return {
        success: false,
        error: 'Internal server error during seller application creation'
      };
    }
  }

  /**
   * Create store (External Seller / Store mode)
   * 
   * @param request Store creation data
   * @returns Store creation result
   */
  createStore(request: StoreCreationRequest): StoreCreationResult {
    try {
      // Validate request
      const validation = validateStoreCreation(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check if owner exists
      const user = this.users.get(request.ownerId);
      if (!user) {
        return {
          success: false,
          error: 'Owner not found'
        };
      }

      // Check if store slug is unique
      const existingStore = Array.from(this.stores.values()).find(
        store => store.slug === request.slug
      );
      if (existingStore) {
        return {
          success: false,
          error: 'Store slug already exists'
        };
      }

      // Create store
      const storeId = `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const store: Store = {
        id: storeId,
        ownerId: request.ownerId,
        name: request.name,
        slug: request.slug,
        description: request.description,
        logo: request.logo,
        banner: request.banner,
        country: request.country,
        city: request.city,
        address: request.address,
        contactEmail: request.contactEmail,
        phone: request.phone,
        website: request.website,
        fulfillmentType: request.fulfillmentType,
        state: isStoreAutoActivationEnabled() ? StoreState.STORE_ACTIVE : StoreState.STORE_PENDING,
        trustMetrics: {
          storeTrustScore: 50, // Start with neutral score
          totalSales: 0,
          successfulDeliveries: 0,
          averageRating: 0,
          responseTime: 0,
          disputeRate: 0,
          cancellationRate: 0
        },
        capabilities: {
          ...getDefaultStoreCapabilities(),
          canShipInternationally: true,
          canOfferInsurance: false,
          supportedCategories: []
        },
        verification: {
          emailVerified: false,
          phoneVerified: false,
          businessVerified: false
        },
        metadata: {
          createdAt: now,
          updatedAt: now,
          activatedAt: isStoreAutoActivationEnabled() ? now : undefined,
          applicationIp: '127.0.0.1', // Would come from request
          applicationUserAgent: 'RoleExpansion-Service' // Would come from request
        },
        settings: {
          autoAcceptOffers: request.settings?.autoAcceptOffers || false,
          requireVerification: request.settings?.requireVerification || false,
          allowInternationalShipping: request.settings?.allowInternationalShipping || true,
          supportedPaymentMethods: request.settings?.supportedPaymentMethods || []
        }
      };

      // Store store
      this.stores.set(storeId, store);

      // Update user roles if not already external seller
      if (!user.roles.includes(UserRole.EXTERNAL_SELLER)) {
        user.roles.push(UserRole.EXTERNAL_SELLER);
        user.metadata.updatedAt = now;
      }

      // Update statistics
      this.statistics.totalStores++;
      this.statistics.totalExternalSellers++;
      if (isStoreAutoActivationEnabled()) {
        this.statistics.activeStores++;
      } else {
        this.statistics.pendingStoreApplications++;
      }

      // Log events
      this.logRoleExpansionEvent(RoleExpansionEventType.STORE_CREATED, {
        userId: request.ownerId,
        storeId,
        metadata: {
          name: request.name,
          slug: request.slug,
          country: request.country,
          fulfillmentType: request.fulfillmentType,
          autoActivated: isStoreAutoActivationEnabled()
        }
      });

      if (isStoreAutoActivationEnabled()) {
        this.logRoleExpansionEvent(RoleExpansionEventType.STORE_ACTIVATED, {
          userId: request.ownerId,
          storeId,
          metadata: {
            activatedAt: now.toISOString()
          }
        });
      }

      console.log(`[RoleExpansion] Created store ${storeId} for owner ${request.ownerId}`);

      return {
        success: true,
        store,
        requiresVerification: isStoreVerificationRequired() ? ['email', 'phone', 'business'] : undefined
      };

    } catch (error) {
      console.error('[RoleExpansion] Error creating store:', error);
      return {
        success: false,
        error: 'Internal server error during store creation'
      };
    }
  }

  /**
   * Get seller dashboard (READ ONLY financial)
   * 
   * @param sellerId Seller ID
   * @returns Seller dashboard data
   */
  getSellerDashboard(sellerId: string): SellerDashboard | null {
    try {
      const sellerProfile = this.sellerProfiles.get(sellerId);
      if (!sellerProfile) {
        return null;
      }

      // Get or create dashboard
      let dashboard = this.sellerDashboards.get(sellerId);
      if (!dashboard) {
        dashboard = {
          sellerId,
          userId: sellerProfile.userId,
          overview: {
            totalListings: 0,
            activeListings: 0,
            totalSales: 0,
            pendingOrders: 0,
            completedOrders: 0,
            totalRevenue: 0,
            pendingRevenue: 0,
            averageOrderValue: 0
          },
          listings: [],
          sales: [],
          settlements: [],
          analytics: {
            viewsLast30Days: 0,
            viewsLast7Days: 0,
            conversionRate: 0,
            averageResponseTime: sellerProfile.trustMetrics.responseTime,
            ratingBreakdown: {
              fiveStars: 0,
              fourStars: 0,
              threeStars: 0,
              twoStars: 0,
              oneStar: 0
            }
          },
          metadata: {
            lastViewedAt: new Date(),
            totalViews: 0,
            lastRefreshAt: new Date()
          }
        };
        this.sellerDashboards.set(sellerId, dashboard);
      }

      // Update last viewed timestamp
      dashboard.metadata.lastViewedAt = new Date();
      dashboard.metadata.totalViews++;

      // Log dashboard view event
      this.logRoleExpansionEvent(RoleExpansionEventType.SELLER_DASHBOARD_VIEWED, {
        userId: sellerProfile.userId,
        sellerId,
        metadata: {
          viewedAt: dashboard.metadata.lastViewedAt.toISOString(),
          totalViews: dashboard.metadata.totalViews
        }
      });

      return dashboard;

    } catch (error) {
      console.error('[RoleExpansion] Error getting seller dashboard:', error);
      return null;
    }
  }

  /**
   * Create fulfillment method signal (Shipping & Fulfillment signals - NO LOGIC)
   * 
   * @param request Fulfillment method data
   * @returns Fulfillment method result
   */
  createFulfillmentMethodSignal(request: FulfillmentMethodRequest): FulfillmentMethodResult {
    try {
      // Validate request
      const validation = validateFulfillmentMethod(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check if fulfillment method is supported
      if (!isFulfillmentMethodSupported(request.method)) {
        return {
          success: false,
          error: 'Fulfillment method not supported'
        };
      }

      // Check if seller exists
      const sellerProfile = this.sellerProfiles.get(request.sellerId);
      if (!sellerProfile) {
        return {
          success: false,
          error: 'Seller not found'
        };
      }

      // Create fulfillment method signal
      const signalId = `fulfillment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const fulfillmentMethod: FulfillmentMethodSignal = {
        id: signalId,
        sellerId: request.sellerId,
        listingId: request.listingId,
        method: request.method,
        configuration: request.configuration,
        restrictions: request.restrictions || {
          prohibitedItems: [],
          restrictedCategories: []
        },
        metadata: {
          createdAt: now,
          updatedAt: now
        }
      };

      // Store fulfillment method
      this.fulfillmentMethods.set(signalId, fulfillmentMethod);

      // Update statistics
      if (request.method === FulfillmentMethod.TRAVELER_DELIVERY) {
        this.statistics.fulfillmentMethods.travelerDelivery++;
      } else if (request.method === FulfillmentMethod.DIRECT_SHIPPING) {
        this.statistics.fulfillmentMethods.directShipping++;
      } else if (request.method === FulfillmentMethod.BOTH) {
        this.statistics.fulfillmentMethods.both++;
      }

      // Log event
      this.logRoleExpansionEvent(RoleExpansionEventType.FULFILLMENT_METHOD_SELECTED, {
        userId: sellerProfile.userId,
        sellerId: request.sellerId,
        listingId: request.listingId,
        metadata: {
          method: request.method,
          configuration: request.configuration
        }
      });

      console.log(`[RoleExpansion] Created fulfillment method signal ${signalId} for seller ${request.sellerId}`);

      return {
        success: true,
        fulfillmentMethod
      };

    } catch (error) {
      console.error('[RoleExpansion] Error creating fulfillment method signal:', error);
      return {
        success: false,
        error: 'Internal server error during fulfillment method creation'
      };
    }
  }

  /**
   * Activate seller profile
   * 
   * @param sellerId Seller ID to activate
   * @param approvedBy Admin ID who approved
   * @returns Success status
   */
  activateSeller(sellerId: string, approvedBy: string): { success: boolean; error?: string } {
    try {
      const sellerProfile = this.sellerProfiles.get(sellerId);
      if (!sellerProfile) {
        return {
          success: false,
          error: 'Seller profile not found'
        };
      }

      if (sellerProfile.state === SellerProfileState.SELLER_ACTIVE) {
        return {
          success: false,
          error: 'Seller profile is already active'
        };
      }

      // Update seller state
      const now = new Date();
      sellerProfile.state = SellerProfileState.SELLER_ACTIVE;
      sellerProfile.metadata.activatedAt = now;
      sellerProfile.metadata.updatedAt = now;

      // Update statistics
      this.statistics.activeSellers++;
      this.statistics.pendingSellerApplications--;

      // Log event
      this.logRoleExpansionEvent(RoleExpansionEventType.SELLER_ACTIVATED, {
        userId: sellerProfile.userId,
        sellerId,
        metadata: {
          approvedBy,
          activatedAt: now.toISOString()
        }
      });

      console.log(`[RoleExpansion] Activated seller profile ${sellerId}`);

      return { success: true };

    } catch (error) {
      console.error('[RoleExpansion] Error activating seller:', error);
      return {
        success: false,
        error: 'Internal server error during seller activation'
      };
    }
  }

  /**
   * Activate store
   * 
   * @param storeId Store ID to activate
   * @param approvedBy Admin ID who approved
   * @returns Success status
   */
  activateStore(storeId: string, approvedBy: string): { success: boolean; error?: string } {
    try {
      const store = this.stores.get(storeId);
      if (!store) {
        return {
          success: false,
          error: 'Store not found'
        };
      }

      if (store.state === StoreState.STORE_ACTIVE) {
        return {
          success: false,
          error: 'Store is already active'
        };
      }

      // Update store state
      const now = new Date();
      store.state = StoreState.STORE_ACTIVE;
      store.metadata.activatedAt = now;
      store.metadata.updatedAt = now;

      // Update statistics
      this.statistics.activeStores++;
      this.statistics.pendingStoreApplications--;

      // Log event
      this.logRoleExpansionEvent(RoleExpansionEventType.STORE_ACTIVATED, {
        userId: store.ownerId,
        storeId,
        metadata: {
          approvedBy,
          activatedAt: now.toISOString()
        }
      });

      console.log(`[RoleExpansion] Activated store ${storeId}`);

      return { success: true };

    } catch (error) {
      console.error('[RoleExpansion] Error activating store:', error);
      return {
        success: false,
        error: 'Internal server error during store activation'
      };
    }
  }

  /**
   * Suspend seller profile
   * 
   * @param sellerId Seller ID to suspend
   * @param reason Suspension reason
   * @returns Success status
   */
  suspendSeller(sellerId: string, reason: string): { success: boolean; error?: string } {
    try {
      const sellerProfile = this.sellerProfiles.get(sellerId);
      if (!sellerProfile) {
        return {
          success: false,
          error: 'Seller profile not found'
        };
      }

      if (sellerProfile.state === SellerProfileState.SELLER_SUSPENDED) {
        return {
          success: false,
          error: 'Seller profile is already suspended'
        };
      }

      // Update seller state
      const now = new Date();
      const previousState = sellerProfile.state;
      sellerProfile.state = SellerProfileState.SELLER_SUSPENDED;
      sellerProfile.metadata.suspendedAt = now;
      sellerProfile.metadata.updatedAt = now;

      // Update statistics
      this.statistics.suspendedSellers++;
      if (previousState === SellerProfileState.SELLER_ACTIVE) {
        this.statistics.activeSellers--;
      }

      // Log event
      this.logRoleExpansionEvent(RoleExpansionEventType.SELLER_SUSPENDED, {
        userId: sellerProfile.userId,
        sellerId,
        previousState: previousState.toString(),
        newState: SellerProfileState.SELLER_SUSPENDED.toString(),
        reason,
        metadata: {
          suspendedAt: now.toISOString()
        }
      });

      console.log(`[RoleExpansion] Suspended seller profile ${sellerId} for reason: ${reason}`);

      return { success: true };

    } catch (error) {
      console.error('[RoleExpansion] Error suspending seller:', error);
      return {
        success: false,
        error: 'Internal server error during seller suspension'
      };
    }
  }

  /**
   * Get seller profile by ID
   */
  getSellerProfile(sellerId: string): SellerProfile | null {
    return this.sellerProfiles.get(sellerId) || null;
  }

  /**
   * Get seller profile by user ID
   */
  getSellerProfileByUserId(userId: string): SellerProfile | null {
    return Array.from(this.sellerProfiles.values()).find(
      profile => profile.userId === userId
    ) || null;
  }

  /**
   * Get store by ID
   */
  getStore(storeId: string): Store | null {
    return this.stores.get(storeId) || null;
  }

  /**
   * Get store by slug
   */
  getStoreBySlug(slug: string): Store | null {
    return Array.from(this.stores.values()).find(
      store => store.slug === slug
    ) || null;
  }

  /**
   * Get stores by owner
   */
  getStoresByOwner(ownerId: string): Store[] {
    return Array.from(this.stores.values()).filter(
      store => store.ownerId === ownerId
    );
  }

  /**
   * Get fulfillment method by ID
   */
  getFulfillmentMethod(signalId: string): FulfillmentMethodSignal | null {
    return this.fulfillmentMethods.get(signalId) || null;
  }

  /**
   * Get fulfillment methods by seller
   */
  getFulfillmentMethodsBySeller(sellerId: string): FulfillmentMethodSignal[] {
    return Array.from(this.fulfillmentMethods.values()).filter(
      method => method.sellerId === sellerId
    );
  }

  /**
   * Get fulfillment methods by listing
   */
  getFulfillmentMethodsByListing(listingId: string): FulfillmentMethodSignal[] {
    return Array.from(this.fulfillmentMethods.values()).filter(
      method => method.listingId === listingId
    );
  }

  /**
   * Get role expansion statistics
   */
  getStatistics(): RoleExpansionStatistics {
    return { ...this.statistics };
  }

  /**
   * Get event log
   */
  getEventLog(limit?: number): RoleExpansionEvent[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  /**
   * Add user to system
   */
  addUser(user: User): void {
    this.users.set(user.id, user);
    this.statistics.totalUsers++;
    
    if (user.roles.includes(UserRole.BUYER)) {
      this.statistics.totalBuyers++;
    }
  }

  /**
   * Log role expansion event
   */
  private logRoleExpansionEvent(type: RoleExpansionEventType, data: any): void {
    const event: RoleExpansionEvent = {
      id: `role_expansion_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: this.getEventCategory(type),
      type,
      timestamp: new Date(),
      data,
      severity: this.getEventSeverity(type)
    };

    this.eventLog.push(event);
    console.log(`[RoleExpansion] Event: ${type} for ${data.userId || data.sellerId || data.storeId}`);
  }

  /**
   * Get event category based on type
   */
  private getEventCategory(type: RoleExpansionEventType): 'SELLER_PROFILE' | 'STORE' | 'DASHBOARD' | 'FULFILLMENT' {
    switch (type) {
      case RoleExpansionEventType.SELLER_APPLICATION_CREATED:
      case RoleExpansionEventType.SELLER_ACTIVATED:
      case RoleExpansionEventType.SELLER_SUSPENDED:
        return 'SELLER_PROFILE';
      case RoleExpansionEventType.STORE_CREATED:
      case RoleExpansionEventType.STORE_ACTIVATED:
      case RoleExpansionEventType.STORE_LISTING_CREATED:
        return 'STORE';
      case RoleExpansionEventType.SELLER_DASHBOARD_VIEWED:
      case RoleExpansionEventType.SELLER_LISTING_CREATED:
        return 'DASHBOARD';
      case RoleExpansionEventType.FULFILLMENT_METHOD_SELECTED:
        return 'FULFILLMENT';
      default:
        return 'SELLER_PROFILE';
    }
  }

  /**
   * Get event severity based on type
   */
  private getEventSeverity(type: RoleExpansionEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (type) {
      case RoleExpansionEventType.SELLER_APPLICATION_CREATED:
        return 'LOW';
      case RoleExpansionEventType.SELLER_ACTIVATED:
        return 'MEDIUM';
      case RoleExpansionEventType.SELLER_SUSPENDED:
        return 'HIGH';
      case RoleExpansionEventType.SELLER_DASHBOARD_VIEWED:
        return 'LOW';
      case RoleExpansionEventType.SELLER_LISTING_CREATED:
        return 'MEDIUM';
      case RoleExpansionEventType.STORE_CREATED:
        return 'LOW';
      case RoleExpansionEventType.STORE_ACTIVATED:
        return 'MEDIUM';
      case RoleExpansionEventType.STORE_LISTING_CREATED:
        return 'MEDIUM';
      case RoleExpansionEventType.FULFILLMENT_METHOD_SELECTED:
        return 'LOW';
      default:
        return 'LOW';
    }
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.users.clear();
    this.sellerProfiles.clear();
    this.stores.clear();
    this.sellerDashboards.clear();
    this.fulfillmentMethods.clear();
    this.eventLog = [];
    this.statistics = {
      totalUsers: 0,
      totalBuyers: 0,
      totalSellers: 0,
      totalExternalSellers: 0,
      totalStores: 0,
      activeSellers: 0,
      activeStores: 0,
      pendingSellerApplications: 0,
      pendingStoreApplications: 0,
      suspendedSellers: 0,
      suspendedStores: 0,
      averageSellerTrustScore: 0,
      averageStoreTrustScore: 0,
      topCountries: [],
      fulfillmentMethods: {
        travelerDelivery: 0,
        directShipping: 0,
        both: 0
      }
    };
  }
}

// Singleton instance
export const roleExpansionService = new RoleExpansionService();
