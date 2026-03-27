import { useState, useEffect } from 'react';
import { DisputeRule, CreateDisputeRuleData } from '../../services/financialGuaranteesService';

interface DisputeRuleEditorProps {
  rule?: DisputeRule | null;
  onSave: (data: CreateDisputeRuleData) => void;
  onCancel: () => void;
}

export default function DisputeRuleEditor({ rule, onSave, onCancel }: DisputeRuleEditorProps) {
  const [formData, setFormData] = useState<CreateDisputeRuleData>({
    reason: '',
    allowedAfterStatus: 'PAID',
    resolutionType: 'REFUND',
    enabled: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rule) {
      setFormData({
        reason: rule.reason,
        allowedAfterStatus: rule.allowedAfterStatus,
        resolutionType: rule.resolutionType,
        enabled: rule.enabled
      });
    }
  }, [rule]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.reason.trim()) {
      newErrors.reason = 'Dispute reason is required';
    }
    if (!formData.allowedAfterStatus.trim()) {
      newErrors.allowedAfterStatus = 'Allowed after status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSave(formData);
  };

  const commonReasons = [
    'Item not delivered',
    'Wrong item received',
    'Item damaged',
    'Item not as described',
    'Delivery delay',
    'Counterfeit item',
    'Missing parts',
    'Poor quality'
  ];

  const commonStatuses = [
    'PAID',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED'
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {rule ? 'Edit Dispute Rule' : 'Create Dispute Rule'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Dispute Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dispute Reason *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              placeholder="e.g., Item not delivered"
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
            
            {/* Quick Select Common Reasons */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Quick select common reasons:</p>
              <div className="flex flex-wrap gap-2">
                {commonReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleInputChange('reason', reason)}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Allowed After Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed After Status *
            </label>
            <select
              value={formData.allowedAfterStatus}
              onChange={(e) => handleInputChange('allowedAfterStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              {commonStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Order status after which this dispute can be opened
            </p>
            {errors.allowedAfterStatus && (
              <p className="mt-1 text-sm text-red-600">{errors.allowedAfterStatus}</p>
            )}
          </div>

          {/* Resolution Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Type *
            </label>
            <div className="space-y-3">
              {[
                { value: 'REFUND', label: 'Full Refund', description: 'Complete refund to buyer', color: 'red' },
                { value: 'PARTIAL', label: 'Partial Refund', description: 'Partial refund based on evidence', color: 'yellow' },
                { value: 'MANUAL', label: 'Manual Review', description: 'Admin will review and decide', color: 'blue' }
              ].map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.resolutionType === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="resolutionType"
                    value={type.value}
                    checked={formData.resolutionType === type.value}
                    onChange={(e) => handleInputChange('resolutionType', e.target.value)}
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

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Rule Preview</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Reason:</strong> {formData.reason || 'No reason specified'}</div>
              <div><strong>Allowed After:</strong> {formData.allowedAfterStatus}</div>
              <div><strong>Resolution:</strong> {formData.resolutionType}</div>
            </div>
            
            {/* Example Flow */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Example Flow:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>1. Order status becomes "{formData.allowedAfterStatus}"</div>
                <div>2. Buyer opens dispute: "{formData.reason}"</div>
                <div>3. System applies resolution: {formData.resolutionType}</div>
              </div>
            </div>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Rule</h3>
              <p className="text-sm text-gray-500">Rule will be active when enabled</p>
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
              {rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
