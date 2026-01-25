# Fraud Detection - Quick Start Guide

## 5-Minute Setup

### 1. Run Migration

```bash
# Windows
.\scripts\run-migration.bat 004_fraud_detection.sql

# Linux/Mac
./scripts/run-migration.sh 004_fraud_detection.sql
```

### 2. Initialize Service

```typescript
import { FraudDetectionService } from './services/FraudDetectionService';
import { fraudDetection } from './middleware/fraudDetection';

// Initialize
const fraudService = new FraudDetectionService(db, redis);
```

### 3. Apply to Routes

```typescript
// High security - payments
app.post('/api/payments',
  fraudDetection(fraudService, {
    checkType: 'PAYMENT',
    blockOnHighRisk: true,
    requireReview: true,
  }),
  handler
);

// Medium security - general API
app.post('/api/data',
  fraudDetection(fraudService, {
    checkType: 'API_CALL',
    blockOnHighRisk: false,
  }),
  handler
);
```

## Common Use Cases

### Protect Payment Endpoints

```typescript
app.post('/api/payments',
  fraudDetection(fraudService, {
    checkType: 'PAYMENT',
    blockOnHighRisk: true,
    requireReview: true,
  }),
  paymentController.create
);
```

### Protect Payout Endpoints

```typescript
app.post('/api/payouts',
  fraudDetection(fraudService, {
    checkType: 'PAYOUT',
    blockOnHighRisk: true,
    requireReview: true,
  }),
  payoutController.create
);
```

### Monitor Login Attempts

```typescript
app.post('/api/auth/login',
  fraudDetection(fraudService, {
    checkType: 'LOGIN',
    blockOnHighRisk: false, // Don't block, just monitor
  }),
  authController.login
);
```

### Protect Dispute Filing

```typescript
app.post('/api/disputes',
  fraudDetection(fraudService, {
    checkType: 'DISPUTE',
    blockOnHighRisk: true,
  }),
  disputeController.create
);
```

## Check Types

| Type | Use For | Recommended Settings |
|------|---------|---------------------|
| PAYMENT | Payment processing | blockOnHighRisk: true, requireReview: true |
| PAYOUT | Payout requests | blockOnHighRisk: true, requireReview: true |
| DISPUTE | Dispute filing | blockOnHighRisk: true |
| LOGIN | Login attempts | blockOnHighRisk: false (monitor only) |
| REGISTRATION | New user signup | blockOnHighRisk: true |
| API_CALL | General API calls | blockOnHighRisk: false |

## Admin Operations

### Blacklist an IP

```typescript
await fraudService.blacklistIp(
  '192.168.1.1',
  'Multiple fraud attempts',
  86400 // 24 hours
);
```

### Remove from Blacklist

```typescript
await fraudService.removeFromBlacklist('192.168.1.1');
```

### Get User Alerts

```typescript
const alerts = await fraudService.getUserAlerts(userId, 10);
```

### Get IP Alerts

```typescript
const alerts = await fraudService.getIpAlerts('192.168.1.1', 10);
```

## Response Handling

### Access Fraud Check Results

```typescript
app.post('/api/payments',
  fraudDetection(fraudService, { checkType: 'PAYMENT' }),
  (req, res) => {
    const fraudCheck = (req as any).fraudCheck;
    
    console.log('Risk Level:', fraudCheck.riskLevel);
    console.log('Risk Score:', fraudCheck.riskScore);
    console.log('Flags:', fraudCheck.flags);
    
    // Your logic here
  }
);
```

### Handle Blocked Requests

Blocked requests automatically return:
```json
{
  "error": "Request blocked",
  "message": "This request has been flagged as potentially fraudulent",
  "riskLevel": "CRITICAL",
  "requestId": "req_123456"
}
```

### Handle Review Required

Review-required requests return:
```json
{
  "error": "Review required",
  "message": "This request requires manual review",
  "riskLevel": "HIGH",
  "requestId": "req_123456"
}
```

## Configuration

