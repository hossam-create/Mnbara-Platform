import React from 'react';
import type { ActivityDomain } from '../../services/activity/types';

export type ActivityTabValue = ActivityDomain | 'all';

interface Props {
  active: ActivityTabValue;
  onChange: (domain: ActivityTabValue) => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={
      `px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 ` +
      (active
        ? 'bg-yellow-500 text-white'
        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50')
    }
  >
    {children}
  </button>
);

const ActivityTabs: React.FC<Props> = ({ active, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <TabButton active={active === 'all'} onClick={() => onChange('all')}>
        All
      </TabButton>
      <TabButton active={active === 'wallet'} onClick={() => onChange('wallet')}>
        Wallet
      </TabButton>
      <TabButton active={active === 'traveler'} onClick={() => onChange('traveler')}>
        Traveler
      </TabButton>
      <TabButton active={active === 'marketplace'} onClick={() => onChange('marketplace')}>
        Marketplace
      </TabButton>
    </div>
  );
};

export default ActivityTabs;
