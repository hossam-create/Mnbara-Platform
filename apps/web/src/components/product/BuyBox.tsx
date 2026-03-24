
import React from 'react';
import GuaranteeBadge from '../guarantee/GuaranteeBadge';

interface BuyBoxProps {
  product: {
    price: number;
    originalPrice?: number;
    quantity: number;
    sold: number;
  };
  quantity: number;
  setQuantity: (q: number) => void;
}

export default function BuyBox({ product, quantity, setQuantity }: BuyBoxProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-8 shadow-soft">
      {/* Price - RETAIL PRIORITY #1 */}
      <div className="mb-8">
        <div className="text-xs text-gray-600 mb-2 font-semibold uppercase tracking-wide">Price</div>
        <div className="text-4xl font-bold text-gray-900 mb-4">US ${product.price.toFixed(2)}</div>
        {product.originalPrice && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 line-through">Was US ${product.originalPrice.toFixed(2)}</span>
            <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-md font-semibold">
              Save {Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="mb-8">
        <label className="text-xs text-gray-600 block mb-3 font-semibold uppercase tracking-wide">Quantity</label>
        <div className="flex items-center gap-4">
          <select 
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-4 py-2.5 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600 font-normal">{product.quantity} available</span>
          <span className="text-sm text-gray-600 font-normal">/ {product.sold} sold</span>
        </div>
      </div>

      {/* Action Buttons - PRIMARY CTA HIERARCHY */}
      <div className="space-y-3 mb-8">
        <button className="w-full bg-brand-blue text-white py-3.5 rounded-lg font-semibold hover:bg-brand-blueDark transition-colors shadow-soft hover:shadow-medium">
          Buy It Now
        </button>
        <button className="w-full border-2 border-brand-blue text-brand-blue py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
          Add to cart
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex gap-3 mb-8">
        <button className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Save
        </button>
      </div>

      {/* Trust badges - SECONDARY INFO */}
      <div className="border-t border-gray-200 pt-8 space-y-4">
        {/* MNbarh Guarantee Badge */}
        <GuaranteeBadge 
          level="full" 
          escrowStatus="HELD"
          size="medium"
          className="w-full"
        />

        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <div className="text-sm font-semibold text-gray-900">Buyer Protection Guarantee</div>
            <div className="text-xs text-gray-600 font-normal">Get the item you ordered or your money back.</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <div>
            <div className="text-sm font-semibold text-gray-900">Secure Transaction</div>
            <div className="text-xs text-gray-600 font-normal">Your information is protected.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
