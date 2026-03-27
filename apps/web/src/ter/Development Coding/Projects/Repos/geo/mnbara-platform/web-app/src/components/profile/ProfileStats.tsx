/**
 * ProfileStats Component
 * Displays user statistics in a card format
 */

import React from 'react';
import type { UserStats } from '../../types/profile';
import './ProfileStats.css';

interface ProfileStatsProps {
  stats: UserStats;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  const formatMemberDuration = (months: number) => {
    if (months < 12) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
    return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  };

  const statItems = [
    { label: 'Total Purchases', value: stats.totalPurchases, icon: '🛒' },
    { label: 'Total Sales', value: stats.totalSales, icon: '💰' },
    { label: 'Active Listings', value: stats.totalListings, icon: '📦' },
    { label: 'Reviews Received', value: stats.totalReviews, icon: '⭐' },
    { label: 'Avg. Rating', value: stats.averageRating.toFixed(1), icon: '📊' },
    { label: 'Response Rate', value: `${stats.responseRate}%`, icon: '💬' },
    { label: 'Delivery Rate', value: `${stats.deliveryRate}%`, icon: '🚚' },
    { label: 'Dispute Rate', value: `${stats.disputeRate}%`, icon: '⚖️' },
    { label: 'Member Duration', value: formatMemberDuration(stats.memberDurationMonths), icon: '📅' },
  ];

  return (
    <div className="mnbara-profile-stats">
      <h3 className="mnbara-profile-stats__title">Statistics</h3>
      <div className="mnbara-profile-stats__grid">
        {statItems.map((item, index) => (
          <div key={index} className="mnbara-profile-stats__item">
            <span className="mnbara-profile-stats__icon">{item.icon}</span>
            <span className="mnbara-profile-stats__value">{item.value}</span>
            <span className="mnbara-profile-stats__label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileStats;
