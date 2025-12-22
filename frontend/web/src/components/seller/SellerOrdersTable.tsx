// ============================================
// 📋 Seller Orders Table Component
// ============================================

import { useState } from 'react';
import type { SellerOrder } from '../../services/seller.service';

interface SellerOrdersTableProps {
  orders: SellerOrder[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onViewOrder: (order: SellerOrder) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
  // Selection support
  selectedOrders?: string[];
  onSelectOrder?: (orderId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-700' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-700' },
  { value: 'in_transit', label: 'In Transit', color: 'bg-purple-100 text-purple-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  { value: 'refunded', label: 'Refunded', color: 'bg-gray-100 text-gray-700' },
];

const getStatusColor = (status: string) => {
  const statusObj = ORDER_STATUSES.find(s => s.value === status);
  return statusObj?.color || 'bg-gray-100 text-gray-700';
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function SellerOrdersTable({
  orders,
  totalCount,
  currentPage,
  pageSize,
  isLoading,
  onPageChange,
  onViewOrder,
  onUpdateStatus,
  onSearch,
  onStatusFilter,
  selectedOrders = [],
  onSelectOrder,
  onSelectAll,
}: SellerOrdersTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const totalPages = Math.ceil(totalCount / pageSize);
  const allSelected = orders.length > 0 && orders.every(o => selectedOrders.includes(o.id));
  const someSelected = orders.some(o => selectedOrders.includes(o.id)) && !allSelected;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    onStatusFilter(status);
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'processing',
      processing: 'shipped',
      shipped: 'in_transit',
      in_transit: 'delivered',
    };
    return flow[currentStatus] || null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Order Management ({totalCount})</h2>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent w-64"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <span className="text-5xl block mb-4">📦</span>
          <p className="text-lg font-medium mb-2">No orders found</p>
          <p className="text-sm">Orders will appear here when customers make purchases</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                {onSelectOrder && (
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => onSelectAll?.(e.target.checked)}
                      className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                    />
                  </th>
                )}
                <th className="p-4 font-medium">Order</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Buyer</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Payment</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                const isSelected = selectedOrders.includes(order.id);
                return (
                  <tr key={order.id} className={`border-b last:border-0 hover:bg-gray-50 ${isSelected ? 'bg-pink-50' : ''}`}>
                    {onSelectOrder && (
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectOrder(order.id, e.target.checked)}
                          className="w-4 h-4 text-pink-500 border-gray-300 rounded focus:ring-pink-500"
                        />
                      </td>
                    )}
                    <td className="p-4">
                      <div className="font-medium text-gray-900">#{order.orderNumber}</div>
                      {order.trackingInfo?.trackingNumber && (
                        <div className="text-xs text-gray-500 mt-1">
                          📦 {order.trackingInfo.trackingNumber}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {order.productImage ? (
                            <img src={order.productImage} alt={order.productTitle} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate max-w-[150px]">{order.productTitle}</div>
                          <div className="text-xs text-gray-500">
                            {order.items?.length || 1} item(s)
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{order.buyerName}</div>
                      <div className="text-xs text-gray-500">{order.buyerEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900">
                        ${order.total.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{order.currency}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                      {order.escrow && (
                        <div className="text-xs text-blue-600 mt-1">🔒 Escrow</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewOrder(order)}
                          className="px-3 py-1.5 text-sm text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        {nextStatus && order.paymentStatus === 'paid' && (
                          <button
                            onClick={() => onUpdateStatus(order.id, nextStatus)}
                            className="px-3 py-1.5 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                          >
                            {nextStatus === 'shipped' ? 'Ship' : formatStatus(nextStatus)}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    currentPage === page
                      ? 'bg-pink-500 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerOrdersTable;
