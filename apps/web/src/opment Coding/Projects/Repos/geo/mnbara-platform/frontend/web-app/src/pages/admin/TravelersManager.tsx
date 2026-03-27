import { useState, useEffect } from 'react';
import travelersService, { Traveler, TravelersFilters } from '../../services/travelersService';
import TravelerCard from '../../components/admin/TravelerCard';
import TravelerEditor from '../../components/admin/TravelerEditor';

export default function TravelersManager() {
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TravelersFilters>({
    status: 'all',
    verification: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [stats, setStats] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTraveler, setEditingTraveler] = useState<Traveler | null>(null);

  useEffect(() => {
    loadTravelers();
    loadStats();
  }, [filters]);

  const loadTravelers = async () => {
    try {
      setLoading(true);
      const response = await travelersService.getTravelers(filters);
      setTravelers(response.travelers);
    } catch (err) {
      setError('Failed to load travelers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await travelersService.getTravelerStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleFilterChange = (newFilters: Partial<TravelersFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleApproveTraveler = async (travelerId: string) => {
    try {
      await travelersService.approveTraveler(travelerId);
      setTravelers(prev => 
        prev.map(traveler => 
          traveler.id === travelerId 
            ? { ...traveler, status: 'approved' as const }
            : traveler
        )
      );
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to approve traveler');
      console.error(err);
    }
  };

  const handleSuspendTraveler = async (travelerId: string, reason?: string) => {
    if (!confirm('Are you sure you want to suspend this traveler?')) return;
    
    try {
      await travelersService.suspendTraveler(travelerId, reason);
      setTravelers(prev => 
        prev.map(traveler => 
          traveler.id === travelerId 
            ? { ...traveler, status: 'suspended' as const }
            : traveler
        )
      );
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to suspend traveler');
      console.error(err);
    }
  };

  const handleDeleteTraveler = async (travelerId: string) => {
    if (!confirm('Are you sure you want to delete this traveler? This action cannot be undone.')) return;
    
    try {
      await travelersService.deleteTraveler(travelerId);
      setTravelers(prev => prev.filter(traveler => traveler.id !== travelerId));
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to delete traveler');
      console.error(err);
    }
  };

  const handleEditTraveler = (traveler: Traveler) => {
    setEditingTraveler(traveler);
    setShowEditor(true);
  };

  const handleCreateTraveler = () => {
    setEditingTraveler(null);
    setShowEditor(true);
  };

  const handleSaveTraveler = async (travelerData: any) => {
    try {
      if (editingTraveler) {
        const updatedTraveler = await travelersService.updateTraveler(editingTraveler.id, travelerData);
        setTravelers(prev => 
          prev.map(traveler => traveler.id === editingTraveler.id ? updatedTraveler : traveler)
        );
      } else {
        const newTraveler = await travelersService.createTraveler(travelerData);
        setTravelers(prev => [newTraveler, ...prev]);
      }
      setShowEditor(false);
      setEditingTraveler(null);
      loadStats(); // Refresh stats
    } catch (err) {
      setError('Failed to save traveler');
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isVerified = (traveler: Traveler) => {
    return traveler.verificationStatus.idVerified && 
           traveler.verificationStatus.ratingBadge;
  };

  if (showEditor) {
    return (
      <TravelerEditor
        traveler={editingTraveler}
        onSave={handleSaveTraveler}
        onCancel={() => {
          setShowEditor(false);
          setEditingTraveler(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Travelers Manager</h1>
        <button
          onClick={handleCreateTraveler}
          className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add Traveler
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Travelers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-3xl">✈️</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="text-3xl">⏰</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-blue-600">{stats.verified}</p>
              </div>
              <div className="text-3xl">🛡️</div>
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
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification
            </label>
            <select
              value={filters.verification}
              onChange={(e) => handleFilterChange({ verification: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
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
              placeholder="Search travelers..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'all', verification: 'all', search: '', page: 1, limit: 20 })}
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

      {/* Travelers List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
          </div>
        ) : travelers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">✈️</div>
            <p className="text-gray-500">No travelers found</p>
            <button
              onClick={handleCreateTraveler}
              className="mt-4 text-brand-blue hover:underline"
            >
              Add your first traveler
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {travelers.map((traveler) => (
              <TravelerCard
                key={traveler.id}
                traveler={traveler}
                onApprove={() => handleApproveTraveler(traveler.id)}
                onSuspend={(reason) => handleSuspendTraveler(traveler.id, reason)}
                onEdit={() => handleEditTraveler(traveler)}
                onDelete={() => handleDeleteTraveler(traveler.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
