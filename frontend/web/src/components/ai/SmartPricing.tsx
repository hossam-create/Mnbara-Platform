// ============================================
// 🧠 AI Smart Pricing Component (Seller)
// ============================================

import { useState } from 'react';

interface PriceInsight {
  recommendedPrice: number;
  confidence: number;
  marketLow: number;
  marketHigh: number;
  demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  competitors: number;
  reason: string;
}

export function SmartPricingWidget({ currentPrice, category }: { currentPrice: number, category: string }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [insight, setInsight] = useState<PriceInsight | null>(null);

  const analyzePrice = () => {
    setAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setInsight({
        recommendedPrice: currentPrice * 0.95, // Suggest 5% lower
        confidence: 0.89,
        marketLow: currentPrice * 0.8,
        marketHigh: currentPrice * 1.2,
        demandLevel: 'high',
        competitors: 12,
        reason: '3 competitors lowered prices this week. High demand expected this weekend.',
      });
      setAnalyzing(false);
    }, 2000);
  };

  if (!insight && !analyzing) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">
            📈
          </div>
          <div>
            <h4 className="font-bold text-gray-900">AI Price Optimizer</h4>
            <p className="text-xs text-gray-600">Get Smart Pricing recommendations based in real-time market data.</p>
          </div>
        </div>
        <button
          onClick={analyzePrice}
          className="w-full py-2 bg-white border border-indigo-200 text-indigo-700 font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-sm"
        >
          Analyze My Price ⚡
        </button>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
        <div className="flex justify-center mb-3">
          <div className="flex gap-1">
            <div className="w-2 h-8 bg-indigo-400 rounded animate-wave"></div>
            <div className="w-2 h-8 bg-indigo-500 rounded animate-wave [animation-delay:0.1s]"></div>
            <div className="w-2 h-8 bg-indigo-600 rounded animate-wave [animation-delay:0.2s]"></div>
            <div className="w-2 h-8 bg-purple-500 rounded animate-wave [animation-delay:0.3s]"></div>
            <div className="w-2 h-8 bg-pink-500 rounded animate-wave [animation-delay:0.4s]"></div>
          </div>
        </div>
        <p className="text-sm font-medium text-gray-600 animate-pulse">Analyzing market trends...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
        <div className="flex justify-between items-start">
          <h4 className="font-bold flex items-center gap-2">
            ✨ AI Recommendation
          </h4>
          <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
            {Math.round(insight!.confidence * 100)}% Confidence
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex items-end gap-3 mb-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Recommended Price</div>
            <div className="text-3xl font-bold text-gray-900">${insight!.recommendedPrice.toFixed(2)}</div>
          </div>
          <div className="mb-1">
             {insight!.recommendedPrice < currentPrice ? (
               <span className="text-green-600 text-sm font-medium flex items-center">
                 ↓ ${(currentPrice - insight!.recommendedPrice).toFixed(2)} lower
               </span>
             ) : (
                <span className="text-blue-600 text-sm font-medium flex items-center">
                 ↑ ${(insight!.recommendedPrice - currentPrice).toFixed(2)} higher
               </span>
             )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          <span className="font-semibold text-indigo-600">Why?</span> {insight!.reason}
        </p>

        <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500">Market Range</div>
            <div className="font-medium text-gray-900">
              ${insight!.marketLow} - ${insight!.marketHigh}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Demand</div>
            <div className={`font-medium ${
              insight!.demandLevel === 'very_high' ? 'text-green-600' :
              insight!.demandLevel === 'high' ? 'text-green-500' : 'text-yellow-500'
            }`}>
              {insight!.demandLevel.replace('_', ' ').toUpperCase()} 🔥
            </div>
          </div>
        </div>

        <button className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          Apply Price (${insight!.recommendedPrice.toFixed(2)})
        </button>
      </div>
    </div>
  );
}

export default SmartPricingWidget;
