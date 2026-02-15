export interface LiveStream {
  id: string;
  title: string;
  description?: string;
  streamerId: string;
  streamerName: string;
  status: StreamStatus;
  rtmpUrl: string;
  playbackUrl: string;
  thumbnailUrl?: string;
  viewerCount: number;
  maxViewers: number;
  isRecording: boolean;
  isAuction: boolean;
  auctionId?: string;
  category: StreamCategory;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  updatedAt: Date;
}

export enum StreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  ERROR = 'error',
  BANNED = 'banned'
}

export enum StreamCategory {
  AUCTION = 'auction',
  PRODUCT_REVIEW = 'product_review',
  TUTORIAL = 'tutorial',
  ENTERTAINMENT = 'entertainment',
  Q_AND_A = 'q_and_a',
  BEHIND_THE_SCENES = 'behind_the_scenes',
  OTHER = 'other'
}

export interface StreamSettings {
  quality: StreamQuality;
  bitrate: number;
  fps: number;
  resolution: string;
  enableRecording: boolean;
  enableChat: boolean;
  enableModeration: boolean;
  maxViewers: number;
  requireAuth: boolean;
  allowComments: boolean;
  autoStartRecording: boolean;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    opacity: number;
  };
}

export enum StreamQuality {
  LOW = 'low',      // 480p
  MEDIUM = 'medium', // 720p
  HIGH = 'high',    // 1080p
  ULTRA = 'ultra'   // 4K
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  isModerator: boolean;
  isStreamer: boolean;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: string;
  reactions: ChatReaction[];
  metadata: Record<string, any>;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface LiveAuction {
  id: string;
  streamId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  status: AuctionStatus;
  startingBid: number;
  currentBid: number;
  currentBidder?: string;
  bidIncrement: number;
  reservePrice?: number;
  buyNowPrice?: number;
  item: AuctionItem;
  bids: Bid[];
  participants: string[];
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AuctionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export interface AuctionItem {
  id: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  brand?: string;
  model?: string;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  shipping: {
    freeShipping: boolean;
    estimatedDelivery: string;
    shippingCost?: number;
  };
}

export interface Bid {
  id: string;
  auctionId: string;
  userId: string;
  username: string;
  amount: number;
  timestamp: Date;
  isWinning: boolean;
  isAutoBid: boolean;
  maxAutoBid?: number;
}

export interface StreamAnalytics {
  streamId: string;
  totalViewers: number;
  peakViewers: number;
  averageViewDuration: number;
  chatMessages: number;
  reactions: number;
  shares: number;
  revenue: number;
  topViewers: ViewerAnalytics[];
  geographicData: GeographicData[];
  deviceData: DeviceData[];
  timeData: TimeData[];
}

export interface ViewerAnalytics {
  userId: string;
  username: string;
  totalWatchTime: number;
  messagesSent: number;
  bidsPlaced: number;
  purchases: number;
  firstSeen: Date;
  lastSeen: Date;
}

export interface GeographicData {
  country: string;
  region: string;
  city: string;
  viewerCount: number;
  watchTime: number;
}

export interface DeviceData {
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'tv';
  os: string;
  browser: string;
  viewerCount: number;
  watchTime: number;
}

export interface TimeData {
  timestamp: Date;
  viewerCount: number;
  chatRate: number;
  engagementScore: number;
}