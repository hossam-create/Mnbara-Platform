# AI Business Service

Internal AI-driven accounting and operations system for Mnbara Platform.

## Overview

This service provides comprehensive business management capabilities including:
- Business account management
- Financial transaction tracking
- Invoice and expense management
- AI-powered financial analysis
- Automated reporting
- Role-based access control (RBAC)

## Sprint 0 Foundation

This service has been set up with the following foundation components:

### ✅ Completed Tasks

1. **PostgreSQL Schema**: Complete database schema with optimized tables and indexes
2. **RBAC System**: Role-based access control with Admin, Finance, and AI roles
3. **Internal APIs**: Secure internal-only API endpoints
4. **Authentication**: JWT-based authentication middleware
5. **Core Routes**: Business, accounts, transactions, invoices, expenses, AI, and reports

### 🏗️ Architecture

```
src/
├── index.ts              # Main application entry point
├── middleware/           # Security and validation middleware
│   ├── auth.ts          # JWT authentication
│   ├── rbac.ts          # Role-based access control
│   ├── rateLimit.ts     # Rate limiting
│   └── errorHandler.ts  # Error handling
├── routes/              # API route handlers
│   ├── business.ts      # Business account management
│   ├── accounts.ts      # Financial accounts
│   ├── transactions.ts  # Transaction management
│   ├── invoices.ts      # Invoice management
│   ├── expenses.ts      # Expense tracking
│   ├── ai.ts           # AI analysis endpoints
│   └── reports.ts      # Financial reporting
└── utils/
    └── logger.ts       # Winston logging
```

### 🗄️ Database Schema

Key entities:
- `BusinessAccount` - Main business entities
- `Account` - Financial accounts (checking, savings, etc.)
- `Transaction` - Financial transactions
- `Invoice` - Customer invoices
- `Expense` - Business expenses
- `AIAnalysis` - AI-powered analysis results
- `FinancialReport` - Generated reports

### 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting
- Input validation with Zod
- SQL injection prevention with Prisma
- CORS protection
- Helmet security headers

### 📊 AI Capabilities

- Cash flow prediction
- Expense classification
- Revenue forecasting
- Risk assessment
- Fraud detection
- Anomaly detection
- Trend analysis
- Optimization recommendations

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

All endpoints are prefixed with `/api/internal` and require authentication.

### Business Management
- `GET /api/internal/business` - List user's businesses
- `POST /api/internal/business` - Create new business
- `GET /api/internal/business/:id` - Get business details
- `PUT /api/internal/business/:id` - Update business
- `DELETE /api/internal/business/:id` - Delete business

### Financial Accounts
- `GET /api/internal/accounts` - List accounts
- `POST /api/internal/accounts` - Create account
- `GET /api/internal/accounts/:id` - Get account details
- `PUT /api/internal/accounts/:id` - Update account
- `DELETE /api/internal/accounts/:id` - Close account

### Transactions
- `GET /api/internal/transactions` - List transactions
- `POST /api/internal/transactions` - Create transaction
- `GET /api/internal/transactions/:id` - Get transaction details
- `POST /api/internal/transactions/:id/process` - Process transaction
- `DELETE /api/internal/transactions/:id` - Cancel transaction

### Invoices
- `GET /api/internal/invoices` - List invoices
- `POST /api/internal/invoices` - Create invoice
- `POST /api/internal/invoices/:id/send` - Send invoice
- `POST /api/internal/invoices/:id/pay` - Mark as paid

### Expenses
- `GET /api/internal/expenses` - List expenses
- `POST /api/internal/expenses` - Create expense
- `POST /api/internal/expenses/:id/approve` - Approve expense
- `POST /api/internal/expenses/:id/reimburse` - Mark as reimbursed

### AI Analysis
- `GET /api/internal/ai` - List AI analyses
- `POST /api/internal/ai` - Create analysis request
- `POST /api/internal/ai/:id/process` - Process AI analysis

### Reports
- `GET /api/internal/reports` - List reports
- `POST /api/internal/reports` - Create report
- `POST /api/internal/reports/:id/generate` - Generate report data
- `POST /api/internal/reports/:id/publish` - Publish report

## Roles and Permissions

### Base Roles
- **ADMIN**: Full system access (`*:*`)
- **FINANCE**: Financial operations (`finance:*`, `reports:*`)
- **AI_ANALYST**: AI operations (`ai:*`, `analytics:*`)

### Business Roles
- **BUSINESS_OWNER**: Full business access
- **BUSINESS_ADMIN**: Administrative access
- **BUSINESS_FINANCE**: Financial operations
- **BUSINESS_VIEWER**: Read-only access

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run migrations
- `npm run db:studio` - Open Prisma Studio

### Environment Variables

See `.env.example` for all available configuration options.

## Next Steps

The foundation is complete and ready for:
1. **Sprint 1**: AI model integration
2. **Sprint 2**: Advanced analytics
3. **Sprint 3**: Real-time processing
4. **Sprint 4**: External integrations

## Security Notes

- All endpoints are internal-only
- JWT tokens are required for all API calls
- Rate limiting prevents abuse
- Input validation prevents injection attacks
- Row-level security ensures data isolation

## Support

For issues and questions, contact the development team.
