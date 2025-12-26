import React from 'react'
import ProductCard from '@/components/product/ProductCard'

interface Product {
  id: string
  title: string
  price: number
  image: string
  rating: number
  seller: string
}

interface RecommendedProductsProps {
  products: Product[]
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({ products }) => {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Recommended for You
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Based on your browsing history and preferences
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.slice(0, 10).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

export default RecommendedProducts