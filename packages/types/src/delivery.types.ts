import { BaseEntity, GeoLocation, DeliveryAddress } from './common.types';

// Delivery Status Enum
export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

// Delivery Type Enum
export enum DeliveryType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SAME_DAY = 'same_day',
  CROWDSHIPPING = 'crowdshipping',
  SCHEDULED = 'scheduled',
  INTERNATIONAL = 'international'
}

// Delivery Priority Enum
export enum DeliveryPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Package Size Enum
export enum PackageSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large'
}

// Delivery Method Enum
export enum DeliveryMethod {
  COURIER = 'courier',
  TRAVELER = 'traveler',
  POSTAL = 'postal',
  PICKUP = 'pickup'
}

// Proof of Delivery Type Enum
export enum ProofOfDeliveryType {
  SIGNATURE = 'signature',
  PHOTO = 'photo',
  OTP = 'otp',
  QR_CODE = 'qr_code',
  BIOMETRIC = 'biometric'
}

// Package Condition Enum
export enum PackageCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  DAMAGED = 'damaged'
}

// Package Dimensions Interface
export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
  weight: number;
  weightUnit: 'kg' | 'lb';
}

// Package Details Interface
export interface PackageDetails {
  description: string;
  size: PackageSize;
  dimensions?: PackageDimensions;
  weight: number;
  weightUnit: 'kg' | 'lb';
  quantity: number;
  value?: number;
  currency?: string;
  fragile: boolean;
  perishable: boolean;
  requiresSignature: boolean;
  specialInstructions?: string;
  images?: string[];
}

// Delivery Sender Interface
export interface DeliverySender {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: DeliveryAddress;
}

// Delivery Recipient Interface
export interface DeliveryRecipient {
  name: string;
  email?: string;
  phoneNumber: string;
  address: DeliveryAddress;
  alternatePhone?: string;
  preferredDeliveryTime?: string;
}

// Delivery Traveler Interface
export interface DeliveryTraveler {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar?: string;
  rating?: number;
  totalDeliveries?: number;
  vehicleType?: string;
  vehicleNumber?: string;
  tripId?: string;
}

// Delivery Route Interface
export interface DeliveryRoute {
  origin: GeoLocation;
  destination: GeoLocation;
  distance: number;
  distanceUnit: 'km' | 'mi';
  estimatedDuration: number;
  actualDuration?: number;
  waypoints?: GeoLocation[];
  polyline?: string;
}

