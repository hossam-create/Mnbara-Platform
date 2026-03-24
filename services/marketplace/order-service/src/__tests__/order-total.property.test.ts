/**
 * Property-Based Test for Order Total Calculation
 * 
 * **Validates: Property 10 (Order Total Calculation)**
 * 
 * Property: Order total = sum(item.price * quantity) + tax - discount
 * 
 * This test uses fast-check to generate random order configurations
 * and verify that the order total calculation is always correct.
 */

import * as fc from 'fast-check';
import {
  calculateOrderTotal,
  createOrder,
  isOrderTotalCorrect,
  OrderItem,
  TAX_RATE,
} from '../services/order.service';

// Helper to create price arbitraries with proper 32-bit float constraints
const priceArbitrary = (min: number, max: number) =>
  fc.float({
    min: Math.fround(min),
    max: Math.fround(max),
    noNaN: true,
  });

const discountArbitrary = (min: number, max: number) =>
  fc.float({
    min: Math.fround(min),
    max: Math.fround(max),
    noNaN: true,
  });

describe('Order Total Calculation - Property-Based Tests', () => {
  /**
   * Property 1: Order total calculation is correct for any valid order
   * 
   * For any set of order items and discount:
   * - Calculate items subtotal: sum(item.price * quantity)
   * - Calculate tax: itemsTotal * TAX_RATE
   * - Calculate total: itemsTotal + tax - discount
   * - Verify order.total matches expected total
   */
  it('should always calculate correct order total for any valid items and discount', () => {
    fc.assert(
      fc.property(
        // Generate array of order items
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 10000),
            quantity: fc.integer({ min: 1, max: 1000 }),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        // Generate discount amount
        discountArbitrary(0, 100000),
        (items: OrderItem[], discount: number) => {
          // Create order with calculated total
          const order = createOrder(items, discount);

          // Manually calculate expected total
          const itemsTotal = items.reduce((sum, item) => {
            return sum + item.price * item.quantity;
          }, 0);
          const expectedTax = itemsTotal * TAX_RATE;
          const expectedTotal = itemsTotal + expectedTax - discount;

          // Verify order total is correct (within floating point precision)
          return Math.abs(order.total - expectedTotal) < 0.01;
        }
      )
    );
  });

  /**
   * Property 2: Order total validation function works correctly
   * 
   * For any valid order created by createOrder:
   * - isOrderTotalCorrect should return true
   */
  it('should validate correct order totals', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 10000),
            quantity: fc.integer({ min: 1, max: 1000 }),
          }),
          { minLength: 1, maxLength: 100 }
        ),
        discountArbitrary(0, 100000),
        (items: OrderItem[], discount: number) => {
          const order = createOrder(items, discount);
          return isOrderTotalCorrect(order) === true;
        }
      )
    );
  });

  /**
   * Property 3: Order total increases with more items
   * 
   * For any two orders where order2 has all items from order1 plus additional items:
   * - order2.total >= order1.total (assuming same discount)
   */
  it('should increase total when adding more items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 1000),
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 1000),
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        discountArbitrary(0, 10000),
        (items1: OrderItem[], items2: OrderItem[], discount: number) => {
          const order1 = createOrder(items1, discount);
          const combinedItems = [...items1, ...items2];
          const order2 = createOrder(combinedItems, discount);

          // order2 should have higher or equal total
          return order2.total >= order1.total;
        }
      )
    );
  });

  /**
   * Property 4: Discount reduces total correctly
   * 
   * For any order:
   * - order with discount should have lower total than order without discount
   * - difference should be approximately equal to discount amount
   */
  it('should reduce total correctly with discount', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 1000),
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        discountArbitrary(0, 10000),
        (items: OrderItem[], discount: number) => {
          const orderWithoutDiscount = createOrder(items, 0);
          const orderWithDiscount = createOrder(items, discount);

          // Total with discount should be less than without discount
          const difference = orderWithoutDiscount.total - orderWithDiscount.total;

          // Difference should be approximately equal to discount (within 0.01)
          return Math.abs(difference - discount) < 0.01;
        }
      )
    );
  });

  /**
   * Property 5: Tax is calculated correctly
   * 
   * For any order:
   * - tax should equal itemsTotal * TAX_RATE
   */
  it('should calculate tax correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 1000),
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        discountArbitrary(0, 10000),
        (items: OrderItem[], discount: number) => {
          const order = createOrder(items, discount);

          // Calculate expected tax
          const itemsTotal = items.reduce((sum, item) => {
            return sum + item.price * item.quantity;
          }, 0);
          const expectedTax = itemsTotal * TAX_RATE;

          // Tax should match expected tax (within floating point precision)
          return Math.abs(order.tax - expectedTax) < 0.01;
        }
      )
    );
  });

  /**
   * Property 6: Order total is never negative when discount is reasonable
   * 
   * For any valid order where discount <= items total + tax:
   * - order.total should be >= 0
   */
  it('should never produce negative order total', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 1000),
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (items: OrderItem[]) => {
          // Calculate items total to ensure discount doesn't exceed it
          const itemsTotal = items.reduce((sum, item) => {
            return sum + item.price * item.quantity;
          }, 0);
          
          // Generate discount that won't exceed items total + tax
          const maxDiscount = itemsTotal + itemsTotal * TAX_RATE;
          const discount = Math.random() * maxDiscount;
          
          const order = createOrder(items, discount);
          return order.total >= 0;
        }
      )
    );
  });

  /**
   * Property 7: calculateOrderTotal function matches createOrder total
   * 
   * For any items and discount:
   * - calculateOrderTotal(items, discount) should equal createOrder(items, discount).total
   */
  it('should have consistent calculation between functions', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 1000),
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        discountArbitrary(0, 10000),
        (items: OrderItem[], discount: number) => {
          const calculatedTotal = calculateOrderTotal(items, discount);
          const orderTotal = createOrder(items, discount).total;

          // Both functions should produce the same result
          return Math.abs(calculatedTotal - orderTotal) < 0.01;
        }
      )
    );
  });

  /**
   * Edge Case: Empty discount (zero discount)
   * 
   * For any order with zero discount:
   * - total should equal itemsTotal + tax
   */
  it('should handle zero discount correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 1000),
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        (items: OrderItem[]) => {
          const order = createOrder(items, 0);

          // Calculate expected total without discount
          const itemsTotal = items.reduce((sum, item) => {
            return sum + item.price * item.quantity;
          }, 0);
          const expectedTotal = itemsTotal + itemsTotal * TAX_RATE;

          return Math.abs(order.total - expectedTotal) < 0.01;
        }
      )
    );
  });

  /**
   * Edge Case: Single item order
   * 
   * For a single item order:
   * - total should equal price * quantity + (price * quantity * TAX_RATE) - discount
   */
  it('should handle single item orders correctly', () => {
    fc.assert(
      fc.property(
        priceArbitrary(0.01, 1000),
        fc.integer({ min: 1, max: 100 }),
        discountArbitrary(0, 10000),
        (price: number, quantity: number, discount: number) => {
          const items: OrderItem[] = [
            {
              id: 'item-1',
              price,
              quantity,
            },
          ];

          const order = createOrder(items, discount);

          // Calculate expected total
          const itemsTotal = price * quantity;
          const expectedTotal = itemsTotal + itemsTotal * TAX_RATE - discount;

          return Math.abs(order.total - expectedTotal) < 0.01;
        }
      )
    );
  });

  /**
   * Edge Case: Large quantity orders
   * 
   * For orders with large quantities:
   * - calculation should still be accurate
   */
  it('should handle large quantity orders correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 100),
            quantity: fc.integer({ min: 1000, max: 10000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        discountArbitrary(0, 100000),
        (items: OrderItem[], discount: number) => {
          const order = createOrder(items, discount);
          return isOrderTotalCorrect(order) === true;
        }
      )
    );
  });

  /**
   * Edge Case: Very small prices
   * 
   * For orders with very small prices:
   * - calculation should still be accurate
   */
  it('should handle very small prices correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            price: priceArbitrary(0.01, 0.99),
            quantity: fc.integer({ min: 1, max: 100 }),
          }),
          { minLength: 1, maxLength: 50 }
        ),
        discountArbitrary(0, 100),
        (items: OrderItem[], discount: number) => {
          const order = createOrder(items, discount);
          return isOrderTotalCorrect(order) === true;
        }
      )
    );
  });
});
