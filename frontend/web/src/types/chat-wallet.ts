// ============================================
// 💬 Chat Types - Real-time Messaging
// ============================================

export interface Conversation {
  id: string;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  type: 'direct' | 'order' | 'support';
  orderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  userId: string;
  name: string;
  avatar?: string;
  role: 'buyer' | 'seller' | 'traveler' | 'support';
  isOnline: boolean;
  lastSeen?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  attachments?: ChatAttachment[];
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export type MessageType = 'text' | 'image' | 'file' | 'location' | 'order_update' | 'payment' | 'system';

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'location';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
  location?: {
    lat: number;
    lon: number;
    address?: string;
  };
}

// ============================================
// 💰 Wallet Types - Financial System
// ============================================

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  pendingBalance: number;
  frozenBalance: number; // In escrow
  totalEarnings: number;
  totalSpent: number;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

export type WalletStatus = 'active' | 'suspended' | 'pending_verification';

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  status: TransactionStatus;
  description: string;
  reference?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type TransactionType = 
  | 'deposit'
  | 'withdrawal'
  | 'payment'
  | 'refund'
  | 'earning'
  | 'escrow_hold'
  | 'escrow_release'
  | 'transfer'
  | 'bonus'
  | 'fee';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'processing';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  isDefault: boolean;
  details: CardDetails | BankDetails | MobileWalletDetails;
  status: 'active' | 'expired' | 'disabled';
  createdAt: string;
}

export type PaymentMethodType = 'card' | 'bank_account' | 'mobile_wallet' | 'paypal';

export interface CardDetails {
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
  swiftCode?: string;
}

export interface MobileWalletDetails {
  provider: 'vodafone_cash' | 'orange_money' | 'etisalat_cash' | 'fawry';
  phoneNumber: string;
}

export interface WithdrawalRequest {
  id: string;
  walletId: string;
  amount: number;
  currency: string;
  fee: number;
  netAmount: number;
  paymentMethodId: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
}

// ============================================
// 👤 Enhanced User Dashboard Types
// ============================================

export interface UserDashboard {
  user: UserProfile;
  wallet: Wallet;
  stats: UserStats;
  recentActivity: ActivityItem[];
  notifications: DashboardNotification[];
}

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRoleExtended;
  kycStatus: KYCStatus;
  kycLevel: number; // 0-3
  rating: number;
  totalReviews: number;
  memberSince: string;
  lastActive: string;
  isVerified: boolean;
  badges: UserBadge[];
}

export type UserRoleExtended = 'buyer' | 'seller' | 'traveler' | 'hybrid';
export type KYCStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export interface UserBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
}

export interface UserStats {
  // Buyer stats
  totalOrders?: number;
  totalSpent?: number;
  activeOrders?: number;
  
  // Seller stats
  totalProducts?: number;
  totalSales?: number;
  totalRevenue?: number;
  pendingOrders?: number;
  
  // Traveler stats
  totalTrips?: number;
  totalDeliveries?: number;
  totalEarnings?: number;
  activeDeliveries?: number;
  
  // Common
  rating: number;
  reviewsCount: number;
  responseRate?: number;
  responseTime?: string; // "< 1 hour"
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  link?: string;
}

export type ActivityType = 
  | 'order_placed'
  | 'order_received'
  | 'payment_received'
  | 'payment_sent'
  | 'review_received'
  | 'product_sold'
  | 'bid_won'
  | 'trip_created'
  | 'delivery_completed'
  | 'withdrawal'
  | 'badge_earned';

export interface DashboardNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  action?: {
    label: string;
    link: string;
  };
  read: boolean;
  createdAt: string;
}

// ============================================
// 🔐 KYC Types
// ============================================

export interface KYCApplication {
  id: string;
  userId: string;
  level: number;
  status: KYCStatus;
  documents: KYCDocument[];
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface KYCDocument {
  id: string;
  type: 'id_card' | 'passport' | 'driving_license' | 'proof_of_address' | 'selfie';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
}
