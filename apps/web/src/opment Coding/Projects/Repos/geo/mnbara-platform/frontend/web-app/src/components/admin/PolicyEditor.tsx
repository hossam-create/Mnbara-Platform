import { useState, useEffect } from 'react';
import { GuaranteePolicy, CreateGuaranteePolicyData } from '../../services/financialGuaranteesService';

interface PolicyEditorProps {
  policy?: GuaranteePolicy | null;
  onSave: (data: CreateGuaranteePolicyData) => void;
  onCancel: () => void;
}

export default function PolicyEditor({ policy, onSave, onCancel }: PolicyEditorProps) {
  const [formData, setFormData] = useState<CreateGuaranteePolicyData>({
    title: '',
    description: '',
    appliesTo: 'BUYER',
    enabled: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (policy) {
      setFormData({
        title: policy.title,
        description: policy.description,
        appliesTo: policy.appliesTo,
        enabled: policy.enabled
      });
    }
  }, [policy]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Policy title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Policy description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSave(formData);
  };

  const samplePolicies = [
    {
      title: 'Buyer Protection',
      description: 'Get a full refund if your item doesn\'t arrive, is damaged, or not as described. We\'ll help resolve any issues with your order.',
      appliesTo: 'BUYER'
    },
    {
      title: 'Seller Protection',
      description: 'Protection against fraudulent chargebacks and false claims. We review evidence and protect legitimate sellers.',
      appliesTo: 'SELLER'
    },
    {
      title: 'Authenticity Guarantee',
      description: 'All items are verified for authenticity. If you receive a counterfeit item, you\'ll get a full refund.',
      appliesTo: 'BUYER'
    },
    {
      title: 'Delivery Guarantee',
      description: 'On-time delivery or your money back. If your order is significantly delayed, you may qualify for compensation.',
      appliesTo: 'BUYER'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {policy ? 'Edit Protection Policy' : 'Create Protection Policy'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              placeholder="e.g., Buyer Protection"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Applies To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applies To *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'BUYER', label: 'Buyer', description: 'Protects buyers in transactions' },
                { value: 'SELLER', label: 'Seller', description: 'Protects sellers in transactions' }
              ].map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.appliesTo === type.value
                      ? 'border-brand-blue bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="appliesTo"
                    value={type.value}
                    checked={formData.appliesTo === type.value}
                    onChange={(e) => handleInputChange('appliesTo', e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              placeholder="Describe what this policy covers and how it protects users..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            
            <p className="mt-1 text-xs text-gray-500">
              This will be displayed to users in trust badges and policy pages.
            </p>
          </div>

          {/* Sample Templates */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Sample Templates</h3>
            <div className="grid grid-cols-1 gap-3">
              {samplePolicies.map((sample, index) => (
                <div key={index} className="bg-white p-3 rounded border border-gray-200">
                  <div className="font-medium text-gray-900 mb-1">{sample.title}</div>
                  <div className="text-sm text-gray-600 mb-2">{sample.description}</div>
                  <button
                    type="button"
                    onClick={() => {
                      handleInputChange('title', sample.title);
                      handleInputChange('description', sample.description);
                      handleInputChange('appliesTo', sample.appliesTo);
                    }}
                    className="text-xs text-brand-blue hover:underline"
                  >
                    Use this template
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badge Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Trust Badge Preview</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center max-w-sm mx-auto">
              <div className="text-4xl mb-3">🛡️</div>
              <div className="font-semibold text-gray-900 mb-2">{formData.title || 'Policy Title'}</div>
              <div className="text-sm text-gray-600">
                {formData.description || 'Policy description will appear here...'}
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Protected by MNbarh
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">Where This Policy Will Appear</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div>• Product pages (trust badges)</div>
              <div>• Checkout pages (protection summary)</div>
              <div>• Order details (active policies)</div>
              <div>• Help center (policy documentation)</div>
              <div>• Footer links (protection information)</div>
            </div>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Policy</h3>
              <p className="text-sm text-gray-500">Policy will be visible to users when enabled</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('enabled', !formData.enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.enabled ? 'bg-brand-blue' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
              {policy ? 'Update Policy' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
