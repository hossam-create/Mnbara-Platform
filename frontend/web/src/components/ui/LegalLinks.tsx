import { useState } from 'react';
import LegalModal from './LegalModal';

interface LegalLinksProps {
  variant?: 'inline' | 'stacked' | 'compact';
  className?: string;
}

const legalContent = {
  terms: {
    title: 'Terms of Service',
    content: `
      <h3>Welcome to Mnbara</h3>
      <p>Mnbara acts as a trust intermediary platform connecting buyers and travelers. By using our services, you agree to these terms.</p>
      
      <h4>Our Role</h4>
      <p>We are not a bank, payment processor, or financial institution. We facilitate trust-based transactions between users.</p>
      
      <h4>User Responsibilities</h4>
      <ul>
        <li>Provide accurate information</li>
        <li>Communicate transparently with other users</li>
        <li>Follow our community guidelines</li>
        <li>Respect the trust-based nature of our platform</li>
      </ul>
      
      <h4>Transaction Process</h4>
      <p>All transactions require human confirmation at multiple steps. There are no automated payments.</p>
      
      <h4>Dispute Resolution</h4>
      <p>We provide advisory services and mediation, but final resolution requires mutual agreement between parties.</p>
      
      <p><strong>Last updated:</strong> December 2024</p>
    `
  },
  privacy: {
    title: 'Privacy Policy', 
    content: `
      <h3>Your Privacy Matters</h3>
      <p>We collect only necessary information to facilitate trust-based transactions between users.</p>
      
      <h4>Information We Collect</h4>
      <ul>
        <li>Basic profile information</li>
        <li>Communication history (for dispute resolution)</li>
        <li>Transaction details (amounts, dates, parties involved)</li>
        <li>Device information for security purposes</li>
      </ul>
      
      <h4>How We Use Information</h4>
      <ul>
        <li>Facilitate transactions between users</li>
        <li>Provide dispute resolution services</li>
        <li>Improve our platform's trust mechanisms</li>
        <li>Ensure platform security and integrity</li>
      </ul>
      
      <h4>Data Sharing</h4>
      <p>We only share information with other users involved in your transactions and as required for dispute resolution.</p>
      
      <h4>Your Rights</h4>
      <p>You can request access to your data or ask us to delete your account at any time.</p>
      
      <p><strong>Last updated:</strong> December 2024</p>
    `
  },
  disclaimer: {
    title: 'Legal Disclaimer',
    content: `
      <h3>Important Information</h3>
      <p>Mnbara is a trust intermediary platform. Please read this disclaimer carefully.</p>
      
      <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
        <h4 style="color: #dc2626; margin: 0 0 0.5rem 0;">⚠️ Platform Limitations</h4>
        <ul style="margin: 0; color: #7f1d1d;">
          <li>We are NOT a bank or financial institution</li>
          <li>We do NOT process payments automatically</li>
          <li>We do NOT provide financial advice</li>
          <li>We do NOT guarantee transaction outcomes</li>
        </ul>
      </div>
      
      <h4>Our Role</h4>
      <p>We facilitate connections and provide advisory services. All transactions require explicit human confirmation at every step.</p>
      
      <h4>User Acknowledgement</h4>
      <p>By using our platform, you acknowledge that:</p>
      <ul>
        <li>You understand our role as a trust intermediary only</li>
        <li>You take responsibility for your transactions</li>
        <li>You will exercise due diligence in all interactions</li>
        <li>You understand that we provide advisory services, not guarantees</li>
      </ul>
      
      <h4>Risk Awareness</h4>
      <p>All transactions carry inherent risks. We help mitigate these risks through our trust systems, but cannot eliminate them entirely.</p>
      
      <p><strong>Last updated:</strong> December 2024</p>
    `
  }
};

export default function LegalLinks({ variant = 'inline', className = '' }: LegalLinksProps) {
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | 'disclaimer' | null>(null);

  const handleLinkClick = (type: 'terms' | 'privacy' | 'disclaimer') => {
    setActiveModal(type);
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const baseClasses = {
    inline: 'flex items-center gap-6 text-sm',
    stacked: 'flex flex-col gap-2 text-sm',
    compact: 'flex items-center gap-4 text-xs'
  };

  const linkClasses = 'text-gray-500 hover:text-gray-700 transition-colors cursor-pointer';

  return (
    <>
      <div className={`${baseClasses[variant]} ${className}`}>
        <button
          onClick={() => handleLinkClick('terms')}
          className={linkClasses}
        >
          Terms of Service
        </button>
        <button
          onClick={() => handleLinkClick('privacy')}
          className={linkClasses}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => handleLinkClick('disclaimer')}
          className={linkClasses}
        >
          Legal Disclaimer
        </button>
      </div>

      {activeModal && (
        <LegalModal
          isOpen={true}
          onClose={handleModalClose}
          onConfirm={handleModalClose}
          title={legalContent[activeModal].title}
          content={legalContent[activeModal].content}
          type={activeModal}
        />
      )}
    </>
  );
}