import { describe, it, expect } from 'vitest';
import {
  geoLocationSchema,
  deliveryAddressSchema,
  packageDimensionsSchema,
  packageDetailsSchema,
  deliverySenderSchema,
  deliveryRecipientSchema,
  deliveryTravelerSchema,
  deliveryRouteSchema,
  deliveryTrackingEventSchema,
  deliveryTimelineSchema,
  proofOfDeliverySchema,
  deliveryPricingSchema,
  deliveryInsuranceSchema,
  deliveryRatingSchema,
  deliveryIssueSchema,
  deliveryNotificationSettingsSchema,
  deliverySchema,
  createDeliveryDtoSchema,
  updateDeliveryDtoSchema,
  assignDeliveryDtoSchema,
  acceptDeliveryDtoSchema,
  completeDeliveryDtoSchema,
  cancelDeliveryDtoSchema,
  reportDeliveryIssueDtoSchema,
  rateDeliveryDtoSchema,
  deliverySearchFiltersSchema,
  deliveryListResponseSchema,
  deliveryQuoteSchema,
  deliveryScheduleSchema,
  deliveryReturnSchema,
  deliverySlaSchema,
  deliveryExceptionSchema,
  deliveryBatchSchema,
  deliveryManifestSchema,
  deliveryZoneSchema,
  deliveryCapacitySchema,
  deliveryPerformanceMetricsSchema,
  deliveryNotificationSchema,
  deliveryTrackingInfoSchema,
  deliverySummarySchema,
  deliveryStatisticsSchema,
  deliveryAvailabilitySchema,
  deliveryRouteOptimizationSchema,
  deliveryAnalyticsSchema,
  deliveryWebhookEventSchema,
} from '../delivery.schema';

