import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AiAssistant from '../components/ai/AiAssistant';
import StoriesBar from '../components/social/StoriesBar';
import InteractiveGlobe from '../components/social/InteractiveGlobe';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { currency, setCurrency } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mock notifications for the UI
  const notifications = [
    { id: 1, text: 'Shipment #SH-992 has arrived in Cairo', time: '2m ago', unread: true },
    { id: 2, text: 'New offer on your iPhone request', time: '1h ago', unread: false }
  ];

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'dark bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <span className="text-white font-black text-xl tracking-tighter">M</span>
              </div>
              <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-indigo-600 hidden md:block tracking-tight">
                MNBARA
              </span>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products, travelers, or routes..."
                  className="w-full px-4 py-2.5 pl-12 pr-24 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all dark:text-white"
                />
                <span className="absolute left-4 top-3 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Global Controls */}
            <div className="flex items-center space-x-4">
              {/* Currency Selector */}
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="hidden md:block bg-transparent text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
              >
                <option value="USD">🇺🇸 USD</option>
                <option value="SAR">🇸🇦 SAR</option>
                <option value="EGP">🇪🇬 EGP</option>
              </select>

              {/* Language Selector */}
              <button 
                onClick={() => setLanguage(language === 'EN' ? 'AR' : 'EN')}
                className="hidden md:block text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-pink-500 transition-colors"
              >
                {language}
              </button>

              {/* Dark Mode Toggle */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-pink-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-pink-500 transition-colors relative"
                >
                  🔔
                  {notifications.some(n => n.unread) && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                  )}
                </button>

                {/* Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
                      <button className="text-xs text-pink-500 font-bold hover:underline">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(note => (
                        <div key={note.id} className={`p-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0 ${note.unread ? 'bg-pink-50/50 dark:bg-pink-900/10' : ''}`}>
                          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{note.text}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{note.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Link to="/login" className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Live Ticker */}
      <div className="bg-slate-900 text-white text-xs py-2 overflow-hidden border-b border-slate-800 relative z-40">
        <div className="flex gap-8 px-4 items-center justify-center">
             <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 🚀 Ahmed W. (Cairo) made $150 delivering iPhones</span>
             <span className="text-slate-700">|</span>
             <span className="flex items-center gap-1">📦 New Request: MacBook Pro from Dubai to Riyadh (Reward: $80)</span>
        </div>
      </div>

      {/* Stories Bar */}
      <StoriesBar />

      {/* Hero Section */}
      <section className="pt-12 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
           <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-indigo-600">
                    A Global Market
                    <br />
                    <span className="text-slate-900 dark:text-white">In Your Pocket</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto lg:mx-0 font-light">
                    Connect with travelers. Shop the world. Save on shipping. secure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                    <button className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full font-bold text-lg shadow-xl shadow-pink-500/20 hover:scale-105 transition-transform">
                        Start Shopping
                    </button>
                    <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white rounded-full font-bold border-2 border-slate-200 dark:border-slate-700 hover:border-pink-500 transition-colors">
                        Become a Traveler
                    </button>
                </div>
              </div>

              {/* Interactive Globe Placeholder */}
              <div className="hidden lg:block h-[500px] w-full bg-slate-100 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌍</div>
                    <p className="font-mono text-slate-500">INTERACTIVE GLOBE DEPLOYED</p>
                  </div>
              </div>
           </div>

           {/* Stats */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-slate-200 dark:border-slate-800 pt-10">
            {[
              { label: 'Active Travelers', value: '12,500+' },
              { label: 'Products Delivered', value: '45,000+' },
              { label: 'Countries', value: '85+' },
              { label: 'Avg. Savings', value: '60%' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Seals */}
      <section className="bg-slate-900 py-16 px-4">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-12 text-center">
               {[
                   { icon: '🛡️', title: 'Blockchain Secure', desc: 'Verified Contracts' },
                   { icon: '💰', title: 'Money Back Guarantee', desc: '100% Refund Policy' },
                   { icon: '⭐', title: 'Top Rated Travelers', desc: 'Identity Verified' },
                   { icon: '💬', title: '24/7 Support', desc: 'Always here for you' }
               ].map((seal, i) => (
                   <div key={i} className="flex flex-col items-center gap-2 max-w-xs">
                       <div className="text-4xl mb-2">{seal.icon}</div>
                       <div className="font-bold text-white text-lg">{seal.title}</div>
                       <div className="text-sm text-slate-400">{seal.desc}</div>
                   </div>
               ))}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-pink-600 to-indigo-600 flex items-center justify-center font-bold">M</div>
                <span className="font-bold tracking-tight">MNBARA</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
                <a href="#" className="hover:text-white transition-colors">Contact</a>
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
            <div className="text-xs text-slate-600">
                © 2025 MnBarh Inc. Secure Fortress Architecture.
            </div>
        </div>
      </footer>
      
      <AiAssistant />
    </div>
  );
};

export default Home;
