import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { Link } from 'react-router-dom';

export default function Watchlist() {
  const { formatPrice } = useCurrency();
  // Mock Data
  const [items, setItems] = useState([
      { id: 1, name: 'PlayStation 5 Pro', price: 499, image: '🎮', dropped: true },
      { id: 2, name: 'MacBook Air 15"', price: 1299, image: '💻', dropped: false },
      { id: 3, name: 'Rolex Submariner', price: 12500, image: '⌚', dropped: false },
  ]);

  const handleRemove = (id: number) => {
      setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <span>❤️</span> My Watchlist
                <span className="text-sm font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">{items.length} items</span>
            </h1>

            {items.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-6xl mb-4">💔</div>
                    <h3 className="text-xl font-bold text-gray-900">Your watchlist is empty</h3>
                    <div className="mt-6">
                        <Link to="/" className="btn-primary px-8 py-3">Start Shopping</Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center gap-6 group hover:border-pink-200 transition-all">
                            
                            {/* Image */}
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-4xl shrink-0">
                                {item.image}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-bold text-lg text-gray-900 hover:text-pink-600 cursor-pointer transition-colors">{item.name}</h3>
                                {item.dropped && (
                                    <div className="inline-block mt-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded">
                                        📉 Price dropped by $50!
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            <div className="flex flex-col items-center sm:items-end gap-2 min-w-[120px]">
                                <div className="font-bold text-xl text-gray-900">{formatPrice(item.price)}</div>
                                <div className="flex gap-2">
                                    <button className="bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-slate-800">
                                        Buy Now
                                    </button>
                                    <button 
                                        onClick={() => handleRemove(item.id)}
                                        className="text-gray-400 hover:text-red-500 p-2"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
