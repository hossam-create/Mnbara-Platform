/**
 * ADDRESS PROMPT COMPONENT
 * Prompts user to add shipping/delivery address
 */

import React from 'react';

interface AddressPromptProps {
  onAddAddress: () => void;
  currentAddress?: string;
}

const AddressPrompt: React.FC<AddressPromptProps> = ({ 
  onAddAddress,
  currentAddress 
}) => {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xl">📍</span>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            {currentAddress ? 'Delivery Address' : 'Add an address for shipping and delivery'}
          </h3>
          {currentAddress ? (
            <p className="text-sm text-gray-600 mb-3">{currentAddress}</p>
          ) : (
            <p className="text-sm text-gray-600 mb-3">
              We'll use this address for shipping and delivery options
            </p>
          )}
          <button
            onClick={onAddAddress}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
          >
            {currentAddress ? 'Change address' : 'Add address'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressPrompt;
