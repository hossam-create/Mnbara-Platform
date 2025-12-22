// ============================================
// 🎮 Gamification Types
// ============================================

// Spin Wheel
export interface SpinWheelPrize {
  id: string;
  name: string;
  type: 'discount' | 'points' | 'cashback' | 'free_shipping' | 'nothing';
  value: number;
  probability: number;
  color: string;
  icon: string;
}

export interface SpinResult {
  prizeId: string;
  prize: SpinWheelPrize;
  code?: string;
  expiresAt?: string;
}

// Daily Challenges
export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  progress: number;
  points: number;
  icon: string;
  expiresAt: string;
  completed: boolean;
}

export type ChallengeType = 
  | 'make_purchase'
  | 'leave_review'
  | 'share_product'
  | 'invite_friend'
  | 'complete_profile'
  | 'add_to_wishlist'
  | 'daily_login';

// Streak Rewards
export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string;
  nextReward: StreakReward;
  rewards: StreakReward[];
}

export interface StreakReward {
  day: number;
  points: number;
  bonus?: {
    type: 'discount' | 'cashback' | 'free_spin';
    value: number;
  };
  claimed: boolean;
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  role: 'buyer' | 'seller' | 'traveler';
  score: number;
  badge?: string;
  change: 'up' | 'down' | 'same';
  previousRank?: number;
}

export interface Leaderboard {
  type: 'buyers' | 'sellers' | 'travelers' | 'overall';
  period: 'daily' | 'weekly' | 'monthly' | 'alltime';
  entries: LeaderboardEntry[];
  userRank?: LeaderboardEntry;
  lastUpdated: string;
}

// ============================================
// 📍 Live Tracking Types
// ============================================

export interface LiveTracking {
  orderId: string;
  deliveryId: string;
  status: DeliveryTrackingStatus;
  traveler: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    phone?: string;
    isAnonymous: boolean;
  } | null;
  currentLocation?: GeoLocation;
  route: TrackingWaypoint[];
  estimatedArrival: string;
  distance: {
    total: number;
    remaining: number;
    unit: 'km' | 'miles';
  };
  timeline: TrackingEvent[];
}

export type DeliveryTrackingStatus = 
  | 'pending_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'nearby'
  | 'arrived'
  | 'delivered';

export interface GeoLocation {
  lat: number;
  lon: number;
  address?: string;
  timestamp: string;
}

export interface TrackingWaypoint {
  type: 'origin' | 'current' | 'destination';
  location: GeoLocation;
  name: string;
  icon: string;
}

export interface TrackingEvent {
  id: string;
  status: DeliveryTrackingStatus;
  message: string;
  location?: string;
  timestamp: string;
}

// ============================================
// 🏪 Seller Store Types
// ============================================

export interface SellerStore {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  logo?: string;
  banner?: string;
  description: string;
  category: string;
  rating: number;
  totalReviews: number;
  totalProducts: number;
  totalSales: number;
  followers: number;
  isVerified: boolean;
  badges: StoreBadge[];
  contact: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  policies: {
    returnPolicy?: string;
    shippingPolicy?: string;
  };
  workingHours?: {
    days: string[];
    openTime: string;
    closeTime: string;
  };
  createdAt: string;
}

export interface StoreBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// ============================================
// ✈️ Traveler Profile Types
// ============================================

export interface TravelerProfile {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  bio?: string;
  rating: number;
  totalReviews: number;
  totalDeliveries: number;
  totalEarnings: number;
  countries: string[];
  languages: string[];
  kycStatus: TravelerKYCStatus;
  verificationLevel: 1 | 2 | 3;
  badges: TravelerBadge[];
  insurance: boolean;
  responseTime: string;
  acceptanceRate: number;
  onTimeRate: number;
  isOnline: boolean;
  lastActive: string;
  createdAt: string;
}

export type TravelerKYCStatus = 
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired';

export interface TravelerBadge {
  id: string;
  name: string;
  icon: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: string;
}

export interface TravelerVerification {
  id: string;
  visitorId: string;
  status: TravelerKYCStatus;
  documents: {
    passport?: VerificationDocument;
    governmentId?: VerificationDocument;
    proofOfAddress?: VerificationDocument;
    selfie?: VerificationDocument;
    travelHistory?: VerificationDocument;
  };
  backgroundCheck: {
    status: 'pending' | 'passed' | 'failed';
    completedAt?: string;
  };
  submittedAt: string;
  reviewedAt?: string;
  expiresAt?: string;
}

export interface VerificationDocument {
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  reviewNote?: string;
}

// ============================================
// 📦 Fulfillment by Mnbara (FBM)
// ============================================

export interface FulfillmentService {
  id: string;
  name: string;
  type: 'standard' | 'express' | 'anonymous';
  description: string;
  features: string[];
  pricing: {
    baseFee: number;
    perKg: number;
    insurance: number;
    currency: string;
  };
  estimatedDays: {
    min: number;
    max: number;
  };
  coverage: string[];
  isAnonymous: boolean;
}

export interface FulfillmentOrder {
  id: string;
  orderId: string;
  type: FulfillmentService['type'];
  status: FulfillmentStatus;
  isAnonymous: boolean;
  package: {
    weight: number;
    dimensions: { length: number; width: number; height: number };
    value: number;
    description: string;
  };
  pickup: {
    address: string;
    date: string;
    contact: string;
  };
  delivery: {
    address: string;
    estimatedDate: string;
    contact: string;
  };
  traveler?: {
    id: string;
    name: string;
    hidden: boolean; // FBM anonymity
  };
  tracking: {
    code: string;
    url: string;
  };
  insurance: {
    included: boolean;
    coverage: number;
  };
  pricing: {
    shipping: number;
    insurance: number;
    handling: number;
    total: number;
  };
  createdAt: string;
}

export type FulfillmentStatus = 
  | 'pending'
  | 'confirmed'
  | 'picked_up'
  | 'at_warehouse'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned';

// ============================================
// ⭐ Reviews & Comments
// ============================================

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  user: {
    name: string;
    avatar?: string;
    isVerifiedBuyer: boolean;
  };
  rating: number;
  title?: string;
  content: string;
  pros?: string[];
  cons?: string[];
  images?: string[];
  likes: number;
  dislikes: number;
  isHelpful: boolean;
  sellerResponse?: {
    content: string;
    respondedAt: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface TravelerReview {
  id: string;
  travelerId: string;
  userId: string;
  deliveryId: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  categories: {
    communication: number;
    punctuality: number;
    packaging: number;
    professionalism: number;
  };
  content: string;
  tags: string[];
  createdAt: string;
}

export interface SellerReview {
  id: string;
  sellerId: string;
  storeId: string;
  userId: string;
  orderId: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number;
  categories: {
    productQuality: number;
    shipping: number;
    communication: number;
    value: number;
  };
  content: string;
  createdAt: string;
}
