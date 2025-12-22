// ============================================
// ⚡ Pending Actions Card for Seller Dashboard
// ============================================

import type { PendingAction } from '../../services/seller.service';

interface PendingActionsCardProps {
  actions: PendingAction[];
  onActionClick: (action: PendingAction) => void;
}

const getActionIcon = (type: PendingAction['type']) => {
  const icons: Record<PendingAction['type'], string> = {
    order_pending: '📦',
    review_pending: '⭐',
    question_pending: '❓',
    return_request: '↩️',
  };
  return icons[type] || '📋';
};

const getPriorityColor = (priority: PendingAction['priority']) => {
  const colors: Record<PendingAction['priority'], string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
  };
  return colors[priority];
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export function PendingActionsCard({ actions, onActionClick }: PendingActionsCardProps) {
  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Actions</h2>
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl block mb-2">✅</span>
          All caught up!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Pending Actions</h2>
        <span className="px-2.5 py-1 bg-pink-100 text-pink-700 text-sm font-medium rounded-full">
          {actions.length}
        </span>
      </div>
      
      <div className="space-y-3">
        {actions.slice(0, 5).map((action) => (
          <div
            key={action.id}
            onClick={() => onActionClick(action)}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
              {getActionIcon(action.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-800 truncate">{action.title}</div>
              <div className="text-sm text-gray-500 truncate">{action.description}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(action.priority)}`}>
                {action.priority}
              </span>
              <span className="text-xs text-gray-400">{formatTimeAgo(action.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {actions.length > 5 && (
        <button className="w-full mt-4 py-2 text-sm text-pink-500 hover:text-pink-600 font-medium">
          View all {actions.length} actions →
        </button>
      )}
    </div>
  );
}

export default PendingActionsCard;
