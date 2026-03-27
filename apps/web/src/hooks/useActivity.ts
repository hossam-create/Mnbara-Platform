import { useQuery } from '@tanstack/react-query';
import type { ActivityDomain, UnifiedActivity } from '../services/activity/types';
import { fetchActivityByDomain } from '../services/activity/activityService';

export type ActivityFilterDomain = ActivityDomain | 'all';

export function useActivity(domain: ActivityFilterDomain) {
  return useQuery<UnifiedActivity[], Error>({
    queryKey: ['activity', domain],
    queryFn: () => fetchActivityByDomain(domain),
    refetchOnWindowFocus: true,
    staleTime: 60 * 1000,
  });
}
