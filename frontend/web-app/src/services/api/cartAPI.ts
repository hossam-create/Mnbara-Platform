import { api } from './client'

export interface CartItem {
  id: string
  productId: string
  title: string
  price: number
  image: string
  quantity: number
  seller: {
    id: string
    name: string
  }
  shipping: {
    cost: number
    estimatedDays: number
  }
  selectedVariant?: {
    size?: string
    color?: string
    [key: string]: any
  }
  availability: 'in_stock' | 'limited' | 'out_of_stock'
  maxQuantity: number
}

export interface Cart {
  id: string
  items: CartItem[]
  totalItems: number
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  currency: string
  appliedCoupon?: {
    code: string
    discount: number
    type: 'percentage' | 'fixed'
  }
  estimatedDelivery?: string
  updatedAt: string
}

export interface AddToCartRequest {
  productId: string
  quantity: number
  selectedVariant?: Record<string, any>
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface ApplyCouponRequest {
  code: string
}

export interface ShippingEstimate {
  method: string
  cost: number
  estimatedDays: number
  carrier: string
}

export const cartAPI = {
  // Get current cart
  getCart: () =>
    api.get<Cart>('/cart'),

  // Add item to cart
  addItem: (data: AddToCartRequest) =>
    api.post<CartItem>('/cart/items', data),

  // Update cart item quantity
  updateItem: (itemId: string, quantity: number) =>
    api.patch<CartItem>(`/cart/items/${itemId}`, { quantity }),

  // Remove item from cart
  removeItem: (itemId: string) =>
    api.delete(`/cart/items/${itemId}`),

  // Clear entire cart
  clearCart: () =>
    api.delete('/cart'),

  // Apply coupon code
  applyCoupon: (code: string) =>
    api.post<{ code: string; discount: number; type: 'percentage' | 'fixed' }>('/cart/coupon', { code }),

  // Remove coupon
  removeCoupon: () =>
    api.delete('/cart/coupon'),

  // Get shipping estimates
  getShippingEstimates: (address: {
    country: string
    state?: string
    city?: string
    zipCode?: string
  }) =>
    api.post<ShippingEstimate[]>('/cart/shipping-estimates', address),

  // Save cart for later (guest to registered user)
  saveCart: (guestCartId?: string) =>
    api.post('/cart/save', { guestCartId }),

  // Merge carts (when user logs in)
  mergeCarts: (guestCartId: string) =>
    api.post('/cart/merge', { guestCartId }),

  // Get saved carts (multiple saved carts feature)
  getSavedCarts: () =>
    api.get('/cart/saved'),

  // Create saved cart
  createSavedCart: (name: string, items: string[]) =>
    api.post('/cart/saved', { name, items }),

  // Load saved cart
  loadSavedCart: (savedCartId: string) =>
    api.post(`/cart/saved/${savedCartId}/load`),

  // Delete saved cart
  deleteSavedCart: (savedCartId: string) =>
    api.delete(`/cart/saved/${savedCartId}`),

  // Validate cart before checkout
  validateCart: () =>
    api.post<{
      valid: boolean
      issues?: Array<{
        itemId: string
        issue: 'out_of_stock' | 'price_changed' | 'unavailable' | 'quantity_limited'
        message: string
        suggestedAction?: string
      }>
    }>('/cart/validate'),

  // Get cart recommendations (items that go well together)
  getCartRecommendations: (limit: number = 5) =>
    api.get(`/cart/recommendations?limit=${limit}`),

  // Move item to wishlist
  moveToWishlist: (itemId: string) =>
    api.post(`/cart/items/${itemId}/move-to-wishlist`),

  // Move item from wishlist to cart
  moveFromWishlist: (productId: string, quantity: number = 1) =>
    api.post('/cart/from-wishlist', { productId, quantity }),

  // Bulk operations
  bulkAddItems: (items: AddToCartRequest[]) =>
    api.post<CartItem[]>('/cart/bulk-add', { items }),

  bulkUpdateItems: (updates: Array<{ itemId: string; quantity: number }>) =>
    api.patch('/cart/bulk-update', { updates }),

  bulkRemoveItems: (itemIds: string[]) =>
    api.delete('/cart/bulk-remove', { data: { itemIds } }),

  // Cart sharing (for collaborative shopping)
  shareCart: (email: string, message?: string) =>
    api.post('/cart/share', { email, message }),

  getSharedCart: (shareToken: string) =>
    api.get<Cart>(`/cart/shared/${shareToken}`),

  // Cart analytics (for business intelligence)
  getCartAnalytics: (period: string = '30d') =>
    api.get(`/cart/analytics?period=${period}`),

  // Abandoned cart recovery
  getAbandonedCarts: (page: number = 1, limit: number = 20) =>
    api.get(`/cart/abandoned?page=${page}&limit=${limit}`),

  sendAbandonedCartEmail: (cartId: string) =>
    api.post(`/cart/abandoned/${cartId}/email`),
}