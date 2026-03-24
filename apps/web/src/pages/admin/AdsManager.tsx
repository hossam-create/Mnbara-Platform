import { useState, useEffect } from 'react';
import adsService, { Ad, AdsFilters } from '../../services/adsService';
import AdEditor from '../../components/admin/AdEditor';
import AdCard from '../../components/admin/AdCard';

export default function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdsFilters>({
    status: 'all',
    placement: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [stats, setStats] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);

  useEffect(() => {
    loadAds();
    loadStats();
  }, [filters]);

  const loadAds = async () => {
    try {
      setLoading(true);
      const response = await adsService.getAds(filters);
      setAds(response.ads);
    } catch (err) {
      setError('Failed to load ads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await adsService.getAdStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleFilterChange = (newFilters: Partial<AdsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleToggleAd = async (adId: string, enabled: boolean) => {
    try {
      await adsService.toggleAd(adId, enabled);
      setAds(prev => 
        prev.map(ad => 
          ad.id === adId ? { ...ad, enabled } : ad
        )
      );
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to update ad');
      console.error(err);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    
    try {
      await adsService.deleteAd(adId);
      setAds(prev => prev.filter(ad => ad.id !== adId));
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to delete ad');
      console.error(err);
    }
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setShowEditor(true);
  };

  const handleCreateAd = () => {
    setEditingAd(null);
    setShowEditor(true);
  };

  const handleSaveAd = async (adData: any) => {
    try {
      if (editingAd) {
        const updatedAd = await adsService.updateAd(editingAd.id, adData);
        setAds(prev => 
          prev.map(ad => ad.id === editingAd.id ? updatedAd : ad)
        );
      } else {
        const newAd = await adsService.createAd(adData);
        setAds(prev => [newAd, ...prev]);
      }
      setShowEditor(false);
      setEditingAd(null);
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to save ad');
      console.error(err);
    }
  };

  const getAdStatus = (ad: Ad): 'active' | 'scheduled' | 'expired' => {
    const now = new Date();
    const start = new Date(ad.startDate);
    const end = new Date(ad.endDate);
    
    if (now < start) return 'scheduled';
    if (now > end) return 'expired';
    return 'active';
  };

  if (showEditor) {
    return (
      <AdEditor
        ad={editingAd}
        onSave={handleSaveAd}
        onCancel={() => {
          setShowEditor(false);
          setEditingAd(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ads Manager</h1>
        <button
          onClick={handleCreateAd}
          className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create New Ad
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-3xl">📢</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <div className="text-3xl">⏰</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
              </div>
              <div className="text-3xl">🕐</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placement
            </label>
            <select
              value={filters.placement}
              onChange={(e) => handleFilterChange({ placement: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="all">All Placements</option>
              <option value="carousel">Hero Carousel</option>
              <option value="deals">Sponsored Deals</option>
              <option value="category">Category Spotlight</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Search ads..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'all', placement: 'all', search: '', page: 1, limit: 20 })}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Ads List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📢</div>
            <p className="text-gray-500">No ads found</p>
            <button
              onClick={handleCreateAd}
              className="mt-4 text-brand-blue hover:underline"
            >
              Create your first ad
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                status={getAdStatus(ad)}
                onToggle={() => handleToggleAd(ad.id, !ad.enabled)}
                onEdit={() => handleEditAd(ad)}
                onDelete={() => handleDeleteAd(ad.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
