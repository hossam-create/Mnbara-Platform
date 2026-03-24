import { Fragment, useState } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next'; // Add import

/**
 * TravelerDropdown - Restored to Previous Version (Simple Blue)
 * 
 * Trigger: 2-Line Pill Button (Blue)
 * Dropdown: Simple Blue List (Traveler / Shipping)
 */

const PlaneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function TravelerDropdown() {
  const [selectedMode, setSelectedMode] = useState<'traveler' | 'direct'>('traveler');
  const { t } = useTranslation();

  return (
    <Popover className="relative z-50">
      {({ open }) => (
        <>
          {/* TRIGGER: Creative Gradient Pill */}
          <Popover.Button
            className={`
              group flex items-center gap-3 px-4 py-1.5 rounded-full transition-all duration-300 outline-none h-[44px]
              bg-gradient-to-r from-[#004F9A] to-[#0075e1] text-white
              border border-white/20 shadow-lg shadow-blue-900/20
              hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:border-white/40 hover:-translate-y-0.5
              focus:ring-2 focus:ring-white/30
            `}
          >
            {/* Round Icon Container with Pulse Effect */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-0 group-hover:opacity-100 duration-1000"></div>
              <div className="group-hover:rotate-[-10deg] transition-transform duration-300">
                <PlaneIcon />
              </div>
            </div>
            
            {/* Two Lines of Text */}
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[11px] font-medium opacity-90 group-hover:opacity-100">{t('header.traveler.title')}</span>
              <span className="text-[13px] font-extrabold tracking-wide group-hover:text-brand-yellow transition-colors">{t('header.traveler.subtitle')}</span>
            </div>
            
            <div className="group-hover:translate-y-0.5 transition-transform">
               <ChevronDownIcon />
            </div>
          </Popover.Button>

          {/* DROPDOWN: Small, Blue Background (Restored) */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel 
              className="absolute left-0 mt-2 z-50 rounded-xl shadow-xl bg-brand-blue ring-1 ring-black/5 p-2"
              style={{ width: '320px' }}
            >
              <div className="flex flex-col gap-1">
                {/* Option 1: Traveler */}
                <button
                  onClick={() => setSelectedMode('traveler')}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                    ${selectedMode === 'traveler' ? 'bg-white/20' : 'hover:bg-white/10'}
                  `}
                >
                  <div className="text-white"><PlaneIcon /></div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">{t('header.traveler.optionTraveler')}</p>
                    <p className="text-white/80 text-xs">{t('header.traveler.optionTravelerDesc')}</p>
                  </div>
                  {selectedMode === 'traveler' && <span className="text-white"><CheckIcon /></span>}
                </button>

                {/* Option 2: Shipping */}
                <button
                  onClick={() => setSelectedMode('direct')}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                    ${selectedMode === 'direct' ? 'bg-white/20' : 'hover:bg-white/10'}
                  `}
                >
                  <div className="text-white">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                     </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">{t('header.traveler.optionShipping')}</p>
                    <p className="text-white/80 text-xs">{t('header.traveler.optionShippingDesc')}</p>
                  </div>
                  {selectedMode === 'direct' && <span className="text-white"><CheckIcon /></span>}
                </button>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
