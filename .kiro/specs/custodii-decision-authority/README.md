# Custodii Decision Authority API Integration

## Overview

This specification provides a complete implementation guide for integrating Custodii's external Decision Authority API into the Mnbarh Platform. The integration enables external regulatory control over asset disposition while maintaining full backward compatibility with current operations.

## Documentation Structure

### 📋 Core Documents

1. **[requirements.md](./requirements.md)** - Business requirements, user stories, acceptance criteria
2. **[design.md](./design.md)** - Architecture design and technical specifications  
3. **[tasks.md](./tasks.md)** - Complete task breakdown (110+ tasks across 10 phases)
4. **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** - High-level overview for stakeholders

### 💻 Implementation Guides

5. **[CODE_IMPLEMENTATION.md](./CODE_IMPLEMENTATION.md)** - Complete code snippets with tests
6. **[CUSTODII_INTEGRATION_COMPLETE_GUIDE.md](./CUSTODII_INTEGRATION_COMPLETE_GUIDE.md)** - Detailed integration guide
7. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation instructions

## Quick Start

### For Product Managers
Start with: **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** → **[requirements.md](./requirements.md)**

### For Developers
Start with: **[CODE_IMPLEMENTATION.md](./CODE_IMPLEMENTATION.md)** → **[tasks.md](./tasks.md)**

### For Architects
Start with: **[design.md](./design.md)** → **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)**

### For DevOps
Start with: **[tasks.md](./tasks.md)** (Phase 6 & 9-10) → **[requirements.md](./requirements.md)** (Section 6.5)

## Key Features

### ✅ Dual-Mode Operation
- **INTERNAL Mode**: Current behavior (auto-approve)
- **EXTERNAL Mode**: Custodii API control
- Switch modes via environment variable (no restart required)

### ✅ Non-Breaking Integration
- Existing services work without modification
- InternalDecisionSource maintains exact current behavior
- Feature flag allows instant rollback

### ✅ Complete Audit Trail
- All decisions logged with full provenance
- Immutable audit log for compliance
- 7-year retention policy

### ✅ Resilient Architecture
- Automatic fallback to INTERNAL mode on failures
- Retry logic with exponential backoff
- 30-second timeout with clear error messages

### ✅ Pluggable Design
- IDecisionSource interface for abstraction
- Easy to add new decision sources
- Factory pattern for source selection

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Mnbarh Platform                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Listing    │  │   Auction    │  │    Escrow    │    │
│  │   Service    │  │   Service    │  │   Service    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  Decision       │                       │
│                   │  Authority      │                       │
│                   │  Service        │                       │
│                   └────────┬────────┘                       │
│                            │                                │
│              ┌─────────────┼─────────────┐                 │
│              │             │             │                 │
│     ┌────────▼────┐  ┌────▼─────┐  ┌───▼──────┐          │
│     │  Internal   │  │ Custodii │  │   Mock   │          │
│     │  Decision   │  │ Decision │  │ Decision │          │
│     │  Source     │  │  Source  │  │  Source  │          │
│     └─────────────┘  └────┬─────┘  └──────────┘          │
│                           │                                │
└───────────────────────────┼────────────────────────────────┘
                            │
                            │ HTTPS
                            │
                   ┌────────▼────────┐
                   │  Custodii API   │
                   │  (External)     │
                   └─────────────────┘
```

## Implementation Timeline

| Phase | Duration | Focus | Tasks |
|-------|----------|-------|-------|
| 1 | Weeks 1-2 | Foundation & Core Service | 20 |
| 2 | Weeks 3-4 | External Integration & Service Integration | 30 |
| 3 | Week 5 | Frontend Integration | 25 |
| 4 | Weeks 6-7 | Testing & Documentation | 20 |
| 5 | Weeks 8-10 | Deployment & Rollout | 15 |

**Total**: 10 weeks, 110+ tasks

## Technology Stack

### Backend
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **HTTP Client**: Axios
- **Testing**: Jest
- **Logging**: Winston (structured JSON)

### Frontend
- **Framework**: React with TypeScript
- **State Management**: Redux
- **HTTP Client**: Axios
- **UI Components**: Custom component library
- **Testing**: Jest + React Testing Library

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Deployment**: Render.com
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

## Key Deliverables

### Code Artifacts
- [ ] Decision Authority Service (new microservice)
- [ ] 3 Decision Source implementations
- [ ] 3 Service integrations (listing, auction, escrow)
- [ ] 10+ Frontend components
- [ ] 12 REST API endpoints
- [ ] 1 Database migration
- [ ] 90%+ test coverage

### Documentation
- [x] Requirements document
- [x] Design document
- [x] Implementation tasks
- [x] Code implementation guide
- [x] Executive summary
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guides
- [ ] Runbooks

## Success Criteria

### Technical
- [ ] All existing tests pass without modification
- [ ] New tests achieve 90%+ coverage
- [ ] Zero downtime during deployment
- [ ] Feature flag toggle works without restart
- [ ] External API integration completes within 30s
- [ ] Can handle 1000 concurrent decision requests

### Business
- [ ] Can switch to EXTERNAL mode in production
- [ ] Custodii API successfully controls asset disposition
- [ ] Admin override workflow functions correctly
- [ ] Compliance audit export works
- [ ] Zero customer-facing errors during rollout

## Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| External API Downtime | HIGH | Automatic fallback to INTERNAL mode |
| Breaking Existing Services | CRITICAL | Feature flag + gradual rollout |
| Decision Timeout | MEDIUM | 30s timeout + retry logic |
| Security Vulnerability | HIGH | Webhook signature validation + MFA |

## Configuration

### Environment Variables

```bash
# Decision Authority Mode
DECISION_AUTHORITY_MODE=INTERNAL          # INTERNAL | EXTERNAL

