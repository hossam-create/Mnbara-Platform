import { useCurrency } from '../../context/CurrencyContext';

export default function ProSellerHub() {
  const { formatPrice } = useCurrency();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xl font-bold">P</div>
              <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-none">Pro Hub</h1>
                  <span className="text-xs text-slate-500">for Travelers</span>
              </div>
          </div>
          <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">
                  🏆 Top Rated Seller
              </span>
              <div className="w-8 h-8 rounded-full bg-slate-200"></div>
          </div>
      </div>

      <div className="grid grid-cols-12 min-h-[calc(100vh-73px)]">
          
          {/* Sidebar */}
          <div className="col-span-2 bg-white border-r border-gray-200 p-4 hidden lg:block">
              <nav className="space-y-1">
                  {['Dashboard', 'Orders', 'Analytics', 'Listings', 'Bank Account'].map((item, idx) => (
                      <a 
                        key={item} 
                        href="#" 
                        className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${idx === 0 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                      >
                          {item}
                      </a>
                  ))}
              </nav>

              <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 text-sm mb-2">Grow your business</h4>
                  <p className="text-xs text-indigo-700 mb-3">Accept bulk orders to Dubai and earn 20% more context.</p>
                  <button className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg">View Opportunities</button>
              </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-10 p-6 lg:p-10">
              
              <div className="mb-8 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Business Overview</h2>
                    <p className="text-slate-500">Last updated: Just now</p>
                  </div>
                  <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg">
                      + Create New Trip
                  </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {[
                      { label: 'Total Revenue', value: formatPrice(15420), change: '+12%' },
                      { label: 'Active Orders', value: '8', change: '2 pending' },
                      { label: 'Rating', value: '4.95', change: '⭐ Star' },
                      { label: 'Completion Rate', value: '100%', change: 'Perfect!' },
                  ].map((stat, i) => (
                      <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          <div className="text-slate-500 text-sm mb-1 font-medium">{stat.label}</div>
                          <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
                          <div className={`text-xs font-bold ${stat.label === 'Active Orders' ? 'text-orange-500' : 'text-green-600'}`}>
                              {stat.change}
                          </div>
                      </div>
                  ))}
              </div>

              {/* Active Orders Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900">Active Shipments</h3>
                      <button className="text-indigo-600 text-sm font-bold hover:underline">View All</button>
                  </div>
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs uppercase">
                              <th className="px-6 py-4 font-bold">Order ID</th>
                              <th className="px-6 py-4 font-bold">Item</th>
                              <th className="px-6 py-4 font-bold">Route</th>
                              <th className="px-6 py-4 font-bold">Reward</th>
                              <th className="px-6 py-4 font-bold">Status</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm text-slate-700">
                          {[
                              { id: '#ORD-992', item: 'MacBook Pro M3', route: 'DXB ✈️ CAI', reward: 150, status: 'In Transit' },
                              { id: '#ORD-995', item: 'PlayStation 5', route: 'USA ✈️ KSA', reward: 120, status: 'Handling' },
                              { id: '#ORD-998', item: 'Supplements (x5)', route: 'LON ✈️ CAI', reward: 45, status: 'Pending Handover' },
                          ].map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-mono font-medium">{row.id}</td>
                                  <td className="px-6 py-4 font-bold">{row.item}</td>
                                  <td className="px-6 py-4">{row.route}</td>
                                  <td className="px-6 py-4 text-green-600 font-bold">{formatPrice(row.reward)}</td>
                                  <td className="px-6 py-4">
                                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold border border-blue-100">
                                          {row.status}
                                      </span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

          </div>
      </div>
    </div>
  );
}
