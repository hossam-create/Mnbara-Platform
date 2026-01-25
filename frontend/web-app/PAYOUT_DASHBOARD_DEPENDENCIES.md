# Admin Payout Dashboard - Dependencies

## Required Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.17.19",
    "@tanstack/react-table": "^8.11.6",
    "@headlessui/react": "^1.7.18",
    "@heroicons/react": "^2.1.1",
    "axios": "^1.6.5",
    "date-fns": "^3.2.0",
    "react-hot-toast": "^2.4.1"
  }
}
```

## Installation Commands

```bash
# Install all at once
npm install @tanstack/react-query @tanstack/react-table @headlessui/react @heroicons/react axios date-fns react-hot-toast

# Or with yarn
yarn add @tanstack/react-query @tanstack/react-table @headlessui/react @heroicons/react axios date-fns react-hot-toast

# Or with pnpm
pnpm add @tanstack/react-query @tanstack/react-table @headlessui/react @heroicons/react axios date-fns react-hot-toast
```

## Dependency Details

### @tanstack/react-query (^5.17.19)
- **Purpose**: Data fetching, caching, and state management
- **Usage**: 
  - Fetching payout data
  - Automatic refetching
  - Cache management
  - Optimistic updates

### @tanstack/react-table (^8.11.6)
- **Purpose**: Powerful table component
- **Usage**:
  - Sortable columns
  - Flexible rendering
  - Type-safe API
  - Performance optimized

### @headlessui/react (^1.7.18)
- **Purpose**: Unstyled, accessible UI components
- **Usage**:
  - Modal/Dialog component
  - Transitions
  - Focus management
  - Keyboard navigation

### @heroicons/react (^2.1.1)
- **Purpose**: Beautiful hand-crafted SVG icons
- **Usage**:
  - UI icons throughout the dashboard
  - Status indicators
  - Action buttons

### axios (^1.6.5)
- **Purpose**: HTTP client
- **Usage**:
  - API requests
  - Request/response interceptors
  - Error handling
  - Token management

### date-fns (^3.2.0)
- **Purpose**: Modern date utility library
- **Usage**:
  - Date formatting
  - Arabic locale support
  - Date calculations
  - Lightweight alternative to moment.js

### react-hot-toast (^2.4.1)
- **Purpose**: Toast notifications
- **Usage**:
  - Success messages
  - Error notifications
  - Loading states
  - Customizable styling

## TypeScript Types

All dependencies include TypeScript definitions. No additional @types packages needed.

## Peer Dependencies

Make sure you have these installed (usually already in Next.js/React projects):

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## Tailwind CSS Configuration

Ensure Tailwind CSS is configured in your project:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3010
```

## Optional Dependencies

### For Development

```bash
npm install -D @types/node typescript
```

### For Testing

```bash
npm install -D @testing-library/react @testing-library/jest-dom vitest
```

## Version Compatibility

| Package | Minimum Version | Tested Version |
|---------|----------------|----------------|
| React | 18.0.0 | 18.2.0 |
| Next.js | 13.0.0 | 14.0.0 |
| TypeScript | 5.0.0 | 5.3.3 |
| Node.js | 18.0.0 | 20.10.0 |

## Bundle Size Impact

Approximate gzipped sizes:

- @tanstack/react-query: ~13 KB
- @tanstack/react-table: ~15 KB
- @headlessui/react: ~25 KB
- @heroicons/react: ~2 KB (tree-shakeable)
- axios: ~13 KB
- date-fns: ~2-5 KB (tree-shakeable)
- react-hot-toast: ~4 KB

**Total**: ~74-77 KB gzipped

## Tree Shaking

These packages support tree shaking:
- ✅ @heroicons/react
- ✅ date-fns
- ✅ @tanstack/react-query
- ✅ @tanstack/react-table

Import only what you need:

```typescript
// Good - tree-shakeable
import { format } from 'date-fns';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

// Avoid - imports everything
import * as dateFns from 'date-fns';
```

## CDN Alternative (Not Recommended)

For quick prototyping only:

```html
<script src="https://unpkg.com/@tanstack/react-query@latest"></script>
```

**Note**: Use npm/yarn for production builds.

## Troubleshooting

### Issue: Module not found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Type errors

```bash
# Regenerate types
npm run build
```

### Issue: Tailwind classes not working

```bash
# Rebuild Tailwind
npm run dev
```

## Updates

Check for updates:

```bash
npm outdated
```

Update all:

```bash
npm update
```

Update specific package:

```bash
npm install @tanstack/react-query@latest
```

---

**Last Updated**: January 23, 2026
