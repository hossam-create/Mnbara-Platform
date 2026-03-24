import { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next'; // Add import

/**
 * FulfillmentDropdown - Blue Dropdown Menu
 * 
 * Trigger: Blue Pill (#004F9A) containing:
 * - Label: "Fulfillment Center"
 * - Icons: Shipping, Pickup, Delivery (White)
 * - Chevron
 * 
 * Purpose: Matches user request for "blue dropdown menu" while maintaining width.
 */

// Creative Colorful Icons for "Images" feel

const ShippingIconColorful = () => (
   <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 24 24" fill="none">
      <path d="M19 13H5v-2h14v2z" fill="#000000" opacity="0.2" /> {/* Shadow */}
      <rect x="2" y="6" width="11" height="10" rx="1" fill="#FFC220" /> {/* Yellow Body */}
      <rect x="13" y="10" width="6" height="6" rx="1" fill="#FFC220" /> {/* Cab */}
      <rect x="14" y="11" width="3" height="3" fill="#30759E" /> {/* Window */}
      <circle cx="5" cy="16" r="2" fill="#2E2F32" /> {/* Wheel */}
      <circle cx="15" cy="16" r="2" fill="#2E2F32" /> {/* Wheel */}
      <circle cx="5" cy="16" r="0.8" fill="#F4F5F6" /> {/* Hubcap */}
      <circle cx="15" cy="16" r="0.8" fill="#F4F5F6" /> {/* Hubcap */}
   </svg>
);

const PickupIconColorful = () => (
   <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 24 24" fill="none">
      <path d="M12 21L3 16V8L12 3L21 8V16L12 21Z" fill="#D49E68" /> {/* Box Base */}
      <path d="M12 3L21 8L12 13L3 8L12 3Z" fill="#E6BC8C" /> {/* Top */}
      <path d="M21 8V16L12 21V13L21 8Z" fill="#B07D4C" /> {/* Side Dark */}
   </svg>
);

const DeliveryIconColorful = () => (
   <svg className="w-6 h-6 drop-shadow-sm" viewBox="0 0 24 24" fill="none">
       <circle cx="10" cy="20" r="2" fill="#E31837" /> {/* Wheel */}
       <circle cx="20" cy="20" r="2" fill="#E31837" /> {/* Wheel */}
       <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
       {/* Filled Items inside cart */}
       <rect x="8" y="5" width="4" height="6" rx="1" fill="#FFC220" />
       <rect x="13" y="7" width="4" height="4" rx="1" fill="#32CD32" />
   </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-3 h-3 text-white ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function FulfillmentDropdown() {
  const { t } = useTranslation();
  return (
    <Popover className="relative z-40">
      {() => (
        <>
          {/* TRIGGER: Creative Gradient Pill */}
          <Popover.Button
            className={`
              group flex items-center justify-between gap-3 px-4 py-1.5 rounded-lg h-[44px] transition-all duration-300 outline-none
              bg-gradient-to-r from-[#004F9A] to-[#0075e1] text-white
              border border-white/20 shadow-lg shadow-blue-900/20
              hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:border-white/40 hover:-translate-y-0.5
              focus:ring-2 focus:ring-white/30
            `}
          >
            {/* Single Expressive Icon (Box/Hub) */}
            <div className="flex-shrink-0 w-7 h-7 bg-white/10 rounded-full p-1 group-hover:bg-white/20 transition-colors group-hover:scale-110 duration-300">
               <PickupIconColorful />
            </div>

            {/* Label */}
            <div className="flex flex-col items-start justify-center">
              <span className="text-[12px] text-white font-bold leading-none whitespace-nowrap group-hover:text-brand-yellow transition-colors">
                {t('header.fulfillment.title')}
              </span>
              <span className="text-[10px] text-white/80 leading-none mt-1 whitespace-nowrap">
                {t('header.fulfillment.subtitle')}
              </span>
            </div>

            {/* Chevron */}
            <div className="group-hover:translate-y-0.5 transition-transform ml-1">
               <ChevronDownIcon />
            </div>
          </Popover.Button>

          {/* DROPDOWN CONTENT */}
          <Transition
             as={Fragment}
             enter="transition ease-out duration-150"
             enterFrom="opacity-0 translate-y-1"
             enterTo="opacity-100 translate-y-0"
             leave="transition ease-in duration-100"
             leaveFrom="opacity-100 translate-y-0"
             leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute left-0 mt-2 z-50 w-64 origin-top-left rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none p-2">
               <div className="flex flex-col gap-1">
                  <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left group">
                     <div className="p-1.5 bg-blue-50 group-hover:bg-blue-100 text-brand-blue rounded-md transition-colors"><ShippingIconColorful /></div>
                     <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t('header.fulfillment.shippingSettings')}</span>
                  </button>
                  <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left group">
                     <div className="p-1.5 bg-blue-50 group-hover:bg-blue-100 text-brand-blue rounded-md transition-colors"><PickupIconColorful /></div>
                     <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t('header.fulfillment.pickupSettings')}</span>
                  </button>
                  <button className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-left group">
                     <div className="p-1.5 bg-blue-50 group-hover:bg-blue-100 text-brand-blue rounded-md transition-colors"><DeliveryIconColorful /></div>
                     <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t('header.fulfillment.deliverySettings')}</span>
                  </button>
               </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
