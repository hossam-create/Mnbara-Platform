# Fraud Detection System Documentation

## Overview

The Fraud Detection System provides comprehensive fraud prevention and risk assessment capabilities for the request-engine service. It uses multiple detection strategies including velocity checks, device fingerprinting, behavior analysis, and blacklisting.

## Architecture

### Components

1. **FraudDetectionService** - Core service implementing fraud detection logic
2. **Fraud Detection Middleware** - Express middleware for automatic fraud checks
3. **Database Schema** - PostgreSQL tables for storing fraud alerts
4. **Redis Cache** - Real-time velocity tracking and blacklist management

### Detection Strategies

#### 1. Velocity Checks
Monitors request rates to detect suspicious activity:
- **IP-based limits**:
  - 100 requests per hour
  - 20 requests per minute
- **User-based limits** (authenticated):
  - 50 requests per hour
  - 10 requests per minute

#### 2. Device Fingerprinting
Analyzes device characteristics:
- User agent validation
- Bot detection (curl, wget, scrapers)
- Device ID tracking
- IP address consistency

#### 3. Behavior Analysis
Identifies suspicious patterns:
- Uniform timing patterns (bot-like behavior)
- Round transaction amounts
- Unusually large amounts
- Action sequence analysis

#### 4. Blacklist Management
Maintains IP blacklists:
- Automatic blocking of blacklisted IPs
- Configurable blacklist duration
- Manual blacklist management

## Risk Scoring

### Risk Levels

| Level | Score Range | Action |
|-------|-------------|--------|
| LOW | 0-29 | ALLOW |
| MEDIUM | 30-59 | ALLOW |
| HIGH | 60-79 | REVIEW |
| CRITICAL | 80-100 | BLOCK |

### Risk Factors

| Factor | Risk Points | Flag |
|--------|-------------|------|
| Blacklisted IP | 100 | BLACKLISTED_IP |
| Bot user agent | 40 | BOT_USER_AGENT |
| IP velocity (minute) | 40 | IP_VELOCITY_EXCEEDED_MINUTE |
| User velocity (minute) | 35 | USER_VELOCITY_EXCEEDED_MINUTE |
| Uniform timing | 35 | UNIFORM_TIMING_PATTERN |
| IP velocity (hour) | 30 | IP_VELOCITY_EXCEEDED_HOUR |
| User velocity (hour) | 25 | USER_VELOCITY_EXCEEDED_HOUR |
| Large amount | 20 | LARGE_AMOUNT |
| Suspicious user agent | 20 | SUSPICIOUS_USER_AGENT |
| IP change | 15 | IP_CHANGE |
| Round amount | 10 | ROUND_AMOUNT |
| New device | 10 | NEW_DEVICE |

## Usage

### Basic Integration

```typescript
import { FraudDetectionService } from './services/FraudDetectionService';
import { fraudDetection } from './middleware/fraudDetection';

// Initialize service
const fraudService = new FraudDetectionService(db, redis);

// Apply middleware to routes
app.post('/api/payments',
  fraudDetection(fraudService, {
    checkType: 'PAYMENT',
    blockOnHighRisk: true,
  }),
  paymentController.create
);
```

### Middleware Options

```typescript
interface FraudDetectionOptions {
  checkType: FraudCheckType;  // Type of check to perform
  blockOnHighRisk?: boolean;  // Block high-risk requests
  requireReview?: boolean;    // Require review for medium risk
}
```

### Check Types

- `PAYMENT` - Payment transaction checks
- `PAYOUT` - Payout request checks
- `DISPUTE` - Dispute filing checks
- `LOGIN` - Login attempt checks
- `REGISTRATION` - New user registration checks
- `API_CALL` - General API call checks

### Manual Fraud Checks

```typescript
// Perform fraud check
const result = await fraudService.performFraudCheck(
  userId,
  ipAddress,
  'PAYMENT',
  {
    userAgent: req.headers['user-agent'],
    deviceId: req.headers['x-device-id'],
    amount: 1000,
  }
);

// Check result
if (result.action === 'BLOCK') {
  // Block request
}
```

### Blacklist Management

```typescript
// Add IP to blacklist
await fraudService.blacklistIp(
  '192.168.1.1',
  'Multiple fraud attempts',
  86400 // 24 hours
);

// Remove from blacklist
await fraudService.removeFromBlacklist('192.168.1.1');
```

### Retrieving Alerts

```typescript
// Get user alerts
const userAlerts = await fraudService.getUserAlerts(userId, 10);

// Get IP alerts
const ipAlerts = await fraudService.getIpAlerts('192.168.1.1', 10);
```

## Database Schema

### fraud_alerts Table

