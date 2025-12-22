// ============================================
// 🎯 Daily Challenges Component
// ============================================

import { useState } from 'react';
import type { DailyChallenge, StreakInfo } from '../../types/advanced-features';

export function DailyChallenges() {
  const [challenges] = useState<DailyChallenge[]>([
    {
      id: 'c1',
      title: 'Make a Purchase',
      description: 'Complete any purchase today',
      type: 'make_purchase',
      target: 1,
      progress: 0,
      points: 100,
      icon: '🛒',
      expiresAt: '2025-12-08T00:00:00Z',
      completed: false,
    },
    {
      id: 'c2',
      title: 'Review Products',
      description: 'Leave 3 reviews on purchased items',
      type: 'leave_review',
      target: 3,
      progress: 2,
      points: 150,
      icon: '⭐',
      expiresAt: '2025-12-08T00:00:00Z',
      completed: false,
    },
    {
      id: 'c3',
      title: 'Share a Product',
      description: 'Share any product on social media',
      type: 'share_product',
      target: 1,
      progress: 1,
      points: 50,
      icon: '📤',
      expiresAt: '2025-12-08T00:00:00Z',
      completed: true,
    },
    {
      id: 'c4',
      title: 'Daily Login',
      description: 'Log in to the app today',
      type: 'daily_login',
      target: 1,
      progress: 1,
      points: 25,
      icon: '✅',
      expiresAt: '2025-12-08T00:00:00Z',
      completed: true,
    },
    {
      id: 'c5',
      title: 'Invite a Friend',
      description: 'Invite 2 friends to join Mnbara',
      type: 'invite_friend',
      target: 2,
      progress: 0,
      points: 200,
      icon: '👥',
      expiresAt: '2025-12-08T00:00:00Z',
      completed: false,
    },
  ]);

  const [streak] = useState<StreakInfo>({
    currentStreak: 7,
    longestStreak: 15,
    lastCheckIn: '2025-12-07',
    nextReward: { day: 8, points: 200, bonus: { type: 'free_spin', value: 1 }, claimed: false },
    rewards: [
      { day: 1, points: 25, claimed: true },
      { day: 2, points: 50, claimed: true },
      { day: 3, points: 75, claimed: true },
      { day: 4, points: 100, claimed: true },
      { day: 5, points: 125, bonus: { type: 'discount', value: 5 }, claimed: true },
      { day: 6, points: 150, claimed: true },
      { day: 7, points: 175, bonus: { type: 'cashback', value: 10 }, claimed: true },
      { day: 8, points: 200, bonus: { type: 'free_spin', value: 1 }, claimed: false },
    ],
  });

  const completedCount = challenges.filter(c => c.completed).length;
  const totalPoints = challenges.reduce((sum, c) => sum + (c.completed ? c.points : 0), 0);
  const possiblePoints = challenges.reduce((sum, c) => sum + c.points, 0);

  const formatTimeRemaining = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Streak Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">🔥 {streak.currentStreak} Day Streak!</h2>
            <p className="text-white/80">Longest streak: {streak.longestStreak} days</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{totalPoints}</div>
            <div className="text-sm text-white/80">Points earned</div>
          </div>
        </div>

        {/* Streak Calendar */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {streak.rewards.map((reward, i) => (
            <div
              key={reward.day}
              className={`flex-shrink-0 w-12 h-16 rounded-xl flex flex-col items-center justify-center ${
                reward.claimed
                  ? 'bg-white/30'
                  : i === streak.currentStreak
                  ? 'bg-white text-orange-500 ring-4 ring-white/50'
                  : 'bg-white/10'
              }`}
            >
              <span className="text-xs font-bold">Day</span>
              <span className="text-lg font-bold">{reward.day}</span>
              {reward.bonus && (
                <span className="text-xs">
                  {reward.bonus.type === 'discount' && '🏷️'}
                  {reward.bonus.type === 'cashback' && '💰'}
                  {reward.bonus.type === 'free_spin' && '🎰'}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center text-sm text-white/80">
          Next reward: <span className="font-bold text-white">+{streak.nextReward.points} pts</span>
          {streak.nextReward.bonus && (
            <span className="ml-2">
              + {streak.nextReward.bonus.type === 'free_spin' && '🎰 Free Spin'}
              {streak.nextReward.bonus.type === 'discount' && `🏷️ ${streak.nextReward.bonus.value}% Off`}
              {streak.nextReward.bonus.type === 'cashback' && `💰 $${streak.nextReward.bonus.value} Cashback`}
            </span>
          )}
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-pink-500 to-indigo-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">🎯 Daily Challenges</h2>
              <p className="text-white/80">Complete challenges to earn points</p>
            </div>
            <div className="text-right">
              <div className="text-sm">Resets in</div>
              <div className="font-bold">{formatTimeRemaining()}</div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {completedCount}/{challenges.length} completed
            </span>
            <span className="text-sm font-bold text-pink-500">
              {totalPoints}/{possiblePoints} points
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full transition-all"
              style={{ width: `${(completedCount / challenges.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Challenges List */}
        <div className="divide-y">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`p-4 flex items-center gap-4 ${
                challenge.completed ? 'bg-green-50' : 'hover:bg-gray-50'
              } transition-colors`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                challenge.completed ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {challenge.completed ? '✅' : challenge.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{challenge.title}</div>
                <div className="text-sm text-gray-500">{challenge.description}</div>
                {!challenge.completed && challenge.progress > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full"
                          style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {challenge.progress}/{challenge.target}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className={`font-bold ${challenge.completed ? 'text-green-500' : 'text-gray-900'}`}>
                  +{challenge.points}
                </div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bonus Challenge */}
        {completedCount === challenges.length && (
          <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏆</span>
              <div className="flex-1">
                <div className="font-bold">All Challenges Completed!</div>
                <div className="text-sm text-white/80">Bonus reward unlocked</div>
              </div>
              <button className="px-4 py-2 bg-white text-orange-500 rounded-xl font-bold hover:bg-orange-50 transition-colors">
                Claim +100 pts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DailyChallenges;
