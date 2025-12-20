// ============================================
// 📦 Product Detail Page
// ============================================

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ProductCard } from '../../components/products/ProductCard';
import { productApi, reviewApi, cartApi } from '../../services/api';
import { buyerService } from '../../services/buyer.service';
import AdvisoryPanel from '../../components/buyer/AdvisoryPanel';
import type { Product, Review, SearchResult } from '../../types';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Product state
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Related products
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  
  // UI state
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [addingToCart, setAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Advisory state
  const [advisoryRecommendations, setAdvisoryRecommendations] = useState<any[]>([]);
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);

  // Load product data
  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  // Load related products when product is loaded
  useEffect(() => {
    if (product) {
      loadRelatedProducts();
      loadReviews(1);
      loadAdvisoryData(product.id);
    }
  }, [product?.id]);
  
  const loadAdvisoryData = async (productId: string) => {
    setLoadingAdvisory(true);
    try {
      const recommendations = await buyerService.getAdvisoryRecommendations(productId);
      setAdvisoryRecommendations(recommendations);
    } catch (err) {
      console.error('Failed to load advisory data:', err);
      // Use mock data as fallback
      setAdvisoryRecommendations(buyerService.getMockTrustData(productId).recommendations);
    } finally {
      setLoadingAdvisory(false);
    }
  };

  const loadProduct = async (productId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await productApi.get(productId);
      if (response.data.success && response.data.data) {
        setProduct(response.data.data);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      setError('Failed to load product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    if (!product) return;
    
    setLoadingRelated(true);
    try {
      const response = await productApi.getRecommended();
      if (response.data.success && response.data.data) {
        // Filter out current product and limit to 4
        const filtered = response.data.data
          .filter(p => p.id !== product.id)
          .slice(0, 4);
        setRelatedProducts(filtered);
      }
    } catch (err) {
      console.error('Failed to load related products:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const loadReviews = async (page: number) => {
    if (!product) return;
    
    setLoadingReviews(true);
    try {
      const response = await reviewApi.getForProduct(product.id, page);
      if (response.data.success && response.data.data) {
        const { items, totalPages } = response.data.data as SearchResult<Review>;
        if (page === 1) {
          setReviews(items);
        } else {
          setReviews(prev => [...prev, ...items]);
        }
        setHasMoreReviews(page < totalPages);
        setReviewsPage(page);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      await cartApi.addItem(product.id, quantity);
      // Show success feedback (could use a toast notification)
      alert('Added to cart!');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    try {
      await cartApi.addItem(product.id, quantity);
      navigate('/checkout');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to proceed. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Call wishlist API
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-3xl animate-pulse" />
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-12 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Product not found'}</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/products"
            className="px-6 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const discountPercent = product.price < (product as any).originalPrice
    ? Math.round((1 - product.price / (product as any).originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-pink-500">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-pink-500">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category.id}`} className="hover:text-pink-500">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden relative group">
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="text-9xl">📦</div>
              )}
              
              {/* Image navigation arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    aria-label="Previous image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImage(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    aria-label="Next image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnail gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square bg-white rounded-xl border-2 flex items-center justify-center overflow-hidden transition-all ${
                      selectedImage === i ? 'border-pink-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Product Details */}
          <div>
            {/* Title & Rating */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  product.condition === 'new' ? 'bg-green-100 text-green-700' :
                  product.condition === 'open_box' ? 'bg-blue-100 text-blue-700' :
                  product.condition === 'used' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {product.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                {product.brand && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {product.brand}
                  </span>
                )}
                {product.listingType === 'auction' && (
                  <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-medium rounded-full">
                    🔨 Auction
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className={`w-5 h-5 ${star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-1 font-semibold">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{product.totalReviews} reviews</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{product.views} views</span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  {formatCurrency(product.price, product.currency)}
                </span>
                {discountPercent > 0 && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      {formatCurrency((product as any).originalPrice, product.currency)}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-lg">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-orange-500 text-sm mt-2">⚠️ Only {product.stock} left in stock!</p>
              )}
              {product.stock === 0 && (
                <p className="text-red-500 text-sm mt-2">❌ Out of stock</p>
              )}
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-100 rounded-xl">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-12 h-12 flex items-center justify-center text-xl font-bold text-gray-600 hover:text-gray-900 transition-colors"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.stock} items available
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <button 
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingToCart}
                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button 
                onClick={handleBuyNow}
                disabled={product.stock === 0 || addingToCart}
                className="flex-1 py-4 border-2 border-pink-500 text-pink-500 text-lg font-bold rounded-xl hover:bg-pink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
              <button 
                onClick={handleWishlistToggle}
                className={`w-14 h-14 border-2 rounded-xl flex items-center justify-center transition-colors ${
                  isWishlisted 
                    ? 'border-red-500 bg-red-50 text-red-500' 
                    : 'border-gray-200 hover:border-red-500 hover:text-red-500'
                }`}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg 
                  className="w-6 h-6" 
                  fill={isWishlisted ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>

            {/* Advisory Panel */}
            {advisoryRecommendations.length > 0 && (
              <div className="mb-6">
                <AdvisoryPanel
                  recommendations={advisoryRecommendations}
                  onActionClick={(action) => {
                    console.log('Advisory action clicked:', action);
                  }}
                />
              </div>
            )}

            {/* Shipping Info */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🚚</span>
                <div>
                  <span className="font-semibold text-green-600">Free Shipping</span>
                  <span className="text-gray-600"> • Ships from {product.originCountry}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-2xl">✈️</span>
                <div>
                  <span className="font-semibold text-indigo-600">Traveler Delivery Available</span>
                  <span className="text-gray-600 block text-sm">Get it faster via a verified traveler</span>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                  {product.seller.avatarUrl ? (
                    <img src={product.seller.avatarUrl} alt={product.seller.fullName} className="w-full h-full object-cover" />
                  ) : (
                    product.seller.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <Link to={`/seller/${product.seller.id}`} className="font-bold text-gray-900 hover:text-pink-500">
                    {product.seller.fullName}
                  </Link>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {product.seller.rating.toFixed(1)}
                    </span>
                    <span>|</span>
                    <span>{product.seller.totalReviews} reviews</span>
                  </div>
                </div>
                <Link
                  to={`/chat?seller=${product.seller.id}`}
                  className="px-4 py-2 border border-pink-500 text-pink-500 rounded-xl font-medium hover:bg-pink-50 transition-colors"
                >
                  💬 Chat
                </Link>
              </div>
              {product.seller.kycVerified && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Seller
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Tabs Section */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              {(['description', 'specs', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 font-semibold capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-pink-500 text-pink-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  {tab === 'reviews' && ` (${product.totalReviews})`}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-600 text-lg whitespace-pre-line">{product.description}</p>
                
                {product.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, i) => (
                        <Link
                          key={i}
                          to={`/products?q=${encodeURIComponent(tag)}`}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specs Tab */}
            {activeTab === 'specs' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Category</span>
                  <span className="font-semibold">{product.category.name}</span>
                </div>
                <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Condition</span>
                  <span className="font-semibold capitalize">{product.condition.replace('_', ' ')}</span>
                </div>
                {product.brand && (
                  <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                    <span className="text-gray-500">Brand</span>
                    <span className="font-semibold">{product.brand}</span>
                  </div>
                )}
                <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Ships From</span>
                  <span className="font-semibold">{product.originCountry}</span>
                </div>
                <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Stock</span>
                  <span className="font-semibold">{product.stock} available</span>
                </div>
                <div className="flex justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-gray-500">Listed</span>
                  <span className="font-semibold">{formatDate(product.createdAt)}</span>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                {/* Reviews Summary */}
                <div className="flex items-center gap-8 mb-8 p-6 bg-gray-50 rounded-2xl">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900">{product.rating.toFixed(1)}</div>
                    <div className="flex justify-center mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          className={`w-5 h-5 ${star <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{product.totalReviews} reviews</div>
                  </div>
                </div>

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white rounded-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold overflow-hidden">
                            {review.reviewer.avatarUrl ? (
                              <img src={review.reviewer.avatarUrl} alt={review.reviewer.fullName} className="w-full h-full object-cover" />
                            ) : (
                              review.reviewer.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{review.reviewer.fullName}</div>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star} 
                                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {review.title && <h4 className="font-semibold mb-2">{review.title}</h4>}
                        <p className="text-gray-600">{review.comment}</p>
                        
                        {/* Review images */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-4">
                            {review.images.map((img, i) => (
                              <img 
                                key={i} 
                                src={img} 
                                alt={`Review image ${i + 1}`} 
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* Seller response */}
                        {review.response && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-pink-500">
                            <div className="text-sm font-semibold text-gray-700 mb-1">Seller Response</div>
                            <p className="text-gray-600 text-sm">{review.response.content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Load more reviews */}
                    {hasMoreReviews && (
                      <div className="text-center">
                        <button
                          onClick={() => loadReviews(reviewsPage + 1)}
                          disabled={loadingReviews}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          {loadingReviews ? 'Loading...' : 'Load More Reviews'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600">Be the first to review this product!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">You May Also Like</h2>
              <Link to="/products" className="text-pink-500 hover:underline font-medium">
                View All →
              </Link>
            </div>
            
            {loadingRelated ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    onAddToCart={(p) => console.log('Add to cart:', p)}
                    onAddToWishlist={(p) => console.log('Add to wishlist:', p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;
