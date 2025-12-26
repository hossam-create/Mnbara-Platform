import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { 
  ShoppingCartIcon, 
  HeartIcon, 
  ShareIcon, 
  StarIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { addToCart } from '@/store/slices/cartSlice'
import { RootState, AppDispatch } from '@/store'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { api } from '@/services/api/client'

interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  images: string[]
  category: string
  condition: 'new' | 'like_new' | 'good' | 'fair'
  seller: {
    id: string
    name: string
    rating: number
    totalSales: number
    avatar?: string
    verified: boolean
  }
  shipping: {
    free: boolean
    cost?: number
    estimatedDays: string
    location: string
  }
  stock: number
  specifications: { label: string; value: string }[]
  rating: number
  reviewCount: number
  createdAt: string
}

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await api.get<Product>(`/products/${id}`)
      setProduct(response.data)
    } catch (err: any) {
      // Mock data for demo
      setProduct({
        id: id || '1',
        title: 'iPhone 15 Pro Max 256GB - Natural Titanium',
        description: 'Brand new iPhone 15 Pro Max with A17 Pro chip, titanium design, and advanced camera system. Includes original box, charger, and 1-year warranty.',
        price: 4999,
        originalPrice: 5499,
        currency: 'SAR',
        images: [
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800',
        ],
        category: 'Electronics',
        condition: 'new',
        seller: {
          id: 'seller1',
          name: 'TechStore Pro',
          rating: 4.9,
          totalSales: 1250,
          verified: true
        },
        shipping: {
          free: true,
          estimatedDays: '2-3',
          location: 'Riyadh, Saudi Arabia'
        },
        stock: 15,
        specifications: [
          { label: 'Storage', value: '256GB' },
          { label: 'Color', value: 'Natural Titanium' },
          { label: 'Display', value: '6.7" Super Retina XDR' },
          { label: 'Chip', value: 'A17 Pro' },
          { label: 'Camera', value: '48MP Main + 12MP Ultra Wide' },
        ],
        rating: 4.8,
        reviewCount: 324,
        createdAt: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/product/${id}` } })
      return
    }
    
    if (!product) return
    
    setAddingToCart(true)
    try {
      dispatch(addToCart({ productId: product.id, quantity }))
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: `/product/${id}` } })
      return
    }
    handleAddToCart()
    navigate('/checkout')
  }

  const toggleWishlist = () => {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }
    setIsWishlisted(!isWishlisted)
  }

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      new: 'New',
      like_new: 'Like New',
      good: 'Good',
      fair: 'Fair'
    }
    return labels[condition] || condition
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Product Not Found
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mx-auto"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const discount = product.originalPrice 
    ? Math.round((1 - product.price / product.originalPrice) * 100) 
    : 0

  return (
    <>
      <Helmet>
        <title>{product.title} - Mnbara</title>
        <meta name="description" content={product.description.slice(0, 160)} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <button onClick={() => navigate('/')} className="hover:text-blue-600">Home</button>
            <span>/</span>
            <button onClick={() => navigate(`/category/${product.category.toLowerCase()}`)} className="hover:text-blue-600">
              {product.category}
            </button>
            <span>/</span>
            <span className="text-gray-900 dark:text-white truncate max-w-xs">{product.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
                <img
                  src={product.images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
                
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : product.images.length - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white"
                    >
                      <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev < product.images.length - 1 ? prev + 1 : 0)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white"
                    >
                      <ChevronRightIcon className="w-6 h-6" />
                    </button>
                  </>
                )}

                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Product Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-3">
                  {getConditionLabel(product.condition)}
                </span>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                  {product.title}
                </h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    i < Math.floor(product.rating) 
                      ? <StarSolidIcon key={i} className="w-5 h-5 text-yellow-400" />
                      : <StarIcon key={i} className="w-5 h-5 text-gray-300" />
                  ))}
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {product.price.toLocaleString()} {product.currency}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">
                    {product.originalPrice.toLocaleString()} {product.currency}
                  </span>
                )}
              </div>

              {/* Shipping Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <TruckIcon className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.shipping.free ? 'Free Shipping' : `Shipping: ${product.shipping.cost} ${product.currency}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      Estimated delivery: {product.shipping.estimatedDays} days
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-6 h-6 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{product.shipping.location}</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-gray-700 dark:text-gray-300">Quantity:</span>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300 dark:border-gray-600">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">{product.stock} available</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 border-2 border-blue-600 text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={toggleWishlist}
                  className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-red-500 transition-colors"
                >
                  {isWishlisted 
                    ? <HeartSolidIcon className="w-6 h-6 text-red-500" />
                    : <HeartIcon className="w-6 h-6" />
                  }
                </button>
              </div>

              {/* Seller Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold">{product.seller.name[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {product.seller.name}
                        </span>
                        {product.seller.verified && (
                          <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                        <span>{product.seller.rating}</span>
                        <span>•</span>
                        <span>{product.seller.totalSales} sales</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    View Store
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                  <span>Buyer Protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-blue-500" />
                  <span>30-Day Returns</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Description & Specifications */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Specifications</h2>
              <dl className="space-y-3">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="flex justify-between">
                    <dt className="text-gray-500">{spec.label}</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductPage
