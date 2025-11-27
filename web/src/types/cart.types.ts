// Cart Types
export interface CartItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface CartResponse {
  success: boolean;
  cart: Cart;
}

export interface CartError {
  message: string;
  code?: string;
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: CartError;
}
