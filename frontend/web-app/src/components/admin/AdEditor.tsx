import { useState, useEffect } from 'react';
import { Ad, CreateAdData } from '../../services/adsService';

interface AdEditorProps {
  ad?: Ad | null;
  onSave: (data: CreateAdData | any) => void;
  onCancel: () => void;
}

export default function AdEditor({ ad, onSave, onCancel }: AdEditorProps) {
  const [formData, setFormData] = useState<CreateAdData>({
    title: '',
    placement: 'carousel',
    imageUrl: '',
    ctaLink: '',
    priority: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    enabled: true,
    metadata: {}
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ad) {
      setFormData({
        title: ad.title,
        placement: ad.placement,
        imageUrl: ad.imageUrl || '',
        ctaLink: ad.ctaLink,
        priority: ad.priority,
        startDate: ad.startDate.split('T')[0],
        endDate: ad.endDate.split('T')[0],
        enabled: ad.enabled,
        metadata: ad.metadata || {}
      });
    }
  }, [ad]);

  const handleInputChange = (field: keyof CreateAdData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = async (file: File) => {
    setImageFile(file);
    setUploading(true);
    
    try {
      // In a real implementation, you'd upload to your server
      // For now, we'll create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imageUrl: previewUrl }));
    } catch (error) {
      setErrors(prev => ({ ...prev, imageUrl: 'Failed to upload image' }));
    } finally {
      setUploading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.ctaLink.trim()) {
      newErrors.ctaLink = 'CTA link is required';
    }
    if (!formData.imageUrl && !imageFile) {
      newErrors.imageUrl = 'Image is required';
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = {
      ...formData,
      imageUrl: formData.imageUrl || undefined
    };

    onSave(submitData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {ad ? 'Edit Ad' : 'Create New Ad'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              placeholder="Enter ad title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Placement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placement *
            </label>
            <select
              value={formData.placement}
              onChange={(e) => handleInputChange('placement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="carousel">Hero Carousel</option>
              <option value="deals">Sponsored Deals</option>
              <option value="category">Category Spotlight</option>
            </select>
          </div>

          {/* Category (for category placement) */}
          {formData.placement === 'category' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.metadata?.categorySlug || ''}
                onChange={(e) => handleInputChange('metadata', { 
                  ...formData.metadata, 
                  categorySlug: e.target.value 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
                placeholder="electronics, fashion, etc."
              />
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image *
            </label>
            <div className="space-y-4">
              {/* Preview */}
              {(formData.imageUrl || imageFile) && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={formData.imageUrl || (imageFile ? URL.createObjectURL(imageFile) : '')}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex items-center gap-4">
                <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                  {uploading ? 'Uploading...' : 'Choose Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <span className="text-sm text-gray-500">
                  Recommended: 1200x600px, max 5MB
                </span>
              </div>
            </div>
            {errors.imageUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
            )}
          </div>

          {/* CTA Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Link *
            </label>
            <input
              type="url"
              value={formData.ctaLink}
              onChange={(e) => handleInputChange('ctaLink', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              placeholder="https://example.com/product"
            />
            {errors.ctaLink && (
              <p className="mt-1 text-sm text-red-600">{errors.ctaLink}</p>
            )}
          </div>

          {/* Priority and Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Higher number = higher priority</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Ad</h3>
              <p className="text-sm text-gray-500">Ad will be shown when enabled and within date range</p>
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
              {ad ? 'Update Ad' : 'Create Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
