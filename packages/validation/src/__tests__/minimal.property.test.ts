import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { userRegistrationSchema } from '../user.schema';

describe('Minimal Property Test for Schema Validation', () => {
  /** Validates: Requirements 2.2.5 - All user input must be validated */
  it('userRegistrationSchema should validate email format', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),
        (email) => {
          const data = {
            email,
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            dateOfBirth: '1990-01-01',
            agreedToTerms: true,
          };
          const result = userRegistrationSchema.safeParse(data);
          expect(result.success).toBe(true);
        }
      )
    );
  });

  it('userRegistrationSchema should reject invalid email formats', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 100 }).filter((s) => !s.includes('@')),
        (email) => {
          const data = {
            email,
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            dateOfBirth: '1990-01-01',
            agreedToTerms: true,
          };
          const result = userRegistrationSchema.safeParse(data);
          expect(result.success).toBe(false);
        }
      )
    );
  });
});