### Adjust Risk Thresholds

Edit `FraudDetectionService.ts`:

```typescript
private readonly RISK_THRESHOLDS = {
  LOW: 30,      // Adjust as needed
  MEDIUM: 60,   // Adjust as needed
  HIGH: 80,     // Adjust as needed
  CRITICAL: 100,
};
```

### Adjust Velocity Limits

Edit `FraudDetectionService.ts`:

```typescript
private readonly VELOCITY_LIMITS = {
  IP_PER_HOUR: 100,    // Adjust as needed
  IP_PER_MINUTE: 20,   // Adjust as needed
  USER_PER_HOUR: 50,   // Adjust as needed
  USER_PER_MINUTE: 10, // Adjust as needed
};
```

## Testing

### Run Tests

```bash
npm test -- FraudDetectionService.test.ts
```

### Manual Testing

```bash
# Test with curl (will be flagged as bot)
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'

# Test with normal user agent
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0" \
  -d '{"amount": 1000}'
```

## Monitoring

### Check Redis Keys

```bash
# Check velocity for IP
redis-cli GET velocity:ip:hour:192.168.1.1

# Check blacklist
redis-cli GET blacklist:ip:192.168.1.1

# Check user velocity
redis-cli GET velocity:user:hour:1
```

### Query Database

```sql
-- Recent high-risk alerts
SELECT * FROM fraud_alerts 
WHERE risk_level IN ('HIGH', 'CRITICAL')
ORDER BY created_at DESC 
LIMIT 10;

-- Alerts for specific user
SELECT * FROM fraud_alerts 
WHERE user_id = 1 
ORDER BY created_at DESC;

-- Alerts for specific IP
SELECT * FROM fraud_alerts 
WHERE ip_address = '192.168.1.1' 
ORDER BY created_at DESC;
```

## Troubleshooting

### High False Positive Rate

1. Check velocity limits - may be too strict
2. Review risk thresholds
3. Analyze flagged patterns
4. Consider whitelisting legitimate users

### Performance Issues

1. Check Redis connection
2. Review database indexes
3. Monitor query performance
4. Consider caching

### Not Detecting Fraud

1. Review detection rules
2. Check risk scoring
3. Analyze missed patterns
4. Update detection strategies

## Best Practices

1. ✅ Apply to all sensitive endpoints
2. ✅ Monitor false positives regularly
3. ✅ Adjust thresholds based on data
4. ✅ Use appropriate check types
5. ✅ Handle errors gracefully
6. ✅ Log all high-risk events
7. ✅ Review blacklists regularly
8. ✅ Test before production

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_HOST=localhost
REDIS_PORT=6379

# Optional
REDIS_PASSWORD=
FRAUD_DETECTION_ENABLED=true
FRAUD_BLOCK_HIGH_RISK=true
FRAUD_LOG_LEVEL=warn
```

## Quick Reference

### Risk Levels
- **LOW** (0-29): Allow
- **MEDIUM** (30-59): Allow
- **HIGH** (60-79): Review
- **CRITICAL** (80-100): Block

### Common Flags
- `BLACKLISTED_IP`: IP is blacklisted
- `BOT_USER_AGENT`: Bot detected
- `IP_VELOCITY_EXCEEDED_*`: Too many requests
- `UNIFORM_TIMING_PATTERN`: Bot-like behavior
- `NEW_DEVICE`: First time device
- `IP_CHANGE`: IP address changed
- `LARGE_AMOUNT`: Unusually large transaction

### Actions
- `ALLOW`: Request allowed
- `REVIEW`: Requires manual review
- `BLOCK`: Request blocked

## Need Help?

- 📖 Full documentation: `FRAUD_DETECTION_DOCUMENTATION.md`
- 🔍 Examples: `src/app.fraud-example.ts`
- 🧪 Tests: `src/services/__tests__/FraudDetectionService.test.ts`
- 🌐 Arabic docs: `FRAUD_DETECTION_COMPLETE_AR.md`

---

**Ready to use!** 🚀
