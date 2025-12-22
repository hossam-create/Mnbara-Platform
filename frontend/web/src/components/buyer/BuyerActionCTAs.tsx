import React from 'react';

interface BuyerActionCTAsProps {
  price: number;
  originalPrice?: number;
  quantity: number;
  onBuyNow: () => void;
  onAddToCart: () => void;
  onSaveToList: () => void;
  onContactSeller: () => void;
  onProceedToCheckout?: () => void;
  className?: string;
}

const BuyerActionCTAs: React.FC<BuyerActionCTAsProps> = ({
  price,
  originalPrice,
  quantity,
  onBuyNow,
  onAddToCart,
  onSaveToList,
  onContactSeller,
  onProceedToCheckout,
  className = '',
}) => {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Price Display */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <span className="text-3xl font-bold text-gray-900">
            ${Number(price).toFixed(2)}
          </span>
          {discount > 0 && originalPrice && (
            <>
              <span className="ml-3 text-xl text-gray-500 line-through">
                ${Number(originalPrice).toFixed(2)}
              </span>
              <span className="ml-3 bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-bold">
                -{discount}%
              </span>
            </>
          )}
        </div>
        
        {/* Quantity Info */}
        <div className="flex items-center text-sm text-gray-600">
          <span className="mr-4">Quantity:</span>
          <select className="border border-gray-300 rounded px-3 py-1 text-sm">
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <span className="ml-3 text-green-600 font-medium">
            {quantity > 1 ? `${quantity} available` : 'Only 1 left!'}
          </span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="space-y-3 mb-4">
        <button
          onClick={onBuyNow}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center text-base"
        >
          <span className="mr-2">🛒</span>
          Buy Now
        </button>
        
        <button
          onClick={onAddToCart}
          className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center text-base"
        >
          <span className="mr-2">➕</span>
          Add to Cart
        </button>
      </div>

      {/* Secondary Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={onSaveToList}
          className="border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
        >
          <span className="mr-1">❤️</span>
          Save
        </button>
        
        <button
          onClick={onContactSeller}
          className="border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
        >
          <span className="mr-1">💬</span>
          Contact
        </button>
      </div>

      {/* Proceed to Checkout (Conditional) */}
      {onProceedToCheckout && (
        <button
          onClick={onProceedToCheckout}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center text-base mb-4"
        >
          <span className="mr-2">🚀</span>
          Proceed to Checkout
        </button>
      )}

      {/* Trust Badges */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <span className="flex items-center">
            <span className="mr-1">🔒</span>
            Secure payment
          </span>
          <span className="flex items-center">
            <span className="mr-1">↩️</span>
            Free returns
          </span>
          <span className="flex items-center">
            <span className="mr-1">🚚</span>
            Fast shipping
          </span>
        </div>
      </div>
    </div>
  );
};

export default BuyerActionCTAs;