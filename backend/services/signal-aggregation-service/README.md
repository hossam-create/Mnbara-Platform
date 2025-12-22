# Signal Aggregation Service

A read-only monitoring service for post-launch signal aggregation and advisory analytics.

## Overview

This service provides deterministic, advisory-only analytics for monitoring platform launch behavior. It aggregates signals from various sources and provides human-readable status reports without any automated enforcement or scoring mutation.

## Key Constraints

- **READ-ONLY**: No data mutation or automated actions
- **DETERMINISTIC**: Same inputs always produce same outputs
- **ADVISORY ONLY**: Status reporting without enforcement
- **FULL AUDIT TRAIL**: Comprehensive logging for all operations
- **NO ONLINE LEARNING**: No model adaptation or optimization

## Signals Tracked

1. **Intent Volume per Corridor**: Request counts and growth rates by travel corridor
2. **Drop-off Points**: Abandonment rates at key journey stages
3. **Trust Friction Indicators**: KYC completion, verification rates, payment success
4. **Confirmation Abandonment**: Final conversion rates and abandonment reasons
5. **Manual Override Frequency**: Human intervention and arbitration cases

## API Endpoints

### GET /health
Service health check and status.

### GET /info
Service information, constraints, and capabilities.

### GET /thresholds
Current advisory thresholds (for transparency).

### GET /signals/:corridor/:timeBucket
Get aggregated signals for specific corridor and time bucket.

**Parameters:**
- `corridor`: Travel corridor identifier (e.g., "US-EGYPT")
- `timeBucket`: Time aggregation bucket ("hour" or "day")
- `start`: Optional start date (ISO 8601)
- `end`: Optional end date (ISO 8601)

## Installation

```bash
cd backend/services/signal-aggregation-service
npm install
npm run build
npm start
```

## Development

```bash
npm run dev        # Development with hot reload
npm run build      # Build TypeScript
npm run lint       # Run linting
npm test           # Run tests
```

## Configuration

Environment variables:
- `PORT`: Service port (default: 3007)
- `NODE_ENV`: Environment mode (development/production)

## Threshold Configuration

Thresholds are defined in `src/types/signal.types.ts` and control the advisory status levels (GREEN/YELLOW/RED). These are advisory only and do not trigger automated actions.

## Monitoring & Logging

- Logs are written to `logs/error.log` and `logs/combined.log`
- Winston logger with JSON formatting
- Audit trail maintained for all operations

## Security

- Helmet.js for security headers
- CORS enabled for cross-origin requests
- Input validation on all endpoints
- No authentication required (internal service)

## Error Handling

- Comprehensive error handling middleware
- Graceful shutdown on SIGTERM/SIGINT
- 404 handler for unknown endpoints
- Structured error responses

## Testing

Run the test suite to verify service functionality:

```bash
npm test
```

## Deployment

The service is designed to run as a standalone microservice. It has no external dependencies beyond the data sources it reads from.

## License

Internal use only - MNbara Platform