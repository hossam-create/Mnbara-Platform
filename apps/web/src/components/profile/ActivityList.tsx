import React from 'react';
import type { UnifiedActivity } from '../../services/activity/types';
import ActivityCard from './ActivityCard';

interface Props {
  items: UnifiedActivity[];
}

const ActivityList: React.FC<Props> = ({ items }) => {
  if (!items.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-lg font-semibold text-gray-900 mb-1">No activity yet</div>
        <div className="text-sm text-gray-600">When you use Wallet, Traveler, or Marketplace features, it will show up here.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((item) => (
        <ActivityCard key={`${item.domain}:${item.id}`} item={item} />
      ))}
    </div>
  );
};

export default ActivityList;
