export type Category = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  featuredBadge?: string;
  collectionCount: number;
};

export type RequestItem = {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  originCountry: string;
  destinationCountry: string;
  rewardUSD: number;
  imageUrl: string;
  travelerTier: 'New' | 'Verified' | 'Elite';
  trustBadge: string;
  createdAt: string;
  travelDate: string;
  status: 'pending' | 'matched' | 'delivered';
  tags: string[];
};

const now = new Date();

export const marketplaceCategories: Category[] = [
  {
    id: 'fashion',
    name: 'Fashion Capsules',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=60',
    description: 'Designer drops, runway exclusives، و limited sneakers.',
    featuredBadge: 'Editor’s pick',
    collectionCount: 142,
  },
  {
    id: 'beauty',
    name: 'Beauty & Wellness',
    imageUrl: 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?auto=format&fit=crop&w=900&q=60',
    description: 'Skincare cult-favorites و spa rituals من سيول و طوكيو.',
    featuredBadge: 'Trending',
    collectionCount: 97,
  },
  {
    id: 'tech',
    name: 'Tech in Transit',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=60',
    description: 'أجهزة وإكسسوارات لم تصل الأسواق المحلية بعد.',
    featuredBadge: 'Launch',
    collectionCount: 86,
  },
  {
    id: 'home',
    name: 'Home & Living',
    imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=60',
    description: 'ديكور boutique من مراكش، كوبنهاغن، ودبي.',
    featuredBadge: 'Curated',
    collectionCount: 54,
  },
  {
    id: 'collectibles',
    name: 'Collectors Corner',
    imageUrl: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=60',
    description: 'مقتنيات فنية وكاميرات أفلام وإصدارات محدودة.',
    collectionCount: 61,
  },
  {
    id: 'local',
    name: 'City Gems',
    imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=60',
    description: 'هدايا artisan من أسواق إسطنبول، جاكرتا، وبيروت.',
    featuredBadge: 'New',
    collectionCount: 73,
  },
];

export type RequestFilters = {
  categoryId?: string;
  destinationCountry?: string;
  minReward?: number;
  maxReward?: number;
  travelDate?: string;
  sort?: 'latest' | 'reward-desc' | 'reward-asc' | 'travel-date';
  limit?: number;
};

export function listCategories(): Category[] {
  return marketplaceCategories;
}

