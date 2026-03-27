import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  userRegistrationSchema,
  userLoginSchema,
  userProfileUpdateSchema,
  passwordChangeSchema,
  addressSchema,
} from '../user.schema';
import {
  orderCreateSchema,
  orderFilterSchema,
  productReviewSchema,
  createOrderDtoSchema,
} from '../order.schema';
import {
  paymentMethodSchema,
  creditCardSchema,
  paymentIntentSchema,
  refundSchema,
} from '../payment.schema';
import {
  geoLocationSchema,
  packageDimensionsSchema,
  createDeliveryDtoSchema,
} from '../delivery.schema';

/**
 * Property-Based Tests for Schema Validation
 * Validates: Requirements 2.2.5 - All user input must be validated
 * 
 * These tests use fast-check to generate random valid/invalid inputs
 * and verify that schemas correctly accept/reject them.
 */

// Helper arbitraries for generating valid test data
const validEmail = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 10 }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 10 }),
    fc.constantFrom('com', 'org', 'net', 'io')
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

const validPassword = fc.string({ minLength: 8, maxLength: 100 });

const validPhone = fc
  .tuple(fc.constantFrom('+1', '+44', '+33', '+49'), fc.integer({ min: 1000000000, max: 9999999999 }))
  .map(([code, num]) => `${code}${num}`);

const validName = fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '.split('')), {
  minLength: 1,
  maxLength: 50,
});

const validUuid = fc.uuid();

const validAmount = fc.integer({ min: 1, max: 1000000 }).map((n) => n / 100);

const validPositiveInt = fc.integer({ min: 1, max: 10000 });

const validRating = fc.integer({ min: 1, max: 5 });

const validLatitude = fc.double({ min: -90, max: 90, noNaN: true });

const validLongitude = fc.double({ min: -180, max: 180, noNaN: true });

