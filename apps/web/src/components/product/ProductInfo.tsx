
interface ProductInfoProps {
  product: {
    condition: string;
    title: string;
    sold: number;
    watchers: number;
    seller: {
      name: string;
      feedback: number;
      feedbackCount: number;
      itemsSold: number;
    };
    price: number;
    originalPrice?: number;
    shipping: {
      cost: string;
      service: string;
      delivery: string;
      location: string;
      returns: string;
    };
  };
}

export default function ProductInfo({ product }: ProductInfoProps) {
  return (
    <div>
      {/* Condition badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          {product.condition}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-xl font-normal text-gray-900 leading-tight mb-2">
        {product.title}
      </h1>

      {/* Item specifics row */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
        <span>{product.sold} sold</span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {product.watchers} watchers
        </span>
      </div>

      {/* Seller info */}
      <div className="border-t border-b border-gray-200 py-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {product.seller.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <a href="#" className="text-brand-blue hover:underline font-medium text-sm">
              {product.seller.name}
            </a>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-green-600 font-medium">{product.seller.feedback}% positive</span>
              <span>({product.seller.feedbackCount.toLocaleString()})</span>
              <span>•</span>
              <span>{(product.seller.itemsSold / 1000).toFixed(0)}K items sold</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-3">
          <button className="text-xs text-brand-blue hover:underline">Contact seller</button>
          <button className="text-xs text-brand-blue hover:underline">Visit store</button>
          <button className="text-xs text-brand-blue hover:underline">See other items</button>
        </div>
      </div>

      {/* Price section */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">US ${product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-gray-500 line-through">US ${product.originalPrice.toFixed(2)}</span>
              <span className="text-sm text-red-600 font-medium">
                {Math.round((1 - product.price / product.originalPrice) * 100)}% off
              </span>
            </>
          )}
        </div>
      </div>

      {/* Shipping info */}
      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <span className="text-gray-600 w-20">Shipping:</span>
          <div>
            <span className="font-medium text-green-700">{product.shipping.cost}</span>
            <span className="text-gray-600"> {product.shipping.service}.</span>
            <a href="#" className="text-brand-blue hover:underline ml-1">See details</a>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-600 w-20">Delivery:</span>
          <div>
            <span className="text-gray-900">Estimated between </span>
            <span className="font-medium">{product.shipping.delivery}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-600 w-20">Located in:</span>
          <span className="text-gray-900">{product.shipping.location}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-600 w-20">Returns:</span>
          <div>
            <span className="text-gray-900">{product.shipping.returns}.</span>
            <span className="text-gray-600"> Buyer pays for return shipping.</span>
            <a href="#" className="text-brand-blue hover:underline ml-1">See details</a>
          </div>
        </div>
      </div>
    </div>
  );
}
