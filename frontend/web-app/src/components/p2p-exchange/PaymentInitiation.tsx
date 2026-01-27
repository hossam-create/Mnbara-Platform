// ============================================================
// P2P Exchange - PaymentInitiation Component
// Component for initiating payment in a match
// ============================================================

import React, { useState } from 'react';
import { useInitiatePayment } from '../../hooks/useMatch';

// ============================================================
// TYPES
// ============================================================

interface PaymentInitiationProps {
  matchId: number;
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export const PaymentInitiation: React.FC<PaymentInitiationProps> = ({
  matchId,
  fromAmount,
  fromCurrency,
  toAmount,
  toCurrency,
  onSuccess,
  onCancel,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const initiatePayment = useInitiatePayment();

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleInitiate = async () => {
    if (!confirmed) {
      alert('Please confirm that you understand the payment terms');
      return;
    }

    try {
      await initiatePayment.mutateAsync(matchId);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to initiate payment:', error);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Initiate Payment</h2>

      {/* Payment Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-blue-700">You will send:</span>
            <span className="font-semibold text-blue-900">
              {fromAmount} {fromCurrency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">You will receive:</span>
            <span className="font-semibold text-blue-900">
              {toAmount} {toCurrency}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">Important Instructions</h3>
        <ul className="list-disc list-inside space-y-2 text-yellow-800">
          <li>Make sure you have sufficient funds in your account</li>
          <li>After initiating payment, you will need to upload proof of payment</li>
          <li>The counter party will confirm receipt before funds are released</li>
          <li>Do not send payment outside of the platform</li>
          <li>Keep all payment receipts and screenshots</li>
        </ul>
      </div>

      {/* Confirmation Checkbox */}
      <div className="mb-6">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            I understand and agree to the payment terms. I confirm that I will send{' '}
            <strong>
              {fromAmount} {fromCurrency}
            </strong>{' '}
            and expect to receive{' '}
            <strong>
              {toAmount} {toCurrency}
            </strong>
            .
          </span>
        </label>
      </div>

      {/* Error Message */}
      {initiatePayment.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">
            Error: {initiatePayment.error instanceof Error ? initiatePayment.error.message : 'Failed to initiate payment'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleInitiate}
          disabled={!confirmed || initiatePayment.isPending}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            confirmed && !initiatePayment.isPending
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {initiatePayment.isPending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Initiating...
            </span>
          ) : (
            'Initiate Payment'
          )}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={initiatePayment.isPending}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Success Message */}
      {initiatePayment.isSuccess && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            Payment initiated successfully! Please proceed to upload proof of payment.
          </p>
        </div>
      )}
    </div>
  );
};
