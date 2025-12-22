// ============================================
// 🎁 Rewards Redemption Component for Checkout
// ============================================

import { useState, useEffect } from 'react';
import rewardsService from '../../services/rewards.service';
import type { RewardsAccount } from '../../types';

interface RewardsRedemptionProps {
  subtotal: number;
  onApplyDiscount: (discount: number, pointsUsed: number) => void;
  onRemoveDiscount: () => void;
  appliedDiscount?: number;
  disabled?: boolean;
}

// Points to dollar conversion rate (100 points = $1)
const POINTS_TO_DOLLAR_RATE = 100;
const MAX_DISCOUNT_PERCENTAGE = 0.5; // Max 50% of subtotal

export function RewardsRedemption({
  subtotal,
  onApplyDiscount,
  onRemoveDiscount,
  appliedDiscount = 0,
  disabled = false,
}: RewardsRedemptionProps) {
  const [account, setAccount] = useState<RewardsAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const data = await rewardsService.getRewardsAccount();
        setAccount(data);
      } catch (error) {
        console.error('Failed to fetch rewards account:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, []);

  // Calculate max discount
  const maxDiscountFromPoints = account ? account.points / POINTS_TO_DOLLAR_RATE : 0;
  const maxDiscountFromSubtotal = subtotal * MAX_DISCOUNT_PERCENTAGE;
  const maxDiscount = Math.min(maxDiscountFromPoints, maxDiscountFromSubtotal);

  const handleApply = () => {
    const discount = pointsToUse / POINTS_TO_DOLLAR_RATE;
    onApplyDiscount(discount, pointsToUse);
  };

  const handleRemove = () => {
    setPointsToUse(0);
    onRemoveDiscount();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!account || account.points < POINTS_TO_DOLLAR_RATE) {
    return null; // Don't show if no points or less than minimum
  }

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full p-4 flex items-center justify-between hover:bg-pink-100/50 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div className="text-left">
            <p className="font-medium text-pink-800">Use Rewards Points</p>
            <p className="text-sm text-pink-600">
              {account.points.toLocaleString()} pts available ({formatCurrency(maxDiscountFromPoints)} value)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {appliedDiscount > 0 && (
            <span className="px-2 py-1 bg-pink-500 text-white text-xs font-bold rounded-full">
              -{formatCurrency(appliedDiscount)}
            </span>
          )}
          <svg
            className={`w-5 h-5 text-pink-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-pink-200">
          <div className="pt-4">
            <p className="text-sm text-pink-700 mb-4">
              Convert your points to savings! (100 points = $1, max {Math.round(MAX_DISCOUNT_PERCENTAGE * 100)}% of order)
            </p>

            {appliedDiscount > 0 ? (
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-pink-200">
                <div>
                  <p className="font-medium text-pink-800">
                    {Math.round(appliedDiscount * POINTS_TO_DOLLAR_RATE).toLocaleString()} points applied
                  </p>
                  <p className="text-sm text-pink-600">Saving {formatCurrency(appliedDiscount)}</p>
                </div>
                <button
                  onClick={handleRemove}
                  disabled={disabled}
                  className="px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-pink-700">Points to use:</span>
                    <span className="font-bold text-pink-800">
                      {pointsToUse.toLocaleString()} pts = {formatCurrency(pointsToUse / POINTS_TO_DOLLAR_RATE)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.round(maxDiscount * POINTS_TO_DOLLAR_RATE)}
                    step={100}
                    value={pointsToUse}
                    onChange={(e) => setPointsToUse(parseInt(e.target.value))}
                    disabled={disabled}
                    className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-pink-500 mt-1">
                    <span>0 pts</span>
                    <span>{Math.round(maxDiscount * POINTS_TO_DOLLAR_RATE).toLocaleString()} pts</span>
                  </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex gap-2 mb-4">
                  {[25, 50, 100].map((percentage) => {
                    const points = Math.round((maxDiscount * POINTS_TO_DOLLAR_RATE * percentage) / 100);
                    if (points < POINTS_TO_DOLLAR_RATE) return null;
                    return (
                      <button
                        key={percentage}
                        onClick={() => setPointsToUse(points)}
                        disabled={disabled}
                        className="flex-1 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors disabled:opacity-50"
                      >
                        {percentage}%
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPointsToUse(Math.round(maxDiscount * POINTS_TO_DOLLAR_RATE))}
                    disabled={disabled}
                    className="flex-1 py-2 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
                  >
                    Max
                  </button>
                </div>

                <button
                  onClick={handleApply}
                  disabled={disabled || pointsToUse < POINTS_TO_DOLLAR_RATE}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply {formatCurrency(pointsToUse / POINTS_TO_DOLLAR_RATE)} Discount
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RewardsRedemption;
