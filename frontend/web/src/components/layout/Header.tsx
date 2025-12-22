import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 hidden sm:block">
                Marketplace
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 sm:mx-6 lg:mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for anything"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm sm:text-base"
              >
                Search
              </button>
            </form>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4 sm:space-x-6">
            <Link to="/sell" className="text-gray-700 hover:text-blue-600 text-sm sm:text-base hidden sm:block">
              Sell
            </Link>
            
            <div className="relative group hidden sm:block">
              <button className="text-gray-700 hover:text-blue-600 text-sm sm:text-base">
                Categories
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                <div className="py-2">
                  <Link to="/category/electronics" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm">
                    Electronics
                  </Link>
                  <Link to="/category/fashion" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm">
                    Fashion
                  </Link>
                  <Link to="/category/home" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-sm">
                    Home & Garden
                  </Link>
                </div>
              </div>
            </div>

            <Link to="/cart" className="text-gray-700 hover:text-blue-600 text-sm sm:text-base">
              <span className="hidden sm:inline">Cart</span>
              <span className="sm:hidden">🛒</span>
            </Link>

            <Link to="/login" className="text-gray-700 hover:text-blue-600 text-sm sm:text-base hidden sm:block">
              Sign In
            </Link>

            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Register</span>
              <span className="sm:hidden">Join</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;