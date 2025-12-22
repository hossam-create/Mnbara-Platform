import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AcceptModal from '../../components/legal/AcceptModal';
import { SEO } from '../../components/seo/SEO';
import { legalContent } from '../../lib/legalContent';

const UserAgreement: React.FC = () => {
  const { language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAcceptAgreement = (agreements: Record<string, { agreed: boolean; timestamp: Date }>) => {
    console.log('User agreements accepted:', agreements);
    // Store agreements in local storage or state management
    localStorage.setItem('userAgreementAccepted', JSON.stringify({
      timestamp: new Date().toISOString(),
      agreements
    }));
    setIsModalOpen(false);
  };

  return (
    <>
      <SEO
        title={language === 'AR' ? 'اتفاقية المستخدم - منبرة' : 'User Agreement - Mnbara'}
        description={language === 'AR' 
          ? 'اتفاقية استخدام منصة منبرة كوسيط ثقة بين المشترين والمسافرين' 
          : 'User agreement for Mnbara platform as a trusted intermediary between buyers and travelers'
        }
        keywords={language === 'AR' 
          ? 'اتفاقية مستخدم, منبرة, وسيط ثقة, شروط الاستخدام' 
          : 'user agreement, mnbara, trust intermediary, terms of use'
        }
        canonical={'/legal/user-agreement'}
        ogTitle={language === 'AR' ? 'اتفاقية المستخدم - منبرة' : 'User Agreement - Mnbara'}
        ogDescription={language === 'AR' 
          ? 'اتفاقية استخدام منصة منبرة كوسيط ثقة بين المشترين والمسافرين' 
          : 'User agreement for Mnbara platform as a trusted intermediary between buyers and travelers'
        }
        lang={language}
      />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">
              {language === 'AR' ? 'اتفاقية المستخدم' : 'User Agreement'}
            </h1>
            <p className="text-blue-100 mt-1">
              {language === 'AR' ? 'آخر تحديث: 21 ديسمبر 2024' : 'Last Updated: December 21, 2024'}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div 
              className="prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: language === 'AR' 
                  ? legalContent.userAgreement.AR 
                  : legalContent.userAgreement.EN 
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
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
        title={language === 'AR' ? 'اتفاقية المستخدم' : 'User Agreement'}
        content={language === 'AR' 
          ? legalContent.userAgreement.AR 
          : legalContent.userAgreement.EN
        }
        requiredAgreements={['user', 'privacy']}
      />
    </div>
    </>
  );
};

export default UserAgreement;