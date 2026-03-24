import React from 'react';
import { PluginMarketplace } from '../../components/plugin-marketplace';
import Layout from '../../layouts/Layout';

const PluginMarketplacePage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <PluginMarketplace />
      </div>
    </Layout>
  );
};

export default PluginMarketplacePage;