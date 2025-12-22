import { useRef } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import MouseFollower from '../components/ui/MouseFollower';

export default function LegalLayout() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const navigationGroups = [
    {
      title: 'Buying & Ordering',
      links: [
        { name: 'Money Back Guarantee', path: '/legal/money-back' },
        { name: 'Shipping & Handover', path: '/legal/shipping' },
        { name: 'Customs & Duties', path: '/legal/customs' },
      ]
    },
    {
      title: 'Traveling & Selling',
      links: [
        { name: 'Traveler Rules', path: '/legal/traveler-rules' },
        { name: 'Listing Policies', path: '/legal/listing-policies' },
        { name: 'Fee Schedule', path: '/legal/fees' },
        { name: 'Prohibited Items', path: '/legal/prohibited-items' },
      ]
    },
    {
      title: 'Account & Privacy',
      links: [
        { name: 'User Agreement', path: '/legal/user-agreement' },
        { name: 'Privacy Policy', path: '/legal/privacy-policy' },
        { name: 'Identity Policy', path: '/legal/identity' },
        { name: 'Feedback Policy', path: '/legal/feedback' },
        { name: 'Cookie Policy', path: '/legal/cookie-policy' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
       <MouseFollower />
       
       {/* Global Header */}
       <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <span className="text-white font-bold text-lg">M</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 tracking-tight">MnBarh <span className="text-gray-400 font-normal">Policies</span></span>
              </Link>
              <div className="text-sm text-gray-500 hover:text-pink-600 cursor-pointer transition-colors">
                  Customer Service
              </div>
          </div>
       </header>

       <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row gap-10">
              {/* Sidebar Navigation - Categorized */}
              <aside className="w-full md:w-64 flex-shrink-0">
                  <nav className="sticky top-24 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                      
                      {navigationGroups.map((group, idx) => (
                        <div key={idx} className="mb-8 last:mb-0">
                           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
                              {group.title}
                           </h3>
                           <ul className="space-y-1">
                               {group.links.map((link) => (
                                   <li key={link.path}>
                                       <NavLink 
                                         to={link.path}
                                         className={({ isActive }) => `
                                             block px-3 py-2 rounded-lg text-sm font-medium transition-all
                                             ${isActive 
                                                 ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                                                 : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent'}
                                         `}
                                       >
                                           {link.name}
                                       </NavLink>
                                   </li>
                               ))}
                           </ul>
                        </div>
                      ))}
                      
                      <div className="mt-8 px-3 py-4 bg-gray-100 rounded-xl">
                          <h4 className="font-bold text-gray-900 text-sm mb-2">Need Help?</h4>
                          <p className="text-gray-500 text-xs mb-3">Our 24/7 team is ready to resolve any disputes fairly.</p>
                          <button className="text-blue-600 text-xs font-bold hover:underline">Contact Support &rarr;</button>
                      </div>
                  </nav>
              </aside>

              {/* Main Content Area */}
              <main className="flex-1 min-w-0" ref={scrollRef}>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 animate-fade-in min-h-[500px]">
                      <Outlet />
                  </div>
                  
                  <div className="mt-8 text-center text-gray-400 text-xs">
                      &copy; 2025 MnBarh Inc. All rights reserved. • <Link to="/" className="hover:underline">Home</Link> • <Link to="/legal/privacy-policy" className="hover:underline">Privacy</Link>
                  </div>
              </main>
          </div>
       </div>
    </div>
  );
}
