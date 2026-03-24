import { useState, useEffect } from 'react';
import { PasteOrder } from '../../services/pasteOrdersService';

interface OrderEditorProps {
  order?: PasteOrder | null;
  availableTravelers: any[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export default function OrderEditor({ order, availableTravelers, onSave, onCancel }: OrderEditorProps) {
  const [formData, setFormData] = useState({
    status: order?.status || 'requested',
    assignedTravelerId: order?.assignedTraveler?.id || '',
    priceBreakdown: order?.priceBreakdown || {
      itemPrice: 0,
      travelerFee: 0,
      serviceFee: 0,
      total: 0,
      currency: 'USD'
    },
    notes: order?.notes || '',
    estimatedDelivery: order?.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
    trackingNumber: order?.trackingNumber || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (order) {
      setFormData({
        status: order.status,
        assignedTravelerId: order.assignedTraveler?.id || '',
        priceBreakdown: order.priceBreakdown,
        notes: order.notes || '',
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
        trackingNumber: order.trackingNumber || ''
      });
    }
  }, [order]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePriceChange = (field: string, value: number) => {
    const newPriceBreakdown = {
      ...formData.priceBreakdown,
      [field]: value
    };
    
    // Recalculate total
    newPriceBreakdown.total = newPriceBreakdown.itemPrice + newPriceBreakdown.travelerFee + newPriceBreakdown.serviceFee;
    
    setFormData(prev => ({ ...prev, priceBreakdown: newPriceBreakdown }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.priceBreakdown.itemPrice <= 0) {
      newErrors.itemPrice = 'Item price must be greater than 0';
    }
    if (formData.priceBreakdown.travelerFee < 0) {
      newErrors.travelerFee = 'Traveler fee cannot be negative';
    }
    if (formData.priceBreakdown.serviceFee < 0) {
      newErrors.serviceFee = 'Service fee cannot be negative';
    }
    if (formData.status === 'matched' && !formData.assignedTravelerId) {
      newErrors.assignedTravelerId = 'Traveler assignment is required for matched status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      assignedTravelerId: formData.assignedTravelerId || undefined,
      estimatedDelivery: formData.estimatedDelivery ? new Date(formData.estimatedDelivery).toISOString() : undefined
    };

    onSave(submitData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Order #{order?.id.slice(-8) || 'New Order'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Info */}
          {order && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Order Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Product:</span>
                  <div className="font-medium">{order.productInfo.title}</div>
                </div>
                <div>
                  <span className="text-gray-500">Buyer:</span>
                  <div className="font-medium">{order.buyer.name} ({order.buyer.email})</div>
                </div>
                <div>
                  <span className="text-gray-500">Source:</span>
                  <div className="font-medium">
                    <a href={order.externalLink} target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                      {order.externalLink}
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Destination:</span>
                  <div className="font-medium">
                    {order.targetCity ? `${order.targetCity}, ` : ''}{order.targetCountry}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="requested">Requested</option>
              <option value="matched">Matched</option>
              <option value="in-transit">In Transit</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Traveler Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Traveler
            </label>
            <select
              value={formData.assignedTravelerId}
              onChange={(e) => handleInputChange('assignedTravelerId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="">Select a traveler</option>
              {availableTravelers.map((traveler) => (
                <option key={traveler.id} value={traveler.id}>
                  {traveler.name} - ⭐ {traveler.rating} - Fee: ${traveler.fee}
                </option>
              ))}
            </select>
            {errors.assignedTravelerId && (
              <p className="mt-1 text-sm text-red-600">{errors.assignedTravelerId}</p>
            )}
          </div>

          {/* Price Breakdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Breakdown
            </label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Price *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceBreakdown.itemPrice}
                  onChange={(e) => handlePriceChange('itemPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                />
                {errors.itemPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.itemPrice}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Traveler Fee
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceBreakdown.travelerFee}
                  onChange={(e) => handlePriceChange('travelerFee', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                />
                {errors.travelerFee && (
                  <p className="mt-1 text-sm text-red-600">{errors.travelerFee}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Fee
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceBreakdown.serviceFee}
                  onChange={(e) => handlePriceChange('serviceFee', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                />
                {errors.serviceFee && (
                  <p className="mt-1 text-sm text-red-600">{errors.serviceFee}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold text-brand-blue">
                  {formData.priceBreakdown.currency} {formData.priceBreakdown.total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={formData.priceBreakdown.currency}
              onChange={(e) => handleInputChange('priceBreakdown', {
                ...formData.priceBreakdown,
                currency: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
            </select>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Delivery
              </label>
              <input
                type="date"
                value={formData.estimatedDelivery}
                onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Number
              </label>
              <input
                type="text"
                value={formData.trackingNumber}
                onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                placeholder="1Z999AA10123456784"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              placeholder="Internal notes about this order..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Update Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
