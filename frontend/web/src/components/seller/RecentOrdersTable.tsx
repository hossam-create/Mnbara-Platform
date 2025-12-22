// ============================================
// 📋 Recent Orders Table for Seller Dashboard
// ============================================

import type { SellerOrder } from '../../services/seller.service';

interface RecentOrdersTableProps {
  orders: SellerOrder[];
  pendingCount: number;
  onViewOrder: (orderId: string) => void;
  onViewAll: () => void;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    in_transit: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export function RecentOrdersTable({ orders, pendingCount, onViewOrder, onViewAll }: RecentOrdersTableProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
              {pendingCount} pending
            </span>
          )}
          <button
            onClick={onViewAll}
            className="text-pink-500 hover:text-pink-600 text-sm font-medium"
          >
            View All →
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <span className="text-4xl block mb-2">📦</span>
          No orders yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Product</th>
                <th className="pb-3 font-medium">Buyer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-4 font-medium text-gray-800">#{order.orderNumber}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {order.productImage && (
                        <img
                          src={order.productImage}
                          alt={order.productTitle}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <span className="text-gray-600 truncate max-w-[150px]">{order.productTitle}</span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-600">{order.buyerName}</td>
                  <td className="py-4 font-semibold text-gray-900">
                    ${order.total.toLocaleString()}
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => onViewOrder(order.id)}
                      className="text-pink-500 hover:text-pink-600 hover:underline text-sm font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentOrdersTable;
