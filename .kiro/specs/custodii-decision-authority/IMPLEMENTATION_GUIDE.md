# Custodii Decision Authority API - Implementation Guide

## Executive Summary

This guide provides executable tasks, code skeletons, tests, and documentation for integrating Custodii's Decision Authority API into the Mnbarh Platform. The integration enables external regulatory control over asset disposition while maintaining backward compatibility.

## Repository Analysis

### Major Modules Identified

1. **Backend Services** (`backend/services/`)
   - 50+ microservices
   - Key services: listing-service, auction-service, escrow-service, compliance-service
   - API Gateway for routing
   - Shared libraries for common functionality

2. **Frontend** (`frontend/web-app/`)
   - React/TypeScript SPA
   - Component-based architecture
   - Service layer for API calls
   - Redux store for state management

3. **Mobile** (`mobile/flutter_app/`)
   - Flutter application
   - Shared business logic with web

4. **Infrastructure** (`docker-compose.yml`, `render.yaml`)
   - Docker-based deployment
   - PostgreSQL databases per service
   - Redis for caching
   - Environment-based configuration

### API Boundaries

- REST APIs exposed via Express.js
- JWT authentication
- Service-to-service communication via HTTP
- WebSocket for real-time updates (auction-service)

### Extension Points for Custodii Integration

1. **Listing Service**: Asset creation/approval workflow
2. **Auction Service**: Auction start validation
3. **Escrow Service**: Fund release authorization
4. **Compliance Service**: Regulatory decision tracking
5. **API Gateway**: New decision authority endpoints
6. **Admin Service**: Decision management UI

---

## SECTION 1: Decision Authority Service (New Microservice)

### Task List

**Priority 1 (Critical Path)**:
- [ ] 1.1 Create decision-authority-service skeleton
- [ ] 1.2 Implement database schema and Prisma models
- [ ] 1.3 Build IDecisionSource interface and factory
- [ ] 1.4 Implement InternalDecisionSource
- [ ] 1.5 Implement MockDecisionSource
- [ ] 1.6 Create DecisionAuthorityService core logic
- [ ] 1.7 Build REST API controllers and routes
- [ ] 1.8 Add webhook handler for external updates

**Priority 2 (External Integration)**:
- [ ] 1.9 Implement CustodiiDecisionSource
- [ ] 1.10 Add polling mechanism for PENDING decisions
- [ ] 1.11 Implement retry/fallback logic
- [ ] 1.12 Add decision timeout handling

**Priority 3 (Observability)**:
- [ ] 1.13 Add comprehensive logging
- [ ] 1.14 Add metrics/monitoring
- [ ] 1.15 Create admin override workflow

### Code Snippets

#### File: `backend/services/decision-authority-service/package.json`
