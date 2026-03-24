export type ActivityDomain = 'wallet' | 'traveler' | 'marketplace';

export interface UnifiedActivity {
  id: string;
  domain: ActivityDomain;
  title: string;
  description: string;
  date: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}
