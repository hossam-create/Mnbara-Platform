import { useState } from 'react';
import { LegalConsentCheckbox, ConfirmationModal } from '../ui';

interface DisputeData {
  disputeReason: string;
  agreeTerms: boolean;
  agreeMediation: boolean;
  agreeFinality: boolean;
}

interface DisputeScreenWithLegalConsentProps {
  transactionId: string;
  productName: string;
  amount: number;
  onSubmitDispute: (data: DisputeData) => void;
  isLoading?: boolean;
}

export default function DisputeScreenWithLegalConsent({ 
  transactionId, 
  productName, 
  amount, 
  onSubmitDispute, 
  isLoading = false 
}: DisputeScreenWithLegalConsentProps) {
  const [disputeData, setDisputeData] = useState<DisputeData>({
    disputeReason: '',
    agreeTerms: false,
    agreeMediation: false,
    agreeFinality: false,
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleInputChange = (field: keyof DisputeData, value: string | boolean) => {
    setDisputeData(prev => ({ ...prev, [field]: value }));
  };

  const handleConsentChange = (type: 'terms' | 'mediation' | 'finality', consented: boolean, timestamp?: Date) => {
    const field = type === 'terms' ? 'agreeTerms' : 
                 type === 'mediation' ? 'agreeMediation' : 'agreeFinality';
    setDisputeData(prev => ({ ...prev, [field]: consented }));
  };

  const allConsentsGiven = disputeData.agreeTerms && disputeData.agreeMediation && disputeData.agreeFinality;
  const canSubmit = allConsentsGiven && disputeData.disputeReason.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleFinalSubmit = () => {
    onSubmitDispute(disputeData);
    setShowConfirmation(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {/* Dispute Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">File a Dispute</h2>
          <p className="text-gray-600">
            Please provide details about the issue you're experiencing with this transaction.
          </p>
        </div>

        {/* Transaction Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Transaction Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-gray-700">{transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Product:</span>
              <span className="font-medium">{productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-red-600">${amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Dispute Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Dispute
          </label>
          <textarea
            value={disputeData.disputeReason}
            onChange={(e) => handleInputChange('disputeReason', e.target.value)}
            placeholder="Please describe the issue in detail..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Legal Consent Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispute Process Terms</h3>
          
          <div className="space-y-4 bg-red-50 p-4 rounded-xl border border-red-200">
            <div className="flex items-start gap-2">
              <span className="text-red-600 text-lg">⚖️</span>
              <p className="text-sm text-red-700">
                Important: Please review these terms before submitting your dispute.
              </p>
            </div>

            <LegalConsentCheckbox
              type="terms"
              checked={disputeData.agreeTerms}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('terms', consented, timestamp)
              }
              disabled={isLoading}
              label="I agree to the Dispute Resolution Terms"
            />

            <LegalConsentCheckbox
              type="mediation"
              checked={disputeData.agreeMediation}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('mediation', consented, timestamp)
              }
              disabled={isLoading}
              label="I agree to participate in mediation if required"
            />

            <LegalConsentCheckbox
              type="finality"
              checked={disputeData.agreeFinality}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('finality', consented, timestamp)
              }
              disabled={isLoading}
              label="I understand that mediation decisions are final and binding"
            />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Mnbara facilitates dispute resolution as a neutral intermediary. 
            We do not make financial decisions or guarantee outcomes.
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
        >
          {isLoading ? 'Submitting Dispute...' : 'Submit Dispute'}
        </button>

        {/* Process Notice */}
        <div className="flex items-center gap-2 mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
          <span className="text-gray-600">⏳</span>
          <p className="text-xs text-gray-700">
            Dispute resolution may take 3-5 business days. All parties will be notified.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleFinalSubmit}
        title="Confirm Dispute Submission"
        message={`You are about to submit a dispute for transaction ${transactionId}.
        
Please confirm your understanding:
• Mnbara acts as a neutral facilitator only
• We do not guarantee specific outcomes
• You agree to participate in good faith mediation
• Mediation decisions are final and binding
• This process may take 3-5 business days

Your reason: "${disputeData.disputeReason.substring(0, 100)}${disputeData.disputeReason.length > 100 ? '...' : ''}"`}
        confirmText="Confirm Dispute"
        cancelText="Review Details"
        type="warning"
        isLoading={isLoading}
      />
    </>
  );
}