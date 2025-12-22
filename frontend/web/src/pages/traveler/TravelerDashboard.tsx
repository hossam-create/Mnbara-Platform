// ============================================
// ✈️ Traveler Dashboard - Earn While Traveling
// ============================================

import { useState, useEffect } from 'react';
import AiMatchingWidget from '../../components/ai/AiMatching';

type TravelerTab = 'overview' | 'trips' | 'requests' | 'deliveries' | 'earnings';

export function TravelerDashboard() {
  const [activeTab, setActiveTab] = useState<TravelerTab>('overview');
  // Mock data states removed until API integration
  // const [loading, setLoading] = useState(true);
  const [showAddTrip, setShowAddTrip] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      // setLoading(false);
    }
  };

  const stats = {
    totalTrips: 12,
    activeDeliveries: 3,
    completedDeliveries: 45,
    totalEarnings: 2840,
    rating: 4.9,
    thisMonthEarnings: 450,
  };

  const tabs = [
    { id: 'overview' as TravelerTab, label: 'Overview', icon: '📊' },
    { id: 'trips' as TravelerTab, label: 'My Trips', icon: '✈️' },
    { id: 'requests' as TravelerTab, label: 'Nearby Requests', icon: '📦' },
    { id: 'deliveries' as TravelerTab, label: 'Deliveries', icon: '🚚' },
    { id: 'earnings' as TravelerTab, label: 'Earnings', icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur border-2 border-white/50 p-1">
                <img src={'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'} alt="Profile" className="w-full h-full rounded-full bg-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold">Welcome back, Traveler!</h1>
                  <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                     ⭐ Gold Traveler
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex flex-col">
                      <div className="text-indigo-200 text-xs uppercase font-bold tracking-wider">Level 12</div>
                      <div className="w-32 h-2 bg-black/20 rounded-full mt-1 overflow-hidden">
                         <div className="h-full bg-white w-3/4 rounded-full"></div>
                      </div>
                   </div>
                   <div className="h-8 w-px bg-white/20"></div>
                   <div className="flex -space-x-2">
                      {['🏆','⚡','🌍','💎'].map((badge, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/30 flex items-center justify-center text-lg shadow-sm" title="Badge">
                           {badge}
                        </div>
                      ))}
                      <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/30 flex items-center justify-center text-xs font-bold shadow-sm">
                        +5
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddTrip(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all self-start md:self-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Trip
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <div className="text-3xl font-bold">{stats.activeDeliveries}</div>
              <div className="text-indigo-200 text-sm">Active Deliveries</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <div className="text-3xl font-bold">{stats.completedDeliveries}</div>
              <div className="text-indigo-200 text-sm">Completed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <div className="text-3xl font-bold">${stats.thisMonthEarnings}</div>
              <div className="text-indigo-200 text-sm">This Month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <div className="text-3xl font-bold flex items-center gap-1">
                {stats.rating}
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-indigo-200 text-sm">Rating</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-white/70 hover:text-white'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* AI Matching - Smart Requests */}
            <div className="mb-8">
              <AiMatchingWidget role="traveler" />
            </div>

            {/* Upcoming Trips */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
                <button className="text-pink-500 font-medium hover:underline">View All</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { from: 'New York, USA', to: 'Cairo, Egypt', date: 'Dec 15, 2025', requests: 8 },
                  { from: 'Dubai, UAE', to: 'London, UK', date: 'Dec 22, 2025', requests: 12 },
                ].map((trip, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-full flex items-center justify-center text-white">
                        ✈️
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-gray-800 font-medium">
                          <span>{trip.from}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span>{trip.to}</span>
                        </div>
                        <div className="text-sm text-gray-500">{trip.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        {trip.requests} matching requests
                      </span>
                      <button className="text-pink-500 font-medium hover:underline text-sm">
                        View Requests →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Nearby Requests */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Requests Near You</h2>
                <button className="text-pink-500 font-medium hover:underline">See All</button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { product: 'iPhone 15 Pro', from: 'USA', reward: 80, urgency: 'high' },
                  { product: 'MacBook Air M3', from: 'USA', reward: 120, urgency: 'medium' },
                  { product: 'Nike Air Max', from: 'UK', reward: 40, urgency: 'low' },
                ].map((req, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">{req.product}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        req.urgency === 'high' ? 'bg-red-100 text-red-600' :
                        req.urgency === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {req.urgency}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-4">From {req.from}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">${req.reward}</span>
                      <button className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors">
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Earnings Chart */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Earnings Overview</h2>
              <div className="h-64 flex items-end justify-between gap-2">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
                  const heights = [40, 65, 45, 80, 60, 75];
                  return (
                    <div key={month} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-pink-500 to-indigo-500 rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${heights[i]}%` }}
                      />
                      <span className="text-xs text-gray-500">{month}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Trips Tab */}
        {activeTab === 'trips' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Trips</h2>
            <div className="text-center py-12 text-gray-500">
              View and manage your trips here
            </div>
          </div>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Nearby Requests</h2>
            <div className="text-center py-12 text-gray-500">
              Browse requests matching your trips
            </div>
          </div>
        )}

        {/* Deliveries Tab */}
        {activeTab === 'deliveries' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Deliveries</h2>
            <div className="text-center py-12 text-gray-500">
              Track your active and past deliveries
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Earnings & Payouts</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-pink-500 to-indigo-500 rounded-xl p-6 text-white">
                <div className="text-sm opacity-80">Total Earnings</div>
                <div className="text-4xl font-bold mt-2">${stats.totalEarnings}</div>
              </div>
              <div className="bg-gray-100 rounded-xl p-6">
                <div className="text-sm text-gray-500">Available Balance</div>
                <div className="text-4xl font-bold text-gray-900 mt-2">$850</div>
                <button className="mt-4 w-full py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors">
                  Withdraw
                </button>
              </div>
              <div className="bg-gray-100 rounded-xl p-6">
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-4xl font-bold text-gray-900 mt-2">$125</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Trip Modal */}
      {showAddTrip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add New Trip</h3>
              <button onClick={() => setShowAddTrip(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input type="text" placeholder="Origin city or airport" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="text" placeholder="Destination city or airport" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                  <input type="date" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Weight (kg)</label>
                  <input type="number" placeholder="5" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all">
                Create Trip
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelerDashboard;
