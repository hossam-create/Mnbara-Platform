import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Product {
  id: string
  title: string
  price: number
  image?: string
  images?: string[]
}

interface TrendingProductsProps {
  products: Product[]
}

const TrendingProducts: React.FC<TrendingProductsProps> = ({ products }) => {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 400
    const newPosition = direction === 'left' 
      ? scrollPosition - scrollAmount 
      : scrollPosition + scrollAmount

    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    })
    setScrollPosition(newPosition)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScrollEvent = () => {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      )
    }

    container.addEventListener('scroll', handleScrollEvent)
    handleScrollEvent()

    return () => container.removeEventListener('scroll', handleScrollEvent)
  }, [])

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Trending on Mnbara
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Check out what's hot right now
        </p>
      </div>

      <div className="relative">
        {/* Scroll Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6 text-gray-900 dark:text-white" />
          </button>
        )}

        {/* Products Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 px-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-40 group cursor-pointer"
            >
              {/* Circular Image Container */}
              <div className="relative w-40 h-40 mb-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-md group-hover:shadow-lg transition-shadow">
                <img
                  src={product.image || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Product Info */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">
                  {product.name}
                </h3>
                <p className="text-primary-600 dark:text-primary-400 font-bold text-sm">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrendingProducts
