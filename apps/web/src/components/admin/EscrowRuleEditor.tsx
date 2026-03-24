import { useState, useEffect } from 'react';
import { EscrowRule, CreateEscrowRuleData } from '../../services/financialGuaranteesService';

interface EscrowRuleEditorProps {
  rule?: EscrowRule | null;
  onSave: (data: CreateEscrowRuleData) => void;
  onCancel: () => void;
}

export default function EscrowRuleEditor({ rule, onSave, onCancel }: EscrowRuleEditorProps) {
  const [formData, setFormData] = useState<CreateEscrowRuleData>({
    name: '',
    type: 'TRAVEL',
    holdPercentage: 100,
    releaseCondition: 'DELIVERED',
    autoReleaseAfterDays: 7,
    disputeWindowDays: 5,
    enabled: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        type: rule.type,
        holdPercentage: rule.holdPercentage,
        releaseCondition: rule.releaseCondition,
        autoReleaseAfterDays: rule.autoReleaseAfterDays,
        disputeWindowDays: rule.disputeWindowDays,
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

    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }
    if (formData.holdPercentage < 0 || formData.holdPercentage > 100) {
      newErrors.holdPercentage = 'Hold percentage must be between 0 and 100';
    }
    if (formData.autoReleaseAfterDays < 0) {
      newErrors.autoReleaseAfterDays = 'Auto release days must be positive';
    }
    if (formData.disputeWindowDays < 0) {
      newErrors.disputeWindowDays = 'Dispute window days must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSave(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {rule ? 'Edit Escrow Rule' : 'Create Escrow Rule'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              placeholder="e.g., Travel Escrow Protection"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="TRAVEL">Travel</option>
              <option value="PASTE_LINK">Paste Link</option>
              <option value="AUCTION">Auction</option>
            </select>
          </div>

          {/* Hold Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hold Percentage *
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                value={formData.holdPercentage}
                onChange={(e) => handleInputChange('holdPercentage', parseInt(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              />
              <span className="text-gray-600">%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Percentage of total amount to hold in escrow
            </p>
            {errors.holdPercentage && (
              <p className="mt-1 text-sm text-red-600">{errors.holdPercentage}</p>
            )}
          </div>

          {/* Release Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Release Condition *
            </label>
            <select
              value={formData.releaseCondition}
              onChange={(e) => handleInputChange('releaseCondition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="DELIVERED">Delivered</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="TIMEOUT">Timeout</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              When funds should be released from escrow
            </p>
          </div>

          {/* Auto Release and Dispute Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Release After (days) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.autoReleaseAfterDays}
                onChange={(e) => handleInputChange('autoReleaseAfterDays', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Days after condition to auto-release
              </p>
              {errors.autoReleaseAfterDays && (
                <p className="mt-1 text-sm text-red-600">{errors.autoReleaseAfterDays}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dispute Window (days) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.disputeWindowDays}
                onChange={(e) => handleInputChange('disputeWindowDays', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Days buyer can open disputes
              </p>
              {errors.disputeWindowDays && (
                <p className="mt-1 text-sm text-red-600">{errors.disputeWindowDays}</p>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Rule Preview</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {formData.name || 'Untitled Rule'}</div>
              <div><strong>Type:</strong> {formData.type}</div>
              <div><strong>Hold:</strong> {formData.holdPercentage}% of transaction amount</div>
              <div><strong>Release:</strong> {formData.releaseCondition} + {formData.autoReleaseAfterDays} days</div>
              <div><strong>Dispute Window:</strong> {formData.disputeWindowDays} days</div>
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
