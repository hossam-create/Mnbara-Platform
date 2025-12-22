import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import ScrollGuard from './ScrollGuard';
import AgreementCheckbox from './AgreementCheckbox';

interface AcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (agreements: Record<string, { agreed: boolean; timestamp: Date }>) => void;
  title: string;
  content: string;
  requiredAgreements?: ('user' | 'privacy' | 'trust' | 'dispute' | 'traveler' | 'buyer' | 'cookies' | 'transparency')[];
  isLoading?: boolean;
}

const AcceptModal: React.FC<AcceptModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  title,
  content,
  requiredAgreements = ['user', 'privacy'],
  isLoading = false
}) => {
  const { language } = useLanguage();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreements, setAgreements] = useState<Record<string, { agreed: boolean; timestamp: Date }>>({});
  const [allAgreementsAccepted, setAllAgreementsAccepted] = useState(false);

  const handleScrollComplete = () => {
    setHasScrolled(true);
  };

  const handleAgreementChange = (type: string, agreed: boolean, timestamp: Date) => {
    const newAgreements = { ...agreements, [type]: { agreed, timestamp } };
    setAgreements(newAgreements);

    // Check if all required agreements are accepted
    const allAccepted = requiredAgreements.every(
      agreement => newAgreements[agreement]?.agreed === true
    );
    
    setAllAgreementsAccepted(allAccepted && hasScrolled);
  };

  const handleAccept = () => {
    if (allAgreementsAccepted) {
      onAccept(agreements);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollGuard onScrollComplete={handleScrollComplete}>
            <div className="prose prose-sm max-w-none p-6">
              <div 
                dangerouslySetInnerHTML={{ __html: content }}
                className="text-gray-700"
              />
            </div>
          </ScrollGuard>
        </div>

        {/* Agreements */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-3">
            {requiredAgreements.map((agreementType) => (
              <AgreementCheckbox
                key={agreementType}
                agreementType={agreementType}
                onAgreementChange={(agreed, timestamp) => 
                  handleAgreementChange(agreementType, agreed, timestamp)
                }
                required={true}
                disabled={!hasScrolled}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isLoading}
            >
              {language === 'AR' ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              onClick={handleAccept}
              disabled={!allAgreementsAccepted || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading 
                ? (language === 'AR' ? 'جاري المعالجة...' : 'Processing...')
                : (language === 'AR' ? 'قبول ومتابعة' : 'Accept & Continue')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcceptModal;