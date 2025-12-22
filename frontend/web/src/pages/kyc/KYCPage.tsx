// ============================================
// 🔐 KYC Verification Page
// ============================================

import { useState } from 'react';

type KYCStep = 'intro' | 'personal' | 'document' | 'selfie' | 'review' | 'complete';
type DocumentType = 'id_card' | 'passport' | 'driving_license';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export function KYCPage() {
  const [step, setStep] = useState<KYCStep>('intro');
  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
  });
  const [documentImage, setDocumentImage] = useState<{ front?: string; back?: string }>({});
  const [selfieImage, setSelfieImage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected' | null>(null);

  const kycLevels = [
    { level: 1, name: 'Basic', limit: '$1,000/month', requirements: ['Email verification', 'Phone verification'] },
    { level: 2, name: 'Intermediate', limit: '$10,000/month', requirements: ['Personal information', 'ID document'] },
    { level: 3, name: 'Advanced', limit: 'Unlimited', requirements: ['Selfie verification', 'Proof of address'] },
  ];

  const documentTypes = [
    { id: 'id_card' as DocumentType, name: 'National ID Card', icon: '🪪', desc: 'Front and back required' },
    { id: 'passport' as DocumentType, name: 'Passport', icon: '📘', desc: 'Photo page only' },
    { id: 'driving_license' as DocumentType, name: 'Driving License', icon: '🚗', desc: 'Front and back required' },
  ];

  const handleFileUpload = (type: 'front' | 'back' | 'selfie', file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'selfie') {
        setSelfieImage(reader.result as string);
      } else {
        setDocumentImage(prev => ({ ...prev, [type]: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate KYC submission
    setTimeout(() => {
      setLoading(false);
      setVerificationStatus('pending');
      setStep('complete');
    }, 2000);
  };

  const steps = [
    { id: 'intro', label: 'Start' },
    { id: 'personal', label: 'Personal Info' },
    { id: 'document', label: 'ID Document' },
    { id: 'selfie', label: 'Selfie' },
    { id: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 Identity Verification</h1>
          <p className="text-gray-600">Complete KYC to unlock higher transaction limits</p>
        </div>

        {/* Progress */}
        {step !== 'complete' && (
          <div className="mb-12">
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
                    {i < currentStepIndex ? '✓' : i + 1}
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

        {/* Intro Step */}
        {step === 'intro' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">KYC Verification Levels</h2>
            <div className="space-y-4 mb-8">
              {kycLevels.map((level) => (
                <div key={level.level} className={`p-6 rounded-xl border-2 ${
                  level.level === 2 ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        level.level === 1 ? 'bg-gray-100 text-gray-600' :
                        level.level === 2 ? 'bg-pink-100 text-pink-600' :
                        'bg-indigo-100 text-indigo-600'
                      }`}>
                        Level {level.level}
                      </span>
                      <h3 className="text-xl font-bold mt-2">{level.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-gray-900">{level.limit}</span>
                      <p className="text-sm text-gray-500">Monthly limit</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {level.requirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-600">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep('personal')}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Verification
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              🔒 Your data is encrypted and securely stored
            </p>
          </div>
        )}

        {/* Personal Info Step */}
        {step === 'personal' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={personalInfo.dateOfBirth}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <select
                  value={personalInfo.nationality}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, nationality: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                >
                  <option value="">Select...</option>
                  <option value="EG">Egyptian</option>
                  <option value="SA">Saudi</option>
                  <option value="AE">Emirati</option>
                  <option value="US">American</option>
                  <option value="GB">British</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={personalInfo.address}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                  placeholder="123 Main Street, Apt 4B"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={personalInfo.city}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                  placeholder="Cairo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={personalInfo.country}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, country: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-0"
                >
                  <option value="">Select...</option>
                  <option value="EG">Egypt</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="AE">UAE</option>
                  <option value="US">USA</option>
                  <option value="GB">UK</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep('intro')}
                className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep('document')}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Document Step */}
        {step === 'document' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload ID Document</h2>
            <p className="text-gray-500 mb-6">Select and upload a valid government-issued ID</p>

            {/* Document Type Selection */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {documentTypes.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setDocumentType(doc.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    documentType === doc.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl block mb-2">{doc.icon}</span>
                  <span className="font-medium text-gray-900 block">{doc.name}</span>
                  <span className="text-xs text-gray-500">{doc.desc}</span>
                </button>
              ))}
            </div>

            {documentType && (
              <div className="space-y-4">
                {/* Front */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Front Side</label>
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    documentImage.front ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-pink-500'
                  }`}>
                    {documentImage.front ? (
                      <div className="relative">
                        <img src={documentImage.front} alt="Front" className="max-h-40 mx-auto rounded-lg" />
                        <button
                          onClick={() => setDocumentImage(prev => ({ ...prev, front: undefined }))}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <span className="text-4xl block mb-2">📤</span>
                        <span className="text-gray-600">Click to upload front side</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload('front', e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Back (not for passport) */}
                {documentType !== 'passport' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Back Side</label>
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      documentImage.back ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-pink-500'
                    }`}>
                      {documentImage.back ? (
                        <div className="relative">
                          <img src={documentImage.back} alt="Back" className="max-h-40 mx-auto rounded-lg" />
                          <button
                            onClick={() => setDocumentImage(prev => ({ ...prev, back: undefined }))}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <span className="text-4xl block mb-2">📤</span>
                          <span className="text-gray-600">Click to upload back side</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload('back', e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('personal')} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50">
                Back
              </button>
              <button
                onClick={() => setStep('selfie')}
                disabled={!documentImage.front || (documentType !== 'passport' && !documentImage.back)}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Selfie Step */}
        {step === 'selfie' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Take a Selfie</h2>
            <p className="text-gray-500 mb-6">Take a clear photo of your face holding your ID</p>

            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              selfieImage ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-pink-500'
            }`}>
              {selfieImage ? (
                <div className="relative inline-block">
                  <img src={selfieImage} alt="Selfie" className="max-h-64 mx-auto rounded-xl" />
                  <button
                    onClick={() => setSelfieImage('')}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <span className="text-6xl block mb-4">🤳</span>
                  <span className="text-lg text-gray-600 block mb-2">Take or upload a selfie</span>
                  <span className="text-sm text-gray-400">Hold your ID next to your face</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
                  />
                </label>
              )}
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 mt-6">
              <h4 className="font-semibold text-yellow-800 mb-2">📸 Tips for a good selfie:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Good lighting, no shadows on your face</li>
                <li>• Remove glasses and hats</li>
                <li>• Hold your ID clearly visible next to your face</li>
                <li>• Look directly at the camera</li>
              </ul>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('document')} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50">
                Back
              </button>
              <button
                onClick={() => setStep('review')}
                disabled={!selfieImage}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Information</h2>

            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Name:</span>
                  <span>{personalInfo.firstName} {personalInfo.lastName}</span>
                  <span className="text-gray-500">Date of Birth:</span>
                  <span>{personalInfo.dateOfBirth}</span>
                  <span className="text-gray-500">Address:</span>
                  <span>{personalInfo.address}, {personalInfo.city}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">Documents Uploaded</h3>
                <div className="flex gap-4">
                  {documentImage.front && <img src={documentImage.front} alt="Front" className="h-20 rounded-lg" />}
                  {documentImage.back && <img src={documentImage.back} alt="Back" className="h-20 rounded-lg" />}
                  {selfieImage && <img src={selfieImage} alt="Selfie" className="h-20 rounded-lg" />}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mt-6">
              <p className="text-sm text-blue-700">
                ℹ️ By submitting, you confirm that all information is accurate. Verification usually takes 24-48 hours.
              </p>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('selfie')} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your documents are being reviewed. We'll notify you once the verification is complete.
            </p>
            <div className="bg-yellow-50 rounded-xl p-4 text-left mb-6">
              <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                <span>⏳</span>
                Status: Under Review
              </div>
              <p className="text-sm text-yellow-700">
                Estimated processing time: 24-48 hours
              </p>
            </div>
            <a
              href="/dashboard"
              className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl"
            >
              Return to Dashboard
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default KYCPage;