```sql
CREATE TABLE fraud_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  ip_address VARCHAR(45) NOT NULL,
  check_type VARCHAR(50) NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  flags TEXT[] NOT NULL,
  action VARCHAR(20) NOT NULL,
  reasons TEXT[] NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes

- `idx_fraud_alerts_user_id` - User lookups
- `idx_fraud_alerts_ip_address` - IP lookups
- `idx_fraud_alerts_check_type` - Check type filtering
- `idx_fraud_alerts_risk_level` - Risk level filtering
- `idx_fraud_alerts_action` - Action filtering
- `idx_fraud_alerts_created_at` - Time-based queries
- `idx_fraud_alerts_user_check` - User + check type composite
- `idx_fraud_alerts_ip_time` - IP + time composite (velocity)

## Redis Keys

### Velocity Tracking

- `velocity:ip:hour:{ip}` - IP hourly request count (TTL: 3600s)
- `velocity:ip:minute:{ip}` - IP minute request count (TTL: 60s)
- `velocity:user:hour:{userId}` - User hourly request count (TTL: 3600s)
- `velocity:user:minute:{userId}` - User minute request count (TTL: 60s)

### Device Tracking

- `device:{userId}:{deviceId}` - Known device (TTL: 30 days)
- `lastip:{userId}` - Last known IP (TTL: 1 hour)

### Behavior Tracking

- `actions:{userId}` - Recent actions list (TTL: 1 hour, max 10 items)

### Blacklist

- `blacklist:ip:{ip}` - Blacklisted IP (configurable TTL)

## API Response Format

### Success (Low Risk)

```json
{
  "userId": 1,
  "ipAddress": "192.168.1.1",
  "checkType": "PAYMENT",
  "riskScore": 15,
  "riskLevel": "LOW",
  "flags": ["NEW_DEVICE"],
  "action": "ALLOW",
  "reasons": ["Request from new device"],
  "metadata": {},
  "timestamp": "2026-01-24T10:00:00Z"
}
```

### Blocked (High Risk)

```json
{
  "error": "Request blocked",
  "message": "This request has been flagged as potentially fraudulent",
  "riskLevel": "CRITICAL",
  "requestId": "req_123456"
}
```

### Review Required

```json
{
  "error": "Review required",
  "message": "This request requires manual review",
  "riskLevel": "HIGH",
  "requestId": "req_123456"
}
```

## Monitoring & Alerts

### Key Metrics

1. **Fraud Detection Rate** - Percentage of requests flagged
2. **Block Rate** - Percentage of requests blocked
3. **False Positive Rate** - Incorrectly flagged legitimate requests
4. **Risk Score Distribution** - Distribution of risk scores

### Logging

All fraud checks are logged with:
- User ID (if authenticated)
- IP address
- Risk score and level
- Flags detected
- Action taken
- Timestamp

High-risk alerts (HIGH/CRITICAL) generate warning logs.

## Testing

### Unit Tests

```bash
npm test -- FraudDetectionService.test.ts
```

### Integration Tests

```bash
npm test -- fraud-detection.integration.test.ts
```

### Test Coverage

- Velocity checks (IP and user)
- Device fingerprinting
- Bot detection
- Blacklist functionality
- Behavior analysis
- Risk scoring
- Action determination

## Configuration

### Environment Variables

```env
# Redis connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Database connection
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Fraud detection settings
FRAUD_DETECTION_ENABLED=true
FRAUD_BLOCK_HIGH_RISK=true
FRAUD_LOG_LEVEL=warn
```

### Customization

Risk thresholds and velocity limits can be customized in `FraudDetectionService.ts`:

```typescript
private readonly RISK_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
  CRITICAL: 100,
};

private readonly VELOCITY_LIMITS = {
  IP_PER_HOUR: 100,
  IP_PER_MINUTE: 20,
  USER_PER_HOUR: 50,
  USER_PER_MINUTE: 10,
};
```

## Best Practices

1. **Apply fraud detection to sensitive endpoints**:
   - Payment processing
   - Payout requests
   - Dispute filing
   - Account changes

2. **Monitor false positives**:
   - Review blocked requests regularly
   - Adjust thresholds based on data
   - Whitelist legitimate high-volume users

3. **Use appropriate check types**:
   - Different endpoints may need different sensitivity
   - Payment checks should be more strict than browsing

4. **Handle errors gracefully**:
   - Don't block requests on fraud detection errors
   - Log errors for investigation
   - Have fallback mechanisms

5. **Regular maintenance**:
   - Review and update blacklists
   - Analyze fraud patterns
   - Update detection rules
   - Clean up old alerts

## Troubleshooting

### High False Positive Rate

- Review risk thresholds
- Check velocity limits
- Analyze flagged patterns
- Consider whitelisting

### Performance Issues

- Check Redis connection
- Review database indexes
- Monitor query performance
- Consider caching

### Missing Detections

- Review detection rules
- Check risk scoring
- Analyze missed fraud patterns
- Update detection strategies

## Future Enhancements

1. **Machine Learning Integration**:
   - Train models on historical fraud data
   - Adaptive risk scoring
   - Pattern recognition

2. **Geographic Analysis**:
   - IP geolocation
   - Country-based risk scoring
   - VPN/proxy detection

3. **Advanced Device Fingerprinting**:
   - Canvas fingerprinting
   - WebGL fingerprinting
   - Browser feature detection

4. **Network Analysis**:
   - Graph-based fraud detection
   - Connected account analysis
   - Relationship mapping

5. **Real-time Alerts**:
   - Webhook notifications
   - Email alerts
   - Dashboard integration

## Support

For issues or questions:
- Check logs in `logs/fraud-detection.log`
- Review Redis keys for debugging
- Query `fraud_alerts` table for historical data
- Contact security team for escalation
