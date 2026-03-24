import { z } from 'zod';

// Enums matching delivery.types.ts
const DeliveryStatusEnum = z.enum([
  'pending',
  'assigned',
  'accepted',
  'picked_up',
  'in_transit',
  'arrived',
  'delivered',
  'failed',
  'cancelled',
  'returned'
]);

const DeliveryTypeEnum = z.enum([
  'standard',
  'express',
  'same_day',
  'crowdshipping',
  'scheduled',
  'international'
]);

const DeliveryPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);

const PackageSizeEnum = z.enum(['small', 'medium', 'large', 'extra_large']);

const DeliveryMethodEnum = z.enum(['courier', 'traveler', 'postal', 'pickup']);

const ProofOfDeliveryTypeEnum = z.enum(['signature', 'photo', 'otp', 'qr_code', 'biometric']);

const PackageConditionEnum = z.enum(['excellent', 'good', 'fair', 'damaged']);

// Geo Location Schema
export const geoLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});
export type GeoLocation = z.infer<typeof geoLocationSchema>;

// Delivery Address Schema (shared with order.schema.ts)
export const deliveryAddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
  country: z.string().length(2, 'Invalid country code'),
  isDefault: z.boolean().optional(),
});
export type DeliveryAddress = z.infer<typeof deliveryAddressSchema>;

// Package Dimensions Schema
export const packageDimensionsSchema = z.object({
  length: z.number().positive('Length must be positive'),
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  unit: z.enum(['cm', 'in']),
  weight: z.number().positive('Weight must be positive'),
  weightUnit: z.enum(['kg', 'lb']),
});
export type PackageDimensions = z.infer<typeof packageDimensionsSchema>;

// Package Details Schema
export const packageDetailsSchema = z.object({
  description: z.string().min(1, 'Package description is required'),
  size: PackageSizeEnum,
  dimensions: packageDimensionsSchema.optional(),
  weight: z.number().positive('Weight must be positive'),
  weightUnit: z.enum(['kg', 'lb']),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  value: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  fragile: z.boolean().default(false),
  perishable: z.boolean().default(false),
  requiresSignature: z.boolean().default(false),
  specialInstructions: z.string().max(500).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
});
export type PackageDetails = z.infer<typeof packageDetailsSchema>;

// Delivery Sender Schema
export const deliverySenderSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  name: z.string().min(1, 'Sender name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  address: deliveryAddressSchema,
});
export type DeliverySender = z.infer<typeof deliverySenderSchema>;

// Delivery Recipient Schema
export const deliveryRecipientSchema = z.object({
  name: z.string().min(1, 'Recipient name is required'),
  email: z.string().email('Invalid email address').optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  address: deliveryAddressSchema,
  alternatePhone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  preferredDeliveryTime: z.string().optional(),
});
export type DeliveryRecipient = z.infer<typeof deliveryRecipientSchema>;

// Delivery Traveler Schema
export const deliveryTravelerSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  avatar: z.string().url('Invalid avatar URL').optional(),
  rating: z.number().min(0).max(5).optional(),
  totalDeliveries: z.number().int().nonnegative().optional(),
  vehicleType: z.string().optional(),
  vehicleNumber: z.string().optional(),
  tripId: z.string().optional(),
});
export type DeliveryTraveler = z.infer<typeof deliveryTravelerSchema>;

// Delivery Route Schema
export const deliveryRouteSchema = z.object({
  origin: geoLocationSchema,
  destination: geoLocationSchema,
  distance: z.number().nonnegative('Distance cannot be negative'),
  distanceUnit: z.enum(['km', 'mi']),
  estimatedDuration: z.number().positive('Estimated duration must be positive'),
  actualDuration: z.number().positive().optional(),
  waypoints: z.array(geoLocationSchema).optional(),
  polyline: z.string().optional(),
});
export type DeliveryRoute = z.infer<typeof deliveryRouteSchema>;

