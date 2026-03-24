// ============================================================
// P2P Exchange - ReceiptConfirmation Component
// Component for confirming receipt of payment
// ============================================================

import React, { useState } from 'react';
import { useConfirmReceipt } from '../../hooks/useMatch';

// ============================================================
// TYPES
// ============================================================

interface ReceiptConfirmationProps {
  matchId: number;
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  proofPhotoUrl?: string;
  proofVideoUrl?: string;
  referenceId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export const ReceiptConfirmation: React.FC<ReceiptConfirmationProps> = ({
  matchId,
  fromAmount,
  fromCurrency,
  toAmount,
  toCurrency,
  proofPhotoUrl,
  proofVideoUrl,
  referenceId,
  onSuccess,
  onCancel,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const confirmReceipt = useConfirmReceipt();

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleConfirm = async () => {
    if (!confirmed) {
      alert('Please confirm that you have received the payment');
      return;
    }

    try {
      await confirmReceipt.mutateAsync(matchId);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to confirm receipt:', error);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-testid="receipt-confirmation">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Receipt of Payment</h2>

      {/* Payment Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" data-testid="payment-summary">
        <h3 className="text-lg font-semibold text-green-900 mb-3">Payment Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-green-700">Expected to receive:</span>
            <span className="font-semibold text-green-900">
              {toAmount} {toCurrency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Counter party sent:</span>
            <span className="font-semibold text-green-900">
              {fromAmount} {fromCurrency}
            </span>
          </div>
          {referenceId && (
            <div className="flex justify-between">
              <span className="text-green-700">Reference ID:</span>
              <span className="font-semibold text-green-900">{referenceId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Proof of Payment */}
      {(proofPhotoUrl || proofVideoUrl) && (
        <div className="mb-6" data-testid="proof-section">
          <button
            onClick={() => setShowProof(!showProof)}
            className="flex items-center justify-between w-full p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            data-testid="view-proof-button"
          >
            <span className="text-blue-900 font-medium">View Proof of Payment</span>
            <svg
              className={`h-5 w-5 text-blue-900 transition-transform ${showProof ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProof && (
            <div className="mt-4 space-y-4" data-testid="proof-content">
              {proofPhotoUrl && (
                <div data-testid="proof-photo-section">
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment Receipt Photo</p>
                  <img
                    src={proofPhotoUrl}
                    alt="Payment receipt"
                    data-testid="proof-photo"
                    className="w-full h-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}
              {proofVideoUrl && (
                <div data-testid="proof-video-section">
                  <p className="text-sm font-medium text-gray-700 mb-2">Payment Video</p>
                  <video
                    src={proofVideoUrl}
                    controls
                    data-testid="proof-video"
                    className="w-full h-auto rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6" data-testid="instructions-section">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">Before Confirming</h3>
        <ul className="list-disc list-inside space-y-2 text-yellow-800">
          <li>Verify that you have received the full payment amount</li>
          <li>Check that the payment reference matches the proof provided</li>
          <li>Ensure the payment is from the correct sender</li>
          <li>Confirm the payment has cleared in your account</li>
          <li>Once confirmed, the exchange will be completed and cannot be reversed</li>
        </ul>
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="warning-section">
        <div className="flex items-start space-x-3">
          <svg
            className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-red-900 mb-1">Important Warning</h4>
            <p className="text-sm text-red-800">
              Only confirm receipt if you have actually received the payment. False confirmation may
              result in account suspension and legal action.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="mb-6">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            data-testid="receipt-confirmation-checkbox"
            className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">
            I confirm that I have received{' '}
            <strong>
              {toAmount} {toCurrency}
            </strong>{' '}
            in my account. I understand that this action is final and cannot be reversed.
          </span>
        </label>
      </div>

      {/* Error Message */}
      {confirmReceipt.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="error-message">
          <p className="text-red-800">
            Error: {confirmReceipt.error instanceof Error ? confirmReceipt.error.message : 'Failed to confirm receipt'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleConfirm}
          disabled={!confirmed || confirmReceipt.isPending}
          data-testid="confirm-receipt-button"
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            confirmed && !confirmReceipt.isPending
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {confirmReceipt.isPending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Confirming...
            </span>
          ) : (
            'Confirm Receipt'
          )}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={confirmReceipt.isPending}
            data-testid="cancel-receipt-button"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Success Message */}
      {confirmReceipt.isSuccess && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4" data-testid="success-message">
          <div className="flex items-start space-x-3">
            <svg
              className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-green-900 mb-1">Receipt Confirmed!</h4>
              <p className="text-sm text-green-800">
                The exchange has been completed successfully. Funds will be released shortly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
