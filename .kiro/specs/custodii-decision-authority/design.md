# Custodii Decision Authority API Integration - Design Document

## 1. Architecture Overview

### 1.1 System Context

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

### 1.2 Design Principles

1. **Abstraction**: Decision logic abstracted behind IDecisionSource interface
2. **Pluggability**: Decision source swappable via configuration
3. **Non-Breaking**: Existing services work without modification
4. **Auditability**: All decisions logged with full provenance
5. **Resilience**: Graceful degradation if external API fails

## 2. Component Design

### 2.1 Decision Authority Service

**Location**: `backend/services/decision-authority-service/`

**Responsibilities**:
- Manage decision lifecycle (request → pending → approved/rejected)
- Route requests to appropriate decision source
- Handle webhooks from external authorities
- Provide decision query API
- Manage decision audit trail

**Key Classes**:
