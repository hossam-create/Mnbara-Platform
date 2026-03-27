import React from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store'
import { addToWatchlist, removeFromWatchlist } from '@/store/slices/userSlice'
import { addItemLocal } from '@/store/slices/cartSlice'
import { HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { clsx } from 'clsx'

interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number
  currency?: string
  images?: string[]
  image?: string
  rating?: number
  reviewCount?: number
  seller?: {
    id: string
    name: string
    rating?: number
  } | string
  condition?: 'new' | 'used' | 'refurbished'
  shipping?: {
    free: boolean
    cost?: number
    estimatedDays: number
  }
  location?: {
    city: string
    country: string
  }
}

interface ProductCardProps {
  product: Product
  className?: string
  viewMode?: 'grid' | 'list'
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className, viewMode = 'grid' }) => {
  const dispatch = useDispatch()
  const { watchlist } = useSelector((state: RootState) => state.user)
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  
  const isInWatchlist = watchlist.includes(product.id)
  const productImage = product.images?.[0] || product.image || '/placeholder-product.jpg'
  const sellerName = typeof product.seller === 'string' ? product.seller : product.seller?.name || 'Unknown Seller'
  const currency = product.currency || 'USD'

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isAuthenticated) {
      // Handle unauthenticated user - could show login modal
      return
    }

    if (isInWatchlist) {
      dispatch(removeFromWatchlist(product.id))
    } else {
      dispatch(addToWatchlist(product.id))
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dispatch(addItemLocal({
      id: `cart-${product.id}-${Date.now()}`,
      productId: product.id,
      title: product.title,
      price: product.price,
      image: productImage,
      quantity: 1,
      seller: {
        id: typeof product.seller === 'object' ? product.seller.id : 'unknown',
        name: sellerName
      },
      shipping: product.shipping || {
        cost: 0,
        estimatedDays: 7
      }
    }))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">★</span>
      )
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">☆</span>
      )
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">☆</span>
      )
    }

    return stars
  }

  return (
    <div className={clsx(
      'group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden',
      viewMode === 'list' && 'flex',
      className
    )}>
      <Link to={`/product/${product.id}`} className={clsx('block', viewMode === 'list' && 'flex w-full')}>
        {/* Product Image */}
        <div className={clsx(
          'relative overflow-hidden bg-gray-100 dark:bg-gray-700',
          viewMode === 'grid' ? 'aspect-square' : 'w-48 h-48 flex-shrink-0'
        )}>
          <img
            src={productImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          
          {/* Condition Badge */}
          {product.condition && product.condition !== 'new' && (
            <div className="absolute top-2 left-2 bg-secondary-500 text-white text-xs px-2 py-1 rounded">
              {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
            </div>
          )}

          {/* Watchlist Button */}
          <button
            onClick={handleWatchlistToggle}
            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow-md transition-shadow opacity-0 group-hover:opacity-100"
          >
            {isInWatchlist ? (
              <HeartSolidIcon className="w-4 h-4 text-red-500" />
            ) : (
              <HeartIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Free Shipping Badge */}
          {product.shipping?.free && (
            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              Free Shipping
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {product.title}
          </h3>

          {/* Price */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center space-x-1 mb-2">
              <div className="flex">
                {renderStars(product.rating)}
              </div>
              {product.reviewCount && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          {/* Seller */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {sellerName}
          </p>

          {/* Location */}
          {product.location && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {product.location.city}, {product.location.country}
            </p>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
          >
            <ShoppingCartIcon className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </Link>
    </div>
  )
}

export default ProductCard