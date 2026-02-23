import { PasteOrder } from '../../services/pasteOrdersService';

interface OrderCardProps {
  order: PasteOrder;
  onStatusUpdate: (orderId: string, status: PasteOrder['status'], notes?: string) => void;
  onTravelerAssign: (orderId: string, travelerId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OrderCard({ order, onStatusUpdate, onTravelerAssign, onEdit, onDelete }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-blue-100 text-blue-800';
      case 'matched':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'amazon':
        return '🛒';
      case 'aliexpress':
        return '🌍';
      case 'ebay':
        return '🏪';
      default:
        return '🔗';
    }
  };

  const getStatusActions = () => {
    switch (order.status) {
      case 'requested':
        return (
          <select
            onChange={(e) => {
              const status = e.target.value as PasteOrder['status'];
              if (status === 'cancelled') {
                const reason = prompt('Reason for cancellation:');
                onStatusUpdate(order.id, status, reason || undefined);
              } else if (status !== order.status) {
                onStatusUpdate(order.id, status);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500 text-sm"
            value={order.status}
          >
            <option value="requested">Requested</option>
            <option value="matched">Match</option>
            <option value="cancelled">Cancel</option>
          </select>
        );
      case 'matched':
        return (
          <select
            onChange={(e) => {
              const status = e.target.value as PasteOrder['status'];
              if (status !== order.status) {
                onStatusUpdate(order.id, status);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500 text-sm"
            value={order.status}
          >
            <option value="matched">Matched</option>
            <option value="in-transit">In Transit</option>
            <option value="cancelled">Cancel</option>
          </select>
        );
      case 'in-transit':
        return (
          <select
            onChange={(e) => {
              const status = e.target.value as PasteOrder['status'];
              if (status !== order.status) {
                onStatusUpdate(order.id, status);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500 text-sm"
            value={order.status}
          >
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancel</option>
          </select>
        );
      case 'delivered':
        return (
          <button
            onClick={() => onStatusUpdate(order.id, 'completed')}
            className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Mark Complete
          </button>
        );
      case 'completed':
        return (
          <span className="text-sm text-green-600 font-medium">Completed</span>
        );
      case 'cancelled':
        return (
          <span className="text-sm text-red-600 font-medium">Cancelled</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Header with Status */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSourceIcon(order.source)}</span>
            <div>
              <h3 className="font-semibold text-gray-900 truncate max-w-[200px]">
                {order.productInfo.title}
              </h3>
              <p className="text-sm text-gray-500">
                Order #{order.id.slice(-8)}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {order.status.replace('-', ' ').charAt(0).toUpperCase() + order.status.replace('-', ' ').slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Product Image */}
        {order.productInfo.imageUrl && (
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={order.productInfo.imageUrl}
              alt={order.productInfo.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Buyer Info */}
        <div className="text-sm">
          <span className="text-gray-500">Buyer:</span>
          <div>
            <span className="font-medium">{order.buyer.name}</span>
            <span className="text-gray-500 ml-2">{order.buyer.email}</span>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="text-sm bg-gray-50 p-3 rounded-lg">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Item Price:</span>
              <span className="font-medium">
                {order.priceBreakdown.currency} {order.priceBreakdown.itemPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Traveler Fee:</span>
              <span className="font-medium">
                {order.priceBreakdown.currency} {order.priceBreakdown.travelerFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee:</span>
              <span className="font-medium">
                {order.priceBreakdown.currency} {order.priceBreakdown.serviceFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-200">
              <span>Total:</span>
              <span className="text-brand-blue">
                {order.priceBreakdown.currency} {order.priceBreakdown.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className="text-sm">
          <span className="text-gray-500">Destination:</span>
          <span className="font-medium ml-2">
            {order.targetCity ? `${order.targetCity}, ` : ''}{order.targetCountry}
          </span>
        </div>

        {/* Assigned Traveler */}
        {order.assignedTraveler ? (
          <div className="text-sm">
            <span className="text-gray-500">Traveler:</span>
            <div className="flex items-center gap-2 mt-1">
              {order.assignedTraveler.avatar ? (
                <img
                  src={order.assignedTraveler.avatar}
                  alt={order.assignedTraveler.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  {order.assignedTraveler.name.charAt(0)}
                </div>
              )}
              <span className="font-medium">{order.assignedTraveler.name}</span>
              <span className="text-yellow-500">⭐ {order.assignedTraveler.rating.toFixed(1)}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <span className="text-gray-500">Traveler:</span>
            <span className="text-red-600 font-medium ml-2">Not Assigned</span>
          </div>
        )}

        {/* External Link */}
        <div className="text-sm">
          <span className="text-gray-500">Source:</span>
          <a
            href={order.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue hover:underline ml-2 truncate block"
          >
            {order.externalLink}
          </a>
        </div>

        {/* Dates */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Created: {new Date(order.createdAt).toLocaleDateString()}</div>
          {order.estimatedDelivery && (
            <div>Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-3">
          {/* Status Actions */}
          <div>
            {getStatusActions()}
          </div>

          {/* Edit & Delete */}
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Order
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete order"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
