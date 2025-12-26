import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from '@/store'
import { fetchFeaturedProducts, fetchRecommendedProducts } from '@/store/slices/productSlice'
import { getTrendingSearches } from '@/store/slices/searchSlice'
import { Helmet } from 'react-helmet-async'
import HeroSection from '@/components/home/HeroSection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import Categories from '@/components/home/Categories'
import TrendingSearches from '@/components/home/TrendingSearches'
import RecommendedProducts from '@/components/home/RecommendedProducts'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import LiveDealsSection from '@/components/home/LiveDealsSection'
import AuctionCountdown from '@/components/home/AuctionCountdown'
import RecentlyViewed from '@/components/home/RecentlyViewed'
import ReviewsCarousel from '@/components/home/ReviewsCarousel'
import TrustBadges from '@/components/home/TrustBadges'

const HomePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { featuredProducts, recommendedProducts, isLoading } = useSelector(
    (state: RootState) => state.products
  )
  const { trendingSearches } = useSelector((state: RootState) => state.search)
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Fetch featured products
    dispatch(fetchFeaturedProducts())
    
    // Fetch trending searches
    dispatch(getTrendingSearches())
    
    // Fetch personalized recommendations for authenticated users
    if (isAuthenticated && user) {
      dispatch(fetchRecommendedProducts(user.id))
    }
  }, [dispatch, isAuthenticated, user])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Mnbara - Your eBay-Level Marketplace for Everything</title>
        <meta 
          name="description" 
          content="Discover millions of products on Mnbara. Buy and sell electronics, fashion, home & garden, collectibles, and more at great prices." 
        />
        <meta name="keywords" content="marketplace, buy, sell, electronics, fashion, home, garden, collectibles" />
        <link rel="canonical" href="https://mnbara.com" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <HeroSection />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {/* Categories */}
          <Categories />

          {/* Live Deals */}
          <LiveDealsSection />

          {/* Live Auctions */}
          <AuctionCountdown />

          {/* Trending Searches */}
          {trendingSearches.length > 0 && (
            <TrendingSearches searches={trendingSearches} />
          )}

          {/* Featured Products */}
          {featuredProducts.length > 0 && (
            <FeaturedProducts products={featuredProducts} />
          )}

          {/* Recently Viewed */}
          <RecentlyViewed />

          {/* Personalized Recommendations */}
          {isAuthenticated && recommendedProducts.length > 0 && (
            <RecommendedProducts products={recommendedProducts} />
          )}

          {/* Customer Reviews */}
          <ReviewsCarousel />

          {/* Trust Badges */}
          <TrustBadges />

          {/* Additional sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Selling CTA */}
            <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Start Selling Today</h2>
              <p className="text-secondary-100 mb-6">
                Turn your unused items into cash. It's easy to sell on Mnbara.
              </p>
              <button className="bg-white text-secondary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Start Selling
              </button>
            </div>

            {/* App Download */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Shop on the Go</h2>
              <p className="text-primary-100 mb-6">
                Download our mobile app for the best shopping experience.
              </p>
              <div className="flex space-x-4">
                <button className="bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm">
                  App Store
                </button>
                <button className="bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm">
                  Google Play
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HomePage