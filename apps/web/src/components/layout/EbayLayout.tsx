import { ReactNode } from 'react';

interface EbayLayoutProps {
  children: ReactNode;
}

export default function EbayLayout({ children }: EbayLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <EbayHeader />
      <EbayCategoryNav />
      <main className="flex-1">
        {children}
      </main>
      <EbayFooter />
    </div>
  );
}

// ============ HEADER ============
function EbayHeader() {
  return (
    <header className="border-b border-gray-200">
      {/* Top Bar */}
      <div className="bg-white">
        <div className="max-w-[1200px] mx-auto px-4 py-1.5 flex justify-between text-xs">
          <div className="flex gap-4 text-gray-600">
            <span>Hi! <a href="/auth/login" className="text-[#0654ba] hover:underline">Sign in</a> or <a href="/auth/register" className="text-[#0654ba] hover:underline">register</a></span>
            <a href="#" className="hover:underline">Daily Deals</a>
            <a href="#" className="hover:underline">Brand Outlet</a>
            <a href="/help" className="hover:underline">Help & Contact</a>
          </div>
          <div className="flex gap-4 text-gray-600">
            <a href="/sell" className="hover:underline">Sell</a>
            <a href="/watchlist" className="hover:underline flex items-center gap-1">
              Watchlist
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <a href="/orders" className="hover:underline flex items-center gap-1">
              My eBay
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <a href="#" className="hover:underline flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </a>
            <a href="/cart" className="hover:underline">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-[1200px] mx-auto px-4 py-2 flex items-center gap-4">
        {/* Logo */}
        <a href="/" className="flex-shrink-0">
          <svg width="100" height="40" viewBox="0 0 100 40">
            <text x="0" y="32" fontSize="32" fontWeight="bold" fontFamily="Arial">
              <tspan fill="#e53238">M</tspan>
              <tspan fill="#0064d2">n</tspan>
              <tspan fill="#f5af02">b</tspan>
              <tspan fill="#86b817">a</tspan>
              <tspan fill="#3665f3">r</tspan>
              <tspan fill="#e53238">a</tspan>
            </text>
          </svg>
        </a>

        {/* Shop by category */}
        <div className="relative group">
          <button className="text-sm text-gray-700 hover:underline flex items-center gap-1 py-2">
            Shop by category
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex">
          <input
            type="text"
            placeholder="Search for anything"
            className="flex-1 border border-gray-400 border-r-0 rounded-l-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#0654ba] focus:ring-1 focus:ring-[#0654ba]"
          />
          <select className="border border-gray-400 border-x-0 px-3 py-2.5 text-sm bg-gray-50 text-gray-600 focus:outline-none">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Home & Garden</option>
            <option>Motors</option>
            <option>Collectibles</option>
          </select>
          <button className="bg-[#3665f3] text-white px-6 rounded-r-full hover:bg-[#2a4dc7] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Advanced */}
        <a href="/search" className="text-xs text-[#0654ba] hover:underline whitespace-nowrap">Advanced</a>
      </div>
    </header>
  );
}

// ============ CATEGORY NAV ============
function EbayCategoryNav() {
  return (
    <nav className="hidden md:block border-t border-gray-100 bg-white">
      <div className="max-w-[1200px] mx-auto px-4">
        <ul className="flex items-center gap-6 h-12 text-sm">
          <li><a href="#" className="text-gray-700 hover:text-[#0654ba] hover:underline transition-colors">Electronics</a></li>
          <li><a href="#" className="text-gray-700 hover:text-[#0654ba] hover:underline">Fashion</a></li>
          <li><a href="#" className="text-gray-700 hover:text-[#0654ba] hover:underline">Home & Garden</a></li>
          <li><a href="#" className="text-gray-700 hover:text-[#0654ba] hover:underline">Motors</a></li>
          <li><a href="#" className="text-gray-700 hover:text-[#0654ba] hover:underline">Collectibles</a></li>
          <li><a href="#" className="font-semibold text-[#e53238] hover:underline">Deals</a></li>
          <li className="ml-auto">
            <a href="#" className="px-4 py-1.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">Sell</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

// ============ FOOTER ============
function EbayFooter() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Buy Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Buy</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Registration</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">eBay Money Back Guarantee</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Bidding & buying help</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Stores</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">eBay for Charity</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Charity Shop</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Seasonal Sales and events</a></li>
            </ul>
          </div>

          {/* Sell Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Sell</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Start selling</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">How to sell</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Business sellers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Affiliates</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Tools & apps</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Developers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Partners</a></li>
            </ul>
          </div>

          {/* Stay Connected Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Stay connected</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Facebook</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Twitter</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Instagram</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">YouTube</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">LinkedIn</a></li>
            </ul>
          </div>

          {/* About Mnbara Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">About Mnbara</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Company info</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">News</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Investors</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Careers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Diversity & Inclusion</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Global Impact</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Government relations</a></li>
            </ul>
          </div>

          {/* Help & Contact Column */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Help & Contact</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Seller Center</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Contact Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">eBay Returns</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Site Map</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Help & Contact</a></li>
              <li><a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Security Center</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Copyright © 1995-2026 Mnbara Inc. All Rights Reserved.
            </div>
            <div className="flex items-center gap-4 text-sm">
              <a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Accessibility</a>
              <a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">User Agreement</a>
              <a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Consumer Health Data</a>
              <a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Payments Terms of Use</a>
              <a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Cookies</a>
              <a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">CA Privacy Notice</a>
              <a href="#" className="text-gray-600 hover:text-[#0654ba] hover:underline">Privacy & Legal</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
