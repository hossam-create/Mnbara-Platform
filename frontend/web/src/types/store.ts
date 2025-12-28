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
  joinDate: string;
  subscriptionEndDate?: string;
  categories: string[];
  socialLinks?: Record<string, string>;
  contactInfo?: Record<string, string>;
  targetRegions: string[];
  isVerified: boolean;
  acceptsReturns: boolean;
  returnPeriodDays: number;
  createdAt: string;
  updatedAt?: string;
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

export interface StoreStats {
  dailyVisitors: number;
  monthlySales: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: string[];
}

export interface StoreSubscription {
  tier: StoreTier;
  startDate: string;
  endDate: string;
  price: number;
  isActive: boolean;
}