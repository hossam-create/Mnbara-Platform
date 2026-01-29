# P2P Exchange Service - API Documentation

**Version**: 1.0.0  
**Base URL**: `https://api.mnbarh.com/p2p-exchange` (Production)  
**Base URL**: `http://localhost:3005` (Development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Exchange Request APIs](#exchange-request-apis)
3. [Marketplace APIs](#marketplace-apis)
4. [Match APIs](#match-apis)
5. [Settlement APIs](#settlement-apis)
6. [Security & Trust APIs](#security--trust-apis)
7. [Communication APIs](#communication-apis)
8. [Admin APIs](#admin-apis)
9. [Error Responses](#error-responses)

---

## Authentication

All API requests require authentication using JWT tokens.

### Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Getting a Token

Tokens are issued by the authentication service. See the main platform authentication documentation.

---

## Exchange Request APIs

### Create Exchange Request

Create a new exchange request to buy or sell currency.

**Endpoint**: `POST /api/v1/exchange/requests`

**Request Body**:
```json
{
  "type": "BUY",
  "fromCurrency": "USD",
  "toCurrency": "EGP",
  "fromAmount": 1000,
  "toAmount": 30000,
  "rate": 30.0,
  "expiresAt": "2026-01-29T12:00:00Z"
}
```

**Response** (201 Created):
```json
{
  "id": "req_abc123",
  "userId": "user_456",
  "type": "BUY",
  "fromCurrency": "USD",
  "toCurrency": "EGP",
  "fromAmount": 1000,
  "toAmount": 30000,
  "rate": 30.0,
  "status": "OPEN",
  "expiresAt": "2026-01-29T12:00:00Z",
  "createdAt": "2026-01-28T12:00:00Z",
  "fees": {
    "platformFee": 10,
    "protectionFee": 5,
    "total": 15
  }
}
```

### Get Exchange Request

Get details of a specific exchange request.

**Endpoint**: `GET /api/v1/exchange/requests/:id`

**Response** (200 OK):
```json
{
  "id": "req_abc123",
  "userId": "user_456",
  "type": "BUY",
  "fromCurrency": "USD",
  "toCurrency": "EGP",
  "fromAmount": 1000,
  "toAmount": 30000,
  "rate": 30.0,
  "status": "MATCHED",
  "matchId": "match_789",
  "expiresAt": "2026-01-29T12:00:00Z",
  "createdAt": "2026-01-28T12:00:00Z"
}
```

### Get User's Exchange Requests

Get all exchange requests for the authenticated user.

**Endpoint**: `GET /api/v1/exchange/requests`

**Query Parameters**:
- `status` (optional): Filter by status (OPEN, MATCHED, COMPLETED, CANCELLED, EXPIRED)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "requests": [
    {
      "id": "req_abc123",
      "type": "BUY",
      "fromCurrency": "USD",
      "toCurrency": "EGP",
      "fromAmount": 1000,
      "status": "MATCHED",
      "createdAt": "2026-01-28T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Cancel Exchange Request

Cancel an open exchange request.

**Endpoint**: `DELETE /api/v1/exchange/requests/:id`

**Response** (200 OK):
```json
{
  "message": "Exchange request cancelled successfully",
  "id": "req_abc123",
  "status": "CANCELLED"
}
```

---

## Marketplace APIs

### Browse Marketplace

Browse available exchange requests in the marketplace.

**Endpoint**: `GET /api/v1/exchange/marketplace`

**Query Parameters**:
- `fromCurrency` (optional): Filter by source currency
- `toCurrency` (optional): Filter by target currency
- `minAmount` (optional): Minimum amount
- `maxAmount` (optional): Maximum amount
- `minRate` (optional): Minimum exchange rate
- `maxRate` (optional): Maximum exchange rate
- `minReputation` (optional): Minimum trust level (BRONZE, SILVER, GOLD, PLATINUM)
- `sortBy` (optional): Sort field (rate, amount, reputation, createdAt)
- `sortOrder` (optional): Sort order (asc, desc)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "requests": [
    {
      "id": "req_xyz789",
      "type": "SELL",
      "fromCurrency": "EGP",
      "toCurrency": "USD",
      "fromAmount": 30000,
      "toAmount": 1000,
      "rate": 30.0,
      "user": {
        "id": "user_789",
        "trustLevel": "GOLD",
        "completedExchanges": 45,
        "successRate": 98.5
      },
      "createdAt": "2026-01-28T11:00:00Z",
      "expiresAt": "2026-01-29T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Accept Marketplace Request

Accept an exchange request from the marketplace (manual matching).

**Endpoint**: `POST /api/v1/exchange/marketplace/:requestId/accept`

**Response** (201 Created):
```json
{
  "match": {
    "id": "match_abc123",
    "request1Id": "req_abc123",
    "request2Id": "req_xyz789",
    "status": "PENDING_PAYMENT",
    "matchScore": 95,
    "createdAt": "2026-01-28T12:00:00Z"
  }
}
```

---

## Match APIs

### Get Match Details

Get details of a specific match.

**Endpoint**: `GET /api/v1/exchange/matches/:id`

**Response** (200 OK):
```json
{
  "id": "match_abc123",
  "request1": {
    "id": "req_abc123",
    "userId": "user_456",
    "type": "BUY",
    "fromCurrency": "USD",
    "toCurrency": "EGP",
    "fromAmount": 1000,
    "toAmount": 30000
  },
  "request2": {
    "id": "req_xyz789",
    "userId": "user_789",
    "type": "SELL",
    "fromCurrency": "EGP",
    "toCurrency": "USD",
    "fromAmount": 30000,
    "toAmount": 1000
  },
  "status": "PENDING_PAYMENT",
  "matchScore": 95,
  "settlementMethod": "internal",
  "createdAt": "2026-01-28T12:00:00Z",
  "timeouts": {
    "paymentDeadline": "2026-01-28T12:30:00Z",
    "proofDeadline": "2026-01-28T13:00:00Z",
    "confirmationDeadline": "2026-01-28T13:30:00Z"
  }
}
```

### Initiate Payment

Initiate payment for a match (buyer action).

**Endpoint**: `POST /api/v1/exchange/matches/:id/initiate-payment`

**Request Body**:
```json
{
  "paymentMethod": "bank_transfer",
  "paymentDetails": {
    "accountNumber": "1234567890",
    "bankName": "Example Bank"
  }
}
```

**Response** (200 OK):
```json
{
  "message": "Payment initiated successfully",
  "match": {
    "id": "match_abc123",
    "status": "PAYMENT_INITIATED",
    "proofDeadline": "2026-01-28T13:00:00Z"
  }
}
```

### Upload Proof of Payment

Upload proof of payment (buyer action).

**Endpoint**: `POST /api/v1/exchange/matches/:id/upload-proof`

**Request**: Multipart form data
- `file`: Image or PDF file (max 10MB)
- `notes` (optional): Additional notes

**Response** (200 OK):
```json
{
  "message": "Proof uploaded successfully",
  "proof": {
    "id": "proof_abc123",
    "matchId": "match_abc123",
    "fileUrl": "https://s3.amazonaws.com/proofs/proof_abc123.jpg",
    "status": "PENDING_VERIFICATION",
    "uploadedAt": "2026-01-28T12:15:00Z"
  }
}
```

### Confirm Receipt

Confirm receipt of payment (seller action).

**Endpoint**: `POST /api/v1/exchange/matches/:id/confirm-receipt`

**Response** (200 OK):
```json
{
  "message": "Receipt confirmed successfully",
  "match": {
    "id": "match_abc123",
    "status": "COMPLETED",
    "completedAt": "2026-01-28T12:20:00Z"
  }
}
```

---

## Settlement APIs

### Get Settlement Details

Get details of a settlement.

**Endpoint**: `GET /api/v1/exchange/settlements/:id`

**Response** (200 OK):
```json
{
  "id": "settle_abc123",
  "matchId": "match_abc123",
  "method": "internal",
  "status": "COMPLETED",
  "fromUserId": "user_456",
  "toUserId": "user_789",
  "fromCurrency": "USD",
  "toCurrency": "EGP",
  "fromAmount": 1000,
  "toAmount": 30000,
  "initiatedAt": "2026-01-28T12:00:00Z",
  "completedAt": "2026-01-28T12:20:00Z"
}
```

### PSP Webhook

Webhook endpoint for payment service provider callbacks.

**Endpoint**: `POST /api/v1/exchange/webhooks/psp/:provider`

**Providers**: `stripe`, `paypal`, `wise`

**Request Body**: Provider-specific format

**Response** (200 OK):
```json
{
  "received": true
}
```

### External Escrow Webhook

Webhook endpoint for external escrow provider callbacks.

**Endpoint**: `POST /api/v1/exchange/webhooks/escrow/:provider`

**Providers**: `tatum`

**Request Body**: Provider-specific format

**Response** (200 OK):
```json
{
  "received": true
}
```

---

## Security & Trust APIs

### Get Security Deposit

Get the user's security deposit balance.

**Endpoint**: `GET /api/v1/exchange/security-deposit`

**Response** (200 OK):
```json
{
  "userId": "user_456",
  "balance": 500,
  "frozen": 50,
  "available": 450,
  "currency": "USD",
  "lastUpdated": "2026-01-28T12:00:00Z"
}
```

### Add to Security Deposit

Add funds to security deposit.

**Endpoint**: `POST /api/v1/exchange/security-deposit/add`

**Request Body**:
```json
{
  "amount": 100,
  "paymentMethod": "stripe",
  "paymentToken": "tok_abc123"
}
```

**Response** (200 OK):
```json
{
  "message": "Security deposit added successfully",
  "deposit": {
    "userId": "user_456",
    "balance": 600,
    "available": 550
  }
}
```

### Get Trust Level

Get the user's trust level and statistics.

**Endpoint**: `GET /api/v1/exchange/trust-level`

**Response** (200 OK):
```json
{
  "userId": "user_456",
  "level": "GOLD",
  "maxTransactionAmount": 10000,
  "completedExchanges": 45,
  "successRate": 98.5,
  "averageCompletionTime": 1800,
  "disputeRate": 1.5,
  "nextLevel": "PLATINUM",
  "nextLevelRequirements": {
    "completedExchanges": 100,
    "successRate": 99.0,
    "disputeRate": 1.0
  }
}
```

### Get External Escrow Providers

Get list of available external escrow providers.

**Endpoint**: `GET /api/v1/exchange/external-escrow-providers`

**Response** (200 OK):
```json
{
  "providers": [
    {
      "id": "tatum",
      "name": "Tatum.io",
      "supportedCurrencies": ["BTC", "ETH", "USDT"],
      "fee": 0.5,
      "estimatedTime": 3600,
      "available": true
    }
  ]
}
```

---

## Communication APIs

### Send Message

Send a message in a match chat.

**Endpoint**: `POST /api/v1/exchange/matches/:matchId/messages`

**Request Body**:
```json
{
  "content": "Payment sent. Please check your account."
}
```

**Response** (201 Created):
```json
{
  "message": {
    "id": "msg_abc123",
    "matchId": "match_abc123",
    "senderId": "user_456",
    "content": "Payment sent. Please check your account.",
    "flagged": false,
    "createdAt": "2026-01-28T12:10:00Z"
  }
}
```

### Get Match Messages

Get all messages for a match.

**Endpoint**: `GET /api/v1/exchange/matches/:matchId/messages`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response** (200 OK):
```json
{
  "messages": [
    {
      "id": "msg_abc123",
      "senderId": "user_456",
      "content": "Payment sent. Please check your account.",
      "flagged": false,
      "createdAt": "2026-01-28T12:10:00Z"
    },
    {
      "id": "msg_xyz789",
      "senderId": "user_789",
      "content": "Received. Thank you!",
      "flagged": false,
      "createdAt": "2026-01-28T12:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "pages": 1
  }
}
```

---

## Admin APIs

### Get All Exchange Requests (Admin)

Get all exchange requests with filters (admin only).

**Endpoint**: `GET /api/v1/admin/exchange/requests`

**Query Parameters**:
- `status` (optional): Filter by status
- `userId` (optional): Filter by user
- `fromDate` (optional): Filter by creation date
- `toDate` (optional): Filter by creation date
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response** (200 OK):
```json
{
  "requests": [
    {
      "id": "req_abc123",
      "userId": "user_456",
      "type": "BUY",
      "fromCurrency": "USD",
      "toCurrency": "EGP",
      "fromAmount": 1000,
      "status": "MATCHED",
      "createdAt": "2026-01-28T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "pages": 25
  }
}
```

### Get Pending Proofs (Admin)

Get all proofs pending verification.

**Endpoint**: `GET /api/v1/admin/exchange/proofs/pending`

**Response** (200 OK):
```json
{
  "proofs": [
    {
      "id": "proof_abc123",
      "matchId": "match_abc123",
      "uploaderId": "user_456",
      "fileUrl": "https://s3.amazonaws.com/proofs/proof_abc123.jpg",
      "status": "PENDING_VERIFICATION",
      "uploadedAt": "2026-01-28T12:15:00Z"
    }
  ]
}
```

### Verify Proof (Admin)

Verify or reject a proof of payment.

**Endpoint**: `POST /api/v1/admin/exchange/proofs/:id/verify`

**Request Body**:
```json
{
  "approved": true,
  "notes": "Payment verified successfully"
}
```

**Response** (200 OK):
```json
{
  "message": "Proof verified successfully",
  "proof": {
    "id": "proof_abc123",
    "status": "VERIFIED",
    "verifiedAt": "2026-01-28T12:25:00Z",
    "verifiedBy": "admin_123"
  }
}
```

### Retry Settlement (Admin)

Manually retry a failed settlement.

**Endpoint**: `POST /api/v1/admin/exchange/settlements/:id/retry`

**Response** (200 OK):
```json
{
  "message": "Settlement retry initiated",
  "settlement": {
    "id": "settle_abc123",
    "status": "PENDING",
    "retryCount": 2
  }
}
```

### Freeze Security Deposit (Admin)

Freeze a user's security deposit.

**Endpoint**: `POST /api/v1/admin/exchange/security-deposit/:userId/freeze`

**Request Body**:
```json
{
  "amount": 100,
  "reason": "Suspicious activity detected"
}
```

**Response** (200 OK):
```json
{
  "message": "Security deposit frozen successfully",
  "deposit": {
    "userId": "user_456",
    "balance": 500,
    "frozen": 150,
    "available": 350
  }
}
```

---

## Error Responses

### Error Format

All errors follow this format:

```json
{
  "error": {
    "code": "INSUFFICIENT_SECURITY_DEPOSIT",
    "message": "Insufficient security deposit for this transaction",
    "details": {
      "required": 50,
      "available": 30
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INSUFFICIENT_SECURITY_DEPOSIT` | 400 | Not enough security deposit |
| `EXCEEDS_TRANSACTION_LIMIT` | 400 | Transaction exceeds trust level limit |
| `INVALID_PROOF` | 400 | Invalid proof of payment |
| `SETTLEMENT_TIMEOUT` | 408 | Settlement timed out |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 100 requests per minute
- **Admin users**: 1000 requests per minute
- **Unauthenticated**: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706443200
```

---

## Webhooks

### Webhook Security

All webhooks include a signature header for verification:

```
X-Webhook-Signature: sha256=abc123...
```

Verify the signature using the webhook secret provided in your dashboard.

### Webhook Retry Policy

- Failed webhooks are retried up to 3 times
- Retry intervals: 1 minute, 5 minutes, 15 minutes
- After 3 failures, webhook is marked as failed

---

## Support

For API support:
- **Documentation**: https://docs.mnbarh.com/p2p-exchange
- **Email**: api-support@mnbarh.com
- **Slack**: #p2p-exchange-api

---

**Last Updated**: 2026-01-28  
**Version**: 1.0.0
