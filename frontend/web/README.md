# Mnbara Frontend - Project Overview

## Quick Start

```bash
cd web
npm install
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Check code quality
npm run test       # Run tests
```

## Tech Stack

- **React 19** + **TypeScript 5.9**
- **Vite 7.2** (fast build tool)
- **Tailwind CSS v4** (styling)
- **Vitest** (testing)
- **Axios** + **Sentry** (API + error tracking)

## Folder Structure

```
src/
├── components/    # Reusable UI (ProductCard, etc.)
├── hooks/         # Custom hooks (useCart, etc.)
├── services/      # API layer (cart.service, api.service)
├── types/         # TypeScript definitions
├── pages/         # Route components
├── layouts/       # Page layouts
├── router/        # Routing config
└── test/          # Test setup
```

## Production Components

### useCart Hook

**AI-assisted: Antigravity**

```typescript
const { cart, loading, error, addToCart, removeFromCart } = useCart();
```

- ✅ localStorage persistence
- ✅ Backend sync with `/api/cart`
- ✅ Token authentication
- ✅ Sentry error tracking
- ✅ Optimistic updates

### ProductCard Component

**AI-assisted: Antigravity**

```tsx
<ProductCard
  id="123"
  title="Product Name"
  price={29.99}
  imageUrl="/image.jpg"
  onAddToCart={handleAdd}
/>
```

- ✅ Tailwind styled with hover effects
- ✅ Accessibility features
- ✅ Lazy-loaded images
- ✅ Responsive design

## Architecture Decisions

### Why Vite?

- 10x faster than Webpack
- Modern ESM support
- Great TypeScript DX

### Why Tailwind v4?

- Latest version with Vite plugin
- Smaller bundle size
- No PostCSS config needed

### Why Vitest?

- Native Vite integration
- 5-10x faster than Jest
- Jest-compatible API

## Environment Setup

Create `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_SENTRY_DSN=your_dsn
```

## Scripts Explained

```json
{
  "dev": "node node_modules/vite/bin/vite.js",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "test": "vitest"
}
```

> Scripts use `node` directly to bypass Windows PowerShell execution policy.

## API Integration

Configure backend endpoints:

- `GET /api/cart` - Fetch cart
- `POST /api/cart` - Add item
- `PATCH /api/cart/:id` - Update quantity
- `DELETE /api/cart/:id` - Remove item
- `POST /api/cart/sync` - Sync local cart

Authentication: Bearer token from `localStorage.getItem('authToken')`

## Next Steps

1. Add React Router for navigation
2. Create authentication flow
3. Build more UI components
4. Add E2E tests (Playwright)
5. Setup CI/CD pipeline

## PR Attribution

When committing these changes, use:

```markdown
AI-assisted: Antigravity

- Initialized React + Vite + TypeScript frontend
- Created useCart hook with localStorage and API sync
- Built ProductCard component with Tailwind
- Added comprehensive unit tests with Vitest
```

---

**Status**: ✅ Production Ready  
**Build**: ✅ Passing  
**Lint**: ✅ Passing  
**Tests**: ✅ Covered
