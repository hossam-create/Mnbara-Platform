import React from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import type { UnifiedActivity } from '../../services/activity/types';
import { Badge } from '../ui/badge';

interface Props {
  item: UnifiedActivity;
}

const statusVariant = (status?: UnifiedActivity['status']) => {
  if (status === 'completed') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'failed') return 'danger';
  return 'secondary';
};

const ActivityCard: React.FC<Props> = ({ item }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
            <Badge variant={statusVariant(item.status)} size="sm">
              {item.status ?? 'info'}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{item.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(item.date).toLocaleString()}</span>
            </div>

            {typeof item.amount === 'number' && (
              <div className="flex items-center gap-1 font-medium text-gray-700">
                <DollarSign className="w-4 h-4" />
                <span>
                  {item.amount.toFixed(2)} {item.currency ?? ''}
                </span>
              </div>
            )}

            <Badge variant="secondary" size="sm">
              {item.domain}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
