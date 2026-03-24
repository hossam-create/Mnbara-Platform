import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

interface Product {
  id: string
  title: string
  price: number
  image?: string
  images?: string[]
}

interface EndlessAccessoriesProps {
  products: Product[]
}

const EndlessAccessories: React.FC<EndlessAccessoriesProps> = ({ products }) => {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 300
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

  // Auto-scroll when not paused
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const container = scrollContainerRef.current
      if (!container) return

      if (container.scrollLeft < container.scrollWidth - container.clientWidth - 10) {
        container.scrollBy({ left: 300, behavior: 'smooth' })
      } else {
        container.scrollTo({ left: 0, behavior: 'smooth' })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused])

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="py-8 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900 rounded-lg px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Endless Accessories. Epic Prices.
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover amazing deals on accessories
          </p>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
          aria-label={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? (
            <Play className="w-6 h-6 text-gray-900 dark:text-white" />
          ) : (
            <Pause className="w-6 h-6 text-gray-900 dark:text-white" />
          )}
        </button>
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
              className="flex-shrink-0 w-48 group cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative w-48 h-48 mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-md group-hover:shadow-lg transition-shadow">
                <img
                  src={product.image || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Product Info */}
              <div>
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

export default EndlessAccessories
