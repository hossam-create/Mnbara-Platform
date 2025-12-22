import { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';

interface Props {
  productName: string;
  price: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function MakeOfferModal({ productName, price, isOpen, onClose }: Props) {
  const { formatPrice } = useCurrency();
  const [offer, setOffer] = useState<number | ''>('');
  const [status, setStatus] = useState<'idle' | 'sent'>('idle');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sent');
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">
        
        {status === 'idle' ? (
            <>
                {/* Header */}
                <div className="bg-slate-50 border-b border-gray-100 p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800">Make an Offer 🤝</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="mb-6 bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                        <span className="font-medium text-gray-600">{productName}</span>
                        <span className="font-bold text-slate-900">{formatPrice(price)}</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Your Offer</label>
                        <div className="relative mb-6">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input 
                                type="number" 
                                required
                                min={price * 0.5}
                                max={price}
                                value={offer}
                                onChange={(e) => setOffer(Number(e.target.value))}
                                className="w-full pl-8 pr-4 py-3 text-lg font-bold rounded-xl border border-gray-300 focus:ring-2 focus:ring-slate-900 outline-none"
                                placeholder="Enter amount"
                            />
                        </div>

                        <div className="space-y-3">
                            <button type="submit" className="w-full btn-primary py-3 text-lg">
                                Send Offer
                            </button>
                            <p className="text-center text-xs text-gray-500">
                                The traveler has 24h to accept or counter.
                            </p>
                        </div>
                    </form>
                </div>
            </>
        ) : (
            <div className="p-10 text-center">
                <div className="text-5xl mb-4 animate-bounce">📨</div>
                <h3 className="text-xl font-bold text-green-600 mb-2">Offer Sent!</h3>
                <p className="text-gray-500">Fingers crossed 🤞</p>
            </div>
        )}
      </div>
    </div>
  );
}
