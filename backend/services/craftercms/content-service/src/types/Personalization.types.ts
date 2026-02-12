// Personalization Types

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  demographics?: UserDemographics;
  preferences?: UserPreferences;
  interests?: UserInterests;
  behavior?: UserBehavior;
  device?: UserDevice;
  location?: UserLocation;
  segments?: string[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
}

export interface UserDemographics {
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  location?: string;
  language?: string;
  timezone?: string;
  currency?: string;
  income?: string;
  education?: string;
  occupation?: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  currency?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  privacy?: {
    analytics?: boolean;
    marketing?: boolean;
    personalization?: boolean;
  };
  content?: {
    categories?: string[];
    tags?: string[];
    formats?: string[];
    frequency?: 'daily' | 'weekly' | 'monthly' | 'never';
  };
}

export interface UserInterests {
  categories?: string[];
  tags?: string[];
  topics?: string[];
  brands?: string[];
  activities?: string[];
  purchaseIntent?: {
    category?: string;
    timeframe?: 'immediate' | 'short-term' | 'long-term';
    budget?: number;
  };
}

export interface UserBehavior {
  sessionCount?: number;
  totalSessionDuration?: number;
  averageSessionDuration?: number;
  lastSessionAt?: string;
  pageViews?: number;
  bounceRate?: number;
  conversionRate?: number;
  purchaseHistory?: PurchaseHistory[];
  searchHistory?: SearchHistory[];
  engagementLevel?: 'low' | 'medium' | 'high';
  loyaltyStatus?: 'new' | 'regular' | 'vip';
}

export interface UserDevice {
  type?: 'desktop' | 'mobile' | 'tablet' | 'smart-tv';
  os?: string;
  browser?: string;
  screenResolution?: string;
  viewportSize?: string;
  userAgent?: string;
  isMobile?: boolean;
  isTablet?: boolean;
  isDesktop?: boolean;
}

export interface UserLocation {
  country?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  currency?: string;
  language?: string;
  ipAddress?: string;
}

export interface PurchaseHistory {
  id: string;
  productId: string;
  productName: string;
  category: string;
  price: number;
  currency: string;
  quantity: number;
  purchaseDate: string;
  status: 'completed' | 'cancelled' | 'refunded';
}

export interface SearchHistory {
  query: string;
  timestamp: string;
  resultsCount?: number;
  clickedResults?: string[];
  category?: string;
  intent?: 'informational' | 'navigational' | 'transactional';
}

export interface PersonalizationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  segments: string[];
  conditions: PersonalizationCondition[];
  modifications: PersonalizationModifications;
  schedule?: PersonalizationSchedule;
  targeting?: PersonalizationTargeting;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
}

export interface PersonalizationCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value?: any;
  values?: any[];
  logicalOperator?: 'AND' | 'OR';
  nestedConditions?: PersonalizationCondition[];
}

export interface PersonalizationModifications {
  fields?: Record<string, any>;
  content?: Record<string, any>;
  layout?: Record<string, any>;
  styling?: Record<string, any>;
  metadata?: Record<string, any>;
  variations?: ContentVariation[];
}

export interface ContentVariation {
  id: string;
  name: string;
  condition: PersonalizationCondition;
  content: Record<string, any>;
  weight: number;
  enabled: boolean;
}

export interface PersonalizationSchedule {
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval?: number;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    months?: number[];
  };
  timeWindows?: {
    startTime: string;
    endTime: string;
    daysOfWeek?: number[];
  }[];
}

export interface PersonalizationTargeting {
  geographic?: {
    countries?: string[];
    regions?: string[];
    cities?: string[];
    exclude?: boolean;
  };
  demographic?: {
    ageRange?: {
      min?: number;
      max?: number;
    };
    gender?: string[];
    income?: string[];
    education?: string[];
  };
  device?: {
    types?: string[];
    os?: string[];
    browsers?: string[];
    screenSizes?: string[];
  };
  behavioral?: {
    segments?: string[];
    engagementLevel?: string[];
    loyaltyStatus?: string[];
    purchaseHistory?: {
      categories?: string[];
      minValue?: number;
      maxValue?: number;
      timeFrame?: string;
    };
  };
}

export interface PersonalizedContent {
  id: string;
  path: string;
  contentType: string;
  locale: string;
  content: Record<string, any>;
  metadata?: ContentMetadata[];
  personalization: {
    applied: boolean;
    rules: string[];
    modifications: Record<string, any>;
    userSegments: string[];
    targeting?: PersonalizationTargeting;
    variations?: ContentVariation[];
    score?: number;
  };
  [key: string]: any;
}

export interface PersonalizationContext {
  timeOfDay?: string;
  dayOfWeek?: number;
  season?: string;
  referrer?: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  device?: UserDevice;
  location?: UserLocation;
  session?: {
    id: string;
    startTime: string;
    pageViews: number;
    duration: number;
  };
  abTest?: {
    testId: string;
    variant: string;
  };
  custom?: Record<string, any>;
}

export interface PersonalizationMetrics {
  ruleId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  engagementTime: number;
  bounceRate: number;
  ctr: number;
  conversionRate: number;
  segments: Record<string, PersonalizationSegmentMetrics>;
  timeDistribution: Record<string, number>;
  deviceDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
}

export interface PersonalizationSegmentMetrics {
  segment: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  avgEngagementTime: number;
}

export interface AITextGenerationRequest {
  prompt: string;
  contentType: string;
  tone?: 'formal' | 'casual' | 'professional' | 'friendly' | 'persuasive' | 'informative';
  length?: 'short' | 'medium' | 'long';
  language?: string;
  targetAudience?: string;
  keywords?: string[];
  maxLength?: number;
  context?: Record<string, any>;
}

export interface AITextGenerationResponse {
  text: string;
  confidence: number;
  tokensUsed: number;
  alternatives?: string[];
  metadata?: {
    tone: string;
    readingLevel: string;
    sentiment: string;
    keywords: string[];
  };
}

export interface AIImageGenerationRequest {
  prompt: string;
  style?: 'photorealistic' | 'illustration' | 'abstract' | 'cartoon' | 'minimalist';
  size?: 'small' | 'medium' | 'large' | 'square' | 'landscape' | 'portrait';
  colorScheme?: string[];
  mood?: string;
  context?: Record<string, any>;
}

export interface AIImageGenerationResponse {
  url: string;
  altText: string;
  confidence: number;
  metadata?: {
    style: string;
    colors: string[];
    dimensions: {
      width: number;
      height: number;
    };
  };
}

export interface ContentRecommendationRequest {
  userProfile: UserProfile;
  context: PersonalizationContext;
  contentId?: string;
  contentType?: string;
  limit?: number;
  excludeIds?: string[];
  diversity?: number;
  freshness?: number;
  popularity?: number;
}

export interface ContentRecommendationResponse {
  recommendations: PersonalizedContent[];
  reasoning?: string[];
  confidence: number;
  diversityScore: number;
  freshnessScore: number;
  popularityScore: number;
}