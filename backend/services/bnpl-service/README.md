# 💳 BNPL Service - Buy Now Pay Later

Advanced Buy Now Pay Later (BNPL) service for Mnbara Platform.

## Features

- ✅ Multiple installment plans (3, 6, 12 months)
- ✅ Credit scoring system
- ✅ Automatic payment scheduling
- ✅ Stripe integration
- ✅ Eligibility checking
- ✅ Real-time payment tracking

## Installation

```bash
npm install
```

## Setup

1. Copy `.env.example` to `.env`
2. Update environment variables
3. Run migrations:

```bash
npx prisma migrate dev
```

4. Seed database:

```bash
npm run prisma:seed
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

### Installments
- `POST /api/v1/installments` - Create installment
- `GET /api/v1/installments/user/:userId` - Get user installments
- `GET /api/v1/installments/:id` - Get installment details
- `PUT /api/v1/installments/:id` - Update installment
- `GET /api/v1/installments/stats/overview` - Get statistics

### Plans
- `GET /api/v1/plans` - Get all plans
- `GET /api/v1/plans/:id` - Get plan details
- `POST /api/v1/plans` - Create plan

### Payments
- `POST /api/v1/payments/process` - Process payment
- `GET /api/v1/payments/schedule/:installmentId` - Get payment schedule

### Credit
- `GET /api/v1/credit/score/:userId` - Get credit score
- `POST /api/v1/credit/check-eligibility` - Check eligibility

## Testing

```bash
npm test
```

## Docker

```bash
docker build -t mnbara-bnpl-service .
docker run -p 3017:3017 mnbara-bnpl-service
```

## License

MIT
