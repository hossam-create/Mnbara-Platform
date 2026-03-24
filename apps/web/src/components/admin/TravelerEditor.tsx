import { useState, useEffect } from 'react';
import { Traveler, CreateTravelerData, TravelerRoute } from '../../services/travelersService';

interface TravelerEditorProps {
  traveler?: Traveler | null;
  onSave: (data: CreateTravelerData | any) => void;
  onCancel: () => void;
}

export default function TravelerEditor({ traveler, onSave, onCancel }: TravelerEditorProps) {
  const [formData, setFormData] = useState<CreateTravelerData>({
    name: '',
    email: '',
    avatar: '',
    phone: '',
    routes: [],
    feeModel: {
      type: 'flat',
      amount: 10,
      currency: 'USD'
    },
    bio: '',
    languages: [],
    preferredCategories: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (traveler) {
      setFormData({
        name: traveler.name,
        email: traveler.email,
        avatar: traveler.avatar || '',
        phone: traveler.phone || '',
        routes: traveler.routes.map(({ id, ...route }) => route),
        feeModel: traveler.feeModel,
        bio: traveler.bio || '',
        languages: traveler.languages,
        preferredCategories: traveler.preferredCategories
      });
    }
  }, [traveler]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRouteChange = (index: number, field: keyof TravelerRoute, value: any) => {
    const newRoutes = [...formData.routes];
    newRoutes[index] = { ...newRoutes[index], [field]: value };
    setFormData(prev => ({ ...prev, routes: newRoutes }));
  };

  const addRoute = () => {
    setFormData(prev => ({
      ...prev,
      routes: [...prev.routes, {
        fromCountry: '',
        toCountry: '',
        frequency: 'on-demand' as const
      }]
    }));
  };

  const removeRoute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      routes: prev.routes.filter((_, i) => i !== index)
    }));
  };

  const handleLanguagesChange = (value: string) => {
    const languages = value.split(',').map(lang => lang.trim()).filter(lang => lang);
    setFormData(prev => ({ ...prev, languages }));
  };

  const handleCategoriesChange = (value: string) => {
    const categories = value.split(',').map(cat => cat.trim()).filter(cat => cat);
    setFormData(prev => ({ ...prev, preferredCategories: categories }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.routes.length === 0) {
      newErrors.routes = 'At least one route is required';
    } else {
      formData.routes.forEach((route, index) => {
        if (!route.fromCountry.trim()) {
          newErrors[`route-${index}-from`] = 'From country is required';
        }
        if (!route.toCountry.trim()) {
          newErrors[`route-${index}-to`] = 'To country is required';
        }
      });
    }
    if (formData.feeModel.amount <= 0) {
      newErrors.feeAmount = 'Fee amount must be greater than 0';
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {traveler ? 'Edit Traveler' : 'Add New Traveler'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                placeholder="Enter traveler name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                placeholder="traveler@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                placeholder="+1 234 567 8900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => handleInputChange('avatar', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              placeholder="Brief description about the traveler..."
            />
          </div>

          {/* Routes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Routes *
              </label>
              <button
                type="button"
                onClick={addRoute}
                className="px-3 py-1 bg-brand-blue text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Route
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.routes.map((route, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Country *
                      </label>
                      <input
                        type="text"
                        value={route.fromCountry}
                        onChange={(e) => handleRouteChange(index, 'fromCountry', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                        placeholder="USA"
                      />
                      {errors[`route-${index}-from`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`route-${index}-from`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        To Country *
                      </label>
                      <input
                        type="text"
                        value={route.toCountry}
                        onChange={(e) => handleRouteChange(index, 'toCountry', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                        placeholder="UAE"
                      />
                      {errors[`route-${index}-to`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`route-${index}-to`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        value={route.frequency}
                        onChange={(e) => handleRouteChange(index, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                      >
                        <option value="on-demand">On Demand</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeRoute(index)}
                        className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.routes && (
              <p className="mt-1 text-sm text-red-600">{errors.routes}</p>
            )}
          </div>

          {/* Fee Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fee Model
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.feeModel.type}
                  onChange={(e) => handleInputChange('feeModel', {
                    ...formData.feeModel,
                    type: e.target.value as 'flat' | 'percentage'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                >
                  <option value="flat">Flat Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.feeModel.amount}
                  onChange={(e) => handleInputChange('feeModel', {
                    ...formData.feeModel,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                />
                {errors.feeAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.feeAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.feeModel.currency}
                  onChange={(e) => handleInputChange('feeModel', {
                    ...formData.feeModel,
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
            </div>
          </div>

          {/* Languages & Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages
              </label>
              <input
                type="text"
                value={formData.languages.join(', ')}
                onChange={(e) => handleLanguagesChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                placeholder="English, Arabic, French"
              />
              <p className="mt-1 text-xs text-gray-500">Separate with commas</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Categories
              </label>
              <input
                type="text"
                value={formData.preferredCategories.join(', ')}
                onChange={(e) => handleCategoriesChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                placeholder="Electronics, Fashion, Beauty"
              />
              <p className="mt-1 text-xs text-gray-500">Separate with commas</p>
            </div>
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
              {traveler ? 'Update Traveler' : 'Add Traveler'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
