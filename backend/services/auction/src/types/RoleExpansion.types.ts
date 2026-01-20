/**
 * Role Expansion Types
 * 
 * Buyer → Seller → Storefront Transition System
 * Role expansion without breaking trust, finance, or authority rules
 */

export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  EXTERNAL_SELLER = 'EXTERNAL_SELLER',
  ADMIN = 'ADMIN'
}

export enum SellerProfileState {
  SELLER_PENDING = 'SELLER_PENDING',
  SELLER_ACTIVE = 'SELLER_ACTIVE',
  SELLER_SUSPENDED = 'SELLER_SUSPENDED'
}

export enum StoreState {
  STORE_PENDING = 'STORE_PENDING',
  STORE_ACTIVE = 'STORE_ACTIVE',
  STORE_SUSPENDED = 'STORE_SUSPENDED'
}

export enum FulfillmentMethod {
  TRAVELER_DELIVERY = 'TRAVELER_DELIVERY',
  DIRECT_SHIPPING = 'DIRECT_SHIPPING',
  BOTH = 'BOTH'
}

export enum RoleExpansionEventType {
  // Seller events
  SELLER_APPLICATION_CREATED = 'SELLER_APPLICATION_CREATED',
  SELLER_ACTIVATED = 'SELLER_ACTIVATED',
  SELLER_SUSPENDED = 'SELLER_SUSPENDED',
  
  // Seller dashboard events
  SELLER_DASHBOARD_VIEWED = 'SELLER_DASHBOARD_VIEWED',
  SELLER_LISTING_CREATED = 'SELLER_LISTING_CREATED',
  
  // Store events
  STORE_CREATED = 'STORE_CREATED',
  STORE_ACTIVATED = 'STORE_ACTIVATED',
  STORE_LISTING_CREATED = 'STORE_LISTING_CREATED',
  
  // Fulfillment events
  FULFILLMENT_METHOD_SELECTED = 'FULFILLMENT_METHOD_SELECTED'
}

export interface User {
  id: string;
  email: string;
  username: string;
  roles: UserRole[];
  trustScore: number;
  buyerTrustScore: number;
  sellerTrustScore?: number;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    ipAddress: string;
    userAgent: string;
  };
  restrictions: {
    suspended: boolean;
    suspendedAt?: Date;
    suspendedReason?: string;
    flagged: boolean;
    flaggedAt?: Date;
    flaggedReason?: string;
  };
}

export interface SellerProfile {
  id: string;
  userId: string;
  displayName: string;
  businessName?: string;
  country: string;
  city?: string;
  fulfillmentType: FulfillmentMethod;
  description?: string;
  avatar?: string;
  contactEmail: string;
  phone?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  state: SellerProfileState;
  trustMetrics: {
    sellerTrustScore: number;
    totalSales: number;
    successfulDeliveries: number;
    averageRating: number;
    responseTime: number;
    disputeRate: number;
    cancellationRate: number;
  };
  capabilities: {
    canCreateAuctions: boolean;
    canCreateListings: boolean;
    canShipInternationally: boolean;
    canOfferInsurance: boolean;
    maxActiveListings: number;
    supportedCategories: string[];
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    businessVerified: boolean;
    verifiedAt?: Date;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    activatedAt?: Date;
    suspendedAt?: Date;
    lastActivityAt?: Date;
    applicationIp: string;
    applicationUserAgent: string;
  };
  requirements: {
    minimumRating?: number;
    requiredVerifications: string[];
    restrictedCategories?: string[];
  };
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  country: string;
  city?: string;
  address?: string;
  contactEmail: string;
  phone?: string;
  website?: string;
  fulfillmentType: FulfillmentMethod;
  state: StoreState;
  trustMetrics: {
    storeTrustScore: number;
    totalSales: number;
    successfulDeliveries: number;
    averageRating: number;
    responseTime: number;
    disputeRate: number;
    cancellationRate: number;
  };
  capabilities: {
    canCreateAuctions: boolean;
    canCreateListings: boolean;
    canShipInternationally: boolean;
    canOfferInsurance: boolean;
    maxActiveListings: number;
    supportedCategories: string[];
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    businessVerified: boolean;
    verifiedAt?: Date;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    activatedAt?: Date;
    suspendedAt?: Date;
    lastActivityAt?: Date;
    applicationIp: string;
    applicationUserAgent: string;
  };
  settings: {
    autoAcceptOffers: boolean;
    requireVerification: boolean;
    allowInternationalShipping: boolean;
    supportedPaymentMethods: string[];
  };
}

