# PR #3: Cart Management & Product Components

## 🛒 Overview

Production-ready cart management system with backend sync and Tailwind-styled UI components.

## Features

### 1. **useCart Hook**

- ✅ localStorage persistence (survives page refresh)
- ✅ Backend sync with `/api/cart` endpoint
- ✅ Bearer token authentication
- ✅ Optimistic updates with error rollback
- ✅ Sentry error tracking
- ✅ Full TypeScript coverage

**API:**

```typescript
const {
  cart, // Current cart state
  loading, // Loading indicator
  error, // Error message
  addToCart, // Add product
  updateQuantity, // Update item quantity
  removeFromCart, // Remove item
  clearCart, // Clear cart
} = useCart();
```

### 2. **ProductCard Component**

- ✅ Tailwind CSS styling with hover effects
- ✅ Responsive design (aspect ratio preserved)
- ✅ Accessibility (ARIA labels, keyboard nav)
- ✅ Lazy-loaded images
- ✅ Smooth transitions

**Props:**

```typescript
interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  onAddToCart: (item) => void;
}
```

### 3. **Service Layer**

- `api.service.ts` - Axios client with token injection
- `cart.service.ts` - Backend cart API integration
- `cart.types.ts` - Full TypeScript definitions

## Files Changed

- `web/src/types/cart.types.ts` (33 lines)
- `web/src/services/api.service.ts` (30 lines)
- `web/src/services/cart.service.ts` (44 lines)
- `web/src/hooks/useCart.ts` (175 lines)
- `web/src/hooks/useCart.test.ts` (294 lines)
- `web/src/components/ProductCard.tsx` (68 lines)
- `web/src/components/ProductCard.test.tsx` (128 lines)

**Total:** 772 insertions, 7 files

## API Integration

**Backend Endpoints Required:**

- `GET /api/cart` - Fetch user cart
- `POST /api/cart` - Add item
- `PATCH /api/cart/:id` - Update quantity
- `DELETE /api/cart/:id` - Remove item
- `POST /api/cart/sync` - Sync local cart

**Authentication:** Bearer token from `localStorage.getItem('authToken')`

## Testing

- ✅ useCart hook: 14 test cases (init, CRUD, errors, localStorage)
- ✅ ProductCard: 8 test cases (rendering, interactions, accessibility)
- ✅ Coverage: Hooks, components, error paths

**Run Tests:**

```bash
npm run test
npm run test:ui        # Visual test runner
npm run test:coverage  # Coverage report
```

## Error Handling

All errors automatically captured by Sentry:

```typescript
try {
  await CartService.addToCart(item);
} catch (error) {
  Sentry.captureException(error);
  setError("Failed to add item to cart");
  // Revert optimistic update
}
```

## Dependencies Added

- `axios` - HTTP client
- `@sentry/react` - Error tracking
- `@testing-library/react` - Component testing
- `@testing-library/user-event` - User interaction testing

## Verification

- ✅ Build: Passing
- ✅ Tests: All passing (22 test cases)
- ✅ Lint: 0 errors
- ✅ Type safety: Full coverage

## AI Attribution

**AI-assisted: Antigravity**

- useCart hook with optimistic updates and error handling
- ProductCard component with Tailwind styling
- Comprehensive unit tests with Vitest
- Service layer architecture

## Usage Example

```typescript
import { useCart } from './hooks/useCart';
import { ProductCard } from './components/ProductCard';

function ProductPage() {
  const { addToCart, loading, error } = useCart();

  return (
    <ProductCard
      id="123"
      title="Premium Headphones"
      price={99.99}
      imageUrl="/images/headphones.jpg"
      onAddToCart={addToCart}
    />
  );
}
```

## Next Steps

- Integrate with actual backend API endpoints
- Add authentication flow (useAuth hook)
- Build more UI components (Button, Input, Modal)
- Add React Router for navigation

---

**Link:** https://github.com/hossam-create/Mnbara-Platform/pull/new/feat/frontend-components

**Depends On:** PR #2 (Frontend Infrastructure) should be merged first
