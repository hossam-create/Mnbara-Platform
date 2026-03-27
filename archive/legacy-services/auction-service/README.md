# Auction Service

Real-time bidding engine for the Mnbara platform (NestJS, Socket.IO, Redis, PostgreSQL).

## Features

- Real-time bidding via WebSockets (Socket.IO)
- Scheduled jobs (NestJS Schedule)
- Redis for caching/queues (BullMQ)
- Prisma + PostgreSQL

## Setup

```bash
cd backend/services/auction-service
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

## Integrated: Real-Time Auction (Bike Auction)

Logic from **`docs/external-projects/Real-Time-Bike-Auction-System-Backend/`** is fully integrated: cron runs `startScheduledAuctions()` (SCHEDULED→ACTIVE) and `endExpiredAuctions()` (ACTIVE→ENDED); anti-sniping and idempotency in `RealtimeBidService`; **Buy Now** at `POST /api/auctions/:auctionId/buy-now`. See [EXTERNAL_PROJECTS_INTEGRATION.md](../../../docs/EXTERNAL_PROJECTS_INTEGRATION.md).
