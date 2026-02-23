import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../hooks/useAuth';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  seller: string;
  originCountry: string;
  deliveryCountry: string;
}

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock cart data for MVP
    const mockCartItems: CartItem[] = [
      {
        id: '1',
        name: 'Colombian Coffee Beans',
        price: 29.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4a0b0e?w=200',
        seller: 'coffee_colombia',
        originCountry: 'Colombia',
        deliveryCountry: 'US'
      },
      {
        id: '2',
        name: 'Swiss Chocolate',
        price: 45.50,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1553452118-621e1f860f43?w=200',
        seller: 'swiss_chocolate_co',
        originCountry: 'Switzerland',
        deliveryCountry: 'US'
      }
    ];
    
    setTimeout(() => {
      setCartItems(mockCartItems);
      setLoading(false);
    }, 1000);
  }, []);

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getServiceFee = () => {
    return cartItems.length * 2.99; // $2.99 per order
  };

  const getTotalWithFee = () => {
    return getTotalPrice() + getServiceFee();
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6">Please log in to view your cart</p>
            <Link to="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
            <Link to="/search">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Items ({cartItems.length})</h2>
              
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">From: {item.originCountry}</p>
                      <p className="text-sm text-gray-600">Deliver to: {item.deliveryCountry}</p>
                      <p className="text-sm text-gray-600">Seller: {item.seller}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-brand-blue">${item.price}</span>
                        <span className="text-sm text-gray-500">×</span>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="px-2 min-w-[2rem] text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee ({cartItems.length} orders)</span>
                  <span>${getServiceFee().toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${getTotalWithFee().toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Traveler Service:</strong> A traveler will bring your items from {cartItems[0]?.originCountry} to {cartItems[0]?.deliveryCountry}
                </p>
              </div>
              
              <Link to="/checkout">
                <Button className="w-full mb-2">
                  Proceed to Checkout
                </Button>
              </Link>
              
              <Link to="/search">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}