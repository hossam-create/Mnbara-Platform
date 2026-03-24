import { Fragment, useState } from 'react';
import { Popover, Transition } from '@headlessui/react';
import FulfillmentSelector from '../fulfillment/FulfillmentSelector';

// Reuse icons or import them if available
const TruckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default function PickupDeliveryDropdown() {
  // We'll manage the state here or via context in a real app
  const [method, setMethod] = useState('shipping');
  const [address] = useState('Sacramento, 95829'); // Mock address

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={`
              flex items-center gap-3 px-4 py-2 rounded-full transition-colors outline-none
              ${open ? 'bg-brand-blueDark text-white' : 'bg-brand-blueDark/20 text-white hover:bg-brand-blueDark/30'}
            `}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <TruckIcon />
            </div>
            <div className="flex flex-col items-start ">
              <span className="text-xs font-medium opacity-90">Pickup or delivery</span>
              <div className="flex items-center gap-1 text-sm font-bold">
                <span className="truncate max-w-[150px]">{address}</span>
                <ChevronDownIcon />
              </div>
            </div>
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute left-0 mt-3 w-screen max-w-md z-50 transform px-4 sm:px-0 lg:max-w-xl">
              <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 bg-white p-4">
                 {/* 
                    Directly embedding the FulfillmentSelector here. 
                    We pass mock data or connect it to global state later.
                 */}
                 <FulfillmentSelector 
                    products={[]} // Empty or mock for header dropdown context
                    userLocation={{
                        city: 'Sacramento',
                        zipCode: '95829',
                        storeName: 'Sacramento Supercenter',
                        storeAddress: '8915 GERBER ROAD'
                    }}
                    onFulfillmentChange={(m) => setMethod(m)} 
                 />
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
