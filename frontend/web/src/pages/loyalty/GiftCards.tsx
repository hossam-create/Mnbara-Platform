import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';

export default function GiftCards() {
  const { formatPrice } = useCurrency();
  const [amount, setAmount] = useState(50);
  const [design, setDesign] = useState(0);

  const designs = [
      { id: 0, name: 'Classic', bg: 'bg-slate-900' },
      { id: 1, name: 'Birthday', bg: 'bg-gradient-to-r from-pink-500 to-purple-500' },
      { id: 2, name: 'Thank You', bg: 'bg-gradient-to-r from-green-400 to-cyan-500' },
      { id: 3, name: 'Love', bg: 'bg-gradient-to-r from-red-500 to-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            
            {/* Preview Section */}
            <div className="sticky top-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-2">Send a Gift Card</h1>
                <p className="text-gray-500 mb-8">The perfect gift for the global shopper.</p>
                
                <div className={`aspect-video rounded-3xl shadow-2xl p-8 flex flex-col justify-between text-white transition-all duration-500 ${designs[design].bg} relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 p-8 opacity-20 text-9xl font-black">🎁</div>
                    <div className="relative z-10 flex justify-between items-start">
                        <span className="font-bold text-2xl tracking-widest">MnBarh</span>
                        <span className="font-mono text-xl opacity-80">$ {amount}</span>
                    </div>
                    <div className="relative z-10 mt-auto">
                        <div className="text-sm opacity-75 uppercase tracking-wider mb-1">To someone special</div>
                        <div className="h-4 w-32 bg-white/30 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Customization Form */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                
                {/* Design Selector */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-3">1. Choose a Design</label>
                    <div className="grid grid-cols-4 gap-3">
                        {designs.map((d, i) => (
                            <button 
                                key={d.id}
                                onClick={() => setDesign(i)}
                                className={`aspect-video rounded-lg ${d.bg} ${design === i ? 'ring-4 ring-offset-2 ring-slate-900' : 'opacity-70 hover:opacity-100'} transition-all`}
                            ></button>
                        ))}
                    </div>
                </div>

                {/* Amount Selector */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-3">2. Select Amount</label>
                    <div className="flex flex-wrap gap-3">
                        {[25, 50, 100, 200, 500].map((val) => (
                            <button 
                                key={val}
                                onClick={() => setAmount(val)}
                                className={`px-6 py-3 rounded-lg font-bold border-2 transition-colors ${amount === val ? 'border-slate-900 bg-slate-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                            >
                                ${val}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Delivery */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-3">3. Delivery Details</label>
                    <div className="space-y-4">
                        <input className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-slate-900 outline-none" placeholder="Recipient's Email" />
                        <textarea className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-slate-900 outline-none" rows={3} placeholder="Add a personal message..." />
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-500 font-medium">Total to pay</span>
                        <span className="text-3xl font-bold text-slate-900">{formatPrice(amount)}</span>
                    </div>
                    <button className="w-full btn-primary py-4 text-lg">
                        Proceed to Checkout
                    </button>
                </div>

            </div>
        </div>
    </div>
  );
}
