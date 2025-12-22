# MNBARA Next.js Frontend

Clean Next.js project skeleton with Tailwind CSS.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with Header/Footer
│   ├── page.tsx            # Home page (/)
│   ├── search/
│   │   └── page.tsx        # Search page (/search)
│   ├── listing/
│   │   └── [id]/
│   │       └── page.tsx    # Listing detail (/listing/[id])
│   ├── loading.tsx         # Global loading state
│   ├── not-found.tsx       # 404 page
│   ├── error.tsx           # Error boundary
│   └── globals.css         # Global styles + Tailwind
├── components/
│   └── layout/
│       ├── Header.tsx      # Site header
│       └── Footer.tsx      # Site footer
├── lib/
│   └── api.ts              # API client (prepared for integration)
└── types/
    └── index.ts            # TypeScript type definitions
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home page with hero, how it works, trust section |
| `/search` | Browse listings with filters |
| `/listing/[id]` | Listing detail page |

## API Integration

The project is prepared for backend integration:

1. **API Client** (`src/lib/api.ts`) - Ready-to-use fetch wrapper
2. **Type Definitions** (`src/types/index.ts`) - TypeScript interfaces
3. **API Proxy** (`next.config.js`) - Rewrites `/api/*` to backend

To connect to the backend:

```bash
# Set environment variable
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Styling

- Tailwind CSS for utility-first styling
- Custom primary color palette in `tailwind.config.ts`
- Utility classes for loading/error/empty states in `globals.css`

## No Business Logic

This skeleton contains:
- ✅ Layout components
- ✅ Routing structure
- ✅ Placeholder UI
- ✅ Type definitions
- ✅ API client structure

It does NOT contain:
- ❌ Backend calls (mock data only)
- ❌ Authentication logic
- ❌ State management
- ❌ Form handling
- ❌ Business logic

These will be added during API integration.

## Payments Advisory Mode

Mnbarh is shifting to a PSP-managed custody model while still avoiding internal wallets. During the phased rollout we kept payments advisory-only because real rails without trust data would have been reckless. The rationale was:

1. Increase regulatory exposure without the data required for licensing.
2. Block our ability to select compliant banking partners (volume + behavior data still in progress).
3. Expand the fraud surface area before trust tooling is hardened.
4. Undercut our “trust before money” principle borrowed from eBay’s playbook.

With the PSP integration now enabled, the platform still does **not** become a bank:

- Funds are captured by a licensed PSP (cards, wallets, bank transfer, Fawry).
- PSP keeps the funds in temporary holding (“escrow facilitator” stance).
- Mnbarh can **only** instruct manual release or refunds through the PSP APIs.

### PSP Guard Flags

```ts
export const PSP_PROVIDER = 'AkhbarPay';
export const AUTO_PAY = false;
export const AUTO_RELEASE = false;
export const AUTO_MATCH = false;
```

UI copy must always mention:
- “Funds held securely by payment provider.”
- “Platform does not store money.”
- “Manual release after confirmation.”

## Automation Guardrails

Automation stays **disabled by design** because:

1. Automation amplifies fraud before trust tooling hardens.
2. Automation removes accountability—humans must own every approval.
3. Automation invites premature regulatory scrutiny in emerging markets.
4. Automation erodes the community’s trust; defensible decisions require manual review.

### Operational Auto-Suggestions

We still need faster ops, so only the following machine actions are permitted:

- **Auto-status signals** – compute “needs attention” states but do not mutate orders.
- **Auto-reminders** – draft reminders for admins to send; no auto-delivery.
- **Auto-timeouts** – raise alerts when SLAs breach; actual resolution stays manual.
- **Auto-risk flags** – tag corridors/accounts for review; never suspend automatically.

Forbidden automation:

- Auto-release money
- Auto-ban accounts
- Auto-resolve disputes

Every automation output must read like: “Suggested action → Requires human confirmation.”

## Egyptian Fraud Controls

To keep Egyptian marketplace scams expensive:

- **Buyer must prepay** before a traveler can even reserve the order.
- **Traveler payouts wait for proof** (delivery photo + buyer confirmation); automation can only nag humans.
- **All disputes route to a manual reviewer** with audit logging.
- **Device fingerprint + IP logging** is enforced on every payment intent call (`x-device-fingerprint` header required).
- **Name match (KYC-lite)** compares legal ID vs. provided name; mismatches block payment capture.
- **Repeat behavior heuristics** flag buyers or travelers with repeated inactivity, late deliveries, or prior disputes.
- **Admin console controls** exist for hold/release/partial refund/full refund/permanent ban — all manual buttons hitting `/api/admin/payments/action`.

UI copy must reassure honest users:

> “Buyer pays first • Funds held by PSP • Release happens only after proof & human approval.”

## Legal Content

- `/legal/user-agreement`

The following platform flags remain locked:

- `AUTO_MATCH = false`
- `AUTO_PAY = false`
- `AUTO_RELEASE = false`
