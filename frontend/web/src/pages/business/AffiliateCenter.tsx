import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';

export default function AffiliateCenter() {
  const { formatPrice } = useCurrency();
  const [generatedLink, setGeneratedLink] = useState('');
  const [productUrl, setProductUrl] = useState('');

  const handleGenerate = () => {
    if (!productUrl) return;
    // Mock generation logic
    setGeneratedLink(`${productUrl}?ref=mn_partner_123`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">MnBarh <span className="text-pink-500">Associates</span></h1>
            <p className="text-xl text-indigo-100 mb-8">
              Recommend products. Earn up to <span className="font-bold text-white">10% commissions</span>.
              Turn your traffic into income today.
            </p>
            <div className="flex gap-4">
                <button className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105">
                    Start Earning
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold backdrop-blur-sm">
                    View Commission Rates
                </button>
            </div>
          </div>
          <div className="md:w-1/3 bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20">
            {/* Live Earnings Mock */}
            <div className="text-sm font-bold opacity-70 mb-2">THIS MONTH'S EARNINGS</div>
            <div className="text-4xl font-bold mb-4">{formatPrice(1250.50)}</div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 w-3/4"></div>
            </div>
            <div className="mt-2 text-xs opacity-70 flex justify-between">
                <span>Next Payout: Oct 25</span>
                <span>Threshold: 80%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8">
        
        {/* Tools Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
            
            {/* Link Generator */}
            <div className="col-span-2 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🔗</span> Link Generator
                </h3>
                <div className="flex flex-col gap-4">
                    <input 
                        type="text" 
                        placeholder="Paste product URL (e.g. mnbarh.com/product/iphone)" 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                    />
                    <div className="flex gap-4">
                        <button 
                            onClick={handleGenerate}
                            className="btn-primary px-8 py-3 whitespace-nowrap"
                        >
                            Get Link
                        </button>
                        {generatedLink && (
                            <div className="flex-1 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
                                <span className="truncate text-sm font-mono">{generatedLink}</span>
                                <button className="text-green-600 font-bold text-xs uppercase hover:underline">Copy</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Performance</h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Clicks</span>
                        <span className="font-bold text-lg">1,245</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Orders</span>
                        <span className="font-bold text-lg">84</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Conversion</span>
                        <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">6.7%</span>
                    </div>
                </div>
            </div>

        </div>

        {/* Marketing Assets */}
        <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Marketing Assets</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="group relative aspect-video bg-gray-200 rounded-xl overflow-hidden cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-center p-4">
                            banner_ad_{i}.jpg
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}
