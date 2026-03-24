import React, { useState, useEffect } from 'react';
import PickupTimeline from './PickupTimeline';
import type { Product, UserLocation } from './FulfillmentSelector';

/**
 * PickupPeriodDetails - Shows dynamic preparation period for pickup orders
 * 
 * Features:
 * - Fetches preparation period from backend API
 * - Shows per-product breakdown with individual readiness times
 * - Highlights bottleneck product (longest prep time)
 * - Toggleable Gantt-style timeline visualization
 * 
 * Calculation Logic:
 * - Base: 24 hours
 * - Fragile: +24 hours
 * - Oversized: +48 hours
 * - Distance > 100km: +24 hours
 * - Distance > 500km: +48 hours (additional)
 */

// Types for preparation data
interface ProductBreakdown {
  id: string;
  name: string;
  productType: 'standard' | 'fragile' | 'oversized';
  preparationHours: number;
  readyAt: Date;
  isBottleneck: boolean;
}

interface PreparationData {
  breakdown: ProductBreakdown[];
  finalPreparationHours: number;
  finalReadyAt: Date;
  bottleneckProduct: ProductBreakdown | null;
}

interface PickupPeriodDetailsProps {
  products: Product[];
  userLocation?: UserLocation;
}

// Client-side calculation fallback
function calculatePreparationPeriod(products: Product[]): PreparationData {
  const now = new Date();
  
  const breakdown: ProductBreakdown[] = products.map(product => {
    let hours = 24; // Base
    
    if (product.productType === 'fragile') hours += 24;
    if (product.productType === 'oversized') hours += 48;
    if (product.warehouseDistanceKm > 100) hours += 24;
    if (product.warehouseDistanceKm > 500) hours += 24;
    
    const readyAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    return {
      id: product.id,
      name: product.name,
      productType: product.productType,
      preparationHours: hours,
      readyAt,
      isBottleneck: false
    };
  });
  
  // Find bottleneck
  const maxHours = Math.max(...breakdown.map(b => b.preparationHours));
  const bottleneckIndex = breakdown.findIndex(b => b.preparationHours === maxHours);
  if (bottleneckIndex >= 0) {
    breakdown[bottleneckIndex].isBottleneck = true;
  }
  
  const finalPreparationHours = maxHours;
  const finalReadyAt = new Date(now.getTime() + finalPreparationHours * 60 * 60 * 1000);
  
  return {
    breakdown,
    finalPreparationHours,
    finalReadyAt,
    bottleneckProduct: breakdown[bottleneckIndex] || null
  };
}

// Format date for display
function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Format hours to readable duration
function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${days} day${days > 1 ? 's' : ''}`;
  return `${days} day${days > 1 ? 's' : ''} ${remainingHours}h`;
}

export default function PickupPeriodDetails({ products, userLocation }: PickupPeriodDetailsProps) {
  const [data, setData] = useState<PreparationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreparationPeriod() {
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch from backend API
        const response = await fetch('/api/fulfillment/pickup-period', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setData(result.data);
            setLoading(false);
            return;
          }
        }
        
        // Fallback to client-side calculation
        const fallbackData = calculatePreparationPeriod(products);
        setData(fallbackData);
      } catch (err) {
        // Use client-side fallback on error
        const fallbackData = calculatePreparationPeriod(products);
        setData(fallbackData);
      } finally {
        setLoading(false);
      }
    }
    
    if (products.length > 0) {
      fetchPreparationPeriod();
    }
  }, [products]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with preparation notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⏱️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Preparation Period Required
            </h3>
            <p className="text-gray-700 text-sm">
              Your order will be ready for pickup in{' '}
              <span className="font-bold text-[#1e3a5f]">
                {formatDuration(data.finalPreparationHours)}
              </span>
              {' '}— by {formatDateTime(data.finalReadyAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Per-product breakdown */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-medium text-gray-900 mb-3 text-sm">
          Item Preparation Breakdown
        </h4>
        
        <div className="space-y-3">
          {data.breakdown.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-center justify-between p-3 rounded-lg border
                ${item.isBottleneck 
                  ? 'bg-amber-50 border-amber-300' 
                  : 'bg-white border-gray-200'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Product type indicator */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${item.productType === 'fragile' ? 'bg-red-100 text-red-700' : ''}
                  ${item.productType === 'oversized' ? 'bg-purple-100 text-purple-700' : ''}
                  ${item.productType === 'standard' ? 'bg-gray-100 text-gray-700' : ''}
                `}>
                  {item.productType === 'fragile' && '🔴'}
                  {item.productType === 'oversized' && '📦'}
                  {item.productType === 'standard' && '📋'}
                </div>
                
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.productType.charAt(0).toUpperCase() + item.productType.slice(1)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`
                  font-semibold text-sm
                  ${item.isBottleneck ? 'text-amber-700' : 'text-gray-700'}
                `}>
                  {formatDuration(item.preparationHours)}
                </p>
                <p className="text-xs text-gray-500">
                  Ready: {formatDateTime(item.readyAt)}
                </p>
                {item.isBottleneck && (
                  <span className="text-xs font-medium text-amber-600">
                    ⚠️ Longest prep
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline toggle */}
      <button
        onClick={() => setShowTimeline(!showTimeline)}
        className="flex items-center gap-2 text-[#1e3a5f] text-sm font-medium hover:underline"
      >
        <span>{showTimeline ? '▼' : '▶'}</span>
        {showTimeline ? 'Hide' : 'Show'} Timeline Visualization
      </button>

      {/* Gantt-style Timeline */}
      {showTimeline && (
        <PickupTimeline 
          breakdown={data.breakdown} 
          finalReadyAt={data.finalReadyAt}
          maxHours={data.finalPreparationHours}
        />
      )}

      {/* Store info */}
      {userLocation?.storeName && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <span className="text-xl">🏪</span>
          <div>
            <p className="font-medium text-gray-900">{userLocation.storeName}</p>
            <p className="text-sm text-gray-600">{userLocation.storeAddress}</p>
          </div>
          <button className="ml-auto text-[#1e3a5f] text-sm font-medium hover:underline">
            Change store
          </button>
        </div>
      )}
    </div>
  );
}
