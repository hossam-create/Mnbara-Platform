import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline'
import ProductCard from '@/components/product/ProductCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviewCount: number
  seller: string
  condition: string
  freeShipping: boolean
}

interface Category {
  slug: string
  name: string
  description: string
  subcategories: { slug: string; name: string }[]
  productCount: number
}

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    condition: searchParams.get('condition') || '',
    sortBy: searchParams.get('sortBy') || 'relevance'
  })

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Best Rating' }
  ]

  const conditionOptions = [
    { value: '', label: 'All Conditions' },
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ]

  const getCategoryName = (s: string): string => {
    const names: Record<string, string> = {
      electronics: 'Electronics',
      fashion: 'Fashion',
      home: 'Home & Garden',
      sports: 'Sports',
      toys: 'Toys & Games',
      automotive: 'Automotive',
      books: 'Books',
      health: 'Health & Beauty'
    }
    return names[s] || s.charAt(0).toUpperCase() + s.slice(1)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const categoryData: Category = {
          slug: slug || 'electronics',
          name: getCategoryName(slug || 'electronics'),
          description: `Browse the best ${getCategoryName(slug || 'electronics')} deals`,
          subcategories: [
            { slug: 'phones', name: 'Phones' },
            { slug: 'laptops', name: 'Laptops' },
            { slug: 'tablets', name: 'Tablets' }
          ],
          productCount: 1250
        }
        setCategory(categoryData)
        
        const mockProducts: Product[] = Array.from({ length: 12 }, (_, i) => ({
          id: `prod-${i + 1}`,
          title: `${getCategoryName(slug || 'electronics')} Product ${i + 1}`,
          price: Math.floor(Math.random() * 5000) + 100,
          originalPrice: Math.random() > 0.5 ? Math.floor(Math.random() * 6000) + 500 : undefined,
          image: `https://picsum.photos/400/400?random=${i}`,
          rating: 3.5 + Math.random() * 1.5,
          reviewCount: Math.floor(Math.random() * 500),
          seller: `Seller ${i + 1}`,
          condition: ['new', 'like_new', 'good'][Math.floor(Math.random() * 3)],
          freeShipping: Math.random() > 0.5
        }))
        
        let sorted = [...mockProducts]
        if (filters.sortBy === 'price_low') sorted.sort((a, b) => a.price - b.price)
        if (filters.sortBy === 'price_high') sorted.sort((a, b) => b.price - a.price)
        if (filters.sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating)
        
        if (filters.minPrice) sorted = sorted.filter(p => p.price >= Number(filters.minPrice))
        if (filters.maxPrice) sorted = sorted.filter(p => p.price <= Number(filters.maxPrice))
        if (filters.condition) sorted = sorted.filter(p => p.condition === filters.condition)
        
        setProducts(sorted)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug, filters])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => { if (v) params.set(k, v) })
    setSearchParams(params)
  }

  const clearFilters = () => {
    setFilters({ minPrice: '', maxPrice: '', condition: '', sortBy: 'relevance' })
    setSearchParams({})
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="large" /></div>
  }

  return (
    <>
      <Helmet>
        <title>{category?.name || 'Category'} - Mnbara</title>
        <meta name="description" content={category?.description} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{category?.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{category?.productCount.toLocaleString()} products</p>
            {category?.subcategories && (
              <div className="flex flex-wrap gap-2 mt-4">
                {category.subcategories.map(sub => (
                  <button key={sub.slug} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600">
                    {sub.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg">
                <FunnelIcon className="w-5 h-5" /> Filters
              </button>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border rounded-lg p-1">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : ''}`}>
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : ''}`}>
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
            <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className="px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg">
              {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div className="flex gap-6">
            {showFilters && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-64 flex-shrink-0">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filters</h3>
                    <button onClick={clearFilters} className="text-sm text-blue-600">Clear all</button>
                  </div>
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Price Range</h4>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => handleFilterChange('minPrice', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                      <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => handleFilterChange('maxPrice', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Condition</h4>
                    {conditionOptions.map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer mb-2">
                        <input type="radio" name="condition" value={opt.value} checked={filters.condition === opt.value} onChange={e => handleFilterChange('condition', e.target.value)} className="w-4 h-4" />
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex-1">
              {products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500">No products found.</p>
                  <button onClick={clearFilters} className="mt-4 text-blue-600">Clear filters</button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
                  {products.map((product, index) => (
                    <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <ProductCard 
                        product={{
                          id: product.id,
                          title: product.title,
                          price: product.price,
                          originalPrice: product.originalPrice,
                          image: product.image,
                          rating: product.rating,
                          reviewCount: product.reviewCount,
                          seller: product.seller,
                          condition: product.condition as 'new' | 'used' | 'refurbished'
                        }} 
                        viewMode={viewMode} 
                      />
                    </motion.div>
                  ))}
                </div>
              )}
              {products.length > 0 && (
                <div className="text-center mt-8">
                  <button className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Load More</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CategoryPage
