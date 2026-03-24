import React, { useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import ActivityTabs, { type ActivityTabValue } from '../../components/profile/ActivityTabs';
import ActivityList from '../../components/profile/ActivityList';
import { useActivity } from '../../hooks/useActivity';

const ActivityPage: React.FC = () => {
  const [active, setActive] = useState<ActivityTabValue>('all');
  const { data, isLoading, error } = useActivity(active);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Activity</h1>
            <p className="mt-2 text-gray-600">Unified history across Wallet, Traveler, and Marketplace</p>
          </div>

          <div className="mb-6">
            <ActivityTabs active={active} onChange={setActive} />
          </div>

          {isLoading && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-700">
              Loading activity...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
              Failed to load activity: {error.message}
            </div>
          )}

          {!isLoading && !error && <ActivityList items={data ?? []} />}
        </div>
      </div>
    </MainLayout>
  );
};

export default ActivityPage;
