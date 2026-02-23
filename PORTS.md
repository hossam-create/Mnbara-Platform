# MNBARA Platform Service Ports

This document lists the canonical port assignments for all services in the platform.
These ports should be used in `docker-compose.yml`, local development, and configurations.

| Service | Port | Notes |
|---------|------|-------|
| **api-gateway** | 3000 | Gateway entry point |
| **auth-service** | 3001 | Authentication & Session |
| **user-service** | 3002 | User profiles |
| **payment-service** | 3003 | Stripe, Escrow payments |
| **product-service** | 3004 | Listings, Catalog |
| **wallet-service** | 3005 | Internal ledger, Balances |
| **orders-service** | 3006 | Order management |
| **escrow-service** | 3007 | Escrow state machine |
| **settlement-service** | 3008 | P2P Transfers |
| **trips-service** | 3009 | Traveler trips |
| **matching-service** | 3010 | Matchmaking engine |
| **notification-service** | 3011 | Email, Push, SMS |
| **subscription-service** | 3012 | SaaS plans |
| **cart-service** | 3013 | Shopping cart |
| **feature-management** | 3014 | Feature flags |
| **admin-service** | 3015 | Backoffice API |
| **country-layer-service** | 3016 | Localization/Region |
| **bnpl-service** | 3017 | Buy Now Pay Later |
| **crypto-service** | 3018 | Crypto integration |
| **ui-config-service** | 3020 | Dynamic UI Config |
| **ui-config-dashboard** | 3021 | Vue.js Admin UI |
| **paypal-service** | 3023 | PayPal integration |
| **ai-assistant-service** | 3024 | GenAI Assistant |
| **mnbarh-ai-engine** | 3025 | Core AI Engine |
| **wholesale-service** | 3026 | B2B Marketplace |
| **compliance-service** | 3027 | Customs Warnings & Prohibited Items |
| **p2p-exchange-service** | 3028 | Currency Exchange |
| **decision-authority-service** | 3030 | Custodii / Decision Authority Integration |
| **smart-delivery-service** | 3037 | AI Route Optimization |

**Note on Conflicts:**
- No known port collisions in the canonical assignments above.
