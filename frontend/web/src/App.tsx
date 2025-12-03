import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-2xl font-display font-bold gradient-text">Mnbara</span>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for products, brands, or categories..."
                  className="w-full px-4 py-2.5 pl-12 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
                <svg className="absolute left-4 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-6">
              <button className="hidden md:block text-gray-700 hover:text-pink-500 font-medium transition-colors">
                Sell
              </button>
              <button className="hidden md:block text-gray-700 hover:text-pink-500 font-medium transition-colors">
                Travel
              </button>
              <button className="relative p-2 text-gray-700 hover:text-pink-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
              <button className="btn-primary">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 opacity-70"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-display font-black mb-6">
              Shop Global,
              <br />
              <span className="gradient-text">Ship Personal</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with travelers bringing products from around the world. Save on shipping, support real people.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl">
                Start Shopping
              </button>
              <button className="px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold border-2 border-gray-300 hover:border-pink-500 transition-all">
                Become a Traveler
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            {[
              { label: 'Active Travelers', value: '12,500+' },
              { label: 'Products Delivered', value: '45,000+' },
              { label: 'Countries', value: '85+' },
              { label: 'Avg. Savings', value: '60%' }
            ].map((stat, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-3xl md:text-4xl font-display font-bold gradient-text">{stat.value}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
            Popular Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: 'Electronics', icon: '📱', color: 'from-blue-400 to-blue-600' },
              { name: 'Fashion', icon: '👗', color: 'from-pink-400 to-pink-600' },
              { name: 'Beauty', icon: '💄', color: 'from-purple-400 to-purple-600' },
              { name: 'Sports', icon: '⚽', color: 'from-green-400 to-green-600' },
              { name: 'Home', icon: '🏠', color: 'from-orange-400 to-orange-600' },
              { name: 'Books', icon: '📚', color: 'from-indigo-400 to-indigo-600' }
            ].map((category, index) => (
              <button
                key={index}
                className="card-hover bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-gray-100 transition-all group"
              >
                <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <div className="font-semibold text-gray-800">{category.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Trending Now
            </h2>
            <button className="text-pink-500 font-semibold hover:text-pink-600 transition-colors">
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'iPhone 15 Pro Max', price: 1199, image: '📱', location: 'USA → Egypt', savings: 35 },
              { name: 'Nike Air Jordan 1', price: 180, image: '👟', location: 'UK → UAE', savings: 40 },
              { name: 'MacBook Pro M3', price: 2499, image: '💻', location: 'USA → India', savings: 30 },
              { name: 'Sony WH-1000XM5', price: 399, image: '🎧', location: 'Japan → Brazil', savings: 25 }
            ].map((product, index) => (
              <div
                key={index}
                className="card-hover bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-8xl">
                  {product.image}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 text-gray-800">{product.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-gray-900">${product.price}</span>
                    <span className="bg-green-100 text-green-700 text-sm font-semibold px-2 py-1 rounded-full">
                      Save {product.savings}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {product.location}
                  </div>
                  <button className="w-full btn-primary py-2.5 text-sm">
                    Request Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '1', title: 'Request an Item', desc: 'Browse products or post what you need from anywhere in the world', icon: '🛍️' },
              { step: '2', title: 'Match with Traveler', desc: 'Connect with verified travelers heading to your destination', icon: '✈️' },
              { step: '3', title: 'Receive & Review', desc: 'Get your item delivered personally and leave a review', icon: '📦' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-4xl shadow-lg">
                  {item.icon}
                </div>
                <div className="text-pink-500 font-bold text-lg mb-2">Step {item.step}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <span className="text-2xl font-display font-bold">Mnbara</span>
              </div>
              <p className="text-gray-400">Connecting shoppers with travelers worldwide.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Shop</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Electronics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fashion</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Beauty</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 Mnbara. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
