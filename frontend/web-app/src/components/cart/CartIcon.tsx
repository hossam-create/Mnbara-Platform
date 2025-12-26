import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'

const CartIcon: React.FC = () => {
  const { totalItems } = useSelector((state: RootState) => state.cart)

  return (
    <div className="relative">
      <ShoppingCartIcon className="w-6 h-6" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </div>
  )
}

export default CartIcon