import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface ListingForm {
  title: string
  description: string
  category: string
  condition: string
  price: string
  quantity: string
  images: File[]
  shippingType: 'free' | 'paid' | 'pickup'
  shippingCost: string
}

const CreateListing: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string[]>([])
  
  const [form, setForm] = useState<ListingForm>({
    title: '',
    description: '',
    category: '',
    condition: 'new',
    price: '',
    quantity: '1',
    images: [],
    shippingType: 'free',
    shippingCost: ''
  })

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Toys & Games',
    'Automotive', 'Books', 'Health & Beauty', 'Collectibles', 'Other'
  ]

  const conditions = [
    { value: 'new', label: 'New', desc: 'Brand new, unused item' },
    { value: 'like_new', label: 'Like New', desc: 'Used once or twice, perfect condition' },
    { value: 'good', label: 'Good', desc: 'Minor signs of use' },
    { value: 'fair', label: 'Fair', desc: 'Visible wear but fully functional' }
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + form.images.length > 10) {
      alert('Maximum 10 images allowed')
      return
    }
    
    const newImages = [...form.images, ...files]
    setForm({ ...form, images: newImages })
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
    setImagePreview(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      navigate('/seller/listings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Create Listing - Mnbara</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Listing</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Fill in the details to list your item for sale</p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Photos</h2>
              <p className="text-sm text-gray-500 mb-4">Add up to 10 photos. First photo will be the cover.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreview.map((src, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">Cover</span>
                    )}
                  </div>
                ))}
                
                {imagePreview.length < 10 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500 mt-2">Add Photo</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </motion.div>

            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                    placeholder="e.g., iPhone 15 Pro Max 256GB - Natural Titanium"
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.title.length}/80 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                  <select
                    required
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                  <textarea
                    required
                    rows={5}
                    maxLength={5000}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                    placeholder="Describe your item in detail..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{form.description.length}/5000 characters</p>
                </div>
              </div>
            </motion.div>

            {/* Condition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Condition</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {conditions.map(cond => (
                  <label
                    key={cond.value}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                      form.condition === cond.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={cond.value}
                      checked={form.condition === cond.value}
                      onChange={e => setForm({ ...form, condition: e.target.value })}
                      className="sr-only"
                    />
                    <p className="font-medium text-gray-900 dark:text-white">{cond.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{cond.desc}</p>
                  </label>
                ))}
              </div>
            </motion.div>

            {/* Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pricing & Inventory</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (SAR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
            </motion.div>

            {/* Shipping */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Shipping</h2>
              
              <div className="space-y-3">
                {[
                  { value: 'free', label: 'Free Shipping', desc: 'You cover shipping costs' },
                  { value: 'paid', label: 'Buyer Pays Shipping', desc: 'Buyer pays for shipping' },
                  { value: 'pickup', label: 'Local Pickup Only', desc: 'No shipping, buyer picks up' }
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer ${
                      form.shippingType === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={opt.value}
                      checked={form.shippingType === opt.value}
                      onChange={e => setForm({ ...form, shippingType: e.target.value as any })}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{opt.label}</p>
                      <p className="text-sm text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {form.shippingType === 'paid' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shipping Cost (SAR)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.shippingCost}
                    onChange={e => setForm({ ...form, shippingCost: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700"
                    placeholder="25"
                  />
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default CreateListing
