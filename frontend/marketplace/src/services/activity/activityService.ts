import type { ActivityDomain, UnifiedActivity } from './types';

type WalletActivityResponseItem = {
  id: string;
  type: string;
  description?: string;
  createdAt: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed';
};

type TravelerActivityResponseItem = {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
  status?: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
};

type MarketplaceActivityResponseItem = {
  id: string;
  event: string;
  summary?: string;
  createdAt: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed';
  metadata?: Record<string, any>;
};

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL as string | undefined;
  return url?.replace(/\/$/, '') ?? '';
};

const safeParseJson = async <T,>(res: Response): Promise<T> => {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
};

const sortByDateDesc = (items: UnifiedActivity[]) =>
  [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const mapWalletActivity = (items: WalletActivityResponseItem[]): UnifiedActivity[] =>
  items.map((x) => ({
    id: x.id,
    domain: 'wallet',
    title: x.type,
    description: x.description ?? 'Wallet activity',
    date: x.createdAt,
    amount: x.amount,
    currency: x.currency,
    status: x.status,
    metadata: { rawType: x.type },
  }));

const mapTravelerActivity = (items: TravelerActivityResponseItem[]): UnifiedActivity[] =>
  items.map((x) => ({
    id: x.id,
    domain: 'traveler',
    title: x.action,
    description: x.details ?? 'Traveler activity',
    date: x.createdAt,
    status: x.status,
    metadata: x.metadata,
  }));

const mapMarketplaceActivity = (items: MarketplaceActivityResponseItem[]): UnifiedActivity[] =>
  items.map((x) => ({
    id: x.id,
    domain: 'marketplace',
    title: x.event,
    description: x.summary ?? 'Marketplace activity',
    date: x.createdAt,
    amount: x.amount,
    currency: x.currency,
    status: x.status,
    metadata: x.metadata,
  }));

const fetchJson = async <T,>(path: string): Promise<T> => {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${path}` : path;

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}) ${url}${errorText ? `: ${errorText}` : ''}`);
  }

  return safeParseJson<T>(res);
};

const mockWallet = (): UnifiedActivity[] => [
  {
    id: 'wallet-1',
    domain: 'wallet',
    title: 'Deposit',
    description: 'Card deposit completed',
    date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    amount: 250,
    currency: 'USD',
    status: 'completed',
  },
  {
    id: 'wallet-2',
    domain: 'wallet',
    title: 'Escrow Hold',
    description: 'Funds held in escrow for order #395012',
    date: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    amount: 1099.99,
    currency: 'USD',
    status: 'pending',
  },
];

const mockTraveler = (): UnifiedActivity[] => [
  {
    id: 'traveler-1',
    domain: 'traveler',
    title: 'Route Created',
    description: 'Dubai → London route created',
    date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: 'completed',
    metadata: { origin: 'Dubai, UAE', destination: 'London, UK' },
  },
  {
    id: 'traveler-2',
    domain: 'traveler',
    title: 'Offer Accepted',
    description: 'You accepted a delivery offer (PROD-123)',
    date: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    status: 'completed',
  },
];

const mockMarketplace = (): UnifiedActivity[] => [
  {
    id: 'marketplace-1',
    domain: 'marketplace',
    title: 'Order Placed',
    description: 'Order created for Apple iPhone 15 Pro Max',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    amount: 1099.99,
    currency: 'USD',
    status: 'pending',
  },
  {
    id: 'marketplace-2',
    domain: 'marketplace',
    title: 'Review Submitted',
    description: 'You left feedback for seller techsuperstore',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    status: 'completed',
  },
];

export async function fetchWalletActivity(): Promise<UnifiedActivity[]> {
  try {
    const json = await fetchJson<{ items?: WalletActivityResponseItem[] } | WalletActivityResponseItem[]>(
      '/wallet/activity',
    );

    const items = Array.isArray(json) ? json : (json.items ?? []);
    return sortByDateDesc(mapWalletActivity(items));
  } catch (_err) {
    return sortByDateDesc(mockWallet());
  }
}

export async function fetchTravelerActivity(): Promise<UnifiedActivity[]> {
  try {
    const json = await fetchJson<{ items?: TravelerActivityResponseItem[] } | TravelerActivityResponseItem[]>(
      '/traveler/activity',
    );

    const items = Array.isArray(json) ? json : (json.items ?? []);
    return sortByDateDesc(mapTravelerActivity(items));
  } catch (_err) {
    return sortByDateDesc(mockTraveler());
  }
}

export async function fetchMarketplaceActivity(): Promise<UnifiedActivity[]> {
  try {
    const json = await fetchJson<
      { items?: MarketplaceActivityResponseItem[] } | MarketplaceActivityResponseItem[]
    >('/marketplace/activity');

    const items = Array.isArray(json) ? json : (json.items ?? []);
    return sortByDateDesc(mapMarketplaceActivity(items));
  } catch (_err) {
    return sortByDateDesc(mockMarketplace());
  }
}

export async function fetchAllActivity(): Promise<UnifiedActivity[]> {
  const [wallet, traveler, marketplace] = await Promise.all([
    fetchWalletActivity(),
    fetchTravelerActivity(),
    fetchMarketplaceActivity(),
  ]);

  return sortByDateDesc([...wallet, ...traveler, ...marketplace]);
}

export async function fetchActivityByDomain(domain?: ActivityDomain | 'all'): Promise<UnifiedActivity[]> {
  if (!domain || domain === 'all') return fetchAllActivity();
  if (domain === 'wallet') return fetchWalletActivity();
  if (domain === 'traveler') return fetchTravelerActivity();
  return fetchMarketplaceActivity();
}
