# Quick Start Guide - Projects #6 & #19

## Real-Time Auction System (Project #6)

### Start Testing in 3 Commands

```bash
# 1. Apply migration
cd backend/services/auction-service && npx prisma migrate deploy

# 2. Start service
npm run dev

# 3. Test bid
curl -X POST http://localhost:3001/auctions/1/realtime-bids \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "idempotencyKey": "test-1"}'
```

### Key Endpoints
- `POST /auctions/:id/realtime-bids` - Place bid
- `GET /auctions/:id/realtime-bids` - Bid history
- `GET /auctions/:id/realtime-bids/winning` - Winning bid

### WebSocket Events
- `bidPlaced` - New bid notification
- `auctionExtended` - Time extension
- `outbid` - Previous bidder notification

---

## KYC System (Project #19)

### Start Testing in 5 Commands

```bash
# 1. Install Python deps
pip install -r backend/services/kyc-service/src/python/requirements.txt

# 2. Apply migration
cd backend/services/kyc-service && npx prisma migrate deploy

# 3. Setup env
cp .env.example .env

# 4. Start service
npm run dev

# 5. Test submission
curl -X POST http://localhost:3007/kyc/submit \
  -F "idType=national_id" \
  -F "idNumber=123456789" \
  -F "fullName=John Doe" \
  -F "idPhoto=@id.jpg" \
  -F "selfiePhoto=@selfie.jpg"
```

### Key Endpoints
- `POST /kyc/submit` - Submit verification
- `GET /kyc/status` - Check status
- `GET /admin/kyc/pending` - Admin: pending list
- `POST /admin/kyc/:id/review` - Admin: review

### Verification Logic
- Both pass → APPROVED
- Both fail → REJECTED
- Mixed → PENDING (manual review)

---

## Ports
- Auction Service: 3001
- KYC Service: 3007

## Documentation
- Auction: `backend/services/auction-service/REALTIME_AUCTION_INTEGRATION_GUIDE.md`
- KYC: `backend/services/kyc-service/README.md`
- Full Report: `PROJECT_6_19_DUAL_COMPLETION_REPORT.md`
