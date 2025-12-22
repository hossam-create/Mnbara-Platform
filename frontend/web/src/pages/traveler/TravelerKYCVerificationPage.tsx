import { useState } from 'react';
import { useRouter } from 'next/router';

type KYCStep = 'personal' | 'contact' | 'travel' | 'address' | 'legal' | 'complete';

type PersonalInfo = {
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  passportPhoto: File | null;
  biometricSelfie: File | null;
};

type ContactInfo = {
  email: string;
  localPhone: string;
  foreignPhone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

type TravelInfo = {
  fromCountry: string;
  toCountry: string;
  fromCity: string;
  toCity: string;
  departureDate: string;
  returnDate: string;
  flightTicket: File | null;
  boardingPass: File | null;
};

type AddressInfo = {
  permanentAddress: string;
  city: string;
  postalCode: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  emergencyContactCountry: string;
};

type LegalInfo = {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingAccepted: boolean;
  digitalSignature: string;
};

export function TravelerKYCVerificationPage() {
  const [step, setStep] = useState<KYCStep>('personal');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected' | null>(null);
  const router = useRouter();

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    nationality: '',
    dateOfBirth: '',
    gender: '',
    passportPhoto: null,
    biometricSelfie: null,
  });

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    localPhone: '',
    foreignPhone: '',
    emailVerified: false,
    phoneVerified: false,
  });

  const [travelInfo, setTravelInfo] = useState<TravelInfo>({
    fromCountry: '',
    toCountry: '',
    fromCity: '',
    toCity: '',
    departureDate: '',
    returnDate: '',
    flightTicket: null,
    boardingPass: null,
  });

  const [addressInfo, setAddressInfo] = useState<AddressInfo>({
    permanentAddress: '',
    city: '',
    postalCode: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    emergencyContactCountry: '',
  });

  const [legalInfo, setLegalInfo] = useState<LegalInfo>({
    termsAccepted: false,
    privacyAccepted: false,
    dataProcessingAccepted: false,
    digitalSignature: '',
  });

  const steps = [
    { id: 'personal', label: 'Personal Identity', number: 1 },
    { id: 'contact', label: 'Contact Details', number: 2 },
    { id: 'travel', label: 'Travel Details', number: 3 },
    { id: 'address', label: 'Address & Emergency', number: 4 },
    { id: 'legal', label: 'Legal Agreement', number: 5 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  const handleFileUpload = (field: keyof PersonalInfo | keyof TravelInfo, file: File) => {
    if (field === 'passportPhoto' || field === 'biometricSelfie') {
      setPersonalInfo(prev => ({ ...prev, [field]: file }));
    } else if (field === 'flightTicket' || field === 'boardingPass') {
      setTravelInfo(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      Object.entries(personalInfo).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== null) {
          formData.append(key, value.toString());
        }
      });

      Object.entries(contactInfo).forEach(([key, value]) => {
        if (value !== null) {
          formData.append(key, value.toString());
        }
      });

      Object.entries(travelInfo).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== null) {
          formData.append(key, value.toString());
        }
      });

      Object.entries(addressInfo).forEach(([key, value]) => {
        if (value !== null) {
          formData.append(key, value.toString());
        }
      });

      Object.entries(legalInfo).forEach(([key, value]) => {
        if (value !== null) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch('/api/traveler/kyc/submit', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setVerificationStatus('pending');
        setStep('complete');
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('KYC submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'personal':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Personal Identity Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nationality</label>
                <select
                  value={personalInfo.nationality}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, nationality: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select Nationality</option>
                  <option value="EG">Egypt</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={personalInfo.dateOfBirth}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Gender</label>
                <select
                  value={personalInfo.gender}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Passport Photo Page</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('passportPhoto', e.target.files?.[0]!)}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Live Biometric Selfie</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('biometricSelfie', e.target.files?.[0]!)}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Contact Information</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                required
              />
              {!contactInfo.emailVerified && (
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                  onClick={() => setContactInfo(prev => ({ ...prev, emailVerified: true }))}
                >
                  Verify Email
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Local Phone Number</label>
              <input
                type="tel"
                value={contactInfo.localPhone}
                onChange={(e) => setContactInfo(prev => ({ ...prev, localPhone: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                required
              />
              {!contactInfo.phoneVerified && (
                <button
                  type="button"
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
                  onClick={() => setContactInfo(prev => ({ ...prev, phoneVerified: true }))}
                >
                  Verify Phone
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Foreign Phone Number (Optional)</label>
              <input
                type="tel"
                value={contactInfo.foreignPhone}
                onChange={(e) => setContactInfo(prev => ({ ...prev, foreignPhone: e.target.value }))}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>
        );

      case 'travel':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Travel Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">From Country</label>
                <select
                  value={travelInfo.fromCountry}
                  onChange={(e) => setTravelInfo(prev => ({ ...prev, fromCountry: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select Country</option>
                  <option value="EG">Egypt</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To Country</label>
                <select
                  value={travelInfo.toCountry}
                  onChange={(e) => setTravelInfo(prev => ({ ...prev, toCountry: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AE">UAE</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">From City</label>
                <input
                  type="text"
                  value={travelInfo.fromCity}
                  onChange={(e) => setTravelInfo(prev => ({ ...prev, fromCity: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To City</label>
                <input
                  type="text"
                  value={travelInfo.toCity}
                  onChange={(e) => setTravelInfo(prev => ({ ...prev, toCity: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Departure Date</label>
                <input
                  type="date"
                  value={travelInfo.departureDate}
                  onChange={(e) => setTravelInfo(prev => ({ ...prev, departureDate: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Return Date</label>
                <input
                  type="date"
                  value={travelInfo.returnDate}
                  onChange={(e) => setTravelInfo(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Flight Ticket</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('flightTicket', e.target.files?.[0]!)}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Boarding Pass (Required before execution)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload('boardingPass', e.target.files?.[0]!)}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
          </div>
        );

      case 'address':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Address & Emergency Contact</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Permanent Address (Egypt)</label>
              <textarea
                value={addressInfo.permanentAddress}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, permanentAddress: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  value={addressInfo.city}
                  onChange={(e) => setAddressInfo(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code</label>
                <input
                  type="text"
                  value={addressInfo.postalCode}
                  onChange={(e) => setAddressInfo(prev => ({ ...prev, postalCode: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold mb-4">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={addressInfo.emergencyContactName}
                    onChange={(e) => setAddressInfo(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Relationship</label>
                  <input
                    type="text"
                    value={addressInfo.emergencyContactRelation}
                    onChange={(e) => setAddressInfo(prev => ({ ...prev, emergencyContactRelation: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={addressInfo.emergencyContactPhone}
                    onChange={(e) => setAddressInfo(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <select
                    value={addressInfo.emergencyContactCountry}
                    onChange={(e) => setAddressInfo(prev => ({ ...prev, emergencyContactCountry: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="EG">Egypt</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'legal':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Legal Agreement</h3>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={legalInfo.termsAccepted}
                  onChange={(e) => setLegalInfo(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                  className="w-5 h-5"
                  required
                />
                <span>I accept the Terms of Service</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={legalInfo.privacyAccepted}
                  onChange={(e) => setLegalInfo(prev => ({ ...prev, privacyAccepted: e.target.checked }))}
                  className="w-5 h-5"
                  required
                />
                <span>I accept the Privacy Policy</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={legalInfo.dataProcessingAccepted}
                  onChange={(e) => setLegalInfo(prev => ({ ...prev, dataProcessingAccepted: e.target.checked }))}
                  className="w-5 h-5"
                  required
                />
                <span>I consent to data processing for verification purposes</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Digital Signature (Type your full name)</label>
              <input
                type="text"
                value={legalInfo.digitalSignature}
                onChange={(e) => setLegalInfo(prev => ({ ...prev, digitalSignature: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                By submitting this form, you confirm that all information provided is accurate and complete. 
                Any false information may result in account suspension and legal action.
              </p>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-xl font-semibold">KYC Verification Submitted</h3>
            <p className="text-gray-600">
              Your verification is under review. You will receive a notification once 
              your KYC status is updated. This usually takes 1-2 business days.
            </p>
            <button
              onClick={() => router.push('/traveler/dashboard')}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg"
            >
              Return to Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'personal':
        return (
          personalInfo.firstName &&
          personalInfo.lastName &&
          personalInfo.nationality &&
          personalInfo.dateOfBirth &&
          personalInfo.gender &&
          personalInfo.passportPhoto &&
          personalInfo.biometricSelfie
        );
      case 'contact':
        return contactInfo.email && contactInfo.localPhone && contactInfo.emailVerified && contactInfo.phoneVerified;
      case 'travel':
        return (
          travelInfo.fromCountry &&
          travelInfo.toCountry &&
          travelInfo.fromCity &&
          travelInfo.toCity &&
          travelInfo.departureDate &&
          travelInfo.flightTicket
        );
      case 'address':
        return (
          addressInfo.permanentAddress &&
          addressInfo.city &&
          addressInfo.postalCode &&
          addressInfo.emergencyContactName &&
          addressInfo.emergencyContactRelation &&
          addressInfo.emergencyContactPhone &&
          addressInfo.emergencyContactCountry
        );
      case 'legal':
        return (
          legalInfo.termsAccepted &&
          legalInfo.privacyAccepted &&
          legalInfo.dataProcessingAccepted &&
          legalInfo.digitalSignature
        );
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 Traveler KYC Verification</h1>
            <p className="text-gray-600">Complete full verification to unlock traveler capabilities</p>
          </div>

          {step !== 'complete' && (
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      i < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : i === currentStepIndex
                        ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {i < currentStepIndex ? '✓' : s.number}
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-16 sm:w-24 h-1 mx-2 ${
                        i < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {steps.map((s) => (
                  <span key={s.id} className="text-xs text-gray-500 text-center w-20">{s.label}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            {renderStep()}
          </div>

          {step !== 'complete' && (
            <div className="flex justify-between">
              <button
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === step);
                  if (currentIndex > 0) {
                    setStep(steps[currentIndex - 1].id as KYCStep);
                  }
                }}
                disabled={step === 'personal'}
                className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>

              {step === 'legal' ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || loading}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Verification'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const currentIndex = steps.findIndex(s => s.id === step);
                    if (currentIndex < steps.length - 1) {
                      setStep(steps[currentIndex + 1].id as KYCStep);
                    }
                  }}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}