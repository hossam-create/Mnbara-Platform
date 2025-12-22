import { useState } from 'react';
import { LegalConsentCheckbox, ConfirmationModal } from '../ui';

interface AcceptanceData {
  requestId: string;
  productName: string;
  deliveryLocation: string;
  agreeTerms: boolean;
  agreeLiability: boolean;
  agreeDeliveryTerms: boolean;
}

interface TravelerAcceptanceWithLegalConsentProps {
  requestId: string;
  productName: string;
  deliveryLocation: string;
  estimatedReward: number;
  onAccept: (data: AcceptanceData) => void;
  isLoading?: boolean;
}

export default function TravelerAcceptanceWithLegalConsent({ 
  requestId, 
  productName, 
  deliveryLocation, 
  estimatedReward, 
  onAccept, 
  isLoading = false 
}: TravelerAcceptanceWithLegalConsentProps) {
  const [consentData, setConsentData] = useState({
    agreeTerms: false,
    agreeLiability: false,
    agreeDeliveryTerms: false,
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleConsentChange = (type: 'terms' | 'liability' | 'delivery', consented: boolean, timestamp?: Date) => {
    const field = type === 'terms' ? 'agreeTerms' : 
                 type === 'liability' ? 'agreeLiability' : 'agreeDeliveryTerms';
    setConsentData(prev => ({ ...prev, [field]: consented }));
  };

  const allConsentsGiven = consentData.agreeTerms && consentData.agreeLiability && consentData.agreeDeliveryTerms;

  const handleAccept = () => {
    if (!allConsentsGiven) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleFinalAccept = () => {
    onAccept({
      requestId,
      productName,
      deliveryLocation,
      ...consentData
    });
    setShowConfirmation(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {/* Delivery Request Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delivery Request</h3>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Product</span>
              <span className="font-medium">{productName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivery To</span>
              <span className="font-medium">{deliveryLocation}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estimated Reward</span>
              <span className="font-bold text-lg text-green-600">${estimatedReward.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Request ID</span>
              <span className="text-sm text-gray-500">{requestId}</span>
            </div>
          </div>
        </div>

        {/* Legal Consent Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acceptance Terms</h3>
          
          <div className="space-y-4 bg-orange-50 p-4 rounded-xl border border-orange-200">
            <div className="flex items-start gap-2">
              <span className="text-orange-600 text-lg">⚠️</span>
              <p className="text-sm text-orange-700">
                Important: Please carefully review these terms before accepting this delivery request.
              </p>
            </div>

            <LegalConsentCheckbox
              type="terms"
              checked={consentData.agreeTerms}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('terms', consented, timestamp)
              }
              disabled={isLoading}
              label="I agree to the Traveler Terms of Service"
            />

            <LegalConsentCheckbox
              type="liability"
              checked={consentData.agreeLiability}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('liability', consented, timestamp)
              }
              disabled={isLoading}
              label="I understand and accept liability for the safe delivery of this item"
            />

            <LegalConsentCheckbox
              type="delivery"
              checked={consentData.agreeDeliveryTerms}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('delivery', consented, timestamp)
              }
              disabled={isLoading}
              label="I agree to the specific delivery terms and timeline requirements"
            />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            As a traveler, you are responsible for the safe transport and timely delivery of items. 
            Mnbara facilitates connections but does not assume liability for lost or damaged goods.
          </p>
        </div>

        {/* Acceptance Button */}
        <button
          onClick={handleAccept}
          disabled={!allConsentsGiven || isLoading}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
        >
          {isLoading ? 'Accepting Request...' : 'Accept Delivery Request'}
        </button>

        {/* Responsibility Notice */}
        <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-600">📦</span>
          <p className="text-xs text-blue-700">
            You are responsible for the item from acceptance until successful delivery.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleFinalAccept}
        title="Confirm Delivery Acceptance"
        message={`You are accepting responsibility for delivering "${productName}" to ${deliveryLocation}.
        
By confirming, you acknowledge:
• You accept full liability for this item during transport
• You agree to the specified delivery timeline
• You understand this is a trust-based arrangement
• Mnbara acts as facilitator only, not as insurer
• The estimated reward is ${estimatedReward.toFixed(2)} upon successful delivery`}
        confirmText="I Accept Responsibility"
        cancelText="Review Terms"
        type="warning"
        isLoading={isLoading}
      />
    </>
  );
}