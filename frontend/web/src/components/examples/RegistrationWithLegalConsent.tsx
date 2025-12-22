import { useState } from 'react';
import { LegalConsentCheckbox, ConfirmationModal } from '../ui';

interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeDisclaimer: boolean;
}

interface RegistrationWithLegalConsentProps {
  onSubmit: (data: RegistrationData) => void;
  isLoading?: boolean;
}

export default function RegistrationWithLegalConsent({ 
  onSubmit, 
  isLoading = false 
}: RegistrationWithLegalConsentProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    fullName: '',
    agreeTerms: false,
    agreePrivacy: false,
    agreeDisclaimer: false,
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleInputChange = (field: keyof RegistrationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConsentChange = (type: 'terms' | 'privacy' | 'disclaimer', consented: boolean, timestamp?: Date) => {
    const field = type === 'terms' ? 'agreeTerms' : 
                 type === 'privacy' ? 'agreePrivacy' : 'agreeDisclaimer';
    setFormData(prev => ({ ...prev, [field]: consented }));
  };

  const allConsentsGiven = formData.agreeTerms && formData.agreePrivacy && formData.agreeDisclaimer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!allConsentsGiven) {
      return;
    }

    // Show confirmation modal before final submission
    setShowConfirmation(true);
  };

  const handleFinalSubmit = () => {
    onSubmit(formData);
    setShowConfirmation(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors"
            required
            disabled={isLoading}
          />
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors"
            required
            minLength={8}
            disabled={isLoading}
          />
        </div>

        {/* Full Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0 transition-colors"
            required
            disabled={isLoading}
          />
        </div>

        {/* Legal Consent Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Agreements</h3>
          
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
            <LegalConsentCheckbox
              type="terms"
              checked={formData.agreeTerms}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('terms', consented, timestamp)
              }
              disabled={isLoading}
              label="I agree to the Terms of Service"
            />

            <LegalConsentCheckbox
              type="privacy"
              checked={formData.agreePrivacy}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('privacy', consented, timestamp)
              }
              disabled={isLoading}
              label="I agree to the Privacy Policy"
            />

            <LegalConsentCheckbox
              type="disclaimer"
              checked={formData.agreeDisclaimer}
              onConsentChange={(consented, timestamp) => 
                handleConsentChange('disclaimer', consented, timestamp)
              }
              disabled={isLoading}
              label="I acknowledge the Legal Disclaimer"
            />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            All agreements are required to use our trust intermediary services. 
            We are not a bank or payment processor - we facilitate connections between users.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!allConsentsGiven || isLoading}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Helper Text */}
        <p className="text-xs text-gray-500 text-center">
          By creating an account, you confirm that you understand our role as a trust intermediary 
          and agree to all legal terms. All transactions require human confirmation.
        </p>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleFinalSubmit}
        title="Final Confirmation"
        message="Please confirm that you understand our platform acts as a trust intermediary only. We are not a bank, payment processor, or financial institution. All transactions require explicit human confirmation at every step."
        confirmText="I Understand & Continue"
        cancelText="Review Terms"
        type="warning"
      />
    </>
  );
}