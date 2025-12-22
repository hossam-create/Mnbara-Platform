// ============================================
// ✈️ Traveler Registration Page
// ============================================

import { useState } from 'react';

type RegistrationStep = 'intro' | 'personal' | 'travel' | 'verification' | 'complete';

export function TravelerRegistrationPage() {
  const [step, setStep] = useState<RegistrationStep>('intro');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
    languages: [] as string[],
    bio: '',
    travelFrequency: '',
    preferredRoutes: '',
    hasVehicle: false,
    vehicleType: '',
    acceptTerms: false,
  });

  const benefits = [
    { icon: '💰', title: 'Earn Extra Income', desc: 'Make money while you travel' },
    { icon: '🌍', title: 'Travel the World', desc: 'Get paid to visit new places' },
    { icon: '⏰', title: 'Flexible Schedule', desc: 'Work when you want' },
    { icon: '🛡️', title: 'Full Insurance', desc: 'Protected on every delivery' },
    { icon: '📱', title: 'Easy App', desc: 'Manage everything from your phone' },
    { icon: '⭐', title: 'Build Reputation', desc: 'Earn badges and reviews' },
  ];

  const requirements = [
    { icon: '📄', text: 'Valid passport (6+ months validity)' },
    { icon: '🪪', text: 'Government-issued ID' },
    { icon: '📸', text: 'Clear profile photo' },
    { icon: '📍', text: 'Proof of address' },
    { icon: '✅', text: 'Background check consent' },
  ];

  const languages = ['Arabic', 'English', 'French', 'Spanish', 'German', 'Chinese', 'Hindi', 'Turkish'];

  const toggleLanguage = (lang: string) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero Section */}
      {step === 'intro' && (
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="text-6xl mb-6 block">✈️</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Become a Mnbara Traveler</h1>
            <p className="text-xl text-white/80 mb-8">
              Turn your travels into earnings. Deliver packages while you explore the world.
            </p>
            <button
              onClick={() => setStep('personal')}
              className="px-8 py-4 bg-white text-indigo-600 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Registration →
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Intro Content */}
        {step === 'intro' && (
          <div className="space-y-12">
            {/* Benefits */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Become a Traveler?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {benefits.map((benefit, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                    <span className="text-4xl mb-4 block">{benefit.icon}</span>
                    <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Requirements</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-2xl">{req.icon}</span>
                    <span className="text-gray-700">{req.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={() => setStep('personal')}
                className="px-12 py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Apply Now - It's Free! 🚀
              </button>
              <p className="text-gray-500 mt-4">Takes only 5 minutes to complete</p>
            </div>
          </div>
        )}

        {/* Personal Info Step */}
        {step === 'personal' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (as on passport)</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                  placeholder="+20 100 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <select
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                >
                  <option value="">Select...</option>
                  <option value="EG">Egyptian</option>
                  <option value="SA">Saudi</option>
                  <option value="AE">Emirati</option>
                  <option value="US">American</option>
                  <option value="GB">British</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                <input
                  type="text"
                  value={form.passportNumber}
                  onChange={(e) => setForm({ ...form, passportNumber: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                  placeholder="A12345678"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        form.languages.includes(lang)
                          ? 'border-pink-500 bg-pink-50 text-pink-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('intro')} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold">
                Back
              </button>
              <button onClick={() => setStep('travel')} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Travel Info Step */}
        {step === 'travel' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Travel Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How often do you travel?</label>
                <select
                  value={form.travelFrequency}
                  onChange={(e) => setForm({ ...form, travelFrequency: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500"
                >
                  <option value="">Select...</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="occasionally">Occasionally</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Routes (countries/cities)</label>
                <textarea
                  value={form.preferredRoutes}
                  onChange={(e) => setForm({ ...form, preferredRoutes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 resize-none"
                  rows={3}
                  placeholder="e.g., Egypt ↔ UAE, Cairo → London, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tell us about yourself</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 resize-none"
                  rows={3}
                  placeholder="Why do you want to become a traveler?"
                />
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="hasVehicle"
                  checked={form.hasVehicle}
                  onChange={(e) => setForm({ ...form, hasVehicle: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                />
                <label htmlFor="hasVehicle" className="text-gray-700">I have my own vehicle for local deliveries</label>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('personal')} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold">
                Back
              </button>
              <button onClick={() => setStep('verification')} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Verification Step */}
        {step === 'verification' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Documents</h2>
            <div className="space-y-4">
              {['Passport Photo Page', 'Government ID (Front)', 'Government ID (Back)', 'Profile Photo', 'Proof of Address'].map((doc, i) => (
                <div key={i} className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-pink-500 transition-colors cursor-pointer">
                  <div className="text-3xl mb-2">📤</div>
                  <div className="font-medium text-gray-700">{doc}</div>
                  <div className="text-sm text-gray-500">Click to upload or drag and drop</div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="font-semibold text-yellow-800">Background Check Required</div>
                  <p className="text-sm text-yellow-700">By continuing, you consent to a background verification check.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={form.acceptTerms}
                onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
              />
              <label htmlFor="acceptTerms" className="text-gray-700">
                I agree to the <a href="#" className="text-pink-500 hover:underline">Terms of Service</a> and{' '}
                <a href="#" className="text-pink-500 hover:underline">Traveler Agreement</a>
              </label>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('travel')} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold">
                Back
              </button>
              <button
                onClick={() => setStep('complete')}
                disabled={!form.acceptTerms}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl disabled:opacity-50"
              >
                Submit Application
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">✈️</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Thank you for applying to become a Mnbara Traveler. We'll review your application and get back to you within 24-48 hours.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 max-w-sm mx-auto mb-8">
              <div className="font-semibold text-blue-800 mb-1">📧 Check your email</div>
              <p className="text-sm text-blue-600">We've sent a confirmation to {form.email || 'your email'}</p>
            </div>
            <a
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl"
            >
              Return to Home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default TravelerRegistrationPage;
