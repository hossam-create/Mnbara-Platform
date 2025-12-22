// ============================================
// 🏆 Leaderboard Component
// ============================================

import { useState } from 'react';
import type { Leaderboard, LeaderboardEntry } from '../../types/advanced-features';

interface LeaderboardProps {
  initialData?: Leaderboard;
}

export function LeaderboardComponent({ initialData }: LeaderboardProps) {
  const [activeType, setActiveType] = useState<'buyers' | 'sellers' | 'travelers' | 'overall'>('overall');
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('weekly');

  // Mock data
  const mockEntries: LeaderboardEntry[] = [
    { rank: 1, userId: 'u1', name: 'Ahmed Mohamed', avatar: '', role: 'buyer', score: 15420, badge: '👑', change: 'same' },
    { rank: 2, userId: 'u2', name: 'Sarah Store', avatar: '', role: 'seller', score: 14850, badge: '🏆', change: 'up', previousRank: 4 },
    { rank: 3, userId: 'u3', name: 'Mike Traveler', avatar: '', role: 'traveler', score: 13200, badge: '🥉', change: 'down', previousRank: 2 },
    { rank: 4, userId: 'u4', name: 'Fatima Shop', avatar: '', role: 'seller', score: 12100, change: 'up', previousRank: 6 },
    { rank: 5, userId: 'u5', name: 'John Buyer', avatar: '', role: 'buyer', score: 11500, change: 'same' },
    { rank: 6, userId: 'u6', name: 'Omar Express', avatar: '', role: 'traveler', score: 10800, change: 'up', previousRank: 10 },
    { rank: 7, userId: 'u7', name: 'Lisa Premium', avatar: '', role: 'seller', score: 9900, change: 'down', previousRank: 5 },
    { rank: 8, userId: 'u8', name: 'Ali Express', avatar: '', role: 'traveler', score: 9200, change: 'same' },
    { rank: 9, userId: 'u9', name: 'Mona Fashion', avatar: '', role: 'seller', score: 8700, change: 'up', previousRank: 12 },
    { rank: 10, userId: 'u10', name: 'David VIP', avatar: '', role: 'buyer', score: 8100, change: 'down', previousRank: 8 },
  ];

  const userRank: LeaderboardEntry = {
    rank: 156,
    userId: 'me',
    name: 'You',
    role: 'buyer',
    score: 2450,
    change: 'up',
    previousRank: 180,
  };

  const getRoleColor = (role: string) => {
    const colors = {
      buyer: 'bg-blue-100 text-blue-700',
      seller: 'bg-green-100 text-green-700',
      traveler: 'bg-purple-100 text-purple-700',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getRoleIcon = (role: string) => {
    const icons = { buyer: '🛒', seller: '🏪', traveler: '✈️' };
    return icons[role as keyof typeof icons] || '👤';
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getChangeIndicator = (entry: LeaderboardEntry) => {
    if (entry.change === 'up') {
      const diff = entry.previousRank ? entry.previousRank - entry.rank : 0;
      return <span className="text-green-500 text-sm">↑ {diff}</span>;
    }
    if (entry.change === 'down') {
      const diff = entry.previousRank ? entry.rank - entry.previousRank : 0;
      return <span className="text-red-500 text-sm">↓ {diff}</span>;
    }
    return <span className="text-gray-400 text-sm">—</span>;
  };

  const types = [
    { id: 'overall' as const, label: 'Overall', icon: '🌟' },
    { id: 'buyers' as const, label: 'Buyers', icon: '🛒' },
    { id: 'sellers' as const, label: 'Sellers', icon: '🏪' },
    { id: 'travelers' as const, label: 'Travelers', icon: '✈️' },
  ];

  const periods = [
    { id: 'daily' as const, label: 'Today' },
    { id: 'weekly' as const, label: 'This Week' },
    { id: 'monthly' as const, label: 'This Month' },
    { id: 'alltime' as const, label: 'All Time' },
  ];

  const filteredEntries = activeType === 'overall' 
    ? mockEntries 
    : mockEntries.filter(e => e.role === activeType.slice(0, -1));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-indigo-500 p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">🏆 Leaderboard</h2>
        <p className="text-white/80">Compete with others and win exclusive rewards!</p>
      </div>

      {/* Type Tabs */}
      <div className="border-b p-4">
        <div className="flex gap-2 overflow-x-auto">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                activeType === type.id
                  ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Period Tabs */}
      <div className="border-b px-4 py-2">
        <div className="flex gap-4">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setActivePeriod(period.id)}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                activePeriod === period.id
                  ? 'text-pink-500 border-b-2 border-pink-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex justify-center items-end gap-4 mb-8">
          {/* 2nd Place */}
          {filteredEntries[1] && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-2xl">{getRoleIcon(filteredEntries[1].role)}</span>
              </div>
              <span className="text-2xl">🥈</span>
              <span className="font-bold text-gray-900 text-sm">{filteredEntries[1].name}</span>
              <span className="text-xs text-gray-500">{filteredEntries[1].score.toLocaleString()} pts</span>
              <div className="bg-gray-200 w-20 h-16 rounded-t-lg mt-2" />
            </div>
          )}

          {/* 1st Place */}
          {filteredEntries[0] && (
            <div className="flex flex-col items-center -mt-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mb-2 shadow-xl ring-4 ring-yellow-200">
                <span className="text-3xl">{getRoleIcon(filteredEntries[0].role)}</span>
              </div>
              <span className="text-3xl">🥇</span>
              <span className="font-bold text-gray-900">{filteredEntries[0].name}</span>
              <span className="text-sm text-gray-500">{filteredEntries[0].score.toLocaleString()} pts</span>
              <div className="bg-gradient-to-t from-yellow-400 to-yellow-300 w-24 h-24 rounded-t-lg mt-2" />
            </div>
          )}

          {/* 3rd Place */}
          {filteredEntries[2] && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center mb-2 shadow-lg">
                <span className="text-2xl">{getRoleIcon(filteredEntries[2].role)}</span>
              </div>
              <span className="text-2xl">🥉</span>
              <span className="font-bold text-gray-900 text-sm">{filteredEntries[2].name}</span>
              <span className="text-xs text-gray-500">{filteredEntries[2].score.toLocaleString()} pts</span>
              <div className="bg-orange-200 w-20 h-12 rounded-t-lg mt-2" />
            </div>
          )}
        </div>
      </div>

      {/* Full List */}
      <div className="divide-y">
        {filteredEntries.slice(3).map((entry) => (
          <div key={entry.userId} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 text-center font-bold text-gray-400">
              {getRankMedal(entry.rank)}
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              {entry.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{entry.name}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(entry.role)}`}>
                {entry.role}
              </span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-900">{entry.score.toLocaleString()}</div>
              {getChangeIndicator(entry)}
            </div>
          </div>
        ))}
      </div>

      {/* Your Rank */}
      <div className="bg-pink-50 border-t-2 border-pink-500 p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 text-center font-bold text-pink-500">
            #{userRank.rank}
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center text-white font-bold">
            👤
          </div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900">{userRank.name} (You)</div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(userRank.role)}`}>
              {userRank.role}
            </span>
          </div>
          <div className="text-right">
            <div className="font-bold text-pink-500">{userRank.score.toLocaleString()}</div>
            {getChangeIndicator(userRank)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardComponent;
