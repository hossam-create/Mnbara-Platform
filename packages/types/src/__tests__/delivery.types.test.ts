import { describe, it, expect } from 'vitest';
import {
  DeliveryStatus,
  DeliveryType,
  DeliveryPriority,
  PackageSize,
  DeliveryMethod,
  ProofOfDeliveryType,
  PackageCondition,
  type Delivery,
  type PackageDetails,
  type DeliveryRoute,
  type CreateDeliveryDto,
  type DeliverySummary,
} from '../delivery.types';

describe('Delivery Types', () => {
  describe('DeliveryStatus Enum', () => {
    it('should have correct delivery statuses', () => {
      expect(DeliveryStatus.PENDING).toBe('pending');
      expect(DeliveryStatus.ASSIGNED).toBe('assigned');
      expect(DeliveryStatus.ACCEPTED).toBe('accepted');
      expect(DeliveryStatus.PICKED_UP).toBe('picked_up');
      expect(DeliveryStatus.IN_TRANSIT).toBe('in_transit');
      expect(DeliveryStatus.ARRIVED).toBe('arrived');
      expect(DeliveryStatus.DELIVERED).toBe('delivered');
      expect(DeliveryStatus.FAILED).toBe('failed');
      expect(DeliveryStatus.CANCELLED).toBe('cancelled');
      expect(DeliveryStatus.RETURNED).toBe('returned');
    });
  });

  describe('DeliveryType Enum', () => {
    it('should have correct delivery types', () => {
      expect(DeliveryType.STANDARD).toBe('standard');
      expect(DeliveryType.EXPRESS).toBe('express');
      expect(DeliveryType.SAME_DAY).toBe('same_day');
      expect(DeliveryType.CROWDSHIPPING).toBe('crowdshipping');
      expect(DeliveryType.SCHEDULED).toBe('scheduled');
      expect(DeliveryType.INTERNATIONAL).toBe('international');
    });
  });

  describe('DeliveryPriority Enum', () => {
    it('should have correct delivery priorities', () => {
      expect(DeliveryPriority.LOW).toBe('low');
      expect(DeliveryPriority.NORMAL).toBe('normal');
      expect(DeliveryPriority.HIGH).toBe('high');
      expect(DeliveryPriority.URGENT).toBe('urgent');
    });
  });

  describe('PackageSize Enum', () => {
    it('should have correct package sizes', () => {
      expect(PackageSize.SMALL).toBe('small');
      expect(PackageSize.MEDIUM).toBe('medium');
      expect(PackageSize.LARGE).toBe('large');
      expect(PackageSize.EXTRA_LARGE).toBe('extra_large');
    });
  });

  describe('DeliveryMethod Enum', () => {
    it('should have correct delivery methods', () => {
      expect(DeliveryMethod.COURIER).toBe('courier');
      expect(DeliveryMethod.TRAVELER).toBe('traveler');
      expect(DeliveryMethod.POSTAL).toBe('postal');
      expect(DeliveryMethod.PICKUP).toBe('pickup');
    });
  });

  describe('ProofOfDeliveryType Enum', () => {
    it('should have correct proof of delivery types', () => {
      expect(ProofOfDeliveryType.SIGNATURE).toBe('signature');
      expect(ProofOfDeliveryType.PHOTO).toBe('photo');
      expect(ProofOfDeliveryType.OTP).toBe('otp');
      expect(ProofOfDeliveryType.QR_CODE).toBe('qr_code');
      expect(ProofOfDeliveryType.BIOMETRIC).toBe('biometric');
    });
  });

  describe('PackageCondition Enum', () => {
    it('should have correct package conditions', () => {
      expect(PackageCondition.EXCELLENT).toBe('excellent');
      expect(PackageCondition.GOOD).toBe('good');
      expect(PackageCondition.FAIR).toBe('fair');
      expect(PackageCondition.DAMAGED).toBe('damaged');
    });
  });

  describe('PackageDetails Interface', () => {
    it('should accept valid package details', () => {
      const packageDetails: PackageDetails = {
        description: 'Electronics package',
        size: PackageSize.MEDIUM,
        weight: 2.5,
        weightUnit: 'kg',
        quantity: 1,
        fragile: true,
        perishable: false,
        requiresSignature: true,
      };

      expect(packageDetails.description).toBe('Electronics package');
      expect(packageDetails.size).toBe(PackageSize.MEDIUM);
      expect(packageDetails.weight).toBe(2.5);
      expect(packageDetails.fragile).toBe(true);
    });

    it('should accept package details with optional fields', () => {
      const packageDetails: PackageDetails = {
        description: 'Electronics package',
        size: PackageSize.MEDIUM,
        dimensions: {
          length: 30,
          width: 20,
          height: 15,
          unit: 'cm',
          weight: 2.5,
          weightUnit: 'kg',
        },
        weight: 2.5,
        weightUnit: 'kg',
        quantity: 1,
        value: 500,
        currency: 'USD',
        fragile: true,
        perishable: false,
        requiresSignature: true,
        specialInstructions: 'Handle with care',
        images: ['https://example.com/image1.jpg'],
      };

      expect(packageDetails.dimensions?.length).toBe(30);
      expect(packageDetails.value).toBe(500);
      expect(packageDetails.specialInstructions).toBe('Handle with care');
    });
  });

  describe('DeliveryRoute Interface', () => {
    it('should accept valid delivery route', () => {
      const route: DeliveryRoute = {
        origin: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        destination: {
          latitude: 34.0522,
          longitude: -118.2437,
        },
        distance: 450,
        distanceUnit: 'km',
        estimatedDuration: 300,
      };

      expect(route.origin.latitude).toBe(40.7128);
      expect(route.destination.latitude).toBe(34.0522);
      expect(route.distance).toBe(450);
      expect(route.estimatedDuration).toBe(300);
    });

    it('should accept route with optional fields', () => {
      const route: DeliveryRoute = {
        origin: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
        destination: {
          latitude: 34.0522,
          longitude: -118.2437,
        },
        distance: 450,
        distanceUnit: 'km',
        estimatedDuration: 300,
        actualDuration: 320,
        waypoints: [
          { latitude: 39.9526, longitude: -75.1652 },
        ],
        polyline: 'encoded_polyline_string',
      };

      expect(route.actualDuration).toBe(320);
      expect(route.waypoints).toHaveLength(1);
      expect(route.polyline).toBe('encoded_polyline_string');
    });
  });

  describe('CreateDeliveryDto Interface', () => {
    it('should accept valid create delivery DTO', () => {
      const dto: CreateDeliveryDto = {
        type: DeliveryType.STANDARD,
        method: DeliveryMethod.COURIER,
        sender: {
          userId: 'user-123',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          },
        },
        recipient: {
          name: 'Jane Doe',
          phoneNumber: '+1234567890',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90001',
            country: 'USA',
          },
        },
        package: {
          description: 'Electronics',
          size: PackageSize.MEDIUM,
          weight: 2.5,
          weightUnit: 'kg',
          quantity: 1,
        },
      };

      expect(dto.type).toBe(DeliveryType.STANDARD);
      expect(dto.sender.userId).toBe('user-123');
      expect(dto.recipient.name).toBe('Jane Doe');
      expect(dto.package.size).toBe(PackageSize.MEDIUM);
    });

    it('should accept create delivery DTO with optional fields', () => {
      const dto: CreateDeliveryDto = {
        orderId: 'order-123',
        type: DeliveryType.EXPRESS,
        priority: DeliveryPriority.HIGH,
        method: DeliveryMethod.COURIER,
        sender: {
          userId: 'user-123',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          },
        },
        recipient: {
          name: 'Jane Doe',
          phoneNumber: '+1234567890',
          email: 'jane@example.com',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90001',
            country: 'USA',
          },
          preferredDeliveryTime: '2-4 PM',
        },
        package: {
          description: 'Electronics',
          size: PackageSize.MEDIUM,
          weight: 2.5,
          weightUnit: 'kg',
          quantity: 1,
          value: 500,
          fragile: true,
          requiresSignature: true,
          specialInstructions: 'Handle with care',
        },
        estimatedPickupTime: new Date(),
        estimatedDeliveryTime: new Date(),
        insurance: {
          coverage: 500,
          currency: 'USD',
        },
        specialRequirements: ['fragile', 'signature-required'],
        notes: 'Please call before delivery',
      };

      expect(dto.orderId).toBe('order-123');
      expect(dto.priority).toBe(DeliveryPriority.HIGH);
      expect(dto.insurance?.coverage).toBe(500);
      expect(dto.specialRequirements).toContain('fragile');
    });
  });

  describe('DeliverySummary Interface', () => {
    it('should accept valid delivery summary', () => {
      const summary: DeliverySummary = {
        id: 'del-123',
        deliveryNumber: 'DEL-2024-001',
        status: DeliveryStatus.IN_TRANSIT,
        type: DeliveryType.STANDARD,
        senderName: 'John Doe',
        recipientName: 'Jane Doe',
        pickupCity: 'New York',
        deliveryCity: 'Los Angeles',
        createdAt: new Date(),
      };

      expect(summary.id).toBe('del-123');
      expect(summary.deliveryNumber).toBe('DEL-2024-001');
      expect(summary.status).toBe(DeliveryStatus.IN_TRANSIT);
      expect(summary.senderName).toBe('John Doe');
    });

    it('should accept delivery summary with estimated time', () => {
      const summary: DeliverySummary = {
        id: 'del-123',
        deliveryNumber: 'DEL-2024-001',
        status: DeliveryStatus.IN_TRANSIT,
        type: DeliveryType.EXPRESS,
        senderName: 'John Doe',
        recipientName: 'Jane Doe',
        pickupCity: 'New York',
        deliveryCity: 'Los Angeles',
        estimatedDeliveryTime: new Date('2024-12-31'),
        createdAt: new Date(),
      };

      expect(summary.estimatedDeliveryTime).toBeInstanceOf(Date);
    });
  });

  describe('Delivery Interface', () => {
    it('should accept valid delivery object', () => {
      const delivery: Delivery = {
        id: 'del-123',
        deliveryNumber: 'DEL-2024-001',
        type: DeliveryType.STANDARD,
        status: DeliveryStatus.PENDING,
        priority: DeliveryPriority.NORMAL,
        method: DeliveryMethod.COURIER,
        sender: {
          userId: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          },
        },
        recipient: {
          name: 'Jane Doe',
          phoneNumber: '+0987654321',
          address: {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90001',
            country: 'USA',
          },
        },
        package: {
          description: 'Electronics',
          size: PackageSize.MEDIUM,
          weight: 2.5,
          weightUnit: 'kg',
          quantity: 1,
          fragile: true,
          perishable: false,
          requiresSignature: true,
        },
        route: {
          origin: {
            latitude: 40.7128,
            longitude: -74.0060,
          },
          destination: {
            latitude: 34.0522,
            longitude: -118.2437,
          },
          distance: 450,
          distanceUnit: 'km',
          estimatedDuration: 300,
        },
        timeline: {
          createdAt: new Date(),
        },
        pricing: {
          baseFee: 10.00,
          distanceFee: 20.00,
          weightFee: 5.00,
          priorityFee: 0,
          serviceFee: 2.00,
          tax: 3.70,
          total: 40.70,
          currency: 'USD',
        },
        trackingEvents: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(delivery.id).toBe('del-123');
      expect(delivery.deliveryNumber).toBe('DEL-2024-001');
      expect(delivery.status).toBe(DeliveryStatus.PENDING);
      expect(delivery.pricing.total).toBe(40.70);
    });
  });
});
