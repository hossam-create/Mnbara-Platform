import React, { useState, useEffect } from 'react';
import apiService from '../../services/api.service';
import { PluginCard } from './PluginCard';
import { PluginDetails } from './PluginDetails';
import { PluginInstallModal } from './PluginInstallModal';
import { PluginSearch } from './PluginSearch';
import { PluginCategories } from './PluginCategories';
import { useAuth } from '../../hooks/useAuth';
import { Plugin, PluginCategory, PluginFilters } from '../../types/plugin.types';
import styles from './PluginMarketplace.module.css';

export const PluginMarketplace: React.FC = () => {
  const { user } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [installPlugin, setInstallPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PluginFilters>({
    category: 'all',
    search: '',
    sortBy: 'popular',
    price: 'all'
  });

  useEffect(() => {
    fetchPlugins();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [plugins, filters]);

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      const response = await apiService.marketplace.getPlugins();
      setPlugins(response.data?.plugins ?? []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch plugins. Please try again.');
      console.error('Error fetching plugins:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...plugins];

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(plugin => plugin.category === filters.category);
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(plugin =>
        plugin.name.toLowerCase().includes(searchTerm) ||
        plugin.description.toLowerCase().includes(searchTerm) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply price filter
    if (filters.price === 'free') {
      filtered = filtered.filter(plugin => plugin.price === 0);
    } else if (filters.price === 'paid') {
      filtered = filtered.filter(plugin => plugin.price > 0);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloadCount - a.downloadCount);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    setFilteredPlugins(filtered);
  };

  const handleInstall = (plugin: Plugin) => {
    if (!user) {
      alert('Please log in to install plugins.');
      return;
    }
    setInstallPlugin(plugin);
  };

  const handleInstallSuccess = () => {
    setInstallPlugin(null);
    fetchPlugins(); // Refresh plugin list
  };

  if (loading) {
    return (
      <div className={styles.marketplace}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading plugins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.marketplace}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchPlugins} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.marketplace}>
      <div className={styles.header}>
        <h1>Plugin Marketplace</h1>
        <p>Extend your platform with powerful plugins</p>
      </div>

      <div className={styles.filters}>
        <PluginSearch 
          value={filters.search}
          onChange={(search) => setFilters({ ...filters, search })}
        />
        <PluginCategories
          selected={filters.category}
          onChange={(category) => setFilters({ ...filters, category })}
        />
        <div className={styles.sortControls}>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            className={styles.select}
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="name">Name (A-Z)</option>
            <option value="price-low">Price (Low-High)</option>
            <option value="price-high">Price (High-Low)</option>
          </select>
          <select
            value={filters.price}
            onChange={(e) => setFilters({ ...filters, price: e.target.value })}
            className={styles.select}
          >
            <option value="all">All Prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      <div className={styles.stats}>
        <p>{filteredPlugins.length} plugins found</p>
      </div>

      <div className={styles.pluginsGrid}>
        {filteredPlugins.map((plugin) => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            onViewDetails={() => setSelectedPlugin(plugin)}
            onInstall={() => handleInstall(plugin)}
            isInstalled={plugin.isInstalled}
          />
        ))}
      </div>

      {filteredPlugins.length === 0 && (
        <div className={styles.emptyState}>
          <p>No plugins found matching your criteria.</p>
          <button onClick={() => setFilters({ category: 'all', search: '', sortBy: 'popular', price: 'all' })}>
            Clear Filters
          </button>
        </div>
      )}

      {selectedPlugin && (
        <PluginDetails
          plugin={selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onInstall={() => handleInstall(selectedPlugin)}
        />
      )}

      {installPlugin && (
        <PluginInstallModal
          plugin={installPlugin}
          onClose={() => setInstallPlugin(null)}
          onSuccess={handleInstallSuccess}
        />
      )}
    </div>
  );
};