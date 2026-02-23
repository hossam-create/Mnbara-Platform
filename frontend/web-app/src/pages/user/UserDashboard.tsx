import React from 'react';
import MainLayout from '../../layouts/MainLayout';

const UserDashboard: React.FC = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your account, activity, and saved items.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/profile/activity"
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-lg font-semibold text-gray-900">Activity</div>
              <div className="text-sm text-gray-600">Unified history across Wallet, Traveler, Marketplace</div>
            </a>

            <a
              href="/user/saved-items"
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-lg font-semibold text-gray-900">Saved Items</div>
              <div className="text-sm text-gray-600">Products you bookmarked for later</div>
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserDashboard;
