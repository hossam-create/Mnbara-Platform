/**
 * STORE INFO COMPONENT
 * Displays selected store information
 */

import React from 'react';

interface StoreInfoProps {
  storeName: string;
  storeAddress: string;
  onChangeStore?: () => void;
}

const StoreInfo: React.FC<StoreInfoProps> = ({ 
  storeName, 
  storeAddress,
  onChangeStore 
}) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🏬</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">{storeName}</h4>
            <p className="text-xs text-gray-600 mt-1">{storeAddress}</p>
          </div>
        </div>
        {onChangeStore && (
          <button
            onClick={onChangeStore}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap transition"
          >
            Change store
          </button>
        )}
      </div>
    </div>
  );
};

export default StoreInfo;
