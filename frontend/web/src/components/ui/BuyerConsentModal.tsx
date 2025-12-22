import { useState } from 'react';

interface BuyerConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  productName?: string;
  amount?: number;
}

export default function BuyerConsentModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  productName,
  amount
}: BuyerConsentModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isChecked) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
        {/* Header */}
        <div className="bg-blue-50 border-b border-blue-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <h3 className="font-bold text-lg text-blue-800">Purchase Confirmation</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-blue-100"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {productName && amount && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium">{productName}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-green-600">${amount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-gray-700 text-sm leading-relaxed">
              Before you proceed, please confirm your understanding:
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-xs font-medium">
                ⚠️ This is a binding commitment to purchase. You are responsible for completing this transaction.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="buyer-consent"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded mt-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="buyer-consent" className="text-sm text-gray-700 leading-tight">
                I understand this is a binding commitment to purchase this item through Mnbara's trust-based platform.
              </label>
            </div>

            <p className="text-xs text-gray-500">
              Mnbara facilitates connections between buyers and travelers. We do not process payments or guarantee outcomes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isChecked || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isLoading ? 'Processing...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}