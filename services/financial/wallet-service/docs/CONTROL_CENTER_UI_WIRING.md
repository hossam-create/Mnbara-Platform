# Control Center — Reconciliation Alerts UI Wiring

## Route: `/control-center/finance/reconciliation`

---

## Overview

This document provides **UI wiring notes** for integrating reconciliation alerts into the Control Center. The implementation is **read-only** with **NO fix buttons** and **NO automation** — alerts are informational only.

---

## Page Structure

```
/control-center/finance/reconciliation
│
├─ Dashboard Widget (Summary)
├─ Alert Filters (Severity, Classification, Date)
├─ Alert List (Paginated Table)
└─ Alert Detail Modal (Click to view)
```

---

## API Endpoints

### 1. Get Alerts (Paginated)
```
GET /api/wallet/reconciliation/alerts

Query Parameters:
- severity?: 'LOW' | 'MEDIUM' | 'HIGH'
- classification?: MismatchClassification
- resolution?: 'NONE' | 'FLAGGED' | 'MANUAL_ACTION' | 'IGNORED'
- gateway?: 'STRIPE' | 'PAYMOB'
- startDate?: ISO date string
- endDate?: ISO date string
- page?: number (default: 1)
- pageSize?: number (default: 20)
- sortBy?: 'severity' | 'detectedAt' | 'amount'
- sortOrder?: 'asc' | 'desc'

Response: ReconciliationAlertListDto
{
  alerts: ReconciliationAlertDto[],
  pagination: {
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  },
  filters: ReconciliationAlertFilters,
  summary: {
    highSeverityCount: number,
    mediumSeverityCount: number,
    lowSeverityCount: number
  }
}
```

### 2. Get Alert Detail
```
GET /api/wallet/reconciliation/alerts/:id

Response: ReconciliationAlertDetailDto
{
  ...ReconciliationAlertDto,
  escrow: { ... },
  run: { ... },
  relatedAlerts: ReconciliationAlertDto[],
  timeline: { ... }
}
```

### 3. Get Statistics
```
GET /api/wallet/reconciliation/stats

Response: ReconciliationStatsDto
{
  totalRuns: number,
  successRate: number,
  averageMatchRate: number,
  activeMismatches: number,
  highSeverityMismatches: number,
  unresolvedMismatches: number,
  byClassification: { ... },
  bySeverity: { ... },
  last24Hours: { ... },
  lastRun: { ... }
}
```

### 4. Get Recent Runs
```
GET /api/wallet/reconciliation/runs/recent?limit=10

Response: ReconciliationRunSummaryDto[]
[
  {
    id: string,
    gateway: string,
    status: string,
    totalChecked: number,
    matchCount: number,
    mismatchCount: number,
    errorCount: number,
    highSeverityCount: number,
    mediumSeverityCount: number,
    lowSeverityCount: number,
    startedAt: string,
    finishedAt: string | null,
    duration: number | null,
    triggeredBy: string,
    notes: string | null
  }
]
```

---

## UI Components

### 1. Dashboard Widget (Summary)

**Purpose:** Show reconciliation health at a glance

**Data Source:** `GET /api/wallet/reconciliation/stats`

