# Mnbara Web App - eBay-Level E-commerce Frontend

A modern, scalable React + Redux web application built with TypeScript, Vite, and Tailwind CSS. This is the frontend for the Mnbara marketplace platform, designed to match eBay's scale and performance.

## 🚀 Features

### Core Features
- **Modern React 18** with TypeScript for type safety
- **Redux Toolkit** for state management with persistence
- **React Query** for server state management
- **React Router v6** for navigation with lazy loading
- **Tailwind CSS** with custom eBay-inspired design system
- **Vite** for fast development and optimized builds

### eBay-Level Features
- **Advanced Search** with NLP-powered suggestions
- **Real-time Updates** via Socket.IO
- **Personalized Recommendations** based on user behavior
- **Multi-language Support** with i18n
- **PWA Support** for mobile app-like experience
- **Performance Optimized** with code splitting and lazy loading

### UI/UX Features
- **Responsive Design** for all device sizes
- **Dark Mode** support with system preference detection
- **Accessibility** compliant (WCAG 2.1)
- **Loading States** and error boundaries
- **Toast Notifications** for user feedback
- **Infinite Scrolling** for product lists

## 🛠️ Tech Stack

### Frontend Framework
- **React 18.2** - UI library with concurrent features
- **TypeScript 5.2** - Type safety and better DX
- **Vite 5.0** - Fast build tool and dev server

### State Management
- **Redux Toolkit 2.0** - Modern Redux with RTK Query
- **Redux Persist** - State persistence
- **React Query** - Server state management

### Styling & UI
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Beautiful SVG icons
- **Framer Motion** - Animation library

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **Storybook** - Component development

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm 8+ or yarn 1.22+

### Setup
```bash
# Clone the repository
git clone https://github.com/mnbarh/platform.git
cd platform/frontend/web-app

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript type checking

# Storybook
npm run storybook    # Start Storybook dev server
npm run build-storybook # Build Storybook
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── layout/         # Layout components
│   ├── auth/           # Authentication components
│   ├── product/        # Product-related components
│   ├── search/         # Search components
│   └── ...
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── errors/         # Error pages
│   └── ...
├── hooks/              # Custom React hooks
├── services/           # API services
│   └── api/            # API client and endpoints
├── store/              # Redux store
│   └── slices/         # Redux slices
├── contexts/           # React contexts
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── styles/             # Global styles
└── assets/             # Static assets
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6) - Main brand color
- **Secondary**: Yellow (#facc15) - eBay-inspired accent
- **Success**: Green (#22c55e) - Success states
- **Danger**: Red (#ef4444) - Error states
- **Gray**: Neutral colors for text and backgrounds

### Typography
- **Font Family**: Inter (body), Poppins (headings)
- **Font Sizes**: Responsive scale from xs to 6xl
- **Font Weights**: 300, 400, 500, 600, 700

### Components
- **Buttons**: Primary, secondary, outline, ghost variants
- **Forms**: Consistent input styling with validation
- **Cards**: Product cards, info cards with shadows
- **Navigation**: Header, sidebar, breadcrumbs

## 🔌 API Integration

### Authentication
- JWT-based authentication with refresh tokens
- Social login (Google, Facebook, Apple)
- Password reset and email verification

### Products
- Product search with filters and sorting
- Product details with image gallery
- Recommendations and related products
- Watchlist management

### Cart & Orders
- Shopping cart with persistence
- Checkout process with payment integration
- Order tracking and history

### Real-time Features
- Live notifications
- Real-time price updates
- Chat and messaging

## 🌐 Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false

# External Services
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_GOOGLE_CLIENT_ID=...
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 📱 PWA Support

The app includes Progressive Web App features:
- Service worker for offline support
- Web app manifest for installation
- Push notifications support
- Background sync

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## 🔍 Performance

### Optimization Features
- Code splitting with React.lazy()
- Image lazy loading
- Bundle analysis with rollup-plugin-analyzer
- Tree shaking for smaller bundles
- Gzip compression

### Performance Targets
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1
- First Input Delay: <100ms

## 🌍 Internationalization

The app supports multiple languages:
- English (default)
- Arabic
- Spanish
- French
- German

## 🔒 Security

### Security Features
- Content Security Policy (CSP)
- XSS protection
- CSRF protection
- Secure authentication flow
- Input validation and sanitization

## 📊 Analytics

### Tracking
- Google Analytics 4
- Custom event tracking
- Performance monitoring
- Error tracking with Sentry

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is proprietary software owned by Mnbara Platform Team.

## 🆘 Support

For support and questions:
- Email: support@mnbarh.com
- Documentation: https://docs.mnbarh.com
- Issues: https://github.com/mnbarh/platform/issues

---

**Built with ❤️ by the Mnbara Platform Team**