import { describe, it, expect } from 'vitest';
import {
  CurrencyCode,
  Status,
  VerificationStatus,
  ApprovalStatus,
  NotificationChannel,
  NotificationPriority,
  MediaType,
  type BaseEntity,
  type GeoLocation,
  type Address,
  type Money,
  type PaginatedResponse,
  type ApiResponse,
  type ApiError,
} from '../common.types';

describe('Common Types', () => {
  describe('CurrencyCode Enum', () => {
    it('should have correct currency codes', () => {
      expect(CurrencyCode.USD).toBe('USD');
      expect(CurrencyCode.EUR).toBe('EUR');
      expect(CurrencyCode.GBP).toBe('GBP');
      expect(CurrencyCode.SAR).toBe('SAR');
      expect(CurrencyCode.AED).toBe('AED');
      expect(CurrencyCode.EGP).toBe('EGP');
    });

    it('should contain all expected currency codes', () => {
      const codes = Object.values(CurrencyCode);
      expect(codes).toContain('USD');
      expect(codes).toContain('EUR');
      expect(codes).toContain('SAR');
      expect(codes.length).toBeGreaterThan(5);
    });
  });

  describe('Status Enum', () => {
    it('should have correct status values', () => {
      expect(Status.ACTIVE).toBe('active');
      expect(Status.INACTIVE).toBe('inactive');
      expect(Status.PENDING).toBe('pending');
      expect(Status.SUSPENDED).toBe('suspended');
      expect(Status.DELETED).toBe('deleted');
    });
  });

  describe('VerificationStatus Enum', () => {
    it('should have correct verification statuses', () => {
      expect(VerificationStatus.NOT_VERIFIED).toBe('not_verified');
      expect(VerificationStatus.PENDING).toBe('pending');
      expect(VerificationStatus.VERIFIED).toBe('verified');
      expect(VerificationStatus.REJECTED).toBe('rejected');
      expect(VerificationStatus.EXPIRED).toBe('expired');
    });
  });

  describe('BaseEntity Interface', () => {
    it('should accept valid base entity', () => {
      const entity: BaseEntity = {
        id: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(entity.id).toBe('123');
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should accept base entity with deletedAt', () => {
      const entity: BaseEntity = {
        id: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      expect(entity.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('GeoLocation Interface', () => {
    it('should accept valid geo location', () => {
      const location: GeoLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
      };

      expect(location.latitude).toBe(40.7128);
      expect(location.longitude).toBe(-74.0060);
    });

    it('should accept geo location with optional fields', () => {
      const location: GeoLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: 100,
        heading: 90,
        speed: 5,
      };

      expect(location.accuracy).toBe(10);
      expect(location.altitude).toBe(100);
      expect(location.heading).toBe(90);
      expect(location.speed).toBe(5);
    });
  });

  describe('Address Interface', () => {
    it('should accept valid address', () => {
      const address: Address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      };

      expect(address.street).toBe('123 Main St');
      expect(address.city).toBe('New York');
      expect(address.postalCode).toBe('10001');
    });

    it('should accept address with optional fields', () => {
      const address: Address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        apartment: 'Apt 4B',
        building: 'Building A',
        floor: '4',
        landmark: 'Near Central Park',
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      };

      expect(address.apartment).toBe('Apt 4B');
      expect(address.coordinates?.latitude).toBe(40.7128);
    });
  });

  describe('Money Interface', () => {
    it('should accept valid money object', () => {
      const money: Money = {
        amount: 100.50,
        currency: CurrencyCode.USD,
      };

      expect(money.amount).toBe(100.50);
      expect(money.currency).toBe(CurrencyCode.USD);
    });
  });

  describe('PaginatedResponse Interface', () => {
    it('should accept valid paginated response', () => {
      const response: PaginatedResponse<string> = {
        data: ['item1', 'item2'],
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
        hasNext: true,
        hasPrevious: false,
      };

      expect(response.data).toHaveLength(2);
      expect(response.total).toBe(100);
      expect(response.hasNext).toBe(true);
    });
  });

  describe('ApiResponse Interface', () => {
    it('should accept successful API response', () => {
      const response: ApiResponse<{ id: string }> = {
        success: true,
        data: { id: '123' },
        timestamp: new Date(),
      };

      expect(response.success).toBe(true);
      expect(response.data?.id).toBe('123');
    });

    it('should accept error API response', () => {
      const error: ApiError = {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        timestamp: new Date(),
        statusCode: 404,
      };

      const response: ApiResponse<never> = {
        success: false,
        error,
        timestamp: new Date(),
      };

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NOT_FOUND');
      expect(response.error?.statusCode).toBe(404);
    });
  });

  describe('NotificationChannel Enum', () => {
    it('should have correct notification channels', () => {
      expect(NotificationChannel.EMAIL).toBe('email');
      expect(NotificationChannel.SMS).toBe('sms');
      expect(NotificationChannel.PUSH).toBe('push');
      expect(NotificationChannel.IN_APP).toBe('in_app');
      expect(NotificationChannel.WEBHOOK).toBe('webhook');
    });
  });

  describe('NotificationPriority Enum', () => {
    it('should have correct priority levels', () => {
      expect(NotificationPriority.LOW).toBe('low');
      expect(NotificationPriority.NORMAL).toBe('normal');
      expect(NotificationPriority.HIGH).toBe('high');
      expect(NotificationPriority.URGENT).toBe('urgent');
    });
  });

  describe('MediaType Enum', () => {
    it('should have correct media types', () => {
      expect(MediaType.IMAGE).toBe('image');
      expect(MediaType.VIDEO).toBe('video');
      expect(MediaType.AUDIO).toBe('audio');
      expect(MediaType.DOCUMENT).toBe('document');
      expect(MediaType.OTHER).toBe('other');
    });
  });
});
