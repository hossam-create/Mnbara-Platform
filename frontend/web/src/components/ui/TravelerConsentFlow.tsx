import { useState, useRef, useEffect } from 'react';

interface TravelerConsentFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  requestDetails?: {
    productName: string;
    deliveryLocation: string;
    estimatedReward: number;
    requestId: string;
  };
}

export default function TravelerConsentFlow({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  requestDetails
}: TravelerConsentFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setHasScrolledToBottom(false);
      setIsChecked(false);
    }
  }, [isOpen]);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setHasScrolledToBottom(scrolledToBottom);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setHasScrolledToBottom(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setHasScrolledToBottom(false);
    }
  };

  const handleConfirm = () => {
    if (isChecked) {
      onConfirm();
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Delivery Responsibilities</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ Important: As a traveler, you accept full responsibility for the safe delivery of this item.
              </p>
            </div>
            
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>Your obligations include:</strong></p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Safely transporting the item from pickup to delivery location</li>
                <li>Maintaining the item in its original condition</li>
                <li>Meeting the agreed-upon delivery timeline</li>
                <li>Providing updates and communication throughout the journey</li>
                <li>Verifying the recipient's identity upon delivery</li>
              </ul>
              
              <p className="mt-4">
                <strong>Note:</strong> Mnbara facilitates connections but does not assume liability for lost or damaged goods. 
                You are directly responsible to the buyer for the safe delivery of this item.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Liability & Risk</h3>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-800 text-sm font-medium">
                ⚠️ You assume all risks associated with this delivery.
              </p>
            </div>

            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>Risk factors include:</strong></p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Damage during transport</li>
                <li>Theft or loss of the item</li>
                <li>Delivery delays beyond your control</li>
                <li>Recipient verification issues</li>
                <li>Customs or regulatory complications</li>
              </ul>

              <p className="mt-4">
                <strong>Compensation:</strong> Your reward is contingent upon successful delivery. 
                No partial payments are made for incomplete or failed deliveries.
              </p>

              <p>
                <strong>Dispute resolution:</strong> Any issues must be reported immediately. 
                Mnbara provides mediation services but does not guarantee outcomes.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Final Confirmation</h3>
            
            {requestDetails && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Delivery Request Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{requestDetails.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery To:</span>
                    <span className="font-medium">{requestDetails.deliveryLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Reward:</span>
                    <span className="font-bold text-green-600">${requestDetails.estimatedReward.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                📋 Please review all terms carefully before accepting this delivery responsibility.
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="traveler-final-consent"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded mt-1 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="traveler-final-consent" className="text-sm text-gray-700">
                I have read and understand all terms. I accept full responsibility for the safe delivery of this item 
                and acknowledge that Mnbara's role is limited to facilitating this connection.
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] max-h-[800px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-2xl">⚖️</span>
            <div>
              <h2 className="font-bold text-xl text-white">Traveler Agreement</h2>
              <p className="text-slate-300 text-sm">Step {currentStep} of 3</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">
              {currentStep === 3 ? 'Final Review' : 'Mandatory Reading'}
            </span>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-100 border-b border-slate-200 p-1">
          <div className="h-1 bg-slate-300 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Area */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6"
        >
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="flex justify-between items-center">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  disabled={isLoading}
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep < 3 && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="scroll-confirm"
                      checked={hasScrolledToBottom}
                      readOnly
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                    />
                    <label htmlFor="scroll-confirm" className="text-sm text-gray-600">
                      I've read this section
                    </label>
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={!hasScrolledToBottom || isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
                  >
                    Continue
                  </button>
                </>
              )}

              {currentStep === 3 && (
                <button
                  onClick={handleConfirm}
                  disabled={!isChecked || isLoading}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  {isLoading ? 'Accepting...' : 'Accept Responsibility'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}