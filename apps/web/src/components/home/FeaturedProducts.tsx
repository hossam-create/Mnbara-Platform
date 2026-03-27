import React from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '@/components/product/ProductCard'

interface Product {
  id: string
  title: string
  price: number
  image: string
  rating: number
  seller: string
}

interface FeaturedProductsProps {
  products: Product[]
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ products }) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Featured Products
        </h2>
        <Link
          to="/search?featured=true"
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          See all featured
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.slice(0, 10).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

export default FeaturedProducts