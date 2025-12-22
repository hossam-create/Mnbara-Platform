// ============================================
// 📦 Order Detail Modal for Seller Dashboard
// ============================================

import { useState, useMemo } from 'react';
import type { SellerOrder } from '../../services/seller.service';

interface OrderDetailModalProps {
  order: SellerOrder;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string, trackingNumber?: string, carrier?: string) => Promise<void>;
  onGenerateLabel: (orderId: string) => Promise<void>;
  isLoading?: boolean;
}

type OrderStatusValue = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded';
type TabType = 'details' | 'timeline' | 'shipping';

const ORDER_STATUSES: { value: OrderStatusValue; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered'];

const CARRIERS = [
  { value: 'fedex', label: 'FedEx', trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=' },
  { value: 'ups', label: 'UPS', trackingUrl: 'https://www.ups.com/track?tracknum=' },
  { value: 'usps', label: 'USPS', trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' },
  { value: 'dhl', label: 'DHL', trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=' },
  { value: 'aramex', label: 'Aramex', trackingUrl: 'https://www.aramex.com/track/results?ShipmentNumber=' },
  { value: 'other', label: 'Other', trackingUrl: '' },
];

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

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  onGenerateLabel,
  isLoading,
}: OrderDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [, setShowShippingForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingInfo?.trackingNumber || '');
  const [carrier, setCarrier] = useState(order.trackingInfo?.carrier?.toLowerCase() || 'fedex');
  const [newStatus, setNewStatus] = useState<OrderStatusValue>(order.status as OrderStatusValue);
  const [estimatedDelivery, setEstimatedDelivery] = useState(order.trackingInfo?.estimatedDelivery || '');

  // Generate order timeline
  const orderTimeline = useMemo(() => {
    const timeline = [
      { status: 'Order Placed', date: order.createdAt, completed: true },
    ];
    
    const currentStatusIndex = STATUS_FLOW.indexOf(order.status);
    
    if (currentStatusIndex >= 1) {
      timeline.push({ status: 'Order Confirmed', date: order.updatedAt, completed: true });
    }
    if (currentStatusIndex >= 2) {
      timeline.push({ status: 'Processing', date: order.updatedAt, completed: true });
    }
    if (currentStatusIndex >= 3) {
      timeline.push({ status: 'Shipped', date: order.updatedAt, completed: true });
    }
    if (currentStatusIndex >= 4) {
      timeline.push({ status: 'In Transit', date: order.updatedAt, completed: true });
    }
    if (currentStatusIndex >= 5) {
      timeline.push({ status: 'Delivered', date: order.updatedAt, completed: true });
    }
    
    // Add pending steps
    if (currentStatusIndex < 5 && order.status !== 'cancelled' && order.status !== 'refunded') {
      for (let i = currentStatusIndex + 1; i <= 5; i++) {
        timeline.push({ 
          status: STATUS_FLOW[i].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          date: '', 
          completed: false 
        });
      }
    }
    
    if (order.status === 'cancelled') {
      timeline.push({ status: 'Cancelled', date: order.updatedAt, completed: true });
    }
    if (order.status === 'refunded') {
      timeline.push({ status: 'Refunded', date: order.updatedAt, completed: true });
    }
    
    return timeline;
  }, [order]);

  const getTrackingUrl = () => {
    const carrierInfo = CARRIERS.find(c => c.value === carrier.toLowerCase());
    if (carrierInfo && carrierInfo.trackingUrl && trackingNumber) {
      return carrierInfo.trackingUrl + trackingNumber;
    }
    return null;
  };

  const handleUpdateStatus = async () => {
    if (newStatus === 'shipped' && !order.trackingInfo?.trackingNumber && !trackingNumber) {
      setShowShippingForm(true);
      setActiveTab('shipping');
      return;
    }
    await onUpdateStatus(order.id, newStatus, trackingNumber || undefined, carrier || undefined);
  };

  const handleShipOrder = async () => {
    if (!trackingNumber) return;
    await onUpdateStatus(order.id, 'shipped', trackingNumber, carrier);
    setShowShippingForm(false);
  };

  const handlePrintLabel = () => {
    // Open print dialog for shipping label
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Shipping Label - Order #${order.orderNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .label { border: 2px solid #000; padding: 20px; max-width: 400px; }
              .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
              .section { margin-bottom: 15px; }
              .section-title { font-weight: bold; margin-bottom: 5px; }
              .barcode { text-align: center; font-size: 14px; letter-spacing: 3px; margin-top: 20px; padding: 10px; background: #f0f0f0; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="header">SHIPPING LABEL</div>
              <div class="section">
                <div class="section-title">FROM:</div>
                <div>MNBARA Seller</div>
                <div>123 Warehouse St</div>
                <div>Los Angeles, CA 90001</div>
              </div>
              <div class="section">
                <div class="section-title">TO:</div>
                <div>${order.buyerName}</div>
                <div>${order.shippingAddress?.street || ''}</div>
                <div>${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zipCode || ''}</div>
                <div>${order.shippingAddress?.country || ''}</div>
                <div>Phone: ${order.shippingAddress?.phone || ''}</div>
              </div>
              <div class="section">
                <div class="section-title">ORDER:</div>
                <div>#${order.orderNumber}</div>
              </div>
              <div class="barcode">
                ${order.trackingInfo?.trackingNumber || trackingNumber || 'TRACKING_NUMBER'}
              </div>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h3>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-6">
            {(['details', 'timeline', 'shipping'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'details' && '📋 Details'}
                {tab === 'timeline' && '📍 Timeline'}
                {tab === 'shipping' && '📦 Shipping'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Actions */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatusValue)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
                disabled={order.status === 'delivered' || order.status === 'cancelled'}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={newStatus === order.status || isLoading}
                className="px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update
              </button>
            </div>
          </div>

          {/* Details Tab */}
          {activeTab === 'details' && (
            <>

          {/* Order Items */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-4 p-4 bg-gray-50">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {order.productImage ? (
                    <img src={order.productImage} alt={order.productTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{order.productTitle}</div>
                  <div className="text-sm text-gray-500">Qty: {order.items?.[0]?.quantity || 1}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${order.subtotal?.toLocaleString() || order.total.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="grid grid-cols-2 gap-6">
            {/* Buyer Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Buyer Information</h4>
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">👤</span>
                  <span className="font-medium">{order.buyerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">✉️</span>
                  <span className="text-sm text-gray-600">{order.buyerEmail}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
              <div className="p-4 bg-gray-50 rounded-xl">
                {order.shippingAddress ? (
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="font-medium text-gray-900">{order.shippingAddress.label}</div>
                    <div>{order.shippingAddress.street}</div>
                    <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</div>
                    <div>{order.shippingAddress.country}</div>
                    <div className="pt-2">📞 {order.shippingAddress.phone}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No shipping address provided</div>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Totals */}
          <div className="grid grid-cols-2 gap-6">
            {/* Payment Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                    order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
                {order.escrow && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Escrow</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      order.escrowStatus === 'held' ? 'bg-blue-100 text-blue-700' :
                      order.escrowStatus === 'released' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.escrowStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Totals */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Order Total</h4>
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${(order.subtotal || order.total - (order.deliveryFee || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>${(order.deliveryFee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span>-${(order.platformFee || 0).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Your Earnings</span>
                  <span className="text-green-600">
                    ${(order.total - (order.platformFee || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking Info (in details tab) */}
          {order.trackingInfo && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Tracking Information</h4>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-medium">{order.trackingInfo.carrier}</div>
                    <div className="text-sm text-gray-500">{order.trackingInfo.trackingNumber}</div>
                  </div>
                  {getTrackingUrl() ? (
                    <a
                      href={getTrackingUrl()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:underline text-sm"
                    >
                      Track Package →
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">No tracking URL</span>
                  )}
                </div>
                {order.trackingInfo.updates && order.trackingInfo.updates.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    {order.trackingInfo.updates.slice(0, 3).map((update, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2" />
                        <div>
                          <div className="text-sm font-medium">{update.status}</div>
                          <div className="text-xs text-gray-500">{update.location} • {update.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
            </>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Order Timeline</h4>
              <div className="relative">
                {orderTimeline.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-6 last:pb-0">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        item.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'bg-white border-gray-300'
                      }`}>
                        {item.completed && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      {index < orderTimeline.length - 1 && (
                        <div className={`w-0.5 flex-1 ${item.completed ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className={`font-medium ${item.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                        {item.status}
                      </div>
                      {item.date && (
                        <div className="text-sm text-gray-500">
                          {formatDate(item.date)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              {/* Shipping Address */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
                <div className="p-4 bg-gray-50 rounded-xl">
                  {order.shippingAddress ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="font-medium text-gray-900">{order.buyerName}</div>
                      <div>{order.shippingAddress.street}</div>
                      <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</div>
                      <div>{order.shippingAddress.country}</div>
                      <div className="pt-2">📞 {order.shippingAddress.phone}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No shipping address provided</div>
                  )}
                </div>
              </div>

              {/* Shipping Form */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-4">📦 Shipping Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                    >
                      {CARRIERS.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                    <input
                      type="date"
                      value={estimatedDelivery}
                      onChange={(e) => setEstimatedDelivery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={handleShipOrder}
                    disabled={!trackingNumber || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Updating...' : order.trackingInfo ? 'Update Tracking' : 'Mark as Shipped'}
                  </button>
                  <button
                    onClick={() => onGenerateLabel(order.id)}
                    disabled={isLoading}
                    className="px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50"
                  >
                    Download Label
                  </button>
                  <button
                    onClick={handlePrintLabel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
                  >
                    🖨️ Print Label
                  </button>
                </div>
              </div>

              {/* Tracking Updates */}
              {order.trackingInfo && order.trackingInfo.updates && order.trackingInfo.updates.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Tracking Updates</h4>
                  <div className="space-y-3">
                    {order.trackingInfo.updates.map((update, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{update.status}</div>
                          <div className="text-xs text-gray-500">{update.location}</div>
                          <div className="text-xs text-gray-400">{update.timestamp}</div>
                          {update.description && (
                            <div className="text-xs text-gray-600 mt-1">{update.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {order.status === 'pending' && order.paymentStatus === 'paid' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'confirmed')}
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50"
            >
              Confirm Order
            </button>
          )}
          {(order.status === 'confirmed' || order.status === 'processing') && (
            <button
              onClick={() => setShowShippingForm(true)}
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50"
            >
              Ship Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderDetailModal;
