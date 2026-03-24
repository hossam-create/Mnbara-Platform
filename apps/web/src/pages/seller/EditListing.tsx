import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const EditListing: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string[]>([])
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'new',
    price: '',
    quantity: '1',
    shippingType: 'free',
    shippingCost: ''
  })

  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Toys & Games', 'Automotive', 'Books', 'Health & Beauty', 'Collectibles', 'Other']
  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ]

  useEffect(() => {
    // Mock fetch listing data
    setTimeout(() => {
      setForm({
        title: 'iPhone 15 Pro Max 256GB',
        description: 'Brand new iPhone 15 Pro Max with A17 Pro chip.',
        category: 'Electronics',
        condition: 'new',
        price: '4999',
        quantity: '5',
        shippingType: 'free',
        shippingCost: ''
      })
      setImagePreview(['https://picsum.photos/400?1', 'https://picsum.photos/400?2'])
      setLoading(false)
    }, 500)
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    navigate('/seller/listings')
  }

  const removeImage = (index: number) => {
    setImagePreview(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="large" /></div>
  }

  return (
    <>
      <Helmet>
        <title>Edit Listing - Mnbara</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Listing</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Update your listing details</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Images */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreview.map((src, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500">
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500 mt-2">Add Photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" />
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700">
                  {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pricing</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (SAR)</label>
                  <input type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input type="number" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button type="button" onClick={() => navigate('/seller/listings')} className="flex-1 py-3 border-2 rounded-xl font-semibold hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default EditListing
