/**
 * PICKUP TIMELINE VISUALIZATION
 * Gantt-style chart showing staggered product readiness
 */

import React from 'react';

interface ProductBreakdown {
  id: string;
  name: string;
  productType: string;
  preparationHours: number;
  readyAt: string;
}

interface PickupTimelineProps {
  breakdown: ProductBreakdown[];
}

const PickupTimeline: React.FC<PickupTimelineProps> = ({ breakdown }) => {
  const maxHours = Math.max(...breakdown.map(b => b.preparationHours));
  const startTime = new Date();

  const getBarWidth = (hours: number): string => {
    return `${(hours / maxHours) * 100}%`;
  };

  const getBarColor = (productType: string): string => {
    switch (productType) {
      case 'fragile':
        return 'bg-amber-500';
      case 'oversized':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatTime = (hours: number): string => {
    const date = new Date(startTime.getTime() + hours * 3600 * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
      <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📊</span>
        <span>Preparation Timeline</span>
      </h4>

      {/* Timeline Grid */}
      <div className="space-y-4">
        {breakdown.map((item, index) => (
          <div key={item.id} className="relative">
            {/* Product Name */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700 truncate max-w-[60%]">
                {item.name}
              </p>
              <p className="text-xs text-gray-500">
                {item.preparationHours}h
              </p>
            </div>

            {/* Timeline Bar */}
            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              {/* Progress Bar */}
              <div
                className={`
                  h-full ${getBarColor(item.productType)} 
                  transition-all duration-500 ease-out
                  flex items-center justify-end pr-2
                `}
                style={{ width: getBarWidth(item.preparationHours) }}
              >
                <span className="text-xs font-semibold text-white">
                  {formatTime(item.preparationHours)}
                </span>
              </div>

              {/* Completion Marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                style={{ left: getBarWidth(item.preparationHours) }}
              />
            </div>
          </div>
        ))}

        {/* Final Pickup Line */}
        <div className="relative pt-4 border-t-2 border-dashed border-red-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-red-600">
              🚩 Final Pickup Availability
            </p>
            <p className="text-xs font-semibold text-red-600">
              {maxHours}h
            </p>
          </div>
          <div className="relative h-2 bg-red-100 rounded-full">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse" />
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            All products ready by {formatTime(maxHours)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-2">Product Types:</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600">Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-xs text-gray-600">Fragile</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-xs text-gray-600">Oversized</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickupTimeline;
