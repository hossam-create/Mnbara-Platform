// ============================================
// 🏆 Top Products List for Seller Dashboard
// ============================================

import type { TopProduct } from '../../services/seller.service';

interface TopProductsListProps {
  products: TopProduct[];
  onViewProduct?: (productId: string) => void;
}

export function TopProductsList({ products, onViewProduct }: TopProductsListProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Top Products</h2>
      
      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-2">📊</span>
          No sales data yet
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewProduct?.(product.id)}
            >
              <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-400">
                #{index + 1}
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">{product.name}</div>
                <div className="text-sm text-gray-500">{product.sales} sales</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">${product.revenue.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopProductsList;
