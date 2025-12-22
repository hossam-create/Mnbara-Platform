import { useState } from 'react';
import { LegalConsentCheckbox, ConfirmationModal } from '../ui';

interface PurchaseData {
  productName: string;
  price: number;
  agreeTerms: boolean;
  agreeDisclaimer: boolean;
}

interface BuyerPurchaseWithLegalConsentProps {
  productName: string;
  price: number;
  onPurchase: (data: PurchaseData) => void;
  isLoading?: boolean;
}

export default function BuyerPurchaseWithLegalConsent({ 
  productName, 
  price, 
  onPurchase, 
  isLoading = false 
}: BuyerPurchaseWithLegalConsentProps) {
  const [consentData, setConsentData] = useState({
    agreeTerms: false,
    agreeDisclaimer: false,
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleConsentChange = (type: 'terms' | 'disclaimer', consented: boolean, timestamp?: Date) => {
    setConsentData(prev => ({ ...prev, [type === 'terms' ? 'agreeTerms' : 'agreeDisclaimer']: consented }));
  };

  const allConsentsGiven = consentData.agreeTerms && consentData.agreeDisclaimer;

  const handlePurchase = () => {
    if (!allConsentsGiven) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleFinalPurchase = () => {
    onPurchase({
      productName,
      price,
      ...consentData
    });
    setShowConfirmation(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {/* Product Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Summary</h3>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Product</span>
              <span className="font-medium">{productName}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">Price</span>
              <span className="font-bold text-lg text-green-600">${price.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Legal Consent Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Before You Purchase</h3>
          
          <div className="space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-lg">ℹ️</span>
              <p className="text-sm text-blue-700">
                Please review these important agreements before completing your purchase.
              </p>
            </div>

            <LegalConsentCheckbox
              type="terms"
              checked={consentData.agreeTerms}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('terms', consented, timestamp)
              }
              disabled={isLoading}
              label="I agree to the updated Terms of Service for this transaction"
            />

            <LegalConsentCheckbox
              type="disclaimer"
              checked={consentData.agreeDisclaimer}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('disclaimer', consented, timestamp)
              }
              disabled={isLoading}
              label="I understand this is a trust-based transaction and acknowledge the risks"
            />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Remember: Mnbara acts as a trust intermediary only. We facilitate connections 
            between buyers and travelers but do not process payments automatically.
          </p>
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={!allConsentsGiven || isLoading}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
        >
          {isLoading ? 'Processing Purchase...' : 'Complete Purchase'}
        </button>

        {/* Security Notice */}
        <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <span className="text-yellow-600">🔒</span>
          <p className="text-xs text-yellow-700">
            This transaction requires human confirmation. No automated payments will be processed.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleFinalPurchase}
        title="Confirm Purchase"
        message={`You are about to purchase "${productName}" for $${price.toFixed(2)}. 
        
Please confirm that you understand:
• This is a trust-based transaction facilitated by Mnbara
• We are not a bank or payment processor
• All transactions require human confirmation
• You take responsibility for this purchase`}
        confirmText="Confirm Purchase"
        cancelText="Review Details"
        type="warning"
      />
    </>
  );
}