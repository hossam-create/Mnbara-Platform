import React from 'react';

/**
 * FulfillmentOptionCard - Interactive card for each fulfillment method
 * 
 * MNBARH Brand:
 * - Selected: dark blue border + light blue background
 * - Unselected: light gray border
 * - Typography: clean, consistent
 */

interface FulfillmentOptionCardProps {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  estimatedTime?: string;
  badge?: string;
}

export default function FulfillmentOptionCard({
  id,
  label,
  description,
  icon,
  selected,
  onSelect,
  estimatedTime,
  badge
}: FulfillmentOptionCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        relative w-full p-5 rounded-xl border-2 transition-all duration-200 text-left
        ${selected 
          ? 'border-[#1e3a5f] bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
      aria-pressed={selected}
      data-testid={`fulfillment-option-${id}`}
    >
      {/* Badge */}
      {badge && (
        <span className="absolute -top-2 right-3 bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}

      {/* Icon */}
      <div className={`
        w-14 h-14 rounded-full flex items-center justify-center mb-3
        ${selected ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-600'}
      `}>
        {icon}
      </div>

      {/* Label */}
      <h3 className={`
        text-lg font-semibold mb-1
        ${selected ? 'text-[#1e3a5f]' : 'text-gray-900'}
      `}>
        {label}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-sm mb-2">
        {description}
      </p>

      {/* Estimated Time */}
      {estimatedTime && (
        <p className={`
          text-xs font-medium
          ${selected ? 'text-[#1e3a5f]' : 'text-gray-400'}
        `}>
          ⏱️ {estimatedTime}
        </p>
      )}

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#1e3a5f] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
