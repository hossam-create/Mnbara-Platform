import { useState, useEffect } from 'react';
import { useCurrency } from '../../context/CurrencyContext';

export default function DailyDeals() {
  const { formatPrice } = useCurrency();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({ hours: 14, minutes: 23, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const deals = [
      { id: 1, name: 'Sony WH-1000XM5', original: 399, price: 299, claimed: 85, image: '🎧' },
      { id: 2, name: 'iPad Air M1', original: 599, price: 479, claimed: 42, image: '📱' },
      { id: 3, name: 'Dyson Airwrap', original: 599, price: 449, claimed: 98, image: '💇‍♀️' },
      { id: 4, name: 'Nike Air Jordan 1', original: 180, price: 135, claimed: 60, image: '👟' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
        
        {/* Banner */}
        <div className="bg-red-600 text-white p-4 sticky top-0 z-30 shadow-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="text-2xl animate-pulse">⚡</span>
                    <h1 className="font-bold text-xl uppercase tracking-wider">Flash Deals</h1>
                </div>
                <div className="flex items-center gap-2 bg-red-800 px-4 py-1 rounded-lg">
                    <span className="text-xs uppercase opacity-75">Ends in</span>
                    <span className="font-mono font-bold text-lg">
                        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Featured Drops</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {deals.map((deal) => (
                    <div key={deal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-shadow relative">
                        {/* Discount Badge */}
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            -{Math.round(((deal.original - deal.price) / deal.original) * 100)}%
                        </div>

                        <div className="h-48 bg-gray-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300">
                            {deal.image}
                        </div>
                        
                        <div className="p-4">
                            <h3 className="font-bold text-gray-900 mb-1">{deal.name}</h3>
                            <div className="flex items-end gap-2 mb-3">
                                <span className="text-xl font-bold text-red-600">{formatPrice(deal.price)}</span>
                                <span className="text-sm text-gray-400 line-through mb-1">{formatPrice(deal.original)}</span>
                            </div>

                            {/* Claim Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-bold text-gray-500">{deal.claimed}% Claimed</span>
                                    {deal.claimed > 90 && <span className="text-red-500 font-bold animate-pulse">🔥 Almost Gone!</span>}
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${deal.claimed > 90 ? 'bg-red-500' : 'bg-red-400'}`} style={{ width: `${deal.claimed}%` }}></div>
                                </div>
                            </div>

                            <button className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors">
                                Buy Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