export function listRequests(filters: RequestFilters = {}): RequestItem[] {
  let results = [...marketplaceRequests];

  if (filters.categoryId) {
    results = results.filter((req) => req.categoryId === filters.categoryId);
  }

  if (filters.destinationCountry) {
    const normalized = filters.destinationCountry.toLowerCase();
    results = results.filter(
      (req) =>
        req.destinationCountry.toLowerCase() === normalized ||
        req.originCountry.toLowerCase() === normalized,
    );
  }

  if (typeof filters.minReward === 'number') {
    results = results.filter((req) => req.rewardUSD >= filters.minReward!);
  }

  if (typeof filters.maxReward === 'number') {
    results = results.filter((req) => req.rewardUSD <= filters.maxReward!);
  }

  if (filters.travelDate) {
    const targetDate = new Date(filters.travelDate);
    if (!Number.isNaN(targetDate.getTime())) {
      results = results.filter((req) => new Date(req.travelDate) >= targetDate);
    }
  }

  const sort = filters.sort || 'latest';
  results.sort((a, b) => {
    switch (sort) {
      case 'reward-desc':
        return b.rewardUSD - a.rewardUSD;
      case 'reward-asc':
        return a.rewardUSD - b.rewardUSD;
      case 'travel-date':
        return new Date(a.travelDate).getTime() - new Date(b.travelDate).getTime();
      case 'latest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (filters.limit && filters.limit > 0) {
    return results.slice(0, filters.limit);
  }

  return results;
}

const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const marketplaceRequests: RequestItem[] = [
  {
    id: 'REQ-1001',
    title: 'Gucci Horsebit Chain Bag',
    categoryId: 'fashion',
    categoryName: 'Fashion Capsules',
    originCountry: 'Italy',
    destinationCountry: 'UAE',
    rewardUSD: 260,
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=60',
    travelerTier: 'Elite',
    trustBadge: 'Traveler verified',
    createdAt: addDays(now, -2).toISOString(),
    travelDate: addDays(now, 7).toISOString(),
    status: 'pending',
    tags: ['trending'],
  },
  {
    id: 'REQ-1002',
    title: 'Shinsegae Beauty Box – Seoul',
    categoryId: 'beauty',
    categoryName: 'Beauty & Wellness',
    originCountry: 'South Korea',
    destinationCountry: 'Saudi Arabia',
    rewardUSD: 140,
    imageUrl: 'https://images.unsplash.com/photo-1512499617640-c2f999098c01?auto=format&fit=crop&w=900&q=60',
    travelerTier: 'Verified',
    trustBadge: 'Escrow protected',
    createdAt: addDays(now, -1).toISOString(),
    travelDate: addDays(now, 10).toISOString(),
    status: 'pending',
    tags: ['trending', 'seasonal'],
  },
  {
    id: 'REQ-1003',
    title: 'Nothing Phone (2) EU Edition',
    categoryId: 'tech',
    categoryName: 'Tech in Transit',
    originCountry: 'Germany',
    destinationCountry: 'Egypt',
    rewardUSD: 120,
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=60',
    travelerTier: 'Verified',
    trustBadge: 'Warranty guidance',
    createdAt: addDays(now, -4).toISOString(),
    travelDate: addDays(now, 3).toISOString(),
    status: 'pending',
    tags: ['limited'],
  },
  {
    id: 'REQ-1004',
    title: 'French Copper Cookware Set',
    categoryId: 'home',
    categoryName: 'Home & Living',
    originCountry: 'France',
    destinationCountry: 'Qatar',
    rewardUSD: 95,
    imageUrl: 'https://images.unsplash.com/photo-1506362802973-bd87181a5b0c?auto=format&fit=crop&w=900&q=60',
    travelerTier: 'New',
    trustBadge: 'Community references',
    createdAt: addDays(now, -6).toISOString(),
    travelDate: addDays(now, 14).toISOString(),
    status: 'pending',
    tags: ['editorial'],
  },
  {
    id: 'REQ-1005',
    title: 'Tokyo Vinyl Collector Pack',
    categoryId: 'collectibles',
    categoryName: 'Collectors Corner',
    originCountry: 'Japan',
    destinationCountry: 'Bahrain',
    rewardUSD: 150,
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=60',
    travelerTier: 'Elite',
    trustBadge: 'Condition verified on delivery',
    createdAt: addDays(now, -3).toISOString(),
    travelDate: addDays(now, 9).toISOString(),
    status: 'pending',
    tags: ['trending'],
  },
  {
    id: 'REQ-1006',
    title: 'Dubai Oud Private Blend',
    categoryId: 'beauty',
    categoryName: 'Beauty & Wellness',
    originCountry: 'UAE',
    destinationCountry: 'Kuwait',
    rewardUSD: 80,
    imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=60',
    travelerTier: 'Verified',
    trustBadge: 'Insured courier',
    createdAt: addDays(now, -5).toISOString(),
    travelDate: addDays(now, 5).toISOString(),
    status: 'matched',
    tags: ['seasonal'],
  },
  {
    id: 'REQ-1007',
    title: 'Copenhagen Minimalist Lamp',
    categoryId: 'home',
    categoryName: 'Home & Living',
    originCountry: 'Denmark',
    destinationCountry: 'UAE',
    rewardUSD: 110,
    imageUrl: 'https://images.unsplash.com/photo-1445510861639-5651173bc5d5?auto=format&fit=crop&w=900&q=60',
    travelerTier: 'Verified',
    trustBadge: 'Packaging instructions ready',
    createdAt: addDays(now, -8).toISOString(),
    travelDate: addDays(now, 16).toISOString(),
    status: 'pending',
    tags: ['editorial'],
  },
  {
    id: 'REQ-1008',
    title: 'Istanbul Handcrafted Ceramics Set',
    categoryId: 'local',
    categoryName: 'City Gems',
    originCountry: 'Turkey',
    destinationCountry: 'Jordan',
    rewardUSD: 70,
    imageUrl: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=900&q=60',
    travelerTier: 'New',
    trustBadge: 'First-trip mentor assigned',
    createdAt: addDays(now, -7).toISOString(),
    travelDate: addDays(now, 20).toISOString(),
    status: 'pending',
    tags: ['local'],
  },
];