**Layout:**
```tsx
<ReconciliationDashboard>
  <StatCard
    title="Active Mismatches"
    value={stats.activeMismatches}
    trend={stats.last24Hours.mismatches}
    color="blue"
  />
  
  <StatCard
    title="High Severity"
    value={stats.highSeverityMismatches}
    alert={stats.highSeverityMismatches > 0}
    color="red"
  />
  
  <StatCard
    title="Match Rate"
    value={`${stats.averageMatchRate.toFixed(1)}%`}
    trend={stats.successRate}
    color="green"
  />
  
  <StatCard
    title="Last 24h Resolved"
    value={stats.last24Hours.resolved}
    color="gray"
  />
</ReconciliationDashboard>
```

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ Reconciliation Health                                   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │ Active   │  │ High     │  │ Match    │  │ Last 24h ││
│  │ Mismatches│  │ Severity │  │ Rate     │  │ Resolved ││
│  │    15    │  │    3 🔴  │  │  97.5%   │  │    8     ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
└─────────────────────────────────────────────────────────┘
```

---

### 2. Alert Filters

**Purpose:** Filter alerts by severity, classification, and date

**Layout:**
```tsx
<AlertFilters>
  <FilterGroup label="Severity">
    <Checkbox value="HIGH" color="red">High 🔴</Checkbox>
    <Checkbox value="MEDIUM" color="orange">Medium 🟠</Checkbox>
    <Checkbox value="LOW" color="green">Low 🟢</Checkbox>
  </FilterGroup>
  
  <FilterGroup label="Classification">
    <Select
      options={[
        'MISSING_PAYMENT',
        'DELAYED_PAYMENT',
        'AMOUNT_MISMATCH',
        'DUPLICATE_GATEWAY_PAYMENT',
        'GATEWAY_SUCCESS_ESCROW_MISSING',
        'GATEWAY_QUERY_FAILED'
      ]}
      placeholder="All Classifications"
    />
  </FilterGroup>
  
  <FilterGroup label="Gateway">
    <Select
      options={['STRIPE', 'PAYMOB']}
      placeholder="All Gateways"
    />
  </FilterGroup>
  
  <FilterGroup label="Date Range">
    <DateRangePicker />
  </FilterGroup>
  
  <FilterGroup label="Status">
    <Select
      options={['FLAGGED', 'MANUAL_ACTION', 'IGNORED']}
      placeholder="All Statuses"
    />
  </FilterGroup>
</AlertFilters>
```

---

### 3. Alert List (Table)

**Purpose:** Display paginated list of alerts

**Data Source:** `GET /api/wallet/reconciliation/alerts`

**Columns:**
1. **Severity Badge** (color-coded)
2. **Classification** (with icon)
3. **Escrow ID** (clickable link)
4. **Expected Amount** (formatted currency)
5. **Gateway Amount** (formatted currency)
6. **Gateway Status**
7. **Detected At** (relative time)
8. **Actions** (View Details button only)

**Layout:**
```tsx
<AlertTable>
  <TableHeader>
    <Column sortable>Severity</Column>
    <Column sortable>Classification</Column>
    <Column>Escrow ID</Column>
    <Column sortable>Expected Amount</Column>
    <Column>Gateway Amount</Column>
    <Column>Gateway Status</Column>
    <Column sortable>Detected</Column>
    <Column>Actions</Column>
  </TableHeader>
  
  <TableBody>
    {alerts.map(alert => (
      <TableRow key={alert.id}>
        <Cell>
          <Badge color={alert.severityColor}>
            {alert.severity}
          </Badge>
        </Cell>
        
        <Cell>
          <ClassificationBadge type={alert.classification} />
        </Cell>
        
        <Cell>
          <Link to={alert.escrowLink}>
            {alert.escrowId.slice(0, 8)}...
          </Link>
        </Cell>
        
        <Cell>
          {formatCurrency(alert.expectedAmount, alert.currency)}
        </Cell>
        
        <Cell>
          {alert.gatewayAmount 
            ? formatCurrency(alert.gatewayAmount, alert.currency)
            : '—'}
        </Cell>
        
        <Cell>
          <StatusBadge status={alert.gatewayStatus} />
        </Cell>
        
        <Cell>
          <RelativeTime timestamp={alert.detectedAt} />
        </Cell>
        
        <Cell>
          <Button
            variant="ghost"
            onClick={() => openDetailModal(alert.id)}
          >
            View Details
          </Button>
        </Cell>
      </TableRow>
    ))}
  </TableBody>
</AlertTable>

<Pagination
  current={pagination.page}
  total={pagination.totalPages}
  onChange={handlePageChange}
