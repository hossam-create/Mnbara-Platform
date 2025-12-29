import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI } from '../services/api/cartAPI';
import { productAPI } from '../services/api/productAPI';

export const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const cart = await cartAPI.getCart();
        setCartItems(cart);

        // Load product details
        const productIds = Object.keys(cart);
        const productDetails: any = {};
        for (const id of productIds) {
          const product = await productAPI.getProductById(id);
          productDetails[id] = product;
        }
        setProducts(productDetails);
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  const handleRemove = async (productId: string) => {
    await cartAPI.removeFromCart(productId);
    setCartItems(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemove(productId);
    } else {
      await cartAPI.updateQuantity(productId, quantity);
      setCartItems(prev => ({
        ...prev,
        [productId]: quantity,
      }));
    }
  };

  const calculateTotal = () => {
    return Object.entries(cartItems).reduce((total, [productId, quantity]) => {
      const product = products[productId];
      return total + (product?.price || 0) * (quantity as number);
    }, 0);
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  if (Object.keys(cartItems).length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <button
          onClick={() => navigate('/products')}
          className="px-6 py-2 bg-blue-500 text-white rounded"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page p-6">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {Object.entries(cartItems).map(([productId, quantity]) => {
            const product = products[productId];
            if (!product) return null;

            return (
              <div key={productId} className="flex gap-4 p-4 border rounded mb-4">
                <img
                  src={product.images?.[0] || 'https://via.placeholder.com/100'}
                  alt={product.title}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-bold">{product.title}</h3>
                  <p className="text-gray-600">${product.price}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleUpdateQuantity(productId, (quantity as number) - 1)}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span className="px-4 py-1">{quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(productId, (quantity as number) + 1)}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleRemove(productId)}
                      className="ml-auto px-4 py-1 bg-red-500 text-white rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-gray-100 p-6 rounded h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>$0.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded font-bold"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};
