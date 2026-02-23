import { Ad } from '../../services/adsService';

interface AdCardProps {
  ad: Ad;
  status: 'active' | 'scheduled' | 'expired';
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function AdCard({ ad, status, onToggle, onEdit, onDelete }: AdCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlacementLabel = (placement: string) => {
    switch (placement) {
      case 'carousel':
        return 'Hero Carousel';
      case 'deals':
        return 'Sponsored Deals';
      case 'category':
        return 'Category Spotlight';
      default:
        return placement;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Image Preview */}
      <div className="aspect-video bg-gray-100 relative">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 text-4xl">📢</div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 truncate">{ad.title}</h3>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center justify-between">
            <span>Placement:</span>
            <span className="font-medium">{getPlacementLabel(ad.placement)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Priority:</span>
            <span className="font-medium">{ad.priority}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Start:</span>
            <span className="font-medium">{new Date(ad.startDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>End:</span>
            <span className="font-medium">{new Date(ad.endDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle */}
          <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-1 ${
              ad.enabled ? 'bg-brand-blue' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                ad.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          
          <span className={`text-xs font-medium ${
            ad.enabled ? 'text-green-600' : 'text-gray-500'
          }`}>
            {ad.enabled ? 'On' : 'Off'}
          </span>

          {/* Edit */}
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit ad"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete ad"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
