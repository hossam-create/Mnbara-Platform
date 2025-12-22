// ============================================
// 🎯 AI Matching Component (Crowdshipping)
// ============================================

import { useState } from 'react';

interface Match {
  id: string;
  type: 'order' | 'trip';
  score: number;
  details: {
    title: string;
    route: string;
    date: string;
    reward: number;
    avatar: string;
  };
  reasons: string[];
}

export function AiMatchingWidget({ role }: { role: 'traveler' | 'buyer' }) {
  const [matches] = useState<Match[]>([
    {
      id: '1',
      type: 'order',
      score: 98,
      details: {
        title: 'iPhone 15 Pro Max',
        route: 'Dubai 🇦🇪 ➔ Cairo 🇪🇬',
        date: 'Flexible (before Dec 20)',
        reward: 45,
        avatar: '📱',
      },
      reasons: ['Exact route match', 'High reward', 'Fits in luggage (0.5kg)'],
    },
    {
      id: '2',
      type: 'order',
      score: 85,
      details: {
        title: 'Designer Shoes (Nike)',
        route: 'London 🇬🇧 ➔ Cairo 🇪🇬',
        date: 'Before Dec 15',
        reward: 25,
        avatar: '👟',
      },
      reasons: ['Route match', 'Good trusted buyer'],
    },
    {
      id: '3',
      type: 'order',
      score: 72,
      details: {
        title: 'MacBook Pro 16"',
        route: 'Dubai 🇦🇪 ➔ Cairo 🇪🇬',
        date: 'Urgent (Dec 10)',
        reward: 120,
        avatar: '💻',
      },
      reasons: ['High reward', 'Route match', 'Requires safe handling'],
    },
  ]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
            🧩
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Smart Matches</h3>
            <p className="text-sm text-gray-500">
              AI found {matches.length} {role === 'traveler' ? 'orders' : 'travelers'} for you
            </p>
          </div>
        </div>
        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="group relative bg-white border-2 border-transparent hover:border-indigo-100 rounded-xl p-4 transition-all hover:shadow-lg hover:-translate-y-1">
            {/* Match Score Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold border border-green-100">
              <span>{match.score}% Match</span>
              <div className="w-16 h-1.5 bg-green-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${match.score}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-3xl">
                {match.details.avatar}
              </div>
              <div className="flex-1 pt-1">
                <h4 className="font-bold text-gray-900 mb-1">{match.details.title}</h4>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    ✈️ {match.details.route}
                  </span>
                  <span className="flex items-center gap-1">
                    📅 {match.details.date}
                  </span>
                </div>
                
                {/* AI Reasons */}
                <div className="flex flex-wrap gap-2">
                  {match.reasons.map((reason, i) => (
                     <span key={i} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-medium border border-indigo-100 flex items-center gap-1">
                       ✨ {reason}
                     </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-end justify-end">
                <div className="text-lg font-bold text-pink-600 mb-2">
                  ${match.details.reward}
                  <span className="text-xs text-gray-400 font-normal ml-1">reward</span>
                </div>
                <button className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors">
                  {role === 'traveler' ? 'Make Offer' : 'Request'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AiMatchingWidget;
