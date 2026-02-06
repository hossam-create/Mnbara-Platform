/**
 * Smart Buyer AI Service Types
 * Camera/Mic powered product search and matching
 */

// ============= Image Recognition Types =============

export interface ImageRecognitionResult {
  labels: RecognizedLabel[];
  objects: RecognizedObject[];
  colors: DominantColor[];
  processingTimeMs: number;
  modelVersion: string;
}

export interface RecognizedLabel {
  name: string;
  confidence: number;
  category: string;
}

export interface RecognizedObject {
  boundingBox: BoundingBox;
  label: string;
  confidence: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DominantColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  percentage: number;
  name: string;
}

// ============= Voice Processing Types =============

export interface VoiceProcessingResult {
  transcript: string;
  confidence: number;
  language: string;
  alternatives: SpeechAlternative[];
  processingTimeMs: number;
}

export interface SpeechAlternative {
  transcript: string;
  confidence: number;
}

export interface VoiceCommand {
  action: VoiceAction;
  parameters: Record<string, any>;
  confidence: number;
  rawTranscript: string;
}

export enum VoiceAction {
  SEARCH = 'SEARCH',
  FILTER = 'FILTER',
  SORT = 'SORT',
  NAVIGATE = 'NAVIGATE',
  ADD_TO_CART = 'ADD_TO_CART',
  COMPARE = 'COMPARE',
  DETAILS = 'DETAILS',
  UNKNOWN = 'UNKNOWN'
}

// ============= Product Matching Types =============

export interface ProductMatchResult {
  matches: ProductMatch[];
  totalMatches: number;
  query: ProductQuery;
  processingTimeMs: number;
}

export interface ProductMatch {
  productId: string;
  productName: string;
  matchScore: number;
  matchReasons: string[];
  price: number;
  currency: string;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  trustScore: number;
  location?: {
    city: string;
    country: string;
  };
  condition: ProductCondition;
  category: string;
  tags: string[];
}

export interface ProductQuery {
  type: 'image' | 'voice' | 'text' | 'combined';
  sourceImageUrl?: string;
  voiceTranscript?: string;
  textQuery?: string;
  extractedTags: string[];
  extractedCategories: string[];
  extractedColors: string[];
  extractedAttributes: Record<string, any>;
}

export enum ProductCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR'
}

// ============= Smart Search Types =============

export interface SmartSearchResult {
  query: string;
  interpretedQuery: InterpretedQuery;
  products: ProductMatch[];
  suggestions: SearchSuggestion[];
  relatedCategories: string[];
  processingTimeMs: number;
}

export interface InterpretedQuery {
  original: string;
  normalized: string;
  intent: SearchIntent;
  entities: SearchEntity[];
  filters: SearchFilter[];
}

export enum SearchIntent {
  FIND_PRODUCT = 'FIND_PRODUCT',
  COMPARE_PRICES = 'COMPARE_PRICES',
  CHECK_AVAILABILITY = 'CHECK_AVAILABILITY',
  FIND_SIMILAR = 'FIND_SIMILAR',
  BROWSING = 'BROWSING',
  UNKNOWN = 'UNKNOWN'
}

export interface SearchEntity {
  type: EntityType;
  value: string;
  confidence: number;
}

export enum EntityType {
  PRODUCT_NAME = 'PRODUCT_NAME',
  BRAND = 'BRAND',
  CATEGORY = 'CATEGORY',
  PRICE_RANGE = 'PRICE_RANGE',
  COLOR = 'COLOR',
  CONDITION = 'CONDITION',
  LOCATION = 'LOCATION',
  SIZE = 'SIZE'
}

export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'EQUALS',
  CONTAINS = 'CONTAINS',
  GT = 'GT',
  GTE = 'GTE',
  LT = 'LT',
  LTE = 'LTE',
  BETWEEN = 'BETWEEN'
}

export interface SearchSuggestion {
  type: 'completion' | 'correction' | 'related' | 'popular';
  text: string;
  confidence: number;
  metadata?: Record<string, any>;
}

// ============= Camera/Mic Integration Types =============

export interface CameraUploadRequest {
  imageData: string; // Base64 encoded image
  userId: string;
  context?: {
    latitude?: number;
    longitude?: number;
    deviceInfo?: string;
  };
}

export interface GalleryUploadRequest {
  imageUrl: string;
  userId: string;
}

export interface VoiceProcessRequest {
  audioData: string; // Base64 encoded audio
  userId: string;
  language?: string;
  context?: {
    currentSearch?: string;
    filters?: Record<string, any>;
  };
}

export interface CameraUploadResponse {
  success: boolean;
  imageId: string;
  thumbnailUrl: string;
  recognitionResult?: ImageRecognitionResult;
  suggestedCategories?: string[];
  suggestedTags?: string[];
}

export interface VoiceProcessResponse {
  success: boolean;
  transcript: string;
  command?: VoiceCommand;
  suggestedActions?: string[];
}

// ============= API Request/Response Types =============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    processingTimeMs: number;
    version: string;
  };
}

export interface SearchRequest {
  query: string;
  type?: 'text' | 'voice' | 'image';
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface MatchRequest {
  imageUrl?: string;
  imageData?: string;
  tags?: string[];
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition[];
  location?: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  limit?: number;
}

// ============= Service Health Types =============

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    imageRecognition: ComponentHealth;
    voiceProcessing: ComponentHealth;
    productMatching: ComponentHealth;
    smartSearch: ComponentHealth;
  };
  timestamp: string;
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTimeMs: number;
  message?: string;
}
