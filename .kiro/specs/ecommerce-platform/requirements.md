# Requirements Document - MNBARA Platform

## Introduction

This document defines the requirements for completing the MNBARA e-commerce platform MVP. MNBARA is a marketplace supporting auctions, fixed-price listings, traveler-based crowdshipping, and escrow payments. The platform consists of a web application (React/Vite), mobile app (React Native), admin dashboard, and a microservices backend with 14 services including real-time auction capabilities and blockchain smart contracts.

**Current State:** The backend infrastructure is largely complete with PostgreSQL/PostGIS, Redis, RabbitMQ, MinIO, and Elasticsearch. Core services are operational. This spec focuses on completing frontend implementations, mobile app features, and integration gaps.

## Glossary

- **MNBARA_System**: The complete MNBARA marketplace platform
- **Buyer**: A user who purchases products through fixed-price listings or auctions
- **Seller**: A user who lists products for sale
- **Traveler**: A verified user who facilitates cross-border purchases via crowdshipping
- **Crowdship**: The traveler-based purchasing and delivery service
- **Escrow**: Payment holding mechanism where funds are held until delivery confirmation
- **Proxy Bid**: Automated bidding system that bids on behalf of a user up to their maximum
- **KYC**: Know Your Customer - identity verification required for travelers
- **MNB Token**: The platform's blockchain token for rewards and transactions
- **Trip**: A traveler's journey with available capacity for transporting items
- **Travel Request**: A buyer's request for a traveler to purchase and deliver an item

## Requirements

### Requirement 1: Web Application Authentication

**User Story:** As a user, I want to authenticate on the web application, so that I can access marketplace features.

#### Acceptance Criteria

1. WHEN a user submits registration with email, phone, and password on the web app, THE MNBARA_System SHALL create a new account via auth-service and return a JWT token.
2. WHEN a user submits valid login credentials, THE MNBARA_System SHALL issue access and refresh tokens and redirect to the dashboard.
3. WHERE OAuth provider login is selected, THE MNBARA_System SHALL authenticate via the provider and create or link the user account.
4. WHEN a user enables MFA in settings, THE MNBARA_System SHALL require verification code for subsequent logins.
5. THE Web_Application SHALL persist authentication state and handle token refresh automatically.

### Requirement 2: Web Application Product Browsing

**User Story:** As a buyer, I want to browse and search products on the web, so that I can find items to purchase.

#### Acceptance Criteria

1. WHEN a user visits the marketplace, THE Web_Application SHALL display featured listings and categories.
2. WHEN a user submits a search query, THE Web_Application SHALL query Elasticsearch via listing-service and display results with faceted filters.
3. THE Web_Application SHALL support filtering by category, price range, condition, and location.
4. WHEN a user clicks a product, THE Web_Application SHALL display full product details, images, seller info, and purchase options.

### Requirement 3: Web Application Auction Participation

**User Story:** As a buyer, I want to participate in auctions on the web, so that I can bid on products in real-time.

#### Acceptance Criteria

1. WHEN a user views an active auction, THE Web_Application SHALL establish a WebSocket connection to auction-service for real-time updates.
2. WHEN a user places a bid, THE Web_Application SHALL submit via WebSocket and display confirmation or rejection within 500 milliseconds.
3. THE Web_Application SHALL display current highest bid, time remaining, and bid history.
4. WHEN the user is outbid, THE Web_Application SHALL display an immediate notification.
5. WHEN an auction ends, THE Web_Application SHALL display the final result and next steps for winners.

### Requirement 4: Web Application Checkout Flow

**User Story:** As a buyer, I want to complete purchases through checkout, so that I can acquire products.

#### Acceptance Criteria

1. WHEN a buyer initiates checkout, THE Web_Application SHALL display order summary, shipping options, and payment methods.
2. THE Web_Application SHALL integrate with payment-service for Stripe and PayPal payment processing.
3. WHEN payment is confirmed, THE Web_Application SHALL display order confirmation and tracking information.
4. THE Web_Application SHALL support escrow payment option for crowdship orders.

### Requirement 5: Web Application Seller Dashboard

**User Story:** As a seller, I want to manage my listings from the web dashboard, so that I can run my business effectively.

#### Acceptance Criteria

