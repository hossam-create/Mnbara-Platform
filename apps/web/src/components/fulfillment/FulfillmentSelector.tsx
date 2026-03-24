import React, { useState } from 'react';
import FulfillmentOptionCard from './FulfillmentOptionCard';
import PickupPeriodDetails from './PickupPeriodDetails';

/**
 * FulfillmentSelector - Main container for fulfillment options
 * 
 * MNBARH Brand Identity:
 * - Primary: dark blue (#1e3a5f), white (#ffffff), light gray (#f5f5f5)
 * - Typography: clean sans-serif (Inter/system)
 * - Buttons: bold, rounded, prominent
 * 
 * Responsive: cards stack vertically on mobile, horizontal on desktop
 */

// ============ ICONS ============

// Shipping - Truck icon
const TruckIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" 
    />
  </svg>
);

// Pickup - Box being loaded into car icon
const PickupIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M8 7h12l-3 9H5L2 4H0m5 12a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4z" 
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M12 3v6m0 0l-2-2m2 2l2-2" 
    />
  </svg>
);

// Delivery - Shopping bag icon
const DeliveryIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
    />
  </svg>
);

// ============ TYPES ============

export interface Product {
  id: string;
  name: string;
  productType: 'standard' | 'fragile' | 'oversized';
  warehouseDistanceKm: number;
  price: number;
  image?: string;
}

export interface UserLocation {
  city: string;
  zipCode: string;
  storeName?: string;
  storeAddress?: string;
}

interface FulfillmentSelectorProps {
  products: Product[];
  userLocation?: UserLocation;
  onFulfillmentChange?: (method: 'shipping' | 'pickup' | 'delivery') => void;
}

// ============ COMPONENT ============

export default function FulfillmentSelector({
  products,
  userLocation,
  onFulfillmentChange
}: FulfillmentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'shipping' | 'pickup' | 'delivery'>('shipping');

  const handleSelect = (method: 'shipping' | 'pickup' | 'delivery') => {
    setSelectedMethod(method);
    onFulfillmentChange?.(method);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header - MNBARH dark blue */}
      <div className="bg-[#1e3a5f] px-6 py-4">
        <h2 className="text-white text-lg font-medium">
          How would you like to get your order?
        </h2>
        {userLocation && (
          <p className="text-white/70 text-sm mt-1">
            📍 {userLocation.city}, {userLocation.zipCode}
          </p>
        )}
      </div>

      {/* Fulfillment Options - Responsive grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Shipping Card */}
          <FulfillmentOptionCard
            id="shipping"
            label="Shipping"
            description="Delivered to your door"
            icon={<TruckIcon />}
            selected={selectedMethod === 'shipping'}
            onSelect={() => handleSelect('shipping')}
            estimatedTime="3-5 business days"
          />

          {/* Pickup Card */}
          <FulfillmentOptionCard
            id="pickup"
            label="Pickup"
            description="Collect from store"
            icon={<PickupIcon />}
            selected={selectedMethod === 'pickup'}
            onSelect={() => handleSelect('pickup')}
            estimatedTime="Varies by item"
            badge="Save on shipping"
          />

          {/* Delivery Card */}
          <FulfillmentOptionCard
            id="delivery"
            label="Delivery"
            description="Express to your address"
            icon={<DeliveryIcon />}
            selected={selectedMethod === 'delivery'}
            onSelect={() => handleSelect('delivery')}
            estimatedTime="Same day available"
          />
        </div>

        {/* Pickup Preparation Period Details */}
        {selectedMethod === 'pickup' && products.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <PickupPeriodDetails products={products} userLocation={userLocation} />
          </div>
        )}

        {/* Continue Button - MNBARH style (bold, rounded, prominent) */}
        <div className="mt-6">
          <button className="w-full bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white font-bold py-4 px-8 rounded-full transition-colors shadow-md">
            Continue with {selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}
          </button>
        </div>
      </div>
    </div>
  );
}