// Delivery Tracking Event Interface
export interface DeliveryTrackingEvent {
  id: string;
  status: DeliveryStatus;
  location?: GeoLocation;
  address?: string;
  timestamp: Date;
  message: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

// Delivery Timeline Interface
export interface DeliveryTimeline {
  createdAt: Date;
  assignedAt?: Date;
  acceptedAt?: Date;
  pickedUpAt?: Date;
  inTransitAt?: Date;
  arrivedAt?: Date;
  deliveredAt?: Date;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
}

// Proof of Delivery Interface
export interface ProofOfDelivery {
  type: ProofOfDeliveryType;
  signature?: string;
  photo?: string;
  otp?: string;
  qrCode?: string;
  biometricData?: string;
  recipientName?: string;
  timestamp: Date;
  location?: GeoLocation;
  notes?: string;
}

// Delivery Pricing Interface
export interface DeliveryPricing {
  baseFee: number;
  distanceFee: number;
  weightFee: number;
  priorityFee: number;
  serviceFee: number;
  tax: number;
  discount?: number;
  total: number;
  currency: string;
}

// Delivery Insurance Interface
export interface DeliveryInsurance {
  insured: boolean;
  coverage: number;
  premium: number;
  currency: string;
  provider?: string;
  policyNumber?: string;
}

// Delivery Rating Interface
export interface DeliveryRating {
  id: string;
  deliveryId: string;
  ratedBy: string;
  rating: number;
  comment?: string;
  categories?: {
    timeliness?: number;
    communication?: number;
    packaging?: number;
    professionalism?: number;
  };
  createdAt: Date;
}

// Delivery Issue Interface
export interface DeliveryIssue {
  id: string;
  type: 'damaged' | 'lost' | 'delayed' | 'wrong_address' | 'refused' | 'other';
  description: string;
  reportedBy: string;
  reportedAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  resolution?: string;
  resolvedAt?: Date;
  images?: string[];
  metadata?: Record<string, unknown>;
}

// Delivery Notification Settings Interface
export interface DeliveryNotificationSettings {
  notifyOnAssignment: boolean;
  notifyOnPickup: boolean;
  notifyOnInTransit: boolean;
  notifyOnArrival: boolean;
  notifyOnDelivery: boolean;
  notifyOnDelay: boolean;
  notifyOnIssue: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

// Main Delivery Interface
export interface Delivery extends BaseEntity {
  deliveryNumber: string;
  orderId?: string;
  type: DeliveryType;
  status: DeliveryStatus;
  priority: DeliveryPriority;
  method: DeliveryMethod;
  sender: DeliverySender;
  recipient: DeliveryRecipient;
  traveler?: DeliveryTraveler;
  package: PackageDetails;
  route: DeliveryRoute;
  timeline: DeliveryTimeline;
  pricing: DeliveryPricing;
  insurance?: DeliveryInsurance;
  trackingEvents: DeliveryTrackingEvent[];
  proofOfDelivery?: ProofOfDelivery;
  rating?: DeliveryRating;
  issues?: DeliveryIssue[];
  notificationSettings?: DeliveryNotificationSettings;
  specialRequirements?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
}

// Create Delivery DTO
export interface CreateDeliveryDto {
  orderId?: string;
  type: DeliveryType;
  priority?: DeliveryPriority;
  method: DeliveryMethod;
  sender: {
    userId: string;
    address: DeliveryAddress;
  };
  recipient: {
    name: string;
    phoneNumber: string;
    email?: string;
    address: DeliveryAddress;
    preferredDeliveryTime?: string;
  };
  package: {
    description: string;
    size: PackageSize;
    weight: number;
    weightUnit: 'kg' | 'lb';
    quantity: number;
    value?: number;
    fragile?: boolean;
    perishable?: boolean;
    requiresSignature?: boolean;
    specialInstructions?: string;
  };
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  insurance?: {
    coverage: number;
    currency: string;
  };
  specialRequirements?: string[];
  notes?: string;
}

// Update Delivery DTO
export interface UpdateDeliveryDto {
  status?: DeliveryStatus;
  travelerId?: string;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  currentLocation?: GeoLocation;
  notes?: string;
}

// Assign Delivery DTO
export interface AssignDeliveryDto {
  deliveryId: string;
  travelerId: string;
  estimatedPickupTime: Date;
  estimatedDeliveryTime: Date;
}

// Accept Delivery DTO
export interface AcceptDeliveryDto {
  deliveryId: string;
  travelerId: string;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
}

// Complete Delivery DTO
export interface CompleteDeliveryDto {
  deliveryId: string;
  proofOfDelivery: {
    type: ProofOfDeliveryType;
    signature?: string;
    photo?: string;
    otp?: string;
    recipientName?: string;
    notes?: string;
  };
  packageCondition: PackageCondition;
  actualDeliveryTime: Date;
  location: GeoLocation;
}

// Cancel Delivery DTO
export interface CancelDeliveryDto {
  deliveryId: string;
  reason: string;
  cancelledBy: string;
  refundAmount?: number;
}

// Report Delivery Issue DTO
export interface ReportDeliveryIssueDto {
  deliveryId: string;
  type: 'damaged' | 'lost' | 'delayed' | 'wrong_address' | 'refused' | 'other';
  description: string;
  reportedBy: string;
  images?: string[];
}

// Rate Delivery DTO
export interface RateDeliveryDto {
  deliveryId: string;
  rating: number;
  comment?: string;
  categories?: {
    timeliness?: number;
    communication?: number;
    packaging?: number;
    professionalism?: number;
  };
}

// Delivery Search Filters Interface
export interface DeliverySearchFilters {
  status?: DeliveryStatus[];
  type?: DeliveryType[];
  priority?: DeliveryPriority[];
  method?: DeliveryMethod[];
  senderId?: string;
  travelerId?: string;
  orderId?: string;
  deliveryNumber?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  pickupCity?: string;
  deliveryCity?: string;
  minDistance?: number;
  maxDistance?: number;
  searchQuery?: string;
}

// Delivery List Response Interface
export interface DeliveryListResponse {
  deliveries: Delivery[];
  total: number;
  page: number;
  limit: number;
}

// Delivery Summary Interface
export interface DeliverySummary {
  id: string;
  deliveryNumber: string;
  status: DeliveryStatus;
  type: DeliveryType;
  senderName: string;
  recipientName: string;
  pickupCity: string;
  deliveryCity: string;
  estimatedDeliveryTime?: Date;
  createdAt: Date;
}

// Delivery Statistics Interface
export interface DeliveryStatistics {
  totalDeliveries: number;
  pendingDeliveries: number;
  inTransitDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  cancelledDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  averageRating: number;
}

// Delivery Tracking Info Interface
export interface DeliveryTrackingInfo {
  deliveryId: string;
  deliveryNumber: string;
  status: DeliveryStatus;
  currentLocation?: GeoLocation;
  estimatedDeliveryTime?: Date;
  trackingEvents: DeliveryTrackingEvent[];
  traveler?: {
    name: string;
    phoneNumber: string;
    avatar?: string;
    rating?: number;
  };
  route?: DeliveryRoute;
}

// Delivery Availability Interface
export interface DeliveryAvailability {
  available: boolean;
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  pricing?: DeliveryPricing;
  availableTravelers?: number;
  message?: string;
}

// Delivery Quote Interface
export interface DeliveryQuote {
  type: DeliveryType;
  priority: DeliveryPriority;
  estimatedPickupTime: Date;
  estimatedDeliveryTime: Date;
  pricing: DeliveryPricing;
  distance: number;
  distanceUnit: 'km' | 'mi';
  duration: number;
  validUntil: Date;
}

// Delivery Route Optimization Interface
export interface DeliveryRouteOptimization {
  deliveryIds: string[];
  optimizedRoute: GeoLocation[];
  totalDistance: number;
  totalDuration: number;
  estimatedCost: number;
  savings: {
    distance: number;
    time: number;
    cost: number;
  };
}

// Delivery Analytics Interface
export interface DeliveryAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  onTimeRate: number;
  averageRating: number;
  totalRevenue: number;
  deliveriesByStatus: Record<DeliveryStatus, number>;
  deliveriesByType: Record<DeliveryType, number>;
  topTravelers: Array<{
    travelerId: string;
    travelerName: string;
    deliveryCount: number;
    averageRating: number;
    totalEarned: number;
  }>;
  deliveriesByDay: Array<{
    date: Date;
    count: number;
    revenue: number;
  }>;
}

// Delivery Batch Interface
export interface DeliveryBatch extends BaseEntity {
  batchNumber: string;
  travelerId: string;
  deliveryIds: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  totalDeliveries: number;
  completedDeliveries: number;
  route?: DeliveryRoute;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

// Delivery Zone Interface
export interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  boundaries: GeoLocation[];
  active: boolean;
  serviceable: boolean;
  deliveryTypes: DeliveryType[];
  baseFee: number;
  perKmFee: number;
  currency: string;
  estimatedDeliveryTime: number;
  metadata?: Record<string, unknown>;
}

// Delivery Schedule Interface
export interface DeliverySchedule {
  id: string;
  deliveryId: string;
  scheduledDate: Date;
  timeSlot: {
    start: string;
    end: string;
  };
  status: 'scheduled' | 'confirmed' | 'rescheduled' | 'cancelled';
  reminderSent: boolean;
  metadata?: Record<string, unknown>;
}

// Delivery Capacity Interface
export interface DeliveryCapacity {
  zoneId: string;
  date: Date;
  timeSlot: string;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  availableTravelers: number;
}

// Delivery Performance Metrics Interface
export interface DeliveryPerformanceMetrics {
  travelerId: string;
  period: {
    from: Date;
    to: Date;
  };
  totalDeliveries: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  cancelledDeliveries: number;
  averageRating: number;
  totalEarnings: number;
  averageDeliveryTime: number;
  onTimeRate: number;
  completionRate: number;
}

// Delivery Notification Interface
export interface DeliveryNotification {
  id: string;
  deliveryId: string;
  recipientId: string;
  type: 'sms' | 'email' | 'push';
  event: 'assigned' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'delayed' | 'issue';
  message: string;
  sentAt: Date;
  delivered: boolean;
  deliveredAt?: Date;
  metadata?: Record<string, unknown>;
}

// Delivery SLA Interface
export interface DeliverySLA {
  type: DeliveryType;
  priority: DeliveryPriority;
  maxPickupTime: number;
  maxDeliveryTime: number;
  maxTotalTime: number;
  onTimeThreshold: number;
  penaltyPerHour?: number;
  currency?: string;
}

// Delivery Exception Interface
export interface DeliveryException {
  id: string;
  deliveryId: string;
  type: 'weather' | 'traffic' | 'accident' | 'vehicle_breakdown' | 'address_issue' | 'other';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  reportedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  delayMinutes?: number;
  metadata?: Record<string, unknown>;
}

// Delivery Manifest Interface
export interface DeliveryManifest {
  id: string;
  manifestNumber: string;
  travelerId: string;
  date: Date;
  deliveries: Array<{
    deliveryId: string;
    deliveryNumber: string;
    sequence: number;
    status: DeliveryStatus;
  }>;
  totalDeliveries: number;
  completedDeliveries: number;
  status: 'open' | 'in_progress' | 'completed' | 'closed';
  createdAt: Date;
  closedAt?: Date;
}

// Delivery Return Interface
export interface DeliveryReturn extends BaseEntity {
  deliveryId: string;
  reason: string;
  returnedBy: string;
  returnedAt: Date;
  returnAddress: DeliveryAddress;
  status: 'initiated' | 'in_transit' | 'completed' | 'failed';
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed' | 'failed';
  metadata?: Record<string, unknown>;
}

// Delivery Webhook Event Interface
export interface DeliveryWebhookEvent {
  id: string;
  deliveryId: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}
