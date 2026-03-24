import { describe, it, expect } from 'vitest';
import {
  userRegistrationSchema,
  userLoginSchema,
  userProfileUpdateSchema,
  passwordChangeSchema,
  addressSchema,
} from '../user.schema';

describe('User Validation Schemas', () => {
  describe('userRegistrationSchema', () => {
    it('should validate a valid registration object', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        agreedToTerms: true,
      };
      const result = userRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        agreedToTerms: true,
      };
      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'short',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        agreedToTerms: true,
      };
      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject future date of birth', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: '2099-01-01',
        agreedToTerms: true,
      };
      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject when agreedToTerms is not true', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        agreedToTerms: false,
      };
      const result = userRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('userLoginSchema', () => {
    it('should validate a valid login object', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = userLoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate login with rememberMe', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };
      const result = userLoginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid',
        password: 'password123',
      };
      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };
      const result = userLoginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('userProfileUpdateSchema', () => {
    it('should validate a valid profile update with all fields', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        bio: 'This is my bio',
        avatarUrl: 'https://example.com/avatar.png',
      };
      const result = userProfileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate empty object (all fields optional)', () => {
      const validData = {};
      const result = userProfileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate partial update', () => {
      const validData = {
        firstName: 'John',
      };
      const result = userProfileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        phone: 'invalid-phone',
      };
      const result = userProfileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid avatar URL', () => {
      const invalidData = {
        avatarUrl: 'not-a-url',
      };
      const result = userProfileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept empty string for optional avatarUrl', () => {
      const validData = {
        avatarUrl: '',
      };
      const result = userProfileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject bio exceeding max length', () => {
      const invalidData = {
        bio: 'a'.repeat(501),
      };
      const result = userProfileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('passwordChangeSchema', () => {
    it('should validate a valid password change', () => {
      const validData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      };
      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
        newPassword: 'newpassword456',
        confirmPassword: 'differentpassword',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short new password', () => {
      const invalidData = {
        currentPassword: 'oldpassword123',
        newPassword: 'short',
        confirmPassword: 'short',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'newpassword456',
        confirmPassword: 'newpassword456',
      };
      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('addressSchema', () => {
    it('should validate a valid address', () => {
      const validData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        isDefault: true,
      };
      const result = addressSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid postal code format', () => {
      const invalidData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: 'invalid',
        country: 'US',
      };
      const result = addressSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid country code length', () => {
      const invalidData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      };
      const result = addressSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        street: '123 Main St',
      };
      const result = addressSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept valid ZIP+4 format', () => {
      const validData = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001-1234',
        country: 'US',
      };
      const result = addressSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});