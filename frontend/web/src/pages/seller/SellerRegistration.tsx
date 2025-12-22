// ============================================
// 🏪 Seller Store Registration Page
// ============================================

import { useState } from 'react';

type RegistrationStep = 'intro' | 'business' | 'store' | 'verification' | 'complete';

export function SellerRegistrationPage() {
  const [step, setStep] = useState<RegistrationStep>('intro');
  const [form, setForm] = useState({
    // Business Info
    businessName: '',
    businessType: '',
    registrationNumber: '',
    taxId: '',
    // Contact
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    // Store
    storeName: '',
    storeSlug: '',
    category: '',
    description: '',
    returnPolicy: '',
    // Terms
    acceptTerms: false,
    acceptFees: false,
  });

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0,
      features: ['Up to 50 products', '5% commission', 'Basic analytics', 'Email support'],
      recommended: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      features: ['Unlimited products', '3% commission', 'Advanced analytics', 'Priority support', 'Featured listings', 'Custom store URL'],
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      features: ['Everything in Pro', '2% commission', 'API access', 'Dedicated manager', 'Custom branding', 'Bulk import'],
      recommended: false,
    },
  ];

  const [selectedPlan, setSelectedPlan] = useState('pro');

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
    'Beauty', 'Automotive', 'Toys', 'Food & Beverages', 'Other',
  ];

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero */}
      {step === 'intro' && (
        <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-500 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="text-6xl mb-6 block">🏪</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Open Your Store on Mnbara</h1>
            <p className="text-xl text-white/80 mb-8">
              Reach millions of customers. Start selling today with zero upfront costs.
            </p>
            <button
              onClick={() => setStep('business')}
              className="px-8 py-4 bg-white text-green-600 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Start Selling →
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Intro Content */}
        {step === 'intro' && (
          <div className="space-y-12">
            {/* Plans */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Choose Your Plan</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer ${
                      selectedPlan === plan.id
                        ? 'border-green-500 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${plan.recommended ? 'ring-2 ring-green-200' : ''}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.recommended && (
                      <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                        RECOMMENDED
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="my-4">
                      <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-green-500">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-green-500">50K+</div>
                <div className="text-gray-600">Active Sellers</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-green-500">$2M+</div>
                <div className="text-gray-600">Monthly Sales</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-green-500">150+</div>
                <div className="text-gray-600">Countries</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-3xl font-bold text-green-500">24/7</div>
                <div className="text-gray-600">Support</div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={() => setStep('business')}
                className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Create My Store 🚀
              </button>
            </div>
          </div>
        )}

        {/* Business Info Step */}
        {step === 'business' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  value={form.businessType}
                  onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                >
                  <option value="">Select...</option>
                  <option value="individual">Individual / Sole Proprietor</option>
                  <option value="company">Company / LLC</option>
                  <option value="partnership">Partnership</option>
                  <option value="nonprofit">Non-Profit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number (Optional)</label>
                <input
                  type="text"
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                  placeholder="Company Registration #"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                  placeholder="business@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                  placeholder="+20 100 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                >
                  <option value="">Select...</option>
                  <option value="EG">Egypt</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="AE">UAE</option>
                  <option value="US">USA</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('intro')} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold">
                Back
              </button>
              <button onClick={() => setStep('store')} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Store Setup Step */}
        {step === 'store' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Setup Your Store</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      storeName: e.target.value,
                      storeSlug: generateSlug(e.target.value),
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                  placeholder="My Awesome Store"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
                <div className="flex items-center">
                  <span className="px-4 py-3 bg-gray-100 border-2 border-r-0 border-gray-200 rounded-l-xl text-gray-500">
                    mnbara.com/store/
                  </span>
                  <input
                    type="text"
                    value={form.storeSlug}
                    onChange={(e) => setForm({ ...form, storeSlug: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-r-xl focus:border-green-500"
                    placeholder="my-store"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 resize-none"
                  rows={3}
                  placeholder="Tell customers about your store..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer">
                  <div className="text-4xl mb-2">📸</div>
                  <div className="text-gray-600">Upload your logo</div>
                  <div className="text-sm text-gray-400">Recommended: 500x500px</div>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('business')} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold">
                Back
              </button>
              <button onClick={() => setStep('verification')} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Verification Step */}
        {step === 'verification' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Steps</h2>
            
            {/* Selected Plan Summary */}
            <div className="bg-green-50 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">
                    {plans.find(p => p.id === selectedPlan)?.name} Plan
                  </div>
                  <div className="text-sm text-gray-600">
                    ${plans.find(p => p.id === selectedPlan)?.price}/month
                  </div>
                </div>
                <button onClick={() => setStep('intro')} className="text-green-600 font-medium hover:underline">
                  Change Plan
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-green-500"
                />
                <label htmlFor="acceptTerms" className="text-gray-700">
                  I agree to the <a href="#" className="text-green-600 hover:underline">Seller Terms</a>,{' '}
                  <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>, and{' '}
                  <a href="#" className="text-green-600 hover:underline">Community Guidelines</a>
                </label>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="acceptFees"
                  checked={form.acceptFees}
                  onChange={(e) => setForm({ ...form, acceptFees: e.target.checked })}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-green-500"
                />
                <label htmlFor="acceptFees" className="text-gray-700">
                  I understand and accept the{' '}
                  <span className="font-semibold">
                    {selectedPlan === 'basic' ? '5%' : selectedPlan === 'pro' ? '3%' : '2%'}
                  </span>{' '}
                  commission on each sale
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep('store')} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold">
                Back
              </button>
              <button
                onClick={() => setStep('complete')}
                disabled={!form.acceptTerms || !form.acceptFees}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl disabled:opacity-50"
              >
                Create Store
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🎉</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Store is Live!</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Congratulations! Your store is now ready. Start adding products and reach customers worldwide.
            </p>
            <div className="bg-gray-100 rounded-xl p-4 max-w-sm mx-auto mb-8">
              <div className="text-sm text-gray-600 mb-1">Your store URL:</div>
              <div className="font-mono font-bold text-green-600">
                mnbara.com/store/{form.storeSlug || 'my-store'}
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <a
                href="/seller"
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl"
              >
                Go to Dashboard
              </a>
              <a
                href="/seller/products/new"
                className="px-8 py-3 border-2 border-green-500 text-green-600 font-bold rounded-xl"
              >
                Add First Product
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerRegistrationPage;
