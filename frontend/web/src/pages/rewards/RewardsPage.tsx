// ============================================
// 🎮 Rewards & Gamification Page
// ============================================

import { useState, useEffect } from 'react';
import SpinWheel from '../../components/gamification/SpinWheel';
import rewardsService from '../../services/rewards.service';
import type { RedemptionOption, RedemptionResult } from '../../services/rewards.service';
import type { SpinWheelPrize, DailyChallenge, StreakInfo, Leaderboard } from '../../types/advanced-features';
import type { RewardsAccount, RewardsTransaction } from '../../types';

type TabType = 'play' | 'challenges' | 'leaderboard' | 'history' | 'redeem';

export function RewardsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('play');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [account, setAccount] = useState<RewardsAccount | null>(null);
  const [prizes, setPrizes] = useState<SpinWheelPrize[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [transactions, setTransactions] = useState<RewardsTransaction[]>([]);
  const [redemptionOptions, setRedemptionOptions] = useState<RedemptionOption[]>([]);
  const [spinsRemaining, setSpinsRemaining] = useState(1);
  
  // Redemption state
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountData, wheelPrizes, dailyChallenges, streakInfo, lb, history, options] = await Promise.all([
        rewardsService.getRewardsAccount(),
        rewardsService.getWheelPrizes(),
        rewardsService.getDailyChallenges(),
        rewardsService.getStreakInfo(),
        rewardsService.getLeaderboard(),
        rewardsService.getTransactionHistory(),
        rewardsService.getRedemptionOptions(),
      ]);

      setAccount(accountData);
      setPrizes(wheelPrizes);
      setChallenges(dailyChallenges);
      setStreak(streakInfo);
      setLeaderboard(lb);
      setTransactions(history.transactions);
      setRedemptionOptions(options);
    } catch (error) {
      console.error('Failed to load rewards data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async () => {
    const result = await rewardsService.spinWheel();
    setSpinsRemaining(prev => prev - 1);
    return result;
  };

  const handleRedeem = async (optionId: string) => {
    setRedeeming(optionId);
    setRedemptionResult(null);
    try {
      const result = await rewardsService.redeemPoints(optionId);
      setRedemptionResult(result);
      if (result.success && account) {
        setAccount({ ...account, points: result.newBalance });
      }
    } catch (error) {
      setRedemptionResult({
        success: false,
        message: 'Failed to redeem. Please try again.',
        newBalance: account?.points || 0,
      });
    } finally {
      setRedeeming(null);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'from-gray-600 to-gray-800';
      case 'gold': return 'from-yellow-500 to-amber-600';
      case 'silver': return 'from-gray-400 to-gray-500';
      default: return 'from-orange-600 to-orange-700';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      default: return '🥉';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">🎲</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/patterns/confetti.svg')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl font-bold mb-4">🎉 Mnbara Rewards</h1>
          <p className="text-pink-100 text-lg">Play, Earn Points, and Get Exclusive Deals!</p>
          
          {/* Stats Bar */}
          <div className="flex justify-center gap-4 mt-8 flex-wrap">
            <div className={`bg-gradient-to-br ${getTierColor(account?.tier || 'bronze')} backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 shadow-lg`}>
              <div className="text-xs text-white/80 uppercase">Your Points</div>
              <div className="text-3xl font-bold">{account?.points.toLocaleString()}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span>{getTierBadge(account?.tier || 'bronze')}</span>
                <span className="text-sm capitalize">{account?.tier} Member</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
              <div className="text-xs text-pink-200 uppercase">Daily Streak</div>
              <div className="text-3xl font-bold flex items-center justify-center gap-2">
                {streak?.currentStreak} 🔥
              </div>
              <div className="text-sm text-pink-200">Best: {streak?.longestStreak} days</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
              <div className="text-xs text-pink-200 uppercase">Lifetime Earned</div>
              <div className="text-3xl font-bold">{account?.lifetimePoints.toLocaleString()}</div>
              <div className="text-sm text-pink-200">Total points</div>
            </div>
            {account?.pointsExpiringSoon && account.pointsExpiringSoon > 0 && (
              <div className="bg-red-500/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-red-300/30">
                <div className="text-xs text-red-200 uppercase">Expiring Soon</div>
                <div className="text-3xl font-bold text-red-100">{account.pointsExpiringSoon}</div>
                <div className="text-sm text-red-200">Use before {formatDate(account.expirationDate || '')}</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center gap-2 md:gap-6 overflow-x-auto">
            {[
              { id: 'play' as TabType, label: '🎡 Play', mobileLabel: '🎡' },
              { id: 'challenges' as TabType, label: '🎯 Challenges', mobileLabel: '🎯' },
              { id: 'redeem' as TabType, label: '🎁 Redeem', mobileLabel: '🎁' },
              { id: 'history' as TabType, label: '📜 History', mobileLabel: '📜' },
              { id: 'leaderboard' as TabType, label: '🏆 Leaderboard', mobileLabel: '🏆' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 md:px-6 border-b-2 font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-pink-500 text-pink-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.mobileLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Play Tab */}
        {activeTab === 'play' && (
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Spin the Wheel of Fortune!</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Use your daily free spin to win points, discounts, and exclusive prizes. 
                Come back every day for more chances!
              </p>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Start a Streak</h3>
                <div className="flex justify-between items-center relative">
                  <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-100 -z-10 rounded-full" />
                  
                  {streak?.rewards.map((reward, i) => (
                    <div key={reward.day} className="flex flex-col items-center gap-2 relative bg-white px-2">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 text-sm font-bold ${
                         i < (streak?.currentStreak || 0) 
                           ? 'border-pink-500 bg-pink-500 text-white' 
                           : 'border-gray-200 text-gray-400'
                       }`}>
                         {i < (streak?.currentStreak || 0) ? '✓' : reward.day}
                       </div>
                       <div className="text-xs text-gray-500">{reward.points}pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center bg-white rounded-full shadow-2xl p-8 border-8 border-pink-100">
              <SpinWheel 
                prizes={prizes} 
                onSpin={handleSpin} 
                spinsRemaining={spinsRemaining}
              />
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="max-w-3xl mx-auto space-y-6">
             {challenges.map(challenge => (
               <div key={challenge.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-6">
                 <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl">
                   {challenge.icon}
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-lg text-gray-900 mb-1">{challenge.title}</h3>
                   <p className="text-gray-500 text-sm mb-3">{challenge.description}</p>
                   
                   <div className="w-full bg-gray-100 h-2.5 rounded-full mb-1">
                     <div 
                       className="bg-gradient-to-r from-pink-500 to-purple-500 h-2.5 rounded-full transition-all duration-500" 
                       style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                     />
                   </div>
                   <div className="text-xs text-gray-500 text-right">
                     {challenge.progress} / {challenge.target}
                   </div>
                 </div>
                 <div className="text-center min-w-[80px]">
                   <div className="text-pink-600 font-bold text-xl">+{challenge.points}</div>
                   <div className="text-xs text-gray-400">Points</div>
                   <button 
                     disabled={challenge.progress < challenge.target || challenge.completed}
                     className="mt-2 px-4 py-1 bg-gray-900 text-white text-xs font-bold rounded-full disabled:bg-gray-200 disabled:text-gray-400"
                   >
                     {challenge.completed ? 'Claimed' : 'Claim'}
                   </button>
                 </div>
               </div>
             ))}
          </div>
        )}

        {/* Redeem Tab */}
        {activeTab === 'redeem' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Redeem Your Points</h2>
              <p className="text-gray-600">You have <span className="font-bold text-pink-600">{account?.points.toLocaleString()}</span> points available</p>
            </div>

            {redemptionResult && (
              <div className={`mb-6 p-4 rounded-xl ${redemptionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{redemptionResult.success ? '✅' : '❌'}</span>
                  <div>
                    <p className={`font-medium ${redemptionResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {redemptionResult.message}
                    </p>
                    {redemptionResult.code && (
                      <p className="text-sm text-green-700 mt-1">
                        Your code: <span className="font-mono font-bold">{redemptionResult.code}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redemptionOptions.map(option => {
                const canAfford = (account?.points || 0) >= option.pointsCost;
                return (
                  <div 
                    key={option.id} 
                    className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all ${
                      canAfford ? 'border-gray-100 hover:border-pink-300 hover:shadow-md' : 'border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="text-4xl mb-4">{option.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{option.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{option.description}</p>
                    {option.minOrderValue && (
                      <p className="text-xs text-gray-400 mb-2">Min. order: ${option.minOrderValue}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pink-600">{option.pointsCost.toLocaleString()} pts</span>
                      <button
                        onClick={() => handleRedeem(option.id)}
                        disabled={!canAfford || redeeming === option.id}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                          canAfford 
                            ? 'bg-gradient-to-r from-pink-500 to-indigo-500 text-white hover:shadow-lg' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {redeeming === option.id ? '...' : 'Redeem'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Transaction History</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <span className="text-4xl block mb-2">📭</span>
                  No transactions yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {transactions.map(tx => (
                    <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'earn' ? 'bg-green-100 text-green-600' :
                        tx.type === 'redeem' ? 'bg-pink-100 text-pink-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {tx.type === 'earn' ? '↑' : tx.type === 'redeem' ? '↓' : '⏱'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{tx.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(tx.createdAt)}</p>
                      </div>
                      <div className={`font-bold ${
                        tx.type === 'earn' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'earn' ? '+' : ''}{tx.points.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && leaderboard && (
           <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-gray-50">
               <div className="flex justify-between items-center">
                 <h2 className="font-bold text-xl">Top Earners</h2>
                 <select className="bg-white border text-sm rounded-lg px-3 py-1">
                   <option>Weekly</option>
                   <option>All Time</option>
                 </select>
               </div>
             </div>
             
             <div className="divide-y divide-gray-50">
               {leaderboard.entries.map((entry) => (
                 <div key={entry.userId} className={`p-4 flex items-center gap-4 ${entry.userId === 'me' ? 'bg-yellow-50' : ''}`}>
                   <div className="w-8 font-bold text-gray-400 text-center">
                     {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                   </div>
                   <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                      {entry.avatar ? '😊' : '👤'}
                   </div>
                   <div className="flex-1">
                     <div className="font-bold text-gray-900 flex items-center gap-2">
                       {entry.name}
                       {entry.userId === 'me' && <span className="text-xs bg-gray-200 px-2 rounded-full">You</span>}
                     </div>
                     <div className="text-xs text-gray-500 capitalize">{entry.role}</div>
                   </div>
                   <div className="text-right">
                     <div className="font-bold text-indigo-600">{entry.score.toLocaleString()}</div>
                     <div className="text-xs text-gray-400">points</div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}
      </main>
    </div>
  );
}

export default RewardsPage;