// Delivery Tracking Event Schema
export const deliveryTrackingEventSchema = z.object({
  id: z.string().uuid('Invalid tracking event ID'),
  status: DeliveryStatusEnum,
  location: geoLocationSchema.optional(),
  address: z.string().optional(),
  timestamp: z.string().datetime(),
  message: z.string().min(1, 'Message is required'),
  actor: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type DeliveryTrackingEvent = z.infer<typeof deliveryTrackingEventSchema>;

// Delivery Timeline Schema
export const deliveryTimelineSchema = z.object({
  createdAt: z.string().datetime(),
  assignedAt: z.string().datetime().optional(),
  acceptedAt: z.string().datetime().optional(),
  pickedUpAt: z.string().datetime().optional(),
  inTransitAt: z.string().datetime().optional(),
  arrivedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
  estimatedPickupTime: z.string().datetime().optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  actualDeliveryTime: z.string().datetime().optional(),
});
export type DeliveryTimeline = z.infer<typeof deliveryTimelineSchema>;

// Proof of Delivery Schema
export const proofOfDeliverySchema = z.object({
  type: ProofOfDeliveryTypeEnum,
  signature: z.string().optional(),
  photo: z.string().url('Invalid photo URL').optional(),
  otp: z.string().optional(),
  qrCode: z.string().optional(),
  biometricData: z.string().optional(),
  recipientName: z.string().optional(),
  timestamp: z.string().datetime(),
  location: geoLocationSchema.optional(),
  notes: z.string().max(500).optional(),
});
export type ProofOfDelivery = z.infer<typeof proofOfDeliverySchema>;

// Delivery Pricing Schema
export const deliveryPricingSchema = z.object({
  baseFee: z.number().min(0, 'Base fee cannot be negative'),
  distanceFee: z.number().min(0, 'Distance fee cannot be negative'),
  weightFee: z.number().min(0, 'Weight fee cannot be negative'),
  priorityFee: z.number().min(0, 'Priority fee cannot be negative'),
  serviceFee: z.number().min(0, 'Service fee cannot be negative'),
  tax: z.number().min(0, 'Tax cannot be negative'),
  discount: z.number().min(0).optional(),
  total: z.number().min(0, 'Total cannot be negative'),
  currency: z.string().length(3),
});
export type DeliveryPricing = z.infer<typeof deliveryPricingSchema>;

// Delivery Insurance Schema
export const deliveryInsuranceSchema = z.object({
  insured: z.boolean(),
  coverage: z.number().positive('Coverage must be positive'),
  premium: z.number().min(0, 'Premium cannot be negative'),
  currency: z.string().length(3),
  provider: z.string().optional(),
  policyNumber: z.string().optional(),
});
export type DeliveryInsurance = z.infer<typeof deliveryInsuranceSchema>;

// Delivery Rating Schema
export const deliveryRatingSchema = z.object({
  id: z.string().uuid('Invalid rating ID'),
  deliveryId: z.string().uuid('Invalid delivery ID'),
  ratedBy: z.string().uuid('Invalid user ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment too long').optional(),
  categories: z.object({
    timeliness: z.number().min(1).max(5).optional(),
    communication: z.number().min(1).max(5).optional(),
    packaging: z.number().min(1).max(5).optional(),
    professionalism: z.number().min(1).max(5).optional(),
  }).optional(),
  createdAt: z.string().datetime(),
});
export type DeliveryRating = z.infer<typeof deliveryRatingSchema>;

// Delivery Issue Schema
export const deliveryIssueSchema = z.object({
  id: z.string().uuid('Invalid issue ID'),
  type: z.enum(['damaged', 'lost', 'delayed', 'wrong_address', 'refused', 'other']),
  description: z.string().min(1, 'Description is required').max(2000),
  reportedBy: z.string().uuid('Invalid user ID'),
  reportedAt: z.string().datetime(),
  status: z.enum(['open', 'investigating', 'resolved', 'closed']),
  resolution: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type DeliveryIssue = z.infer<typeof deliveryIssueSchema>;

// Delivery Notification Settings Schema
export const deliveryNotificationSettingsSchema = z.object({
  notifyOnAssignment: z.boolean().default(true),
  notifyOnPickup: z.boolean().default(true),
  notifyOnInTransit: z.boolean().default(true),
  notifyOnArrival: z.boolean().default(true),
  notifyOnDelivery: z.boolean().default(true),
  notifyOnDelay: z.boolean().default(true),
  notifyOnIssue: z.boolean().default(true),
  smsNotifications: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
});
export type DeliveryNotificationSettings = z.infer<typeof deliveryNotificationSettingsSchema>;

// Main Delivery Schema
export const deliverySchema = z.object({
  id: z.string().uuid('Invalid delivery ID'),
  deliveryNumber: z.string().min(1, 'Delivery number is required'),
  orderId: z.string().uuid('Invalid order ID').optional(),
  type: DeliveryTypeEnum,
  status: DeliveryStatusEnum,
  priority: DeliveryPriorityEnum.default('normal'),
  method: DeliveryMethodEnum,
  sender: deliverySenderSchema,
  recipient: deliveryRecipientSchema,
  traveler: deliveryTravelerSchema.optional(),
  package: packageDetailsSchema,
  route: deliveryRouteSchema,
  timeline: deliveryTimelineSchema,
  pricing: deliveryPricingSchema,
  insurance: deliveryInsuranceSchema.optional(),
  trackingEvents: z.array(deliveryTrackingEventSchema).default([]),
  proofOfDelivery: proofOfDeliverySchema.optional(),
  rating: deliveryRatingSchema.optional(),
  issues: z.array(deliveryIssueSchema).optional(),
  notificationSettings: deliveryNotificationSettingsSchema.optional(),
  specialRequirements: z.array(z.string()).optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
  cancelledAt: z.string().datetime().optional(),
  cancelledBy: z.string().uuid().optional(),
  cancellationReason: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Delivery = z.infer<typeof deliverySchema>;

// Create Delivery DTO Schema
export const createDeliveryDtoSchema = z.object({
  orderId: z.string().uuid('Invalid order ID').optional(),
  type: DeliveryTypeEnum,
  priority: DeliveryPriorityEnum.optional(),
  method: DeliveryMethodEnum,
  sender: z.object({
    userId: z.string().uuid('Invalid user ID'),
    address: deliveryAddressSchema,
  }),
  recipient: z.object({
    name: z.string().min(1, 'Recipient name is required'),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    email: z.string().email('Invalid email address').optional(),
    address: deliveryAddressSchema,
    preferredDeliveryTime: z.string().optional(),
  }),
  package: z.object({
    description: z.string().min(1, 'Package description is required'),
    size: PackageSizeEnum,
    weight: z.number().positive('Weight must be positive'),
    weightUnit: z.enum(['kg', 'lb']),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    value: z.number().positive().optional(),
    fragile: z.boolean().default(false),
    perishable: z.boolean().default(false),
    requiresSignature: z.boolean().default(false),
    specialInstructions: z.string().max(500).optional(),
  }),
  estimatedPickupTime: z.string().datetime().optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  insurance: z.object({
    coverage: z.number().positive('Coverage must be positive'),
    currency: z.string().length(3),
  }).optional(),
  specialRequirements: z.array(z.string()).optional(),
  notes: z.string().max(500).optional(),
});
export type CreateDeliveryDto = z.infer<typeof createDeliveryDtoSchema>;

// Update Delivery DTO Schema
export const updateDeliveryDtoSchema = z.object({
  status: DeliveryStatusEnum.optional(),
  travelerId: z.string().uuid('Invalid traveler ID').optional(),
  estimatedPickupTime: z.string().datetime().optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  currentLocation: geoLocationSchema.optional(),
  notes: z.string().max(500).optional(),
});
export type UpdateDeliveryDto = z.infer<typeof updateDeliveryDtoSchema>;

// Assign Delivery DTO Schema
export const assignDeliveryDtoSchema = z.object({
  deliveryId: z.string().uuid('Invalid delivery ID'),
  travelerId: z.string().uuid('Invalid traveler ID'),
  estimatedPickupTime: z.string().datetime(),
  estimatedDeliveryTime: z.string().datetime(),
});
export type AssignDeliveryDto = z.infer<typeof assignDeliveryDtoSchema>;

// Accept Delivery DTO Schema
export const acceptDeliveryDtoSchema = z.object({
  deliveryId: z.string().uuid('Invalid delivery ID'),
  travelerId: z.string().uuid('Invalid traveler ID'),
  estimatedPickupTime: z.string().datetime().optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
});
export type AcceptDeliveryDto = z.infer<typeof acceptDeliveryDtoSchema>;

// Complete Delivery DTO Schema
export const completeDeliveryDtoSchema = z.object({
  deliveryId: z.string().uuid('Invalid delivery ID'),
  proofOfDelivery: z.object({
    type: ProofOfDeliveryTypeEnum,
    signature: z.string().optional(),
    photo: z.string().url('Invalid photo URL').optional(),
    otp: z.string().optional(),
    recipientName: z.string().optional(),
    notes: z.string().max(500).optional(),
  }),
  packageCondition: PackageConditionEnum,
  actualDeliveryTime: z.string().datetime(),
  location: geoLocationSchema,
});
export type CompleteDeliveryDto = z.infer<typeof completeDeliveryDtoSchema>;

// Cancel Delivery DTO Schema
export const cancelDeliveryDtoSchema = z.object({
  deliveryId: z.string().uuid('Invalid delivery ID'),
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500),
  cancelledBy: z.string().uuid('Invalid user ID'),
  refundAmount: z.number().positive().optional(),
});
export type CancelDeliveryDto = z.infer<typeof cancelDeliveryDtoSchema>;

// Report Delivery Issue DTO Schema
export const reportDeliveryIssueDtoSchema = z.object({
  deliveryId: z.string().uuid('Invalid delivery ID'),
  type: z.enum(['damaged', 'lost', 'delayed', 'wrong_address', 'refused', 'other']),
  description: z.string().min(1, 'Description is required').max(2000),
  reportedBy: z.string().uuid('Invalid user ID'),
  images: z.array(z.string().url('Invalid image URL')).max(10, 'Maximum 10 images allowed').optional(),
});
export type ReportDeliveryIssueDto = z.infer<typeof reportDeliveryIssueDtoSchema>;

// Rate Delivery DTO Schema
export const rateDeliveryDtoSchema = z.object({
  deliveryId: z.string().uuid('Invalid delivery ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment too long').optional(),
  categories: z.object({
    timeliness: z.number().min(1).max(5).optional(),
    communication: z.number().min(1).max(5).optional(),
    packaging: z.number().min(1).max(5).optional(),
    professionalism: z.number().min(1).max(5).optional(),
  }).optional(),
});
export type RateDeliveryDto = z.infer<typeof rateDeliveryDtoSchema>;

// Delivery Search Filters Schema
export const deliverySearchFiltersSchema = z.object({
  status: z.array(DeliveryStatusEnum).optional(),
  type: z.array(DeliveryTypeEnum).optional(),
  priority: z.array(DeliveryPriorityEnum).optional(),
  method: z.array(DeliveryMethodEnum).optional(),
  senderId: z.string().uuid('Invalid user ID').optional(),
  travelerId: z.string().uuid('Invalid traveler ID').optional(),
  orderId: z.string().uuid('Invalid order ID').optional(),
  deliveryNumber: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  pickupCity: z.string().optional(),
  deliveryCity: z.string().optional(),
  minDistance: z.number().nonnegative().optional(),
  maxDistance: z.number().positive().optional(),
  searchQuery: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
export type DeliverySearchFilters = z.infer<typeof deliverySearchFiltersSchema>;

// Delivery List Response Schema
export const deliveryListResponseSchema = z.object({
  deliveries: z.array(deliverySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type DeliveryListResponse = z.infer<typeof deliveryListResponseSchema>;

// Delivery Quote Schema
export const deliveryQuoteSchema = z.object({
  type: DeliveryTypeEnum,
  priority: DeliveryPriorityEnum,
  estimatedPickupTime: z.string().datetime(),
  estimatedDeliveryTime: z.string().datetime(),
  pricing: deliveryPricingSchema,
  distance: z.number().nonnegative(),
  distanceUnit: z.enum(['km', 'mi']),
  duration: z.number().positive(),
  validUntil: z.string().datetime(),
});
export type DeliveryQuote = z.infer<typeof deliveryQuoteSchema>;

// Delivery Schedule Schema
export const deliveryScheduleSchema = z.object({
  id: z.string().uuid('Invalid schedule ID'),
  deliveryId: z.string().uuid('Invalid delivery ID'),
  scheduledDate: z.string().datetime(),
  timeSlot: z.object({
    start: z.string(),
    end: z.string(),
  }),
  status: z.enum(['scheduled', 'confirmed', 'rescheduled', 'cancelled']),
  reminderSent: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});
export type DeliverySchedule = z.infer<typeof deliveryScheduleSchema>;

// Delivery Return Schema
export const deliveryReturnSchema = z.object({
  id: z.string().uuid('Invalid return ID'),
  deliveryId: z.string().uuid('Invalid delivery ID'),
  reason: z.string().min(1, 'Reason is required'),
  returnedBy: z.string().uuid('Invalid user ID'),
  returnedAt: z.string().datetime(),
  returnAddress: deliveryAddressSchema,
  status: z.enum(['initiated', 'in_transit', 'completed', 'failed']),
  refundAmount: z.number().positive().optional(),
  refundStatus: z.enum(['pending', 'processed', 'failed']).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DeliveryReturn = z.infer<typeof deliveryReturnSchema>;

// Delivery SLA Schema
export const deliverySlaSchema = z.object({
  type: DeliveryTypeEnum,
  priority: DeliveryPriorityEnum,
  maxPickupTime: z.number().int().nonnegative(),
  maxDeliveryTime: z.number().int().nonnegative(),
  maxTotalTime: z.number().int().nonnegative(),
  onTimeThreshold: z.number().int().nonnegative(),
  penaltyPerHour: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
});
export type DeliverySLA = z.infer<typeof deliverySlaSchema>;

// Delivery Exception Schema
export const deliveryExceptionSchema = z.object({
  id: z.string().uuid('Invalid exception ID'),
  deliveryId: z.string().uuid('Invalid delivery ID'),
  type: z.enum(['weather', 'traffic', 'accident', 'vehicle_breakdown', 'address_issue', 'other']),
  description: z.string().min(1, 'Description is required'),
  impact: z.enum(['low', 'medium', 'high', 'critical']),
  reportedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  resolution: z.string().optional(),
  delayMinutes: z.number().int().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type DeliveryException = z.infer<typeof deliveryExceptionSchema>;

// Delivery Batch Schema
export const deliveryBatchSchema = z.object({
  id: z.string().uuid('Invalid batch ID'),
  batchNumber: z.string().min(1, 'Batch number is required'),
  travelerId: z.string().uuid('Invalid traveler ID'),
  deliveryIds: z.array(z.string().uuid('Invalid delivery ID')),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  totalDeliveries: z.number().int().positive(),
  completedDeliveries: z.number().int().nonnegative(),
  route: deliveryRouteSchema.optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type DeliveryBatch = z.infer<typeof deliveryBatchSchema>;

// Delivery Manifest Schema
export const deliveryManifestSchema = z.object({
  id: z.string().uuid('Invalid manifest ID'),
  manifestNumber: z.string().min(1, 'Manifest number is required'),
  travelerId: z.string().uuid('Invalid traveler ID'),
  date: z.string().datetime(),
  deliveries: z.array(z.object({
    deliveryId: z.string().uuid('Invalid delivery ID'),
    deliveryNumber: z.string().min(1),
    sequence: z.number().int().positive(),
    status: DeliveryStatusEnum,
  })),
  totalDeliveries: z.number().int().positive(),
  completedDeliveries: z.number().int().nonnegative(),
  status: z.enum(['open', 'in_progress', 'completed', 'closed']),
  createdAt: z.string().datetime(),
  closedAt: z.string().datetime().optional(),
});
export type DeliveryManifest = z.infer<typeof deliveryManifestSchema>;

// Delivery Zone Schema
export const deliveryZoneSchema = z.object({
  id: z.string().uuid('Invalid zone ID'),
  name: z.string().min(1, 'Zone name is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().length(2),
  boundaries: z.array(geoLocationSchema).min(3, 'At least 3 boundary points required'),
  active: z.boolean().default(true),
  serviceable: z.boolean().default(true),
  deliveryTypes: z.array(DeliveryTypeEnum).min(1, 'At least one delivery type required'),
  baseFee: z.number().min(0, 'Base fee cannot be negative'),
  perKmFee: z.number().min(0, 'Per km fee cannot be negative'),
  currency: z.string().length(3),
  estimatedDeliveryTime: z.number().int().positive(),
  metadata: z.record(z.unknown()).optional(),
});
export type DeliveryZone = z.infer<typeof deliveryZoneSchema>;

// Delivery Capacity Schema
export const deliveryCapacitySchema = z.object({
  zoneId: z.string().uuid('Invalid zone ID'),
  date: z.string().datetime(),
  timeSlot: z.string(),
  totalCapacity: z.number().int().nonnegative(),
  usedCapacity: z.number().int().nonnegative(),
  availableCapacity: z.number().int().nonnegative(),
  availableTravelers: z.number().int().nonnegative(),
});
export type DeliveryCapacity = z.infer<typeof deliveryCapacitySchema>;

// Delivery Performance Metrics Schema
export const deliveryPerformanceMetricsSchema = z.object({
  travelerId: z.string().uuid('Invalid traveler ID'),
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  totalDeliveries: z.number().int().nonnegative(),
  completedDeliveries: z.number().int().nonnegative(),
  onTimeDeliveries: z.number().int().nonnegative(),
  lateDeliveries: z.number().int().nonnegative(),
  cancelledDeliveries: z.number().int().nonnegative(),
  averageRating: z.number().min(0).max(5).optional(),
  totalEarnings: z.number().nonnegative(),
  averageDeliveryTime: z.number().positive().optional(),
  onTimeRate: z.number().min(0).max(1).optional(),
  completionRate: z.number().min(0).max(1).optional(),
});
export type DeliveryPerformanceMetrics = z.infer<typeof deliveryPerformanceMetricsSchema>;

// Delivery Notification Schema
export const deliveryNotificationSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
  deliveryId: z.string().uuid('Invalid delivery ID'),
  recipientId: z.string().uuid('Invalid recipient ID'),
  type: z.enum(['sms', 'email', 'push']),
  event: z.enum(['assigned', 'picked_up', 'in_transit', 'arrived', 'delivered', 'delayed', 'issue']),
  message: z.string().min(1, 'Message is required'),
  sentAt: z.string().datetime(),
  delivered: z.boolean().default(false),
  deliveredAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type DeliveryNotification = z.infer<typeof deliveryNotificationSchema>;

// Delivery Tracking Info Schema
export const deliveryTrackingInfoSchema = z.object({
  deliveryId: z.string().uuid('Invalid delivery ID'),
  deliveryNumber: z.string().min(1, 'Delivery number is required'),
  status: DeliveryStatusEnum,
  currentLocation: geoLocationSchema.optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  trackingEvents: z.array(deliveryTrackingEventSchema),
  traveler: z.object({
    name: z.string().min(1),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    avatar: z.string().url().optional(),
    rating: z.number().min(0).max(5).optional(),
  }).optional(),
  route: deliveryRouteSchema.optional(),
});
export type DeliveryTrackingInfo = z.infer<typeof deliveryTrackingInfoSchema>;

// Delivery Summary Schema
export const deliverySummarySchema = z.object({
  id: z.string().uuid('Invalid delivery ID'),
  deliveryNumber: z.string().min(1),
  status: DeliveryStatusEnum,
  type: DeliveryTypeEnum,
  senderName: z.string().min(1),
  recipientName: z.string().min(1),
  pickupCity: z.string().optional(),
  deliveryCity: z.string().optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});
export type DeliverySummary = z.infer<typeof deliverySummarySchema>;

// Delivery Statistics Schema
export const deliveryStatisticsSchema = z.object({
  totalDeliveries: z.number().int().nonnegative(),
  pendingDeliveries: z.number().int().nonnegative(),
  inTransitDeliveries: z.number().int().nonnegative(),
  completedDeliveries: z.number().int().nonnegative(),
  failedDeliveries: z.number().int().nonnegative(),
  cancelledDeliveries: z.number().int().nonnegative(),
  averageDeliveryTime: z.number().positive().optional(),
  onTimeDeliveryRate: z.number().min(0).max(1).optional(),
  averageRating: z.number().min(0).max(5).optional(),
});
export type DeliveryStatistics = z.infer<typeof deliveryStatisticsSchema>;

// Delivery Availability Schema
export const deliveryAvailabilitySchema = z.object({
  available: z.boolean(),
  estimatedPickupTime: z.string().datetime().optional(),
  estimatedDeliveryTime: z.string().datetime().optional(),
  pricing: deliveryPricingSchema.optional(),
  availableTravelers: z.number().int().nonnegative().optional(),
  message: z.string().optional(),
});
export type DeliveryAvailability = z.infer<typeof deliveryAvailabilitySchema>;

// Delivery Route Optimization Schema
export const deliveryRouteOptimizationSchema = z.object({
  deliveryIds: z.array(z.string().uuid('Invalid delivery ID')),
  optimizedRoute: z.array(geoLocationSchema),
  totalDistance: z.number().nonnegative(),
  totalDuration: z.number().positive(),
  estimatedCost: z.number().nonnegative(),
  savings: z.object({
    distance: z.number().nonnegative(),
    time: z.number().nonnegative(),
    cost: z.number().nonnegative(),
  }),
});
export type DeliveryRouteOptimization = z.infer<typeof deliveryRouteOptimizationSchema>;

// Delivery Analytics Schema
export const deliveryAnalyticsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']),
  totalDeliveries: z.number().int().nonnegative(),
  completedDeliveries: z.number().int().nonnegative(),
  averageDeliveryTime: z.number().positive().optional(),
  onTimeRate: z.number().min(0).max(1).optional(),
  averageRating: z.number().min(0).max(5).optional(),
  totalRevenue: z.number().nonnegative(),
  deliveriesByStatus: z.record(DeliveryStatusEnum, z.number().int().nonnegative()),
  deliveriesByType: z.record(DeliveryTypeEnum, z.number().int().nonnegative()),
  topTravelers: z.array(z.object({
    travelerId: z.string().uuid(),
    travelerName: z.string().min(1),
    deliveryCount: z.number().int().nonnegative(),
    averageRating: z.number().min(0).max(5).optional(),
    totalEarned: z.number().nonnegative(),
  })),
  deliveriesByDay: z.array(z.object({
    date: z.string().datetime(),
    count: z.number().int().nonnegative(),
    revenue: z.number().nonnegative(),
  })),
});
export type DeliveryAnalytics = z.infer<typeof deliveryAnalyticsSchema>;

// Delivery Webhook Event Schema
export const deliveryWebhookEventSchema = z.object({
  id: z.string().uuid('Invalid webhook event ID'),
  deliveryId: z.string().uuid('Invalid delivery ID'),
  event: z.string().min(1, 'Event type is required'),
  data: z.record(z.unknown()),
  timestamp: z.string().datetime(),
  processed: z.boolean().default(false),
  processedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});
export type DeliveryWebhookEvent = z.infer<typeof deliveryWebhookEventSchema>;