1. THE Web_Application SHALL provide a seller dashboard with listing management, order tracking, and earnings overview.
2. WHEN a seller creates a listing, THE Web_Application SHALL support product details, images upload to MinIO, and listing type selection (fixed/auction).
3. THE Web_Application SHALL display real-time notifications for new orders, bids, and messages.
4. THE Web_Application SHALL provide sales analytics and performance metrics.

### Requirement 6: Mobile App Authentication

**User Story:** As a mobile user, I want to authenticate on the app, so that I can access marketplace features on the go.

#### Acceptance Criteria

1. WHEN a user registers or logs in on mobile, THE Mobile_App SHALL authenticate via auth-service and securely store tokens.
2. THE Mobile_App SHALL support biometric authentication (fingerprint/face) for returning users.
3. THE Mobile_App SHALL implement secure token storage using platform-specific secure storage.
4. WHEN tokens expire, THE Mobile_App SHALL automatically refresh or prompt re-authentication.

### Requirement 7: Mobile App Product Discovery

**User Story:** As a mobile user, I want to browse and search products, so that I can shop from anywhere.

#### Acceptance Criteria

1. THE Mobile_App SHALL display a home feed with personalized recommendations from recommendation-service.
2. WHEN a user searches, THE Mobile_App SHALL query Elasticsearch and display results with infinite scroll.
3. THE Mobile_App SHALL support barcode/QR scanning for product lookup.
4. THE Mobile_App SHALL cache recently viewed products for offline access.

### Requirement 8: Mobile App Real-Time Auctions

**User Story:** As a mobile user, I want to participate in auctions, so that I can bid in real-time from my phone.

#### Acceptance Criteria

1. WHEN viewing an auction, THE Mobile_App SHALL establish WebSocket connection for real-time bid updates.
2. THE Mobile_App SHALL support quick-bid buttons and proxy bid configuration.
3. WHEN the user is outbid, THE Mobile_App SHALL send a push notification via FCM/APNs.
4. THE Mobile_App SHALL display auction countdown timer with server-synchronized time.

### Requirement 9: Mobile App Traveler Features

**User Story:** As a traveler, I want to manage trips and deliveries from my phone, so that I can earn while traveling.

#### Acceptance Criteria

1. WHEN a traveler creates a trip, THE Mobile_App SHALL submit to trips-service with origin, destination, dates, and capacity.
2. THE Mobile_App SHALL display nearby delivery requests using matching-service geo-spatial queries.
3. WHEN a traveler accepts a request, THE Mobile_App SHALL update match status and notify the buyer.
4. THE Mobile_App SHALL support location tracking updates to trips-service for delivery progress.
5. THE Mobile_App SHALL enable photo capture for pickup and delivery confirmation evidence.

### Requirement 10: Mobile App Push Notifications

**User Story:** As a mobile user, I want to receive push notifications, so that I stay informed about important events.

#### Acceptance Criteria

1. THE Mobile_App SHALL register device tokens with notification-service for FCM (Android) and APNs (iOS).
2. WHEN an auction event occurs (outbid, ending soon, won), THE MNBARA_System SHALL send push notification within 30 seconds.
3. WHEN an order status changes, THE MNBARA_System SHALL send push notification to relevant parties.
4. THE Mobile_App SHALL support notification preferences configuration.

### Requirement 11: Admin Dashboard User Management

**User Story:** As an admin, I want to manage users from the dashboard, so that I can maintain platform integrity.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display user list with search, filter, and pagination.
2. WHEN an admin views a user, THE Admin_Dashboard SHALL display profile, transaction history, and KYC status.
3. THE Admin_Dashboard SHALL allow admins to approve or reject KYC submissions.
4. THE Admin_Dashboard SHALL allow admins to suspend or ban users with audit logging.

### Requirement 12: Admin Dashboard Dispute Resolution

**User Story:** As an admin, I want to resolve disputes, so that transaction conflicts are handled fairly.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display pending disputes with order details and evidence.
2. WHEN an admin reviews a dispute, THE Admin_Dashboard SHALL show communication history and submitted evidence.
3. WHEN an admin resolves a dispute, THE Admin_Dashboard SHALL trigger escrow release or refund via payment-service.
4. THE Admin_Dashboard SHALL log all dispute resolution actions for audit.

