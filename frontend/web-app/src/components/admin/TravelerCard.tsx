import { Traveler } from '../../services/travelersService';

interface TravelerCardProps {
  traveler: Traveler;
  onApprove: () => void;
  onSuspend: (reason?: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TravelerCard({ traveler, onApprove, onSuspend, onEdit, onDelete }: TravelerCardProps) {
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

  const getFeeDisplay = () => {
    if (traveler.feeModel.type === 'flat') {
      return `${traveler.feeModel.currency} ${traveler.feeModel.amount}`;
    } else {
      return `${traveler.feeModel.amount}%`;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Header with Avatar and Status */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              {traveler.avatar ? (
                <img
                  src={traveler.avatar}
                  alt={traveler.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-gray-600">
                  {traveler.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            {/* Info */}
            <div>
              <h3 className="font-semibold text-gray-900">{traveler.name}</h3>
              <p className="text-sm text-gray-500">{traveler.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(traveler.status)}`}>
                  {traveler.status.charAt(0).toUpperCase() + traveler.status.slice(1)}
                </span>
                {isVerified(traveler) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Rating:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold">⭐ {traveler.rating.toFixed(1)}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-500">Completed:</span>
            <span className="font-semibold">{traveler.completedOrders}</span>
          </div>
        </div>

        {/* Fee Model */}
        <div className="text-sm">
          <span className="text-gray-500">Fee:</span>
          <span className="font-semibold ml-2">{getFeeDisplay()}</span>
        </div>

        {/* Routes */}
        <div className="text-sm">
          <span className="text-gray-500">Routes:</span>
          <div className="mt-1 space-y-1">
            {traveler.routes.slice(0, 2).map((route, index) => (
              <div key={index} className="text-xs bg-gray-50 px-2 py-1 rounded">
                {route.fromCountry} → {route.toCountry}
              </div>
            ))}
            {traveler.routes.length > 2 && (
              <div className="text-xs text-gray-500">
                +{traveler.routes.length - 2} more routes
              </div>
            )}
          </div>
        </div>

        {/* Languages */}
        {traveler.languages.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-500">Languages:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {traveler.languages.slice(0, 3).map((lang, index) => (
                <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {lang}
                </span>
              ))}
              {traveler.languages.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{traveler.languages.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Last Active */}
        <div className="text-xs text-gray-500">
          Last active: {new Date(traveler.lastActive).toLocaleDateString()}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {/* Status-specific actions */}
          {traveler.status === 'pending' && (
            <button
              onClick={onApprove}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve
            </button>
          )}
          
          {traveler.status === 'approved' && (
            <button
              onClick={() => onSuspend()}
              className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Suspend
            </button>
          )}
          
          {traveler.status === 'suspended' && (
            <button
              onClick={onApprove}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              Reactivate
            </button>
          )}

          {/* Edit */}
          <button
            onClick={onEdit}
            className="p-2 text-gray-600 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit traveler"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete traveler"
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