describe('User Schema Property Tests', () => {
  it('userRegistrationSchema accepts valid registration data', () => {
    fc.assert(
      fc.property(validEmail, validPassword, validName, validName, validPhone, (email, password, firstName, lastName, phone) => {
        const data = {
          email,
          password,
          firstName,
          lastName,
          phone,
          dateOfBirth: '1990-01-01',
          agreedToTerms: true,
        };
        const result = userRegistrationSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  it('userRegistrationSchema rejects invalid email formats', () => {
    fc.assert(
      fc.property(fc.string().filter((s) => !s.includes('@')), (email) => {
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
      }),
      { numRuns: 50 }
    );
  });

  it('userLoginSchema accepts valid credentials', () => {
    fc.assert(
      fc.property(validEmail, validPassword, (email, password) => {
        const result = userLoginSchema.safeParse({ email, password });
        expect(result.success).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  it('passwordChangeSchema validates matching passwords', () => {
    fc.assert(
      fc.property(validPassword, (password) => {
        const data = {
          currentPassword: 'oldpassword123',
          newPassword: password,
          confirmPassword: password,
        };
        const result = passwordChangeSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  it('addressSchema validates complete addresses', () => {
    fc.assert(
      fc.property(validName, validName, (street, city) => {
        const data = {
          street,
          city,
          state: 'NY',
          postalCode: '12345',
          country: 'US',
        };
        const result = addressSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 50 }
    );
  });
});

describe('Order Schema Property Tests', () => {
  it('orderCreateSchema validates orders with valid items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            productId: validUuid,
            quantity: validPositiveInt,
            price: validAmount,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        validUuid,
        validUuid,
        (items, shippingAddressId, shippingMethodId) => {
          const data = { items, shippingAddressId, shippingMethodId };
          const result = orderCreateSchema.safeParse(data);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('orderCreateSchema rejects empty items array', () => {
    const data = {
      items: [],
      shippingAddressId: fc.sample(validUuid, 1)[0],
      shippingMethodId: fc.sample(validUuid, 1)[0],
    };
    const result = orderCreateSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('productReviewSchema validates ratings within range', () => {
    fc.assert(
      fc.property(validUuid, validRating, validName, (productId, rating, content) => {
        const data = {
          productId,
          rating,
          content: content.padEnd(10, ' '), // Ensure minimum length
        };
        const result = productReviewSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  it('productReviewSchema rejects ratings outside 1-5 range', () => {
    const invalidRatings = [0, 6, -1, 100];
    for (const rating of invalidRatings) {
      const data = {
        productId: fc.sample(validUuid, 1)[0],
        rating,
        content: 'This is a great product.',
      };
      const result = productReviewSchema.safeParse(data);
      expect(result.success).toBe(false);
    }
  });

  it('createOrderDtoSchema validates complete order DTOs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('marketplace', 'crowdshipping', 'p2p_exchange', 'auction'),
        validUuid,
        fc.array(
          fc.record({
            productId: validUuid,
            quantity: validPositiveInt,
            unitPrice: validAmount,
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (type, customerId, items) => {
          const data = {
            type,
            customerId,
            items,
            shippingAddress: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              postalCode: '12345',
              country: 'US',
              firstName: 'John',
              lastName: 'Doe',
              phoneNumber: '+1234567890',
            },
            shippingMethod: 'standard',
            paymentMethod: 'card',
          };
          const result = createOrderDtoSchema.safeParse(data);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Payment Schema Property Tests', () => {
  it('paymentMethodSchema validates payment methods', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('credit_card', 'debit_card', 'paypal', 'bank_transfer', 'apple_pay', 'google_pay'),
        (type) => {
          const result = paymentMethodSchema.safeParse({ type });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('creditCardSchema validates credit card data', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 13, maxLength: 19 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 2024, max: 2100 }),
        fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 3, maxLength: 4 }),
        validName,
        (cardNumber, expiryMonth, expiryYear, cvv, cardholderName) => {
          const data = {
            cardNumber,
            expiryMonth,
            expiryYear,
            cvv,
            cardholderName,
            billingAddress: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              postalCode: '12345',
              country: 'US',
            },
          };
          const result = creditCardSchema.safeParse(data);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('paymentIntentSchema validates payment intents', () => {
    fc.assert(
      fc.property(
        validAmount,
        fc.constantFrom('USD', 'EUR', 'GBP', 'JPY'),
        (amount, currency) => {
          const result = paymentIntentSchema.safeParse({ amount, currency });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('refundSchema validates refund requests', () => {
    fc.assert(
      fc.property(validUuid, validAmount, validName, (paymentId, amount, reason) => {
        const data = {
          paymentId,
          amount,
          reason: reason.padEnd(10, ' '), // Ensure minimum length
        };
        const result = refundSchema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 50 }
    );
  });
});

describe('Delivery Schema Property Tests', () => {
  it('geoLocationSchema validates coordinates', () => {
    fc.assert(
      fc.property(validLatitude, validLongitude, (latitude, longitude) => {
        const result = geoLocationSchema.safeParse({ latitude, longitude });
        expect(result.success).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  it('geoLocationSchema rejects invalid latitude', () => {
    const invalidLatitudes = [-91, 91, -180, 180];
    for (const latitude of invalidLatitudes) {
      const result = geoLocationSchema.safeParse({ latitude, longitude: 0 });
      expect(result.success).toBe(false);
    }
  });

  it('packageDimensionsSchema validates package dimensions', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.constantFrom('cm', 'in'),
        fc.double({ min: 0.1, max: 1000, noNaN: true }),
        fc.constantFrom('kg', 'lb'),
        (length, width, height, unit, weight, weightUnit) => {
          const data = { length, width, height, unit, weight, weightUnit };
          const result = packageDimensionsSchema.safeParse(data);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('createDeliveryDtoSchema validates delivery creation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('standard', 'express', 'same_day', 'crowdshipping', 'scheduled', 'international'),
        fc.constantFrom('courier', 'traveler', 'postal', 'pickup'),
        validUuid,
        (type, method, userId) => {
          const data = {
            type,
            method,
            sender: {
              userId,
              address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                postalCode: '12345',
                country: 'US',
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
                country: 'US',
              },
            },
            package: {
              description: 'Test package',
              size: 'medium',
              weight: 1.5,
              weightUnit: 'kg',
              quantity: 1,
            },
          };
          const result = createDeliveryDtoSchema.safeParse(data);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Schema Validation Invariants', () => {
  it('schemas reject missing required fields', () => {
    // Test userRegistrationSchema missing required fields
    const incompleteRegistration = {
      email: 'test@example.com',
      // missing password, firstName, lastName, etc.
    };
    expect(userRegistrationSchema.safeParse(incompleteRegistration).success).toBe(false);

    // Test userLoginSchema missing required fields
    const incompleteLogin = { email: 'test@example.com' };
    expect(userLoginSchema.safeParse(incompleteLogin).success).toBe(false);

    // Test addressSchema missing required fields
    const incompleteAddress = { street: '123 Main St' };
    expect(addressSchema.safeParse(incompleteAddress).success).toBe(false);
  });

  it('schema validation is deterministic', () => {
    fc.assert(
      fc.property(validEmail, validPassword, (email, password) => {
        const data = { email, password };
        const result1 = userLoginSchema.safeParse(data);
        const result2 = userLoginSchema.safeParse(data);
        expect(result1.success).toBe(result2.success);
        if (result1.success && result2.success) {
          expect(result1.data).toEqual(result2.data);
        }
      }),
      { numRuns: 50 }
    );
  });

  it('schema safeParse never throws', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        expect(() => userLoginSchema.safeParse(input)).not.toThrow();
      }),
      { numRuns: 50 }
    );
  });

  it('validation errors contain meaningful messages', () => {
    const invalidData = {
      email: 'not-an-email',
      password: '123', // too short
    };
    const result = userRegistrationSchema.safeParse(invalidData);
    if (!result.success) {
      const errorMessages = result.error.errors.map((e) => e.message);
      expect(errorMessages.some((msg) => msg.length > 0)).toBe(true);
    }
  });

  it('nested object schemas validate all levels', () => {
    const invalidNestedData = {
      cardNumber: '4111111111111111',
      expiryMonth: 12,
      expiryYear: 2030,
      cvv: '123',
      cardholderName: 'John Doe',
      billingAddress: {
        street: '', // invalid - empty
        city: 'New York',
        state: 'NY',
        postalCode: '12345',
        country: 'US',
      },
    };
    const result = creditCardSchema.safeParse(invalidNestedData);
    expect(result.success).toBe(false);
  });

  it('array schemas validate all array elements', () => {
    const mixedValidInvalidItems = [
      { productId: fc.sample(validUuid, 1)[0], quantity: 1, price: 10 },
      { productId: 'not-a-uuid', quantity: 1, price: 10 }, // invalid
      { productId: fc.sample(validUuid, 1)[0], quantity: 0, price: 10 }, // invalid
    ];
    const data = {
      items: mixedValidInvalidItems,
      shippingAddressId: fc.sample(validUuid, 1)[0],
      shippingMethodId: fc.sample(validUuid, 1)[0],
    };
    const result = orderCreateSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
