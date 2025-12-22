import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AcceptModal from '../../components/legal/AcceptModal';
import { legalContent } from '../../lib/legalContent';

const AITransparency: React.FC = () => {
  const { language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAcceptAgreement = (agreements: Record<string, { agreed: boolean; timestamp: Date }>) => {
    console.log('AI transparency accepted:', agreements);
    localStorage.setItem('aiTransparencyAccepted', JSON.stringify({
      timestamp: new Date().toISOString(),
      agreements
    }));
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-cyan-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">
              {language === 'AR' ? 'سياسة الشفافية والمشورة بالذكاء الاصطناعي' : 'Transparency & AI Advisory Policy'}
            </h1>
            <p className="text-cyan-100 mt-1">
              {language === 'AR' ? 'آخر تحديث: 21 ديسمبر 2024' : 'Last Updated: December 21, 2024'}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div 
              className="prose prose-cyan max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: language === 'AR' 
                  ? legalContent.transparencyAI.AR 
                  : legalContent.transparencyAI.EN 
              }}
            />
          </div>

          {/* Action */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {language === 'AR' 
                  ? 'للمتابعة، يرجى قراءة والقبول أدناه' 
                  : 'To continue, please read and accept below'
                }
              </span>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
              >
                {language === 'AR' ? 'قراءة والقبول' : 'Read & Accept'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Acceptance Modal */}
      <AcceptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccept={handleAcceptAgreement}
        title={language === 'AR' ? 'سياسة الشفافية والمشورة بالذكاء الاصطناعي' : 'Transparency & AI Advisory Policy'}
        content={language === 'AR' 
          ? legalContent.transparencyAI.AR 
          : legalContent.transparencyAI.EN
        }
        requiredAgreements={['transparency', 'user']}
      />
    </div>
  );
};

export default AITransparency;