describe('Delivery Validation Schemas', () => {
  describe('geoLocationSchema', () => {
    it('should validate valid coordinates', () => {
      const validData = {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        country: 'US',
        postalCode: '10001',
      };
      const result = geoLocationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject latitude outside range', () => {
      const invalidData = {
        latitude: 91,
        longitude: -74.0060,
      };
      const result = geoLocationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject longitude outside range', () => {
      const invalidData = {
        latitude: 40.7128,
        longitude: -181,
      };
      const result = geoLocationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryAddressSchema', () => {
    it('should validate a valid delivery address', () => {
      const validData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      };
      const result = deliveryAddressSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid postal code', () => {
      const invalidData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: 'invalid',
        country: 'US',
      };
      const result = deliveryAddressSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('packageDimensionsSchema', () => {
    it('should validate valid package dimensions', () => {
      const validData = {
        length: 30,
        width: 20,
        height: 10,
        unit: 'cm',
        weight: 2.5,
        weightUnit: 'kg',
      };
      const result = packageDimensionsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative dimensions', () => {
      const invalidData = {
        length: -30,
        width: 20,
        height: 10,
        unit: 'cm',
        weight: 2.5,
        weightUnit: 'kg',
      };
      const result = packageDimensionsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('packageDetailsSchema', () => {
    it('should validate valid package details', () => {
      const validData = {
        description: 'Fragile electronics',
        size: 'medium',
        weight: 2.5,
        weightUnit: 'kg',
        quantity: 1,
        value: 500,
        currency: 'USD',
        fragile: true,
        perishable: false,
        requiresSignature: true,
        specialInstructions: 'Handle with care',
      };
      const result = packageDetailsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative weight', () => {
      const invalidData = {
        description: 'Test package',
        size: 'medium',
        weight: -2.5,
        weightUnit: 'kg',
        quantity: 1,
      };
      const result = packageDetailsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliverySenderSchema', () => {
    it('should validate valid sender data', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      };
      const result = deliverySenderSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'invalid-email',
        phoneNumber: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        },
      };
      const result = deliverySenderSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryRecipientSchema', () => {
    it('should validate valid recipient data', () => {
      const validData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phoneNumber: '+1234567891',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'US',
        },
        alternatePhone: '+1234567892',
        preferredDeliveryTime: '14:00-18:00',
      };
      const result = deliveryRecipientSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phoneNumber: 'invalid-phone',
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          postalCode: '90001',
          country: 'US',
        },
      };
      const result = deliveryRecipientSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryTravelerSchema', () => {
    it('should validate valid traveler data', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@example.com',
        phoneNumber: '+1234567893',
        avatar: 'https://example.com/avatar.jpg',
        rating: 4.5,
        totalDeliveries: 100,
        vehicleType: 'car',
        vehicleNumber: 'ABC123',
        tripId: 'trip-123',
      };
      const result = deliveryTravelerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject rating outside 0-5 range', () => {
      const invalidData = {
        userId: '123e4567-e89b-12d3-a456-426614174001',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@example.com',
        phoneNumber: '+1234567893',
        rating: 6,
      };
      const result = deliveryTravelerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryRouteSchema', () => {
    it('should validate valid route data', () => {
      const validData = {
        origin: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        destination: {
          latitude: 34.0522,
          longitude: -118.2437,
        },
        distance: 3940,
        distanceUnit: 'km',
        estimatedDuration: 3600,
        actualDuration: 3500,
        waypoints: [
          { latitude: 39.9526, longitude: -75.1652 },
        ],
        polyline: 'encoded_polyline_string',
      };
      const result = deliveryRouteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative distance', () => {
      const invalidData = {
        origin: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        destination: {
          latitude: 34.0522,
          longitude: -118.2437,
        },
        distance: -3940,
        distanceUnit: 'km',
        estimatedDuration: 3600,
      };
      const result = deliveryRouteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryTrackingEventSchema', () => {
    it('should validate valid tracking event', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        status: 'in_transit',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        address: '123 Main St, New York, NY',
        timestamp: '2024-01-01T12:00:00Z',
        message: 'Package is in transit',
        actor: 'system',
      };
      const result = deliveryTrackingEventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        status: 'invalid_status',
        timestamp: '2024-01-01T12:00:00Z',
        message: 'Test message',
      };
      const result = deliveryTrackingEventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryTimelineSchema', () => {
    it('should validate valid timeline', () => {
      const validData = {
        createdAt: '2024-01-01T10:00:00Z',
        assignedAt: '2024-01-01T10:30:00Z',
        acceptedAt: '2024-01-01T11:00:00Z',
        pickedUpAt: '2024-01-01T12:00:00Z',
        inTransitAt: '2024-01-01T13:00:00Z',
        arrivedAt: '2024-01-01T14:00:00Z',
        deliveredAt: '2024-01-01T15:00:00Z',
        estimatedPickupTime: '2024-01-01T12:00:00Z',
        estimatedDeliveryTime: '2024-01-01T15:00:00Z',
        actualDeliveryTime: '2024-01-01T15:30:00Z',
      };
      const result = deliveryTimelineSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept partial timeline', () => {
      const validData = {
        createdAt: '2024-01-01T10:00:00Z',
      };
      const result = deliveryTimelineSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('proofOfDeliverySchema', () => {
    it('should validate valid proof of delivery', () => {
      const validData = {
        type: 'signature',
        signature: 'data:image/svg+xml;base64,...',
        photo: 'https://example.com/photo.jpg',
        otp: '123456',
        qrCode: 'data:image/png;base64,...',
        biometricData: 'fingerprint_data',
        recipientName: 'Jane Smith',
        timestamp: '2024-01-01T15:00:00Z',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        notes: 'Delivered to front desk',
      };
      const result = proofOfDeliverySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid proof type', () => {
      const invalidData = {
        type: 'invalid_type',
        timestamp: '2024-01-01T15:00:00Z',
      };
      const result = proofOfDeliverySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryPricingSchema', () => {
    it('should validate valid pricing', () => {
      const validData = {
        baseFee: 5.00,
        distanceFee: 10.00,
        weightFee: 2.50,
        priorityFee: 3.00,
        serviceFee: 1.50,
        tax: 2.20,
        discount: 1.00,
        total: 22.20,
        currency: 'USD',
      };
      const result = deliveryPricingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative fees', () => {
      const invalidData = {
        baseFee: -5.00,
        distanceFee: 10.00,
        weightFee: 2.50,
        priorityFee: 3.00,
        serviceFee: 1.50,
        tax: 2.20,
        total: 22.20,
        currency: 'USD',
      };
      const result = deliveryPricingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryInsuranceSchema', () => {
    it('should validate valid insurance', () => {
      const validData = {
        insured: true,
        coverage: 1000.00,
        premium: 25.00,
        currency: 'USD',
        provider: 'Insurance Co',
        policyNumber: 'POL123456',
      };
      const result = deliveryInsuranceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject zero coverage for insured delivery', () => {
      const invalidData = {
        insured: true,
        coverage: 0,
        premium: 25.00,
        currency: 'USD',
      };
      const result = deliveryInsuranceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryRatingSchema', () => {
    it('should validate valid rating', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        deliveryId: '123e4567-e89b-12d3-a456-426614174004',
        ratedBy: '123e4567-e89b-12d3-a456-426614174005',
        rating: 5,
        comment: 'Excellent service!',
        categories: {
          timeliness: 5,
          communication: 4,
          packaging: 5,
          professionalism: 5,
        },
        createdAt: '2024-01-01T16:00:00Z',
      };
      const result = deliveryRatingSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject rating below 1', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174003',
        deliveryId: '123e4567-e89b-12d3-a456-426614174004',
        ratedBy: '123e4567-e89b-12d3-a456-426614174005',
        rating: 0,
        createdAt: '2024-01-01T16:00:00Z',
      };
      const result = deliveryRatingSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryIssueSchema', () => {
    it('should validate valid issue report', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174006',
        type: 'damaged',
        description: 'Package arrived with visible damage to the corner',
        reportedBy: '123e4567-e89b-12d3-a456-426614174007',
        reportedAt: '2024-01-01T17:00:00Z',
        status: 'open',
        resolution: 'Refund issued',
        resolvedAt: '2024-01-02T10:00:00Z',
        images: ['https://example.com/damage1.jpg'],
      };
      const result = deliveryIssueSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty description', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174006',
        type: 'damaged',
        description: '',
        reportedBy: '123e4567-e89b-12d3-a456-426614174007',
        reportedAt: '2024-01-01T17:00:00Z',
        status: 'open',
      };
      const result = deliveryIssueSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('deliveryNotificationSettingsSchema', () => {
    it('should validate valid notification settings', () => {
      const validData = {
        notifyOnAssignment: true,
        notifyOnPickup: true,
        notifyOnInTransit: true,
        notifyOnArrival: true,
        notifyOnDelivery: true,
        notifyOnDelay: true,
        notifyOnIssue: true,
        smsNotifications: true,
        emailNotifications: true,
        pushNotifications: true,
      };
      const result = deliveryNotificationSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should use default values', () => {
      const validData = {};
      const result = deliveryNotificationSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notifyOnAssignment).toBe(true);
        expect(result.data.smsNotifications).toBe(true);
      }
    });
  });

  describe('deliverySchema', () => {
    it('should validate a complete delivery', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174008',
        deliveryNumber: 'DEL-2024-001',
        type: 'standard',
        status: 'delivered',
        priority: 'normal',
        method: 'courier',
        sender: {
          userId: '123e4567-e89b-12d3-a456-426614174009',
          name: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        },
        recipient: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phoneNumber: '+1234567891',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90001',
            country: 'US',
          },
        },
        package: {
          description: 'Fragile electronics',
          size: 'medium',
          weight: 2.5,
          weightUnit: 'kg',
          quantity: 1,
        },
        route: {
          origin: { latitude: 40.7128, longitude: -74.0060 },
          destination: { latitude: 34.0522, longitude: -118.2437 },
          distance: 3940,
          distanceUnit: 'km',
          estimatedDuration: 3600,
        },
        timeline: {
          createdAt: '2024-01-01T10:00:00Z',
          deliveredAt: '2024-01-01T15:00:00Z',
        },
        pricing: {
          baseFee: 5.00,
          distanceFee: 10.00,
          weightFee: 2.50,
          priorityFee: 3.00,
          serviceFee: 1.50,
          tax: 2.20,
          total: 22.20,
          currency: 'USD',
        },
        trackingEvents: [],
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T15:00:00Z',
      };
      const result = deliverySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('createDeliveryDtoSchema', () => {
    it('should validate a valid delivery creation DTO', () => {
      const validData = {
        type: 'standard',
        method: 'courier',
        sender: {
          userId: '123e4567-e89b-12d3-a456-426614174009',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        },
        recipient: {
          name: 'Jane Smith',
          phoneNumber: '+1234567891',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90001',
            country: 'US',
          },
        },
        package: {
          description: 'Fragile electronics',
          size: 'medium',
          weight: 2.5,
          weightUnit: 'kg',
          quantity: 1,
          requiresSignature: true,
        },
      };
      const result = createDeliveryDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateDeliveryDtoSchema', () => {
    it('should validate a valid delivery update DTO', () => {
      const validData = {
        status: 'in_transit',
        estimatedDeliveryTime: '2024-01-01T15:00:00Z',
        currentLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      };
      const result = updateDeliveryDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('assignDeliveryDtoSchema', () => {
    it('should validate a valid delivery assignment DTO', () => {
      const validData = {
        deliveryId: '123e4567-e89b-12d3-a456-426614174008',
        travelerId: '123e4567-e89b-12d3-a456-426614174010',
        estimatedPickupTime: '2024-01-01T12:00:00Z',
        estimatedDeliveryTime: '2024-01-01T15:00:00Z',
      };
      const result = assignDeliveryDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('acceptDeliveryDtoSchema', () => {
    it('should validate a valid delivery acceptance DTO', () => {
      const validData = {
        deliveryId: '123e4567-e89b-12d3-a456-426614174008',
        travelerId: '123e4567-e89b-12d3-a456-426614174010',
      };
      const result = acceptDeliveryDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('completeDeliveryDtoSchema', () => {
    it('should validate a valid delivery completion DTO', () => {
      const validData = {
        deliveryId: '123e4567-e89b-12d3-a456-426614174008',
        proofOfDelivery: {
          type: 'signature',
          recipientName: 'Jane Smith',
        },
        packageCondition: 'excellent',
        actualDeliveryTime: '2024-01-01T15:00:00Z',
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      };
      const result = completeDeliveryDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('cancelDeliveryDtoSchema', () => {
    it('should validate a valid delivery cancellation DTO', () => {
      const validData = {
        deliveryId: '123e4567-e89b-12d3-a456-426614174008',
        reason: 'Customer requested cancellation due to change of plans',
        cancelledBy: '123e4567-e89b-12d3-a456-426614174009',
      };
      const result = cancelDeliveryDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('reportDeliveryIssueDtoSchema', () => {
    it('should validate a valid issue report DTO', () => {
      const validData = {
        deliveryId: '123e4567-e89b-12d3-a456-426614174008',
        type: 'damaged',
        description: 'Package arrived with visible damage',
        reportedBy: '123e4567-e89b-12d3-a456-426614174007',
      };
      const result = reportDeliveryIssueDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('rateDeliveryDtoSchema', () => {
    it('should validate a valid delivery rating DTO', () => {
      const validData = {
        deliveryId: '123e4567-e89b-12d3-a456-426614174008',
        rating: 5,
        comment: 'Excellent service!',
      };
      const result = rateDeliveryDtoSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('deliverySearchFiltersSchema', () => {
    it('should validate valid search filters', () => {
      const validData = {
        status: ['pending', 'in_transit'],
        type: ['standard', 'express'],
        senderId: '123e4567-e89b-12d3-a456-426614174009',
        page: 1,
        limit: 20,
      };
      const result = deliverySearchFiltersSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('deliveryListResponseSchema', () => {
    it('should validate a valid list response', () => {
      const validData = {
        deliveries: [],
        total: 0,
        page: 1,
        limit: 20,
      };
      const result = deliveryListResponseSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});