/>
```

**Visual:**
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Severity │ Classification      │ Escrow ID  │ Expected │ Gateway │ Detected  │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🔴 HIGH  │ MISSING_PAYMENT     │ abc123...  │ 100.00   │ —       │ 2h ago    │
│ 🟠 MEDIUM│ AMOUNT_MISMATCH     │ def456...  │ 50.00    │ 52.50   │ 5h ago    │
│ 🟢 LOW   │ DELAYED_PAYMENT     │ ghi789...  │ 200.00   │ pending │ 1d ago    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Alert Detail Modal

**Purpose:** Show full context for a single alert

**Data Source:** `GET /api/wallet/reconciliation/alerts/:id`

**Sections:**
1. **Alert Summary** (classification, severity, amounts)
2. **Description** (human-readable explanation)
3. **Recommended Action** (what admin should do)
4. **Escrow Context** (buyer, seller, reference)
5. **Gateway Context** (payment ID, status, link)
6. **Timeline** (detection, resolution events)
7. **Related Alerts** (other alerts for same escrow)

**Layout:**
```tsx
<AlertDetailModal>
  <ModalHeader>
    <Badge color={alert.severityColor}>{alert.severity}</Badge>
    <Title>{alert.classification}</Title>
    <CloseButton />
  </ModalHeader>
  
  <ModalBody>
    {/* Alert Summary */}
    <Section title="Alert Summary">
      <InfoRow label="Escrow ID">
        <Link to={alert.escrowLink}>{alert.escrowId}</Link>
      </InfoRow>
      <InfoRow label="Expected Amount">
        {formatCurrency(alert.expectedAmount, alert.currency)}
      </InfoRow>
      <InfoRow label="Gateway Amount">
        {alert.gatewayAmount 
          ? formatCurrency(alert.gatewayAmount, alert.currency)
          : 'Not found'}
      </InfoRow>
      <InfoRow label="Gateway Status">
        {alert.gatewayStatus || '—'}
      </InfoRow>
      <InfoRow label="Detected At">
        {formatDateTime(alert.detectedAt)}
      </InfoRow>
    </Section>
    
    {/* Description */}
    <Section title="Description">
      <InfoBox type="info">
        {alert.description}
      </InfoBox>
    </Section>
    
    {/* Recommended Action */}
    <Section title="Recommended Action">
      <InfoBox 
        type={alert.requiresImmediateAttention ? 'error' : 'warning'}
      >
        {alert.recommendedAction}
      </InfoBox>
    </Section>
    
    {/* Escrow Context */}
    <Section title="Escrow Context">
      <InfoRow label="Buyer Wallet">
        {detail.escrow.buyerWalletId}
      </InfoRow>
      <InfoRow label="Seller Wallet">
        {detail.escrow.sellerWalletId}
      </InfoRow>
      <InfoRow label="Status">
        {detail.escrow.status}
      </InfoRow>
      <InfoRow label="Reference">
        {detail.escrow.referenceType} #{detail.escrow.referenceId}
      </InfoRow>
    </Section>
    
    {/* Gateway Context */}
    <Section title="Gateway Context">
      <InfoRow label="Gateway">
        {detail.run.gateway}
      </InfoRow>
      <InfoRow label="Payment ID">
        {alert.gatewayPaymentId || 'Not found'}
      </InfoRow>
      {alert.gatewayLink && (
        <InfoRow label="Gateway Dashboard">
          <ExternalLink href={alert.gatewayLink}>
            View in {detail.run.gateway}
          </ExternalLink>
        </InfoRow>
      )}
    </Section>
    
    {/* Timeline */}
    <Section title="Timeline">
      <Timeline events={detail.timeline.events} />
    </Section>
    
    {/* Related Alerts */}
    {detail.relatedAlerts.length > 0 && (
      <Section title="Related Alerts">
        <AlertList alerts={detail.relatedAlerts} compact />
      </Section>
    )}
  </ModalBody>
  
  <ModalFooter>
    <Button variant="secondary" onClick={closeModal}>
      Close
    </Button>
    
    {/* NO FIX BUTTONS - READ ONLY */}
  </ModalFooter>