### Requirement 13: Admin Dashboard Analytics

**User Story:** As an admin, I want to view platform analytics, so that I can monitor business health.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display key metrics: GMV, active users, listings, completed orders.
2. THE Admin_Dashboard SHALL provide charts for transaction trends, auction activity, and crowdship deliveries.
3. THE Admin_Dashboard SHALL display real-time auction monitoring with active bid counts.
4. THE Admin_Dashboard SHALL provide export functionality for reports.

### Requirement 14: Escrow Integration Completion

**User Story:** As a platform operator, I want complete escrow integration, so that buyer funds are protected.

#### Acceptance Criteria

1. WHEN a crowdship order is created, THE Payment_Service SHALL hold funds in escrow with status "held".
2. WHEN delivery evidence is submitted and verified, THE MNBARA_System SHALL release escrow to seller and traveler.
3. IF a dispute is raised, THEN THE MNBARA_System SHALL freeze escrow pending admin resolution.
4. THE MNBARA_System SHALL integrate MNBAuctionEscrow smart contract for blockchain-backed escrow option.

### Requirement 15: Rewards System Integration

**User Story:** As a user, I want to earn and redeem rewards, so that I am incentivized to use the platform.

#### Acceptance Criteria

1. WHEN a user completes a transaction, THE Rewards_Service SHALL award points based on transaction value.
2. THE Web_Application and Mobile_App SHALL display user's reward balance and transaction history.
3. WHEN a user redeems rewards, THE Rewards_Service SHALL deduct points and apply discount or benefit.
4. THE MNBARA_System SHALL display leaderboard of top earners.

### Requirement 16: Blockchain Wallet Integration

**User Story:** As a user, I want to connect my crypto wallet, so that I can use MNB tokens for transactions.

#### Acceptance Criteria

1. THE Web_Application SHALL support wallet connection (MetaMask, WalletConnect) for MNB token transactions.
2. WHEN a user pays with MNB tokens, THE MNBARA_System SHALL process via MNBExchange smart contract.
3. THE Mobile_App SHALL support wallet connection for token-based payments.
4. THE MNBARA_System SHALL display MNB token balance and transaction history.

### Requirement 17: Search and Discovery Enhancement

**User Story:** As a buyer, I want advanced search capabilities, so that I can find exactly what I need.

#### Acceptance Criteria

1. THE MNBARA_System SHALL index all products in Elasticsearch with full-text search, synonyms, and typo tolerance.
2. THE Search_System SHALL support auto-complete suggestions as user types.
3. THE Search_System SHALL rank results by relevance, popularity, seller rating, and recency.
4. THE MNBARA_System SHALL provide personalized recommendations based on browsing history via recommendation-service.

### Requirement 18: Real-Time Notifications System

**User Story:** As a user, I want real-time notifications across all platforms, so that I never miss important updates.

#### Acceptance Criteria

1. THE Notification_Service SHALL publish events to RabbitMQ for async processing.
2. THE Web_Application SHALL receive real-time notifications via WebSocket connection.
3. THE Mobile_App SHALL receive push notifications via FCM/APNs.
4. THE MNBARA_System SHALL support email notifications for critical events (order confirmation, payment received).

### Requirement 19: API Gateway Security

**User Story:** As a platform operator, I want secure API access, so that the system is protected from attacks.

#### Acceptance Criteria

1. THE API_Gateway SHALL enforce JWT authentication on all protected endpoints.
2. THE API_Gateway SHALL implement rate limiting per IP and per user.
3. THE API_Gateway SHALL validate all input against defined schemas.
4. THE API_Gateway SHALL log all requests with correlation IDs for tracing.

### Requirement 20: Monitoring and Observability

**User Story:** As a platform operator, I want comprehensive monitoring, so that I can ensure system health.

#### Acceptance Criteria

1. THE MNBARA_System SHALL expose Prometheus metrics for all services.
2. THE MNBARA_System SHALL implement structured JSON logging with correlation IDs.
3. THE MNBARA_System SHALL configure alerts for payment failures, auction timer drift, and service health.
4. THE MNBARA_System SHALL provide Grafana dashboards for real-time monitoring.
