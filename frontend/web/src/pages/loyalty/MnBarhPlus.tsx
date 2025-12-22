import { useCurrency } from '../../context/CurrencyContext';

export default function MnBarhPlus() {
  const { formatPrice } = useCurrency();

  return (
    <div className="min-h-screen bg-white font-sans">
      
      {/* Hero */}
      <div className="bg-slate-900 text-white pt-20 pb-24 px-4 text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
              <span className="inline-block py-1 px-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold text-xs uppercase tracking-widest mb-4">
                  Introducing
              </span>
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
                  MnBarh <span className="text-yellow-400 italic">PLUS</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  The ultimate membership for global shoppers. Zero fees. Priority delivery. Exclusive deals.
              </p>
              <button className="bg-yellow-400 text-black font-bold text-lg px-10 py-4 rounded-full hover:bg-yellow-300 transition-transform hover:scale-105 shadow-xl shadow-yellow-400/20">
                  Start Your 30-Day Free Trial
              </button>
              <p className="mt-4 text-sm text-gray-400">Then {formatPrice(9.99)}/month. Cancel anytime.</p>
          </div>
      </div>

      {/* Benefits Grid */}
      <div className="max-w-7xl mx-auto px-4 py-20 -mt-20">
          <div className="grid md:grid-cols-3 gap-8">
              {[
                  { title: 'Zero Traveler Fees', desc: 'Save average $25 per order on traveler rewards.', icon: '💸' },
                  { title: 'Priority Matching', desc: 'Get matched with travelers 2x faster.', icon: '⚡' },
                  { title: 'Exclusive Drops', desc: 'Access to Daily Deals 30 mins before everyone else.', icon: '🔓' },
              ].map((benefit, i) => (
                  <div key={i} className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center hover:-translate-y-2 transition-transform">
                      <div className="w-20 h-20 mx-auto bg-slate-50 rounded-full flex items-center justify-center text-5xl mb-6">
                          {benefit.icon}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                      <p className="text-gray-500">{benefit.desc}</p>
                  </div>
              ))}
          </div>
      </div>

      {/* Savings Calculator (Mock) */}
      <div className="bg-slate-50 py-20 px-4">
          <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">See how much you could save</h2>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-left">
                      <div className="text-sm font-bold text-gray-500 uppercase mb-1">If you order</div>
                      <div className="text-3xl font-bold text-slate-900">2 items / month</div>
                  </div>
                  <div className="text-4xl">➡️</div>
                  <div className="text-left">
                      <div className="text-sm font-bold text-gray-500 uppercase mb-1">You save</div>
                      <div className="text-5xl font-bold text-green-600">{formatPrice(480)}<span className="text-lg text-gray-400">/year</span></div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
