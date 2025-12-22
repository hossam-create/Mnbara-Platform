// ============================================
// 📝 Listing Form for Product Creation/Editing
// ============================================

import { useState, useRef } from 'react';
import type { ListingFormData } from '../../services/seller.service';
import type { ProductCondition, ListingType, Currency } from '../../types';

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  onSubmit: (data: ListingFormData, isDraft: boolean) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'open_box', label: 'Open Box' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'used', label: 'Used' },
  { value: 'for_parts', label: 'For Parts' },
];

const LISTING_TYPES: { value: ListingType; label: string; icon: string; description: string }[] = [
  { value: 'buy_now', label: 'Buy Now', icon: '🛒', description: 'Fixed price listing' },
  { value: 'auction', label: 'Auction', icon: '🔨', description: 'Bidding starts at your price' },
  { value: 'make_offer', label: 'Make Offer', icon: '💬', description: 'Accept buyer offers' },
];

const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED'];

const CATEGORIES = [
  { id: 'electronics', name: 'Electronics', subcategories: ['Phones', 'Laptops', 'Tablets', 'Accessories'] },
  { id: 'fashion', name: 'Fashion', subcategories: ['Men', 'Women', 'Kids', 'Accessories'] },
  { id: 'home', name: 'Home & Garden', subcategories: ['Furniture', 'Decor', 'Kitchen', 'Garden'] },
  { id: 'sports', name: 'Sports', subcategories: ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports'] },
  { id: 'beauty', name: 'Beauty', subcategories: ['Skincare', 'Makeup', 'Fragrance', 'Hair Care'] },
  { id: 'automotive', name: 'Automotive', subcategories: ['Parts', 'Accessories', 'Tools', 'Electronics'] },
];

const AUCTION_DURATIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 5, label: '5 days' },
  { value: 7, label: '7 days' },
  { value: 10, label: '10 days' },
];

export function ListingForm({ initialData, onSubmit, onCancel, isLoading }: ListingFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>(initialData?.images?.map(f => URL.createObjectURL(f)) || []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<Partial<ListingFormData>>({
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    condition: 'new',
    listingType: 'buy_now',
    price: 0,
    currency: 'USD',
    stock: 1,
    brand: '',
    tags: [],
    originCountry: 'US',
    startPrice: 0,
    reservePrice: undefined,
    buyNowPrice: undefined,
    auctionDuration: 7,
    autoExtend: true,
    ...initialData,
  });

  const selectedCategory = CATEGORIES.find(c => c.id === form.categoryId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      setErrors({ ...errors, images: 'Maximum 10 images allowed' });
      return;
    }

    const newImages = [...images, ...files];
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setImages(newImages);
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviews]);
    setErrors({ ...errors, images: '' });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviewUrls(newPreviews);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title?.trim()) newErrors.title = 'Title is required';
    if (!form.description?.trim()) newErrors.description = 'Description is required';
    if (!form.categoryId) newErrors.categoryId = 'Category is required';
    if (images.length === 0) newErrors.images = 'At least one image is required';

    if (form.listingType === 'buy_now' || form.listingType === 'make_offer') {
      if (!form.price || form.price <= 0) newErrors.price = 'Price must be greater than 0';
    }

    if (form.listingType === 'auction') {
      if (!form.startPrice || form.startPrice <= 0) newErrors.startPrice = 'Starting price must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!isDraft && !validateForm()) return;

    await onSubmit({
      ...form,
      images,
    } as ListingFormData, isDraft);
  };

  return (
    <div className="space-y-6">
      {/* Images Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Images <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-5 gap-3">
          {imagePreviewUrls.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
              <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-pink-500 text-white text-xs rounded">
                  Main
                </span>
              )}
            </div>
          ))}
          {images.length < 10 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-pink-500 hover:bg-pink-50 transition-colors"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-gray-500 mt-1">Add Image</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
        <p className="text-xs text-gray-400 mt-2">Upload up to 10 images. First image will be the main photo.</p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Enter a descriptive title"
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-200'}`}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      {/* Category & Subcategory */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value, subcategoryId: '' })}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.categoryId ? 'border-red-500' : 'border-gray-200'}`}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
          <select
            value={form.subcategoryId}
            onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}
            disabled={!selectedCategory}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100"
          >
            <option value="">Select subcategory</option>
            {selectedCategory?.subcategories.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Condition & Brand */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
          <select
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value as ProductCondition })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            {CONDITIONS.map((cond) => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand (Optional)</label>
          <input
            type="text"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            placeholder="e.g., Apple, Samsung"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          placeholder="Describe your product in detail..."
          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none ${errors.description ? 'border-red-500' : 'border-gray-200'}`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Listing Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type</label>
        <div className="grid grid-cols-3 gap-3">
          {LISTING_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setForm({ ...form, listingType: type.value })}
              className={`p-4 border-2 rounded-xl text-center transition-all ${
                form.listingType === type.value
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl block mb-1">{type.icon}</span>
              <span className="block font-medium text-gray-800">{type.label}</span>
              <span className="text-xs text-gray-500">{type.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pricing - Fixed Price */}
      {(form.listingType === 'buy_now' || form.listingType === 'make_offer') && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.price || ''}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.price ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Pricing - Auction */}
      {form.listingType === 'auction' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium text-gray-900">Auction Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Starting Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.startPrice || ''}
                onChange={(e) => setForm({ ...form, startPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent ${errors.startPrice ? 'border-red-500' : 'border-gray-200'}`}
              />
              {errors.startPrice && <p className="text-red-500 text-sm mt-1">{errors.startPrice}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Price (Optional)</label>
              <input
                type="number"
                value={form.reservePrice || ''}
                onChange={(e) => setForm({ ...form, reservePrice: parseFloat(e.target.value) || undefined })}
                placeholder="Minimum price to sell"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buy It Now Price (Optional)</label>
              <input
                type="number"
                value={form.buyNowPrice || ''}
                onChange={(e) => setForm({ ...form, buyNowPrice: parseFloat(e.target.value) || undefined })}
                placeholder="Instant purchase price"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select
                value={form.auctionDuration}
                onChange={(e) => setForm({ ...form, auctionDuration: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {AUCTION_DURATIONS.map((dur) => (
                  <option key={dur.value} value={dur.value}>{dur.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoExtend}
                  onChange={(e) => setForm({ ...form, autoExtend: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Auto-extend if bid in last 2 min</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stock */}
      <div className="w-1/3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
        <input
          type="number"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 1 })}
          min="1"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-3 px-6 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isLoading}
          className="flex-1 py-3 px-6 border-2 border-pink-500 text-pink-500 rounded-xl font-bold hover:bg-pink-50 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save as Draft'}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isLoading}
          className="flex-1 py-3 px-6 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {isLoading ? 'Publishing...' : 'Publish Listing'}
        </button>
      </div>
    </div>
  );
}

export default ListingForm;
