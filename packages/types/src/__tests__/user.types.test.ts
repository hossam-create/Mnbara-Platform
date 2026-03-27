import { describe, it, expect } from 'vitest';
import {
  UserRole,
  UserStatus,
  KYCStatus,
  AccountType,
  type User,
  type UserProfile,
  type CreateUserDto,
  type UserLoginDto,
  type UserPublicProfile,
} from '../user.types';

describe('User Types', () => {
  describe('UserRole Enum', () => {
    it('should have correct user roles', () => {
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.USER).toBe('user');
      expect(UserRole.SELLER).toBe('seller');
      expect(UserRole.TRAVELER).toBe('traveler');
      expect(UserRole.MODERATOR).toBe('moderator');
      expect(UserRole.SUPPORT).toBe('support');
    });

    it('should contain all expected roles', () => {
      const roles = Object.values(UserRole);
      expect(roles).toContain('admin');
      expect(roles).toContain('user');
      expect(roles).toContain('seller');
      expect(roles.length).toBe(6);
    });
  });

  describe('UserStatus Enum', () => {
    it('should have correct user statuses', () => {
      expect(UserStatus.ACTIVE).toBe('active');
      expect(UserStatus.INACTIVE).toBe('inactive');
      expect(UserStatus.SUSPENDED).toBe('suspended');
      expect(UserStatus.PENDING_VERIFICATION).toBe('pending_verification');
      expect(UserStatus.BANNED).toBe('banned');
    });
  });

  describe('KYCStatus Enum', () => {
    it('should have correct KYC statuses', () => {
      expect(KYCStatus.NOT_STARTED).toBe('not_started');
      expect(KYCStatus.PENDING).toBe('pending');
      expect(KYCStatus.UNDER_REVIEW).toBe('under_review');
      expect(KYCStatus.APPROVED).toBe('approved');
      expect(KYCStatus.REJECTED).toBe('rejected');
      expect(KYCStatus.EXPIRED).toBe('expired');
    });
  });

  describe('AccountType Enum', () => {
    it('should have correct account types', () => {
      expect(AccountType.PERSONAL).toBe('personal');
      expect(AccountType.BUSINESS).toBe('business');
    });
  });

  describe('UserProfile Interface', () => {
    it('should accept valid user profile', () => {
      const profile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(profile.firstName).toBe('John');
      expect(profile.lastName).toBe('Doe');
    });

    it('should accept user profile with optional fields', () => {
      const profile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'JohnD',
        bio: 'Software developer',
        avatar: 'https://example.com/avatar.jpg',
        phoneNumber: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        language: 'en',
        timezone: 'America/New_York',
      };

      expect(profile.displayName).toBe('JohnD');
      expect(profile.bio).toBe('Software developer');
      expect(profile.gender).toBe('male');
    });
  });

  describe('CreateUserDto Interface', () => {
    it('should accept valid create user DTO', () => {
      const dto: CreateUserDto = {
        email: 'john@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptedTerms: true,
      };

      expect(dto.email).toBe('john@example.com');
      expect(dto.firstName).toBe('John');
      expect(dto.acceptedTerms).toBe(true);
    });

    it('should accept create user DTO with optional fields', () => {
      const dto: CreateUserDto = {
        email: 'john@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        accountType: AccountType.BUSINESS,
        roles: [UserRole.SELLER],
        acceptedTerms: true,
      };

      expect(dto.phoneNumber).toBe('+1234567890');
      expect(dto.accountType).toBe(AccountType.BUSINESS);
      expect(dto.roles).toContain(UserRole.SELLER);
    });
  });

  describe('UserLoginDto Interface', () => {
    it('should accept valid login DTO', () => {
      const dto: UserLoginDto = {
        email: 'john@example.com',
        password: 'SecurePass123!',
      };

      expect(dto.email).toBe('john@example.com');
      expect(dto.password).toBe('SecurePass123!');
    });

    it('should accept login DTO with optional fields', () => {
      const dto: UserLoginDto = {
        email: 'john@example.com',
        password: 'SecurePass123!',
        rememberMe: true,
        deviceInfo: {
          deviceName: 'iPhone 13',
          deviceType: 'mobile',
          browser: 'Safari',
          os: 'iOS 15',
        },
      };

      expect(dto.rememberMe).toBe(true);
      expect(dto.deviceInfo?.deviceName).toBe('iPhone 13');
    });
  });

  describe('UserPublicProfile Interface', () => {
    it('should accept valid public profile', () => {
      const profile: UserPublicProfile = {
        id: '123',
        displayName: 'JohnD',
        memberSince: new Date(),
        statistics: {
          averageRating: 4.5,
          totalReviews: 10,
          completedOrders: 50,
          completedDeliveries: 20,
          trustScore: 85,
        },
        kycVerified: true,
      };

      expect(profile.id).toBe('123');
      expect(profile.displayName).toBe('JohnD');
      expect(profile.statistics.averageRating).toBe(4.5);
      expect(profile.kycVerified).toBe(true);
    });

    it('should accept public profile with optional fields', () => {
      const profile: UserPublicProfile = {
        id: '123',
        displayName: 'JohnD',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Experienced seller',
        memberSince: new Date(),
        statistics: {
          averageRating: 4.5,
          totalReviews: 10,
          completedOrders: 50,
          completedDeliveries: 20,
          trustScore: 85,
        },
        kycVerified: true,
        badges: ['verified', 'top-seller'],
      };

      expect(profile.avatar).toBe('https://example.com/avatar.jpg');
      expect(profile.badges).toContain('verified');
    });
  });

  describe('User Interface', () => {
    it('should accept valid user object', () => {
      const user: User = {
        id: '123',
        email: 'john@example.com',
        roles: [UserRole.USER],
        status: UserStatus.ACTIVE,
        accountType: AccountType.PERSONAL,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
        authentication: {
          email: 'john@example.com',
          emailVerified: true,
          phoneVerified: false,
          twoFactorEnabled: false,
        },
        preferences: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          marketingEmails: false,
          newsletter: false,
          language: 'en',
          currency: 'USD',
        },
        statistics: {
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalSpent: 0,
          totalEarned: 0,
          totalDeliveries: 0,
          completedDeliveries: 0,
          averageRating: 0,
          totalReviews: 0,
          trustScore: 0,
          memberSince: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.id).toBe('123');
      expect(user.email).toBe('john@example.com');
      expect(user.roles).toContain(UserRole.USER);
      expect(user.status).toBe(UserStatus.ACTIVE);
    });
  });
});
