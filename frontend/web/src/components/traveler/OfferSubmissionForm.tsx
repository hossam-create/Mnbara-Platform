import React, { useState } from 'react';
import type { OfferFormData, TravelerRequest } from '../../services/traveler.service';

interface OfferSubmissionFormProps {
  request: TravelerRequest;
  onSubmit: (offerData: OfferFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DELIVERY_TIMELINES = [
  { value: 3, label: '3 days', description: 'Express delivery' },
  { value: 5, label: '5 days', description: 'Standard delivery' },
  { value: 7, label: '7 days', description: 'Economy delivery' },
  { value: 10, label: '10 days', description: 'Flexible timeline' },
];

const PACKAGING_OPTIONS = [
  { value: 'standard', label: 'Standard Packaging', description: 'Bubble wrap + box' },
  { value: 'premium', label: 'Premium Packaging', description: 'Double protection + insurance' },
  { value: 'custom', label: 'Custom Packaging', description: 'Special requirements' },
];

const OfferSubmissionForm: React.FC<OfferSubmissionFormProps> = ({
  request,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [form, setForm] = useState<OfferFormData>({
    proposedDeliveryDays: 5,
    packagingType: 'standard',
    specialNotes: '',
    termsAgreed: false,
    insuranceCoverage: true,
    trackingUpdates: true,
    proposedPickupDate: '',
    proposedDeliveryDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.termsAgreed) {
      newErrors.termsAgreed = 'You must agree to the terms and conditions';
    }

    if (form.proposedDeliveryDays > request.maxDeliveryDays) {
      newErrors.proposedDeliveryDays = `Cannot exceed buyer's maximum of ${request.maxDeliveryDays} days`;
    }

    if (form.packagingType === 'custom' && !form.specialNotes.trim()) {
      newErrors.specialNotes = 'Please provide details for custom packaging';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(form);
    } catch (error) {
      console.error('Failed to submit offer:', error);
      setErrors({ submit: 'Failed to submit offer. Please try again.' });
    }
  };

  const calculateEarnings = () => {
    // Simple calculation - in real app, this would consider packaging type, timeline, etc.
    return request.deliveryReward;
  };

  const handleTimelineChange = (days: number) => {
    const pickupDate = new Date();
    const deliveryDate = new Date();
    deliveryDate.setDate(pickupDate.getDate() + days);

    setForm({
      ...form,
      proposedDeliveryDays: days,
      proposedPickupDate: pickupDate.toISOString().split('T')[0],
      proposedDeliveryDate: deliveryDate.toISOString().split('T')[0],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Submit Delivery Offer</h2>
              <p className="text-sm text-gray-600 mt-1">
                For: {request.productName}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Offer Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Offer Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Base Reward:</span>
                <span className="font-medium text-green-600 ml-2">${request.deliveryReward}</span>
              </div>
              <div>
                <span className="text-gray-600">Estimated Earnings:</span>
                <span className="font-medium text-green-600 ml-2">${calculateEarnings()}</span>
              </div>
              <div>
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium ml-2">{request.distanceKm} km</span>
              </div>
              <div>
                <span className="text-gray-600">Buyer Trust:</span>
                <span className="font-medium text-blue-600 ml-2">{request.buyerTrustScore}%</span>
              </div>
            </div>
          </div>

          {/* Delivery Timeline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Proposed Delivery Timeline <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DELIVERY_TIMELINES.map((timeline) => (
                <button
                  key={timeline.value}
                  type="button"
                  onClick={() => handleTimelineChange(timeline.value)}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    form.proposedDeliveryDays === timeline.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{timeline.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{timeline.description}</div>
                </button>
              ))}
            </div>
            {errors.proposedDeliveryDays && (
              <p className="text-red-500 text-sm mt-1">{errors.proposedDeliveryDays}</p>
            )}

            {form.proposedPickupDate && (
              <div className="mt-4 text-sm text-gray-600">
                <span className="font-medium">Estimated Schedule:</span>
                <span className="ml-2">
                  Pickup: {new Date(form.proposedPickupDate).toLocaleDateString()}
                </span>
                <span className="mx-2">→</span>
                <span>
                  Delivery: {new Date(form.proposedDeliveryDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Packaging Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Packaging Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PACKAGING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, packagingType: option.value })}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    form.packagingType === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Special Notes */}
          {form.packagingType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Packaging Details <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.specialNotes}
                onChange={(e) => setForm({ ...form, specialNotes: e.target.value })}
                rows={3}
                placeholder="Please describe your custom packaging requirements..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.specialNotes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.specialNotes && (
                <p className="text-red-500 text-sm mt-1">{errors.specialNotes}</p>
              )}
            </div>
          )}

          {/* Additional Services */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Additional Services</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.insuranceCoverage}
                  onChange={(e) => setForm({ ...form, insuranceCoverage: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Include additional insurance coverage
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.trackingUpdates}
                  onChange={(e) => setForm({ ...form, trackingUpdates: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Provide real-time tracking updates
                </span>
              </label>
            </div>
          </div>

          {/* Terms Agreement */}
          <div>
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={form.termsAgreed}
                onChange={(e) => setForm({ ...form, termsAgreed: e.target.checked })}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                I agree to the{' '}
                <a href="/legal/delivery-terms" className="text-blue-600 hover:text-blue-700 underline">
                  Delivery Terms and Conditions
                </a>
                . I understand that this offer is binding and I'm committed to delivering the item as specified.
              </span>
            </label>
            {errors.termsAgreed && (
              <p className="text-red-500 text-sm mt-1">{errors.termsAgreed}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Submitting...' : 'Submit Offer'}
            </button>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default OfferSubmissionForm;