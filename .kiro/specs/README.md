# Specifications Index

This directory contains all feature specifications for the platform. Each spec follows a structured format with requirements, design, and implementation tasks.

## Active Specifications

### 1. Manual Payout System ✅
**Status:** Implemented  
**Path:** [manual-payout-system/](./manual-payout-system/)

Secure, admin-approved payout system for travelers to withdraw funds from their wallets.

**Key Features:**
- User payout requests
- Admin approval workflow
- Multiple payout methods (Bank, PayPal, Stripe)
- AES-256 encryption
- Complete admin dashboard

**Quick Links:**
- [Overview](./manual-payout-system/README.md)
- [Requirements](./manual-payout-system/requirements.md)
- [Design](./manual-payout-system/design.md)
- [Tasks](./manual-payout-system/tasks.md)
- [Summary](./manual-payout-system/SPEC_SUMMARY.md)

---

### 2. Disputes & Refunds System 📋
**Status:** Ready for Implementation  
**Path:** [disputes-refunds-system/](./disputes-refunds-system/)

Comprehensive dispute resolution and refund management system for delivered requests.

**Key Features:**
- 48-hour dispute window
- Evidence upload (photos, documents)
- Admin review and resolution
- Three resolution options (full refund, release to seller, partial refund)
- Stripe refund integration
- Automated notifications

**Quick Links:**
- [Overview](./disputes-refunds-system/README.md)
- [Requirements](./disputes-refunds-system/requirements.md)
- [Design](./disputes-refunds-system/design.md)
- [Tasks](./disputes-refunds-system/tasks.md)
- [Summary](./disputes-refunds-system/SPEC_SUMMARY.md)

---

### 3. Custodii Decision Authority ✅
**Status:** Implemented  
**Path:** [custodii-decision-authority/](./custodii-decision-authority/)

Integration with Custodii for AI-powered decision making and compliance.

**Quick Links:**
- [Overview](./custodii-decision-authority/README.md)
- [Requirements](./custodii-decision-authority/requirements.md)
- [Design](./custodii-decision-authority/design.md)
- [Tasks](./custodii-decision-authority/tasks.md)

---

### 4. Frontend-Backend Binding 🚧
**Status:** In Progress  
**Path:** [frontend-backend-binding/](./frontend-backend-binding/)

Comprehensive binding between frontend components and backend APIs.

**Quick Links:**
- [Requirements](./frontend-backend-binding/requirements.md)
- [Design](./frontend-backend-binding/design.md)
- [Tasks](./frontend-backend-binding/tasks.md)
- [API Inventory](./frontend-backend-binding/API_INVENTORY.md)

---

### 5. Frontend Wallet Integration 📋
**Status:** Planned  
**Path:** [frontend-wallet-integration/](./frontend-wallet-integration/)

Frontend integration for wallet functionality.

---

### 6. AI-Ready Architecture 📋
**Status:** Planned  
**Path:** [ai-ready-architecture/](./ai-ready-architecture/)

Architecture for AI-powered features and decision making.

**Quick Links:**
- [Requirements](./ai-ready-architecture/requirements.md)

---

### 7. eBay Category Products 📋
**Status:** Planned  
**Path:** [ebay-category-products/](./ebay-category-products/)

Product categorization system inspired by eBay.

---

### 8. E-commerce Platform 📋
**Status:** Planned  
**Path:** [ecommerce-platform/](./ecommerce-platform/)

Core e-commerce platform features.

---

### 9. Homepage Retail Recomposition 📋
**Status:** Planned  
**Path:** [homepage-retail-recomposition/](./homepage-retail-recomposition/)

Homepage redesign for retail experience.

---

### 10. Live Location Tracking 📋
**Status:** Planned  
**Path:** [live-location-tracking/](./live-location-tracking/)

Real-time location tracking for travelers and deliveries.

---

## Specification Structure

Each specification follows this structure:

```
spec-name/
├── README.md              # Overview and quick links
├── requirements.md        # User stories and acceptance criteria
├── design.md             # Technical architecture and design
├── tasks.md              # Implementation checklist
└── SPEC_SUMMARY.md       # Executive summary (optional)
```

## Status Legend

- ✅ **Implemented** - Feature is complete and deployed
- 🚧 **In Progress** - Currently being implemented
- 📋 **Planned** - Specification exists, not yet started
- 🔄 **Under Review** - Being reviewed or updated

## Creating a New Specification

To create a new specification:

1. Create a new directory: `.kiro/specs/feature-name/`
2. Create the required files:
   - `README.md` - Overview
   - `requirements.md` - Requirements
   - `design.md` - Design
   - `tasks.md` - Tasks
3. Update this index file
4. Follow the existing spec format

## Specification Guidelines

### Requirements Document
- Start with feature overview
- Include user stories (As a... I want... So that...)
- Define acceptance criteria (AC-X.Y format)
- List non-functional requirements
- Define out of scope items
- List dependencies and assumptions

### Design Document
- Include system architecture diagrams
- Define database schema
- Document API endpoints
- Describe service layer design
- Include security considerations
- Add error handling strategy
- Document testing approach

### Tasks Document
- Break down into phases
- Use checkboxes for tracking
- Include file paths
- Add test results
- Track completion status

## Related Documentation

### Backend Documentation
- [Internal Ledger Service](../backend/services/internal-ledger-service/README.md)
- [Request Engine](../backend/services/request-engine/)
- [Payment Service](../backend/services/payment-service/)
- [Auction Service](../backend/services/auction-service/)
- [Decision Authority Service](../backend/services/decision-authority-service/)

### Frontend Documentation
- [Web App](../frontend/web-app/)
- [Mobile App](../mobile/flutter_app/)

### General Documentation
- [Architecture](../docs/)
- [API Design](../docs/API_DESIGN.md)
- [Security Guide](../docs/SECURITY_GUIDE.md)

---

**Last Updated:** January 24, 2026  
**Total Specifications:** 10  
**Implemented:** 2  
**Ready for Implementation:** 1  
**In Progress:** 1  
**Planned:** 6
