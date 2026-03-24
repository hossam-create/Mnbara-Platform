/**
 * Order Service
 * Handles order management and calculations
 */

export interface OrderItem {
  id: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  tax: number;
  discount: number;
  total: number;
}

// Tax rate constant (e.g., 10%)
export const TAX_RATE = 0.1;

/**
 * Calculate order total
 * Formula: sum(item.price * quantity) + tax - discount
 * 
 * @param items - Array of order items
 * @param discount - Discount amount (optional)
 * @returns Calculated order total
 */
export function calculateOrderTotal(
  items: OrderItem[],
  discount: number = 0
): number {
  // Calculate items subtotal
  const itemsTotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  // Calculate tax on items subtotal
  const tax = itemsTotal * TAX_RATE;

  // Calculate final total: items + tax - discount
  const total = itemsTotal + tax - discount;

  // Return total rounded to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * Create an order with calculated total
 * 
 * @param items - Array of order items
 * @param discount - Discount amount (optional)
 * @returns Order object with calculated total
 */
export function createOrder(
  items: OrderItem[],
  discount: number = 0
): Order {
  const itemsTotal = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const tax = itemsTotal * TAX_RATE;
  const total = calculateOrderTotal(items, discount);

  return {
    id: `order-${Date.now()}`,
    items,
    tax,
    discount,
    total,
  };
}

/**
 * Validate order total calculation
 * Property: Order total = sum(item.price * quantity) + tax - discount
 * 
 * @param order - Order to validate
 * @returns true if order total is correct, false otherwise
 */
export function isOrderTotalCorrect(order: Order): boolean {
  const itemsTotal = order.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const expectedTax = itemsTotal * TAX_RATE;
  const expectedTotal = itemsTotal + expectedTax - order.discount;

  // Allow for floating point precision errors (within 0.01)
  return Math.abs(order.total - expectedTotal) < 0.01;
}
