// Store Model - نموذج المتاجر الأساسي

export enum StoreTier {
  basic = 'basic',      // متجر أساسي
  premium = 'premium',  // متجر بريميوم
  enterprise = 'enterprise' // متجر مؤسسي
}

export enum StoreStatus {
  pending = 'pending',   // قيد المراجعة
  active = 'active',    // نشط
  suspended = 'suspended', // موقوف
  banned = 'banned'     // محظور
}

export interface Store {
  id: string;
  ownerId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  logo?: string;
  coverImage?: string;
  tier: StoreTier;
  status: StoreStatus;
  rating: number;
  reviewCount: number;
  totalSales: number;
  totalProducts: number;
  totalFollowers: number;
  joinDate: Date;
  subscriptionEndDate?: Date;
  categories: string[];
  socialLinks?: Record<string, string>;
  contactInfo?: Record<string, string>;
  targetRegions: string[];
  isVerified: boolean;
  acceptsReturns: boolean;
  returnPeriodDays: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateStoreRequest {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  logo?: string;
  coverImage?: string;
  categories?: string[];
  socialLinks?: Record<string, string>;
  contactInfo?: Record<string, string>;
  targetRegions?: string[];
  acceptsReturns?: boolean;
  returnPeriodDays?: number;
}

export interface UpdateStoreRequest extends Partial<CreateStoreRequest> {
  id: string;
}

export interface StoreStats {
  storeId: string;
  dailyVisitors: number;
  monthlySales: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: string[];
  period: Date;
}

export interface StoreSubscription {
  storeId: string;
  tier: StoreTier;
  startDate: Date;
  endDate: Date;
  price: number;
  isActive: boolean;
}

export interface StorePromotion {
  id: string;
  storeId: string;
  productIds: string[];
  promotionType: 'featured' | 'discount' | 'bundle';
  discountPercentage?: number;
  startDate: Date;
  endDate: Date;
  targetRegions?: string[];
  budget: number;
  spent: number;
  status: 'active' | 'paused' | 'completed' | 'scheduled';
  createdAt: Date;
}

// Store Verification - توثيق المتاجر
export interface StoreVerification {
  storeId: string;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  documents: {
    type: string;
    url: string;
    status: 'approved' | 'rejected' | 'pending';
  }[];
}