import { useState } from 'react';

/**
 * IconStrip - TWO-LAYER implementation (CRITICAL)
 * 
 * Layer A: Full-width light blue background strip (~56px)
 * Layer B: Centered white floating box with rounded-xl, shadow-sm
 * 
 * Icons are NOT bold, soft/friendly style
 */

// Icons - Soft, friendly, Walmart-like (NOT bold)
const ShippingIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const PickupIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const DeliveryIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

interface FulfillmentOption {
  id: string;
  label: string;
  icon: JSX.Element;
}

const fulfillmentOptions: FulfillmentOption[] = [
  { id: 'shipping', label: 'Shipping', icon: <ShippingIcon /> },
  { id: 'pickup', label: 'Pickup', icon: <PickupIcon /> },
  { id: 'delivery', label: 'Delivery', icon: <DeliveryIcon /> },
];

export default function IconStrip() {
  const [selected, setSelected] = useState('shipping');

  return (
    // LAYER A: Full-width light blue background strip
    <div 
      className="w-full bg-blue-100"
      style={{ height: '56px' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-center">
        
        {/* LAYER B: Centered white floating box - does NOT touch screen edges */}
        <div className="bg-white rounded-xl shadow-sm px-8 py-2 flex items-center gap-8">
          {fulfillmentOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={`
                flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors
                ${selected === option.id 
                  ? 'text-brand-blue bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {/* Icon - soft, not bold */}
              <div className={selected === option.id ? 'text-brand-blue' : 'text-gray-500'}>
                {option.icon}
              </div>
              {/* Text - font-normal (NOT bold) */}
              <span className="text-xs font-normal">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