# Custodii API Configuration (required for EXTERNAL mode)
CUSTODII_API_URL=https://api.custodii.com
CUSTODII_API_KEY=<secret>
CUSTODII_WEBHOOK_SECRET=<secret>

# Timeouts
DECISION_TIMEOUT_MS=30000                 # 30 seconds
DECISION_POLL_INTERVAL_MS=5000            # 5 seconds

# Database
DATABASE_URL=postgresql://user:pass@host:5432/decision_authority

# JWT
JWT_SECRET=<secret>
```

## API Endpoints

### Decision Management
```
POST   /api/v1/decisions/request          - Request decision from authority
GET    /api/v1/decisions/:id              - Get decision by ID
GET    /api/v1/decisions/asset/:assetId   - Get decisions for asset
GET    /api/v1/decisions                  - List decisions (with filters)
PATCH  /api/v1/decisions/:id/override     - Admin override (requires auth)
```

### Webhooks
```
POST   /api/v1/webhook/decisions           - Webhook for external updates
```

### Health Check
```
GET    /health                             - Service health status
```

## Database Schema

### Tables
- `asset_decision_records` - Main decision records (append-only)
- `decision_audit_log` - Immutable audit trail
- `decision_webhook_events` - Webhook event queue

### Key Fields
- `status`: PENDING | APPROVED | REJECTED | EXPIRED | CANCELLED
- `source`: INTERNAL | EXTERNAL | OVERRIDE
- `assetType`: LISTING | AUCTION | ESCROW_RELEASE

## Testing Strategy

### Unit Tests
- Decision source implementations
- Service business logic
- Controllers and routes
- Utility functions

### Integration Tests
- INTERNAL mode end-to-end
- EXTERNAL mode with MockDecisionSource
- Webhook processing
- Admin override workflow

### Load Tests
- 100 concurrent requests
- 1000 concurrent requests
- Polling under load
- Webhook processing under load

### Security Tests
- Webhook signature validation
- API authentication
- Admin authorization
- SQL injection prevention
- XSS prevention

## Monitoring & Alerting

### Metrics
- Decision request rate
- Decision approval rate
- Average decision time
- Error rate by source
- API latency (p50, p95, p99)

### Alerts
- External API downtime
- Decision timeout rate > 5%
- Error rate > 1%
- Queue depth > 1000
- Webhook processing failures

## Future Enhancements

### Phase 2 (Post-Launch)
- [ ] Batch decision processing
- [ ] Decision appeals workflow
- [ ] Multi-authority support
- [ ] Real-time decision streaming (WebSocket)
- [ ] Decision analytics dashboard
- [ ] Automated decision routing rules

### Phase 3 (Advanced)
- [ ] Machine learning for decision prediction
- [ ] Conditional approvals (time-limited, amount-limited)
- [ ] Decision workflow customization
- [ ] Historical decision migration
- [ ] Advanced reporting and analytics

## Support & Troubleshooting

### Common Issues

**Issue**: External API timeout
**Solution**: Check CUSTODII_API_URL and network connectivity. System will auto-fallback to INTERNAL mode.

**Issue**: Webhook signature validation fails
**Solution**: Verify CUSTODII_WEBHOOK_SECRET matches Custodii configuration.

**Issue**: Decision stuck in PENDING
**Solution**: Use admin override panel to manually resolve.

### Logs
All logs are structured JSON format:
```json
{
  "timestamp": "2026-01-19T10:30:00Z",
  "level": "info",
  "service": "decision-authority-service",
  "message": "Decision requested",
  "decisionId": "uuid",
  "assetType": "LISTING",
  "source": "EXTERNAL"
}
```

### Health Check
```bash
curl http://localhost:3010/health
```

Response:
```json
{
  "status": "healthy",
  "service": "decision-authority-service",
  "mode": "INTERNAL",
  "timestamp": "2026-01-19T10:30:00Z"
}
```

## Contributing

### Code Style
- TypeScript strict mode
- ESLint + Prettier
- 90%+ test coverage required
- All public methods documented

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit PR with description
5. Pass CI/CD checks
6. Get 2 approvals
7. Merge to `main`

### Commit Message Format
```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`

## License

Proprietary - Mnbarh Platform

## Contact

- **Technical Lead**: [Name]
- **Product Manager**: [Name]
- **DevOps Lead**: [Name]

---

**Document Version**: 1.0  
**Last Updated**: January 19, 2026  
**Status**: Ready for Implementation