</AlertDetailModal>
```

---

## Color Scheme

### Severity Colors
```typescript
const SEVERITY_COLORS = {
  HIGH: '#EF4444',    // Red
  MEDIUM: '#F59E0B',  // Orange
  LOW: '#10B981',     // Green
};
```

### Classification Icons
```typescript
const CLASSIFICATION_ICONS = {
  MISSING_PAYMENT: '❌',
  DELAYED_PAYMENT: '⏳',
  AMOUNT_MISMATCH: '💰',
  DUPLICATE_GATEWAY_PAYMENT: '⚠️',
  GATEWAY_SUCCESS_ESCROW_MISSING: '🔍',
  GATEWAY_QUERY_FAILED: '🚫',
};
```

---

## Data Fetching (React Example)

```typescript
// Fetch alerts with filters
const { data: alertsData, isLoading } = useQuery({
  queryKey: ['reconciliation-alerts', filters],
  queryFn: () => fetch('/api/wallet/reconciliation/alerts?' + new URLSearchParams(filters))
    .then(res => res.json()),
  refetchInterval: 30000, // Refresh every 30 seconds
});

// Fetch stats for dashboard
const { data: stats } = useQuery({
  queryKey: ['reconciliation-stats'],
  queryFn: () => fetch('/api/wallet/reconciliation/stats')
    .then(res => res.json()),
  refetchInterval: 60000, // Refresh every minute
});

// Fetch alert detail
const { data: alertDetail } = useQuery({
  queryKey: ['reconciliation-alert', alertId],
  queryFn: () => fetch(`/api/wallet/reconciliation/alerts/${alertId}`)
    .then(res => res.json()),
  enabled: !!alertId, // Only fetch when alertId is set
});
```

---

## Utility Functions

### Format Currency
```typescript
function formatCurrency(amount: string, currency: string): string {
  const numAmount = BigInt(amount);
  const formatted = (Number(numAmount) / 100).toFixed(2);
  return `${formatted} ${currency}`;
}
```

### Format Relative Time
```typescript
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
```

### Format DateTime
```typescript
function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

---

## Accessibility

### ARIA Labels
```tsx
<Badge aria-label={`Severity: ${alert.severity}`}>
  {alert.severity}
</Badge>

<Button
  aria-label={`View details for alert ${alert.id}`}
  onClick={() => openDetailModal(alert.id)}
>
  View Details
</Button>
```

### Keyboard Navigation
- Table rows should be keyboard navigable
- Modal should trap focus
- Filters should be accessible via keyboard

---

## Mobile Responsiveness

### Breakpoints
- **Desktop:** Full table view
- **Tablet:** Condensed table (hide some columns)
- **Mobile:** Card view instead of table

```tsx
<ResponsiveAlertList>
  {/* Desktop/Tablet: Table */}
  <Hidden below="md">
    <AlertTable alerts={alerts} />
  </Hidden>
  
  {/* Mobile: Cards */}
  <Hidden above="md">
    <AlertCardList alerts={alerts} />
  </Hidden>
</ResponsiveAlertList>
```

---

## Error States

### No Alerts
```tsx
<EmptyState
  icon="✅"
  title="No Active Alerts"
  description="All reconciliation checks are passing. Great job!"
/>
```

### Loading State
```tsx
<LoadingState>
  <Skeleton count={5} height={60} />
</LoadingState>
```

### Error State
```tsx
<ErrorState
  title="Failed to Load Alerts"
  description="Unable to fetch reconciliation data. Please try again."
  action={<Button onClick={retry}>Retry</Button>}
/>
```

---

## Important Notes

### ❌ NO FIX BUTTONS
- **DO NOT** add "Resolve" buttons
- **DO NOT** add "Ignore" buttons
- **DO NOT** add any action buttons that mutate state

### ✅ READ-ONLY ONLY
- Alerts are **informational**
- Admin must manually investigate and fix via other tools
- Links to escrow and gateway dashboards for context

### 🔄 Auto-Refresh
- Dashboard stats: Every 60 seconds
- Alert list: Every 30 seconds
- Use polling or WebSocket for real-time updates

---

## Testing Checklist

- [ ] Alerts load correctly with filters
- [ ] Pagination works
- [ ] Sorting works (severity, date, amount)
- [ ] Detail modal shows full context
- [ ] Links to escrow and gateway work
- [ ] Colors match severity correctly
- [ ] Empty state shows when no alerts
- [ ] Loading state shows during fetch
- [ ] Error state shows on failure
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation works
- [ ] Screen reader announces severity

---

**UI Wiring Complete — Phase 4.4.4**

All endpoints, components, and utilities defined. Ready for frontend implementation.
