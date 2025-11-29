import React from 'react';

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  onAddToCart: (item: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
  }) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  price,
  imageUrl,
  onAddToCart,
}) => {
  const handleAddToCart = () => {
    onAddToCart({ id, title, price, imageUrl });
  };

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200">
      {/* Image Container */}
      <div className="aspect-square w-full overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-blue-600">
            ${price.toFixed(2)}
          </span>

          <button
            onClick={handleAddToCart}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Add ${title} to cart`}
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Optional: Badge for new/sale items */}
      {/* <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
        SALE
      </div> */}
    </div>
  );
};
