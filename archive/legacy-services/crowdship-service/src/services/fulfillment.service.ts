/**
 * FULFILLMENT SERVICE
 * Backend logic for dynamic pickup period calculation
 * 
 * Features:
 * - Product-type-based preparation time
 * - Warehouse distance calculation
 * - Multi-product cart analysis
 * - Bottleneck identification
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// TYPES
// ============================================================

interface Product {
  id: string;
  name: string;
  productType: 'standard' | 'fragile' | 'oversized';
  warehouseDistanceKm: number;
  price: number;
}

interface ProductBreakdown extends Product {
  preparationHours: number;
  readyAt: string;
}

interface PickupPeriodResult {
  breakdown: ProductBreakdown[];
  finalPreparationHours: number;
  finalReadyAt: string;
  bottleneckProduct: ProductBreakdown;
}

// ============================================================
// CALCULATION LOGIC
// ============================================================

/**
 * Calculate preparation period for a single product
 * 
 * Base: 24 hours
 * + Fragile: +24 hours
 * + Oversized: +48 hours
 * + Distance > 100km: +24 hours
 * + Distance > 500km: +48 hours
 */
function calculateProductPeriod(
  productType: string,
  warehouseDistanceKm: number
): number {
  let hours = 24; // Base preparation time

  // Product type adjustments
  if (productType === 'fragile') {
    hours += 24; // Extra handling time
  }
  if (productType === 'oversized') {
    hours += 48; // Special logistics required
  }

  // Distance adjustments
  if (warehouseDistanceKm > 100) {
    hours += 24; // Regional shipping
  }
  if (warehouseDistanceKm > 500) {
    hours += 48; // Long-distance shipping
  }

  return hours;
}

/**
 * Calculate pickup period for multiple products
 * Returns the longest preparation time (bottleneck)
 */
export function calculatePickupPeriod(products: Product[]): PickupPeriodResult {
  const now = new Date();

  // Calculate period for each product
  const breakdown: ProductBreakdown[] = products.map(product => {
    const preparationHours = calculateProductPeriod(
      product.productType,
      product.warehouseDistanceKm
    );

    const readyAt = new Date(now.getTime() + preparationHours * 3600 * 1000);

    return {
      ...product,
      preparationHours,
      readyAt: readyAt.toISOString()
    };
  });

  // Find the longest preparation time (bottleneck)
  const bottleneckProduct = breakdown.reduce((max, item) =>
    item.preparationHours > max.preparationHours ? item : max
  );

  const finalPreparationHours = bottleneckProduct.preparationHours;
  const finalReadyAt = bottleneckProduct.readyAt;

  return {
    breakdown,
    finalPreparationHours,
    finalReadyAt,
    bottleneckProduct
  };
}

// ============================================================
// WAREHOUSE DISTANCE CALCULATION
// ============================================================

/**
 * Calculate distance from warehouse to delivery address
 * (Simplified - in production, use Google Maps API or similar)
 */
export async function calculateWarehouseDistance(
  warehouseId: string,
  deliveryAddress: {
    latitude: number;
    longitude: number;
  }
): Promise<number> {
  // TODO: Integrate with warehouse service
  // For now, return mock data
  
  // Mock warehouse locations
  const warehouses: Record<string, { lat: number; lng: number }> = {
    'warehouse-cairo': { lat: 30.0444, lng: 31.2357 },
    'warehouse-alex': { lat: 31.2001, lng: 29.9187 },
    'warehouse-giza': { lat: 30.0131, lng: 31.2089 }
  };

  const warehouse = warehouses[warehouseId];
  if (!warehouse) {
    throw new Error('Warehouse not found');
  }

  // Haversine formula for distance calculation
  const R = 6371; // Earth's radius in km
  const dLat = toRad(deliveryAddress.latitude - warehouse.lat);
  const dLng = toRad(deliveryAddress.longitude - warehouse.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(warehouse.lat)) *
      Math.cos(toRad(deliveryAddress.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ============================================================
// PRODUCT METADATA
// ============================================================

/**
 * Get product metadata (type, warehouse location)
 * In production, this would query the product catalog
 */
export async function getProductMetadata(productId: string): Promise<{
  productType: 'standard' | 'fragile' | 'oversized';
  warehouseId: string;
}> {
  // TODO: Query product catalog service
  // For now, return mock data based on product ID patterns

  if (productId.includes('glass') || productId.includes('fragile')) {
    return {
      productType: 'fragile',
      warehouseId: 'warehouse-cairo'
    };
  }

  if (productId.includes('furniture') || productId.includes('oversized')) {
    return {
      productType: 'oversized',
      warehouseId: 'warehouse-giza'
    };
  }

  return {
    productType: 'standard',
    warehouseId: 'warehouse-cairo'
  };
}

// ============================================================
// PICKUP HUB ASSIGNMENT
// ============================================================

/**
 * Assign optimal pickup hub based on user location
 */
export async function assignPickupHub(userLocation: {
  latitude: number;
  longitude: number;
}): Promise<{
  hubId: string;
  hubName: string;
  hubAddress: string;
  distanceKm: number;
}> {
  // TODO: Query pickup hub service
  // For now, return mock data

  return {
    hubId: 'hub-cairo-downtown',
    hubName: 'MNbarh Cairo Downtown Hub',
    hubAddress: 'Downtown Cairo, Egypt',
    distanceKm: 5
  };
}

// ============================================================
// EXPORT
// ============================================================

export default {
  calculatePickupPeriod,
  calculateWarehouseDistance,
  getProductMetadata,
  assignPickupHub
};
