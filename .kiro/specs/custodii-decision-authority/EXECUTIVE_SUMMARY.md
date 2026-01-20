# Custodii Decision Authority API Integration - Executive Summary

## Overview

This specification defines the complete integration of Custodii's external Decision Authority API into the Mnbarh Platform, enabling external regulatory control over asset disposition (listings, auctions, escrow releases) while maintaining full backward compatibility.

## Business Value

### Current State
- Mnbarh Platform makes all asset disposition decisions internally
- No external oversight or regulatory control
- Potential compliance risks in regulated markets

### Target State
- **Dual-mode operation**: INTERNAL (current) | EXTERNAL (Custodii)
- External regulatory authority can make binding decisions
- Seamless mode switching via feature flags
- Zero disruption to existing operations
- Full audit trail for compliance

### Key Benefits
1. **Regulatory Compliance**: Meet requirements for external oversight
2. **Risk Mitigation**: External authority validates high-risk transactions
3. **Market Expansion**: Enter regulated markets requiring external control
4. **Flexibility**: Switch between internal/external modes instantly
5. **Auditability**: Complete decision provenance for compliance

## Technical Approach

### Architecture Pattern: Strategy Pattern with Factory

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

### Core Design Principles

1. **Abstraction**: `IDecisionSource` interface isolates decision logic
2. **Pluggability**: Decision source swappable via configuration
3. **Non-Breaking**: Existing services work without modification
4. **Auditability**: All decisions logged with full provenance
5. **Resilience**: Graceful degradation if external API fails

## Implementation Scope

### New Components

1. **Decision Authority Service** (New Microservice)
   - Manages decision lifecycle
   - Routes requests to appropriate source
   - Handles webhooks from external authorities
   - Provides decision query API
   - Manages audit trail

2. **Decision Source Implementations**
   - `InternalDecisionSource`: Auto-approves (current behavior)
   - `CustodiiDecisionSource`: Calls external Custodii API
   - `MockDecisionSource`: Simulates external API for testing

3. **Service Integrations**
   - Listing Service: Request decision before making listing public
   - Auction Service: Require APPROVED decision before auction starts
   - Escrow Service: Request decision before releasing funds

4. **Frontend Updates**
   - Disposition status badges on listings/auctions
   - Status filters in search/browse
   - Admin decision management panel
   - Real-time status updates

5. **Infrastructure**
   - Feature flags for mode switching
   - Database schema for decision records
   - Monitoring and alerting
   - Deployment configuration

### Modified Components

- **Listing Service**: Add decision check in creation workflow
- **Auction Service**: Add decision check in start workflow
- **Escrow Service**: Add decision check in release workflow
- **API Gateway**: Add routes for decision authority service
- **Admin Service**: Add decision management UI

## Deliverables

### Documentation
- [x] Requirements Document (requirements.md)
- [x] Design Document (design.md)
- [x] Implementation Tasks (tasks.md)
- [x] Code Implementation Guide (CODE_IMPLEMENTATION.md)
- [x] Complete Integration Guide (CUSTODII_INTEGRATION_COMPLETE_GUIDE.md)
- [x] Executive Summary (this document)

### Code Artifacts (110+ tasks)
- [ ] Decision Authority Service (new microservice)
- [ ] Decision Source implementations (3 classes)
- [ ] Service integrations (3 services)
- [ ] Frontend components (10+ components)
- [ ] Database migrations (1 migration)
- [ ] API endpoints (12 endpoints)
- [ ] Tests (90%+ coverage)
- [ ] Deployment configuration

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- Create decision authority service
- Implement decision source abstraction
- Build internal and mock sources
- Add database schema

### Phase 2: Integration (Weeks 3-4)
- Integrate with listing/auction/escrow services
- Implement Custodii decision source
- Add webhook handling
- Build polling mechanism

### Phase 3: Frontend (Week 5)
- Add disposition status UI
- Build admin decision panel
- Add status filters
- Implement real-time updates

### Phase 4: Testing (Weeks 6-7)
- Unit tests (90%+ coverage)
- Integration tests
- Load tests (1000 concurrent requests)
- Security tests

### Phase 5: Deployment (Weeks 8-10)
- Staging deployment (INTERNAL mode)
- Production deployment (INTERNAL mode)
- Gradual rollout to EXTERNAL mode
- Monitoring and optimization

**Total Duration**: 10 weeks

## Risk Management

### Risk 1: External API Downtime
**Impact**: HIGH - Listings/auctions blocked, business disruption
**Mitigation**: 
- Automatic fallback to INTERNAL mode
- Queue requests for retry
- Alert ops team on failures
- 30-second timeout with clear error messages

### Risk 2: Breaking Existing Services
**Impact**: CRITICAL - Production outage, revenue loss
**Mitigation**:
- Comprehensive integration tests
- Feature flag allows instant rollback
- Gradual rollout (1% → 10% → 100%)
- InternalDecisionSource maintains exact current behavior

### Risk 3: Decision Timeout
**Impact**: MEDIUM - Poor user experience
**Mitigation**:
- 30-second timeout
- Retry with exponential backoff
- Admin panel to resolve stuck decisions
- Clear user messaging

