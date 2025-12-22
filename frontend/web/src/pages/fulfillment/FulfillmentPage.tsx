// ============================================
// 📦 Fulfillment by Mnbara (FBM) Page
// ============================================

import { useState } from 'react';
import ShippingCalculator from '../../components/calculator/ShippingCalculator';

type FBMTab = 'overview' | 'pricing' | 'how-it-works' | 'enroll';

export function FulfillmentPage() {
  const [activeTab, setActiveTab] = useState<FBMTab>('overview');
  const [enrollStep, setEnrollStep] = useState(1);

  const features = [
    { icon: '🛡️', title: 'Anonymous Delivery', desc: 'Buyer never sees traveler identity' },
    { icon: '📦', title: 'Secure Handling', desc: 'Professional packaging & handling' },
    { icon: '📍', title: 'Live Tracking', desc: 'Real-time location updates' },
    { icon: '💰', title: 'Insured Shipments', desc: 'Full coverage up to $10,000' },
    { icon: '🔄', title: 'Easy Returns', desc: 'Hassle-free return processing' },
    { icon: '⚡', title: 'Fast Delivery', desc: '2-5 days express shipping' },
  ];

  const pricing = [
    { weight: '0-1 kg', standard: 15, express: 25, anonymous: 35 },
    { weight: '1-5 kg', standard: 25, express: 40, anonymous: 55 },
    { weight: '5-10 kg', standard: 40, express: 65, anonymous: 85 },
    { weight: '10-20 kg', standard: 60, express: 95, anonymous: 120 },
  ];

  const howItWorks = [
    { step: 1, title: 'Create Shipment', desc: 'Enter package details and select delivery options', icon: '📋' },
    { step: 2, title: 'Drop Off or Pickup', desc: 'Drop at nearest FBM center or schedule pickup', icon: '📦' },
    { step: 3, title: 'We Handle Everything', desc: 'Packaging, labeling, and carrier assignment', icon: '🏭' },
    { step: 4, title: 'Live Tracking', desc: 'Track your package in real-time', icon: '📍' },
    { step: 5, title: 'Delivery', desc: 'Safe delivery with proof of receipt', icon: '✅' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-bold mb-4">
            NEW
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Fulfillment by Mnbara
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Let us handle your shipping. Secure, anonymous, and hassle-free delivery worldwide.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('enroll')}
              className="px-8 py-4 bg-white text-indigo-600 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Get Started
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className="px-8 py-4 border-2 border-white text-white text-lg font-bold rounded-xl hover:bg-white/10 transition-all"
            >
              View Pricing
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'pricing', label: 'Pricing' },
              { id: 'how-it-works', label: 'How It Works' },
              { id: 'enroll', label: 'Enroll Now' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FBMTab)}
                className={`py-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Features Grid */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                Why Choose FBM?
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <span className="text-4xl mb-4 block">{feature.icon}</span>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Anonymous Delivery Highlight */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-6xl mb-4 block">🛡️</span>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Anonymous Delivery
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Perfect for travelers who want privacy. Buyers receive their package without knowing the traveler's identity. All communications go through Mnbara.
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Traveler identity hidden from buyer',
                      'All communications through Mnbara',
                      'Protected contact information',
                      'Professional Mnbara branding on package',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="text-center text-gray-500 mb-4">Package Label Preview</div>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📦</div>
                      <div className="font-bold text-lg">MNBARA FULFILLMENT</div>
                      <div className="text-sm text-gray-500 mb-4">Tracking: FBM-XXXX-XXXX</div>
                      <div className="border-t pt-4">
                        <div className="text-sm text-gray-500">From:</div>
                        <div className="font-semibold">Mnbara Logistics</div>
                        <div className="text-sm text-gray-500 mt-2">To:</div>
                        <div className="font-semibold">Customer Name</div>
                        <div className="text-sm text-gray-600">Customer Address</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={() => setActiveTab('enroll')}
                className="px-12 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Start Using FBM Today 🚀
              </button>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              Simple, Transparent Pricing
            </h2>
            
            {/* Calculator Section */}
            <div className="mb-12">
               <ShippingCalculator />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-gray-900">Package Weight</th>
                    <th className="px-6 py-4 text-center font-bold text-gray-900">
                      <div>Standard</div>
                      <div className="text-sm font-normal text-gray-500">5-7 days</div>
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-gray-900">
                      <div>Express</div>
                      <div className="text-sm font-normal text-gray-500">2-3 days</div>
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-gray-900 bg-indigo-50">
                      <div className="flex items-center justify-center gap-2">
                        Anonymous
                        <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">NEW</span>
                      </div>
                      <div className="text-sm font-normal text-gray-500">2-3 days</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pricing.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.weight}</td>
                      <td className="px-6 py-4 text-center text-gray-700">${row.standard}</td>
                      <td className="px-6 py-4 text-center text-gray-700">${row.express}</td>
                      <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50">${row.anonymous}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-gray-500">
              * Prices shown are for standard routes. Remote areas may have additional charges.
            </p>
          </div>
        )}

        {/* How It Works Tab */}
        {activeTab === 'how-it-works' && (
          <div className="space-y-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              How FBM Works
            </h2>
            <div className="relative">
              {/* Timeline Line */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500" />
              
              <div className="space-y-8">
                {howItWorks.map((item, i) => (
                  <div key={i} className={`flex items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 inline-block">
                        <span className="text-4xl mb-3 block">{item.icon}</span>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                    <div className="hidden md:flex w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold items-center justify-center z-10">
                      {item.step}
                    </div>
                    <div className="flex-1 hidden md:block" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enroll Tab */}
        {activeTab === 'enroll' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Enroll in FBM</h2>
                <div className="text-sm text-gray-500">Step {enrollStep} of 3</div>
              </div>

              {enrollStep === 1 && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Choose Your Role</h3>
                  <div className="grid gap-4">
                    {[
                      { id: 'seller', icon: '🏪', title: 'I\'m a Seller', desc: 'Use FBM for my store shipments' },
                      { id: 'traveler', icon: '✈️', title: 'I\'m a Traveler', desc: 'Deliver anonymously through FBM' },
                    ].map((role) => (
                      <button
                        key={role.id}
                        className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                      >
                        <span className="text-4xl">{role.icon}</span>
                        <div>
                          <div className="font-bold text-gray-900">{role.title}</div>
                          <div className="text-sm text-gray-600">{role.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setEnrollStep(2)}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl"
                  >
                    Continue
                  </button>
                </div>
              )}

              {enrollStep === 2 && (
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg">Business Information</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Business / Store Name"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Pickup Address"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setEnrollStep(1)}
                      className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-bold"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setEnrollStep(3)}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {enrollStep === 3 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-5xl">✅</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">You're Enrolled!</h3>
                  <p className="text-gray-600 mb-8">
                    Welcome to Fulfillment by Mnbara. Start creating shipments right away.
                  </p>
                  <button className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl">
                    Create First Shipment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FulfillmentPage;
