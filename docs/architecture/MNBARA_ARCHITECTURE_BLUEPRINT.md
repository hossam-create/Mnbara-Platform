# Mnbara Platform - Comprehensive Architectural Blueprint

This document outlines the complete technical architecture for the Mnbara Platform, integrating Crowdshipping, Marketplace, Auctions, and AI-driven Context Awareness.

## 1. High-Level Architecture

The platform follows a **Microservices Architecture** to ensure scalability, flexibility, and independent deployment of features.

### Core Components

1.  **Frontend Clients**
    *   **Web App (React + Vite):** For buyers, sellers, and admin dashboard.
    *   **Mobile App (React Native/Flutter):** Primary interface for travelers (location tracking, camera/mic integration).

2.  **API Gateway (Kong / Nginx)**
    *   Single entry point for all client requests.
    *   Handles Authentication (JWT), Rate Limiting, and Routing.

3.  **Backend Microservices**
    *   **User Service (Node.js):** Auth, Profiles, KYC, Wallet management.
    *   **Product Service (Node.js):** Product listings, Inventory, Search indexing.
    *   **Auction Service (Node.js/Python):** Real-time bidding engine, Auto-extend logic, Sniping prevention.
    *   **Recommendation Service (Python - FastAPI):** AI engine for traveler recommendations (Geo-spatial + Collaborative Filtering).
    *   **Order/Matching Service (Node.js):** Order lifecycle, Matching buyers with travelers.
    *   **Payment Service (Node.js):** Escrow management, Payment Gateway integration (Stripe/PayPal), Payouts.
    *   **Delivery Service (Node.js):** Shipment tracking, Logistics integration.
    *   **Notification Service (Node.js):** Push notifications (FCM), Emails, SMS.
    *   **Chat Service (Node.js + WebSocket):** Real-time in-app messaging between users.

4.  **Data Layer**
    *   **Primary DB (PostgreSQL):** Relational data (Users, Orders, Transactions).
    *   **Geo-Spatial DB (PostGIS):** Traveler locations, Geofencing.
    *   **Cache (Redis):** Session management, Real-time leaderboards, Pub/Sub.
    *   **Search Engine (Elasticsearch):** Advanced product search and filtering.
    *   **Message Broker (Kafka / RabbitMQ):** Asynchronous communication between services (e.g., "New Bid" event -> Notification Service).

---

## 2. Key Functional Modules & Requirements

### A. Crowdshipping (The Core)
*   **Traveler Journey:**
    *   Post a trip (Origin -> Destination, Date).
    *   **Real-time Tracking:** App tracks location (Airport, Mall, City).
    *   **Smart Alerts:** "You are at Dubai Mall. 3 people want an iPhone 15 from the Apple Store here. Buy & Earn $150."
*   **Buyer Journey:**
    *   Post a "Request" (Product Link + Details).
    *   Match with travelers going to their city.

### B. Marketplace & Auctions (eBay/Amazon Style)
*   **Listing Types:**
    *   **Buy Now:** Fixed price.
    *   **Auction:** Bidding with timer.
    *   **Make Offer:** Negotiation.
*   **Auction Logic:**
    *   **Soft Close:** If a bid is placed in the last 2 minutes, extend time by 2 minutes.
    *   **Reserve Price:** Minimum price to sell.
    *   **Auto-Bid:** System bids for user up to a max limit.

### C. AI & Context Awareness (The Brain)
*   **Tech Stack:** Python (FastAPI) + PyTorch/Scikit-learn.
*   **Features:**
    *   **Visual Search:** Traveler points camera at a product -> App identifies it -> Checks if anyone wants it.
    *   **Voice Command:** "I'm at Heathrow Terminal 5" -> App shows requests deliverable from there.
    *   **Recommendation Engine:** Suggests products based on:
        *   Traveler's current location (Geo-fencing).
        *   Traveler's past history.
        *   High-demand items in the destination city.

### D. Fintech (The Wallet)
*   **Escrow System:**
    *   Buyer pays -> Money held in "Escrow".
    *   Traveler delivers -> Buyer confirms -> Money released to Traveler.
*   **Multi-Currency Wallet:**
    *   Hold balances in USD, SAR, EUR, etc.
    *   Internal exchange rates.
*   **Rewards Program:**
    *   Points for every transaction (Buyer/Traveler/Seller).
    *   Redeemable for discounts or shipping fees.

---

## 3. Database Schema Overview (Critical Tables)

### `users`
*   `id`, `email`, `kyc_status`, `rating`, `wallet_balance`

### `products`
*   `id`, `seller_id`, `title`, `type` (buy_now/auction), `price`, `location` (PostGIS Point)

### `auctions`
*   `id`, `product_id`, `start_time`, `end_time`, `current_bid`, `status`

### `traveler_locations` (PostGIS)
*   `traveler_id`, `current_location` (Point), `last_updated`, `airport_code`

### `escrow_transactions`
*   `id`, `order_id`, `amount`, `status` (held/released/refunded), `release_code`

---

## 4. Infrastructure & Deployment

*   **Containerization:** Docker for all services.
*   **Orchestration:** Kubernetes (K8s) or Docker Compose (for dev).
*   **CI/CD:** GitHub Actions (Build -> Test -> Deploy).
*   **Cloud Provider:** AWS / Google Cloud / Oracle Cloud (as discussed).

---

## 5. Security & Compliance

*   **PCI-DSS:** For payment handling (via Stripe/Payment Service).
*   **GDPR:** User data privacy and "Right to be Forgotten".
*   **Encryption:** TLS 1.3 for transit, AES-256 for data at rest (Wallet/KYC).
