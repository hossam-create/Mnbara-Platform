# Admin Dashboard Frontend

Professional React-based admin dashboard for Mnbara Platform.

## Features

- ✅ Dashboard Overview with KPIs
- ✅ User Management with filters
- ✅ Analytics with charts
- ✅ Responsive design
- ✅ Ant Design UI components
- ✅ Real-time data from API

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Ant Design** - UI components
- **Recharts** - Data visualization
- **React Router** - Navigation
- **Axios** - HTTP client
- **Zustand** - State management

## Quick Start

### Install Dependencies

```bash
cd frontend/admin-dashboard
npm install
```

### Run Development Server

```bash
npm run dev
```

The dashboard will be available at: http://localhost:3000

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   └── DashboardLayout.tsx    # Main layout with sidebar
├── pages/
│   ├── Dashboard.tsx          # Overview page
│   ├── Users.tsx              # User management
│   └── Analytics.tsx          # Analytics charts
├── App.tsx                    # Main app with routing
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

## Pages

### Dashboard
- Active users count
- Total orders
- Revenue metrics
- User distribution charts
- Daily revenue trends

### Users
- User list with pagination
- Filters (role, KYC status)
- Search functionality
- User details

### Analytics
- Period selection (7d, 30d, 3m, 1y)
- User analytics
- Order status distribution
- Revenue breakdown

## API Integration

The dashboard connects to the admin-service backend:

```typescript
// Example API call
axios.get('/api/admin/analytics/overview?period=7d')
```

API proxy is configured in `vite.config.ts` to forward `/api` requests to `http://localhost:3012`.

## Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3012
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## License

MIT