export interface SellerDashboard {
  sellerId: string;
  userId: string;
  overview: {
    totalListings: number;
    activeListings: number;
    totalSales: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    pendingRevenue: number;
    averageOrderValue: number;
  };
  listings: {
    id: string;
    title: string;
    category: string;
    currentBid?: number;
    buyNowPrice?: number;
    status: string;
    views: number;
    watchers: number;
    createdAt: Date;
    endsAt?: Date;
  }[];
  sales: {
    id: string;
    listingId: string;
    listingTitle: string;
    buyerId: string;
    buyerUsername: string;
    finalPrice: number;
    currency: string;
    status: string;
    createdAt: Date;
    completedAt?: Date;
  }[];
  settlements: {
    id: string;
    saleId: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
    settledAt?: Date;
    description: string;
  }[];
  analytics: {
    viewsLast30Days: number;
    viewsLast7Days: number;
    conversionRate: number;
    averageResponseTime: number;
    ratingBreakdown: {
      fiveStars: number;
      fourStars: number;
      threeStars: number;
      twoStars: number;
      oneStar: number;
    };
  };
  metadata: {
    lastViewedAt: Date;
    totalViews: number;
    lastRefreshAt: Date;
  };
}

export interface FulfillmentMethodSignal {
  id: string;
  sellerId: string;
  listingId: string;
  method: FulfillmentMethod;
  configuration: {
    travelerDelivery?: {
      maxDistance: number;
      supportedCountries: string[];
      deliveryTime: number;
    };
    directShipping?: {
      supportedCountries: string[];
      shippingZones: Array<{
        zone: string;
        countries: string[];
        cost: number;
        estimatedDays: number;
      }>;
      freeShippingThreshold?: number;
    };
  };
  restrictions: {
    prohibitedItems: string[];
    restrictedCategories: string[];
    maxWeight?: number;
    maxDimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt?: Date;
  };
}

export interface RoleExpansionEvent {
  id: string;
  category: 'SELLER_PROFILE' | 'STORE' | 'DASHBOARD' | 'FULFILLMENT';
  type: RoleExpansionEventType;
  timestamp: Date;
  data: {
    userId?: string;
    sellerId?: string;
    storeId?: string;
    listingId?: string;
    previousState?: string;
    newState?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SellerApplicationRequest {
  displayName: string;
  businessName?: string;
  country: string;
  city?: string;
  fulfillmentType: FulfillmentMethod;
  description?: string;
  contactEmail: string;
  phone?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface SellerApplicationResult {
  success: boolean;
  sellerProfile?: SellerProfile;
  error?: string;
  requiresVerification?: string[];
}

export interface StoreCreationRequest {
  ownerId: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string;
  country: string;
  city?: string;
  address?: string;
  contactEmail: string;
  phone?: string;
  website?: string;
  fulfillmentType: FulfillmentMethod;
  settings?: {
    autoAcceptOffers: boolean;
    requireVerification: boolean;
    allowInternationalShipping: boolean;
    supportedPaymentMethods: string[];
  };
}

export interface StoreCreationResult {
  success: boolean;
  store?: Store;
  error?: string;
  requiresVerification?: string[];
}

export interface FulfillmentMethodRequest {
  sellerId: string;
  listingId: string;
  method: FulfillmentMethod;
  configuration: {
    travelerDelivery?: {
      maxDistance: number;
      supportedCountries: string[];
      deliveryTime: number;
    };
    directShipping?: {
      supportedCountries: string[];
      shippingZones: Array<{
        zone: string;
        countries: string[];
        cost: number;
        estimatedDays: number;
      }>;
      freeShippingThreshold?: number;
    };
  };
  restrictions?: {
    prohibitedItems: string[];
    restrictedCategories: string[];
    maxWeight?: number;
    maxDimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
}

export interface FulfillmentMethodResult {
  success: boolean;
  fulfillmentMethod?: FulfillmentMethodSignal;
  error?: string;
}

export interface RoleExpansionStatistics {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalExternalSellers: number;
  totalStores: number;
  activeSellers: number;
  activeStores: number;
  pendingSellerApplications: number;
  pendingStoreApplications: number;
  suspendedSellers: number;
  suspendedStores: number;
  averageSellerTrustScore: number;
  averageStoreTrustScore: number;
  topCountries: Array<{
    country: string;
    sellerCount: number;
    storeCount: number;
  }>;
  fulfillmentMethods: {
    travelerDelivery: number;
    directShipping: number;
    both: number;
  };
}

export interface RoleExpansionConfig {
  sellerApprovalRequired: boolean;
  storeApprovalRequired: boolean;
  minimumBuyerTrustScore: number;
  defaultSellerCapabilities: {
    canCreateAuctions: boolean;
    canCreateListings: boolean;
    maxActiveListings: number;
  };
  defaultStoreCapabilities: {
    canCreateAuctions: boolean;
    canCreateListings: boolean;
    maxActiveListings: number;
  };
  autoActivateSellers: boolean;
  autoActivateStores: boolean;
  requireSellerVerification: boolean;
  requireStoreVerification: boolean;
  supportedFulfillmentMethods: FulfillmentMethod[];
}

export interface RoleExpansionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requirements: string[];
}

export interface UserRoleTransition {
  userId: string;
  fromRole: UserRole;
  toRole: UserRole;
  transitionType: 'BUYER_TO_SELLER' | 'BUYER_TO_EXTERNAL_SELLER' | 'SELLER_TO_EXTERNAL_SELLER';
  reason: string;
  approvedBy?: string;
  approvedAt?: Date;
  metadata: {
    applicationData?: Record<string, any>;
    verificationRequired?: string[];
    backgroundCheck?: boolean;
  };
}