### Risk 4: Security Vulnerability
**Impact**: HIGH - Unauthorized decision manipulation
**Mitigation**:
- Webhook signature validation (HMAC-SHA256)
- API key rotation policy
- Admin override requires MFA
- All actions logged with full audit trail

## Success Criteria

### Technical Success
- [ ] All existing tests pass without modification
- [ ] New tests achieve 90%+ coverage
- [ ] Zero downtime during deployment
- [ ] Feature flag toggle works without restart
- [ ] External API integration completes within 30s
- [ ] Can handle 1000 concurrent decision requests

### Business Success
- [ ] Can switch to EXTERNAL mode in production
- [ ] Custodii API successfully controls asset disposition
- [ ] Admin override workflow functions correctly
- [ ] Compliance audit export works
- [ ] Zero customer-facing errors during rollout
- [ ] User satisfaction maintained or improved

## Key Metrics

### Performance Metrics
- Decision request latency: < 200ms (INTERNAL), < 30s (EXTERNAL)
- Throughput: 1000 concurrent requests
- Availability: 99.9% uptime
- Error rate: < 0.1%

### Business Metrics
- Decision approval rate
- Average decision time
- Override frequency
- User satisfaction score
- Compliance audit pass rate

## Dependencies

### External Dependencies
- Custodii API documentation and credentials
- Custodii webhook endpoint configuration
- Custodii API rate limits and SLA
- Custodii support for integration testing

### Internal Dependencies
- listing-service (modification required)
- auction-service (modification required)
- escrow-service (modification required)
- api-gateway (new routes)
- admin-service (new UI panels)
- Database migration approval
- DevOps team for deployment

## Future Integration Advice

### Ensuring Future Custodii Integration Without Rewriting

1. **Maintain Interface Stability**
   - Never modify `IDecisionSource` interface without versioning
   - Add new methods as optional with default implementations
   - Use feature flags for new capabilities

2. **Keep Business Logic Separate**
   - Decision logic stays in decision sources
   - Service integration code stays minimal
   - No business rules in controllers/routes

3. **Version API Contracts**
   - Use `/api/v1/` prefix for all endpoints
   - Create `/api/v2/` for breaking changes
   - Maintain backward compatibility for 6 months

4. **Abstract External API Details**
   - Map Custodii responses to internal types
   - Handle Custodii-specific errors internally
   - Don't leak Custodii types to calling code

5. **Use Configuration Over Code**
   - All Custodii-specific settings in env vars
   - No hardcoded URLs or credentials
   - Feature flags for gradual rollout

6. **Comprehensive Testing**
   - Test with MockDecisionSource first
   - Integration tests don't depend on real Custodii API
   - Contract tests verify API compatibility

7. **Monitoring and Observability**
   - Log all decision requests/responses
   - Track decision source performance separately
   - Alert on source-specific failures

8. **Documentation**
   - Document all assumptions about Custodii API
   - Keep API contract documentation updated
   - Maintain runbooks for common issues

### Adding New Decision Sources

To add a new decision source (e.g., "RegulatoryAuthority"):

1. Create `RegulatoryAuthorityDecisionSource.ts` implementing `IDecisionSource`
2. Add to `DecisionSourceFactory.ts`
3. Add new mode to `DecisionAuthorityMode` enum
4. Add configuration in `config.ts`
5. Write tests
6. Update documentation

**No changes needed** in:
- Service integration code
- Controllers/routes
- Database schema
- Frontend (except adding new mode to UI)

## Conclusion

This integration provides a robust, flexible, and future-proof solution for external decision authority control. The abstraction layer ensures that:

1. **Current operations continue unchanged** (INTERNAL mode)
2. **External control can be enabled instantly** (EXTERNAL mode)
3. **New decision sources can be added easily** (pluggable architecture)
4. **Full audit trail maintained** (compliance ready)
5. **Graceful degradation on failures** (resilient)

The implementation follows best practices for microservices, maintains backward compatibility, and provides a clear path for future enhancements without requiring rewrites.

---

## Quick Start

### For Developers

1. Read `requirements.md` for business context
2. Review `CODE_IMPLEMENTATION.md` for code examples
3. Follow `tasks.md` for implementation order
4. Use `CUSTODII_INTEGRATION_COMPLETE_GUIDE.md` as reference

### For Product Managers

1. Read this Executive Summary
2. Review `requirements.md` for user stories
3. Track progress using `tasks.md`
4. Monitor success criteria

### For DevOps

1. Review infrastructure requirements in `requirements.md`
2. Follow deployment guide in `tasks.md` Phase 9-10
3. Configure feature flags per environment
4. Setup monitoring and alerting

---

## Contact & Support

For questions or issues during implementation:
- Technical: Review `CODE_IMPLEMENTATION.md`
- Business: Review `requirements.md`
- Process: Review `tasks.md`
- Architecture: Review this document

---

**Document Version**: 1.0  
**Last Updated**: January 19, 2026  
**Status**: Ready for Implementation
