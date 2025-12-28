import React from 'react'
import { Link } from 'react-router-dom'
import { Laptop, Smartphone, Headphones, Watch, Camera, Gamepad2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  link: string
}

const FeaturedCategories: React.FC = () => {
  const categories: Category[] = [
    {
      id: '1',
      name: 'Laptops',
      icon: <Laptop className="w-8 h-8" />,
      color: 'from-blue-400 to-blue-600',
      link: '/search?category=laptops'
    },
    {
      id: '2',
      name: 'Smartphones',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'from-green-400 to-green-600',
      link: '/search?category=smartphones'
    },
    {
      id: '3',
      name: 'Headphones',
      icon: <Headphones className="w-8 h-8" />,
      color: 'from-purple-400 to-purple-600',
      link: '/search?category=headphones'
    },
    {
      id: '4',
      name: 'Smartwatches',
      icon: <Watch className="w-8 h-8" />,
      color: 'from-pink-400 to-pink-600',
      link: '/search?category=smartwatches'
    },
    {
      id: '5',
      name: 'Cameras',
      icon: <Camera className="w-8 h-8" />,
      color: 'from-orange-400 to-orange-600',
      link: '/search?category=cameras'
    },
    {
      id: '6',
      name: 'Gaming',
      icon: <Gamepad2 className="w-8 h-8" />,
      color: 'from-red-400 to-red-600',
      link: '/search?category=gaming'
    }
  ]

  return (
    <section className="py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          The Future in Your Hands
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Explore our featured tech categories
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={category.link}
            className="group flex flex-col items-center"
          >
            {/* Circular Container */}
            <div
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 text-white mb-4`}
            >
              {category.icon}
            </div>

            {/* Category Name */}
            <h3 className="text-center font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {category.name}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default FeaturedCategories
