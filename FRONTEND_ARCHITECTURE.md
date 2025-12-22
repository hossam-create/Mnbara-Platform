# FRONTEND ARCHITECTURE

## FOLDER STRUCTURE
```
frontend/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── requests/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── new/page.tsx
│   │   └── loading.tsx
│   ├── offers/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── loading.tsx
│   ├── search/
│   │   └── page.tsx
│   ├── health/
│   │   └── page.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── ShellLayout.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── SearchFilters.tsx
│   │   └── SearchResults.tsx
│   ├── cards/
│   │   ├── RequestCard.tsx
│   │   ├── OfferCard.tsx
│   │   ├── UserCard.tsx
│   │   └── TransactionCard.tsx
│   ├── trust/
│   │   ├── TrustBadge.tsx
│   │   ├── RiskIndicator.tsx
│   │   ├── VerificationStatus.tsx
│   │   └── AdvisoryBanner.tsx
│   ├── forms/
│   │   ├── RequestForm.tsx
│   │   ├── OfferForm.tsx
│   │   ├── SearchForm.tsx
│   │   └── FilterForm.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorBoundary.tsx
│   └── shared/
│       ├── FeatureFlag.tsx
│       ├── ServiceStatus.tsx
│       └── MaintenanceMode.tsx
├── services/
│   ├── api/
│   │   ├── base.ts
│   │   ├── requests.ts
│   │   ├── offers.ts
│   │   ├── search.ts
│   │   ├── trust.ts
│   │   └── health.ts
│   ├── feature-flags.ts
│   └── config.ts
├── hooks/
│   ├── useApi.ts
│   ├── useSearch.ts
│   ├── useRequests.ts
│   ├── useOffers.ts
│   ├── useTrust.ts
│   ├── useFeatureFlags.ts
│   └── useServiceStatus.ts
├── types/
│   ├── api.ts
│   ├── requests.ts
│   ├── offers.ts
│   ├── search.ts
│   ├── trust.ts
│   ├── user.ts
│   └── feature-flags.ts
├── utils/
│   ├── validation.ts
│   ├── formatters.ts
│   ├── constants.ts
│   └── helpers.ts
├── lib/
│   ├── tailwind.ts
│   ├── cn.ts
│   └── routing.ts
└── public/
    ├── icons/
    └── images/
```

## ROUTING STRUCTURE (App Router)
```typescript
// app/layout.tsx - Root layout with eBay-like shell
// app/page.tsx - Homepage with search-first design
// app/requests/page.tsx - Browse all requests
// app/requests/[id]/page.tsx - Single request view
// app/requests/new/page.tsx - Create new request
// app/offers/page.tsx - Browse all offers
// app/offers/[id]/page.tsx - Single offer view
// app/search/page.tsx - Search results page
// app/health/page.tsx - System status page
```

## SHARED LAYOUT STRUCTURE
```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ShellLayout>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ShellLayout>
      </body>
    </html>
  )
}

// components/layout/ShellLayout.tsx
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}

// components/layout/Header.tsx
export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between h-16">
        <Logo />
        <SearchBar />
        <Navigation />
      </div>
    </header>
  )
}
```

## API SERVICE LAYER STRUCTURE
```typescript
// services/api/base.ts
export const apiClient = {
  get: (endpoint: string) => fetch(`${BASE_URL}${endpoint}`),
  post: (endpoint: string, data: unknown) => fetch(`${BASE_URL}${endpoint}`,
    { method: 'POST', body: JSON.stringify(data) }),
  // ... other methods
}

// services/api/requests.ts
export const requestsService = {
  getAll: () => apiClient.get('/requests'),
  getById: (id: string) => apiClient.get(`/requests/${id}`),
  create: (data: RequestCreate) => apiClient.post('/requests', data),
}

// services/api/offers.ts
export const offersService = {
  getAll: () => apiClient.get('/offers'),
  getById: (id: string) => apiClient.get(`/offers/${id}`),
}

// services/api/search.ts
export const searchService = {
  query: (params: SearchParams) => apiClient.get(`/search?${params}`),
}

// services/api/trust.ts
export const trustService = {
  getScore: (userId: string) => apiClient.get(`/trust/${userId}`),
  getAdvisory: (context: AdvisoryContext) => apiClient.post('/trust/advisory', context),
}
```

## FEATURE FLAG HANDLING
```typescript
// services/feature-flags.ts
export const featureFlags = {
  isEnabled: (flag: string): boolean => {
    // Read from environment or remote config
    return false // Default safe state
  },
  getVariants: (flag: string): string[] => {
    return [] // Empty array for safety
  }
}

// hooks/useFeatureFlags.ts
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  
  useEffect(() => {
    // Read-only fetch from safe config source
  }, [])
  
  return {
    isEnabled: (flag: string) => flags[flag] || false,
    isLoading: false
  }
}

// components/shared/FeatureFlag.tsx
export default function FeatureFlag({
  name,
  children,
  fallback = null
}: {
  name: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { isEnabled } = useFeatureFlags()
  
  return isEnabled(name) ? children : fallback
}
```

## TYPE DEFINITIONS
```typescript
// types/requests.ts
export interface Request {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface RequestCreate {
  title: string
  description: string
  // ... other fields
}

// types/offers.ts
export interface Offer {
  id: string
  requestId: string
  price: number
  currency: string
  status: 'pending' | 'accepted' | 'rejected'
}

// types/trust.ts
export interface TrustScore {
  value: number
  confidence: number
  factors: string[]
}

export interface Advisory {
  level: 'info' | 'warning' | 'critical'
  message: string
  context: Record<string, unknown>
}

// types/feature-flags.ts
export interface FeatureFlagConfig {
  name: string
  enabled: boolean
  variants: string[]
}
```

## HOOKS STRUCTURE
```typescript
// hooks/useApi.ts
export const useApi = <T,>() => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const execute = useCallback(async (promise: Promise<T>) => {
    // Safe execution with error handling
  }, [])
  
  return { data, loading, error, execute }
}

// hooks/useRequests.ts
export const useRequests = () => {
  const { data, loading, error, execute } = useApi<Request[]>()
  
  const fetchRequests = useCallback(() => {
    execute(requestsService.getAll())
  }, [execute])
  
  return { requests: data, loading, error, fetchRequests }
}

// hooks/useSearch.ts
export const useSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  
  const search = useCallback(async (searchQuery: string) => {
    // Safe search execution
  }, [])
  
  return { query, results, search, setQuery }
}
```

## COMPONENT RESPONSIBILITIES
- **Header.tsx**: Global navigation and search shell
- **SearchBar.tsx**: Main search input with suggestions
- **RequestCard.tsx**: Display individual request with trust indicators
- **AdvisoryPanel.tsx**: Show advisory information (read-only)
- **TrustBadge.tsx**: Visual trust indicator component
- **RiskIndicator.tsx**: Risk level display component
- **ServiceStatus.tsx**: System health status display
- **FeatureFlag.tsx**: Conditional rendering based on flags