# Entity Relationship Diagrams (ERD)

Database schemas and relationships for all Mnbara Platform services.

---

## Core Services ERD

### Users & Authentication

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ OAUTH_PROVIDERS : uses
    USERS ||--o{ ROLES : has
    USERS {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        string role
        timestamp created_at
        timestamp updated_at
    }
    
    SESSIONS {
        uuid id PK
        uuid user_id FK
        string refresh_token
        timestamp expires_at
        timestamp created_at
    }
    
    OAUTH_PROVIDERS {
        uuid id PK
        uuid user_id FK
        string provider
        string provider_id
        json metadata
        timestamp created_at
    }
    
    ROLES {
        string name PK
        string description
        json permissions
    }
```

### Products & Categories

```mermaid
erDiagram
    CATEGORIES ||--o{ CATEGORIES : parent
    CATEGORIES ||--o{ PRODUCTS : contains
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ PRODUCT_SPECIFICATIONS : has
    PRODUCTS ||--o{ BIDS : receives
    PRODUCTS ||--o{ MAKE_OFFERS : receives
    
    CATEGORIES {
        uuid id PK
        uuid parent_id FK
        string name_en
        string name_ar
        string slug UK
        int level
        int product_count
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCTS {
        uuid id PK
        uuid category_id FK
        uuid seller_id FK
        string title
        string title_ar
        decimal price
        string origin_country
        string purchase_country
        string delivery_country
        string condition
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        string url
        string thumbnail_url
        int position
        boolean is_primary
    }
    
    PRODUCT_SPECIFICATIONS {
        uuid id PK
        uuid product_id FK
        string key
        string value
        string key_ar
    }
    
    BIDS {
        uuid id PK
        uuid product_id FK
        uuid bidder_id FK
        decimal amount
        boolean is_auto_bid
        decimal max_amount
        string status
        boolean is_winning
        timestamp created_at
    }
    
    MAKE_OFFERS {
        uuid id PK
        uuid product_id FK
        uuid buyer_id FK
        uuid seller_id FK
        decimal offer_price
        decimal counter_offer
        string status
        timestamp created_at
        timestamp responded_at
    }
```

### Orders & Payments

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ ORDERS : fulfills
    ORDERS ||--|| PAYMENTS : has
    ORDERS ||--o{ ESCROW : uses
    ORDERS ||--o{ SETTLEMENTS : generates
    ORDERS ||--o{ DISPUTES : has
    ORDERS ||--|| PRODUCTS : contains
    
    ORDERS {
        uuid id PK
        uuid buyer_id FK
        uuid seller_id FK
        uuid product_id FK
        decimal total_amount
        string currency
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    PAYMENTS {
        uuid id PK
        uuid order_id FK
        decimal amount
        string currency
        string payment_method
        string stripe_payment_intent_id
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    ESCROW {
        uuid id PK
        uuid order_id FK
        decimal amount
        string currency
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    SETTLEMENTS {
        uuid id PK
        uuid order_id FK
        decimal seller_payout
        decimal traveler_payout
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    DISPUTES {
        uuid id PK
        uuid order_id FK
        string reason
        string status
        timestamp created_at
        timestamp resolved_at
    }
```

### Trips & Matching

```mermaid
erDiagram
    USERS ||--o{ TRIPS : creates
    TRIPS ||--o{ MATCH_CANDIDATES : generates
    ORDERS ||--o{ MATCH_CANDIDATES : has
    TRIPS ||--o{ STOPOVERS : has
    TRIPS ||--o{ TRIP_MANIFESTS : has
    
    TRIPS {
        uuid id PK
        uuid traveler_id FK
        string origin
        string destination
        string origin_country
        string destination_country
        timestamp departure_date
        timestamp arrival_date
        string status
        float total_capacity
        float used_capacity
        float remaining_capacity
        timestamp created_at
        timestamp updated_at
    }
    
    MATCH_CANDIDATES {
        uuid id PK
        uuid order_id FK
        uuid trip_id FK
        float score
        string status
        json friction_signals
        float pickup_deviation
        float dropoff_deviation
        string product_origin_country
        string product_purchase_country
        string product_delivery_country
        string trip_origin_country
        string trip_destination_country
        boolean country_match_valid
        timestamp created_at
        timestamp updated_at
    }
    
    STOPOVERS {
        uuid id PK
        uuid trip_id FK
        string location
        string country
        timestamp arrival_time
        timestamp departure_time
    }
    
    TRIP_MANIFESTS {
        uuid id PK
        uuid trip_id FK
        json items
        timestamp created_at
    }
```

### Wallet & Financial

```mermaid
erDiagram
    USERS ||--|| WALLETS : has
    WALLETS ||--o{ TRANSACTIONS : has
    WALLETS ||--o{ WALLET_ADDRESSES : has
    TRANSACTIONS ||--o{ TRANSACTION_LOGS : has
    
    WALLETS {
        uuid id PK
        uuid user_id FK
        decimal balance
        string currency
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    TRANSACTIONS {
        uuid id PK
        uuid wallet_id FK
        string type
        decimal amount
        string description
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    WALLET_ADDRESSES {
        uuid id PK
        uuid wallet_id FK
        string address
        string currency
        boolean is_primary
        timestamp created_at
    }
    
    TRANSACTION_LOGS {
        uuid id PK
        uuid transaction_id FK
        string action
        json previous_state
        json new_state
        timestamp created_at
    }
```

---

## Platform Events ERD

```mermaid
erDiagram
    PLATFORM_EVENTS ||--o{ PLATFORM_ORDERS : triggers
    PLATFORM_EVENTS ||--o{ PLATFORM_COMMISSIONS : generates
    PLATFORM_EVENTS ||--o{ PLATFORM_REFUNDS : processes
    PLATFORM_EVENTS ||--o{ PLATFORM_PAYOUTS : executes
    
    PLATFORM_EVENTS {
        uuid id PK
        string event_type
        json payload
        string status
        timestamp created_at
        timestamp processed_at
    }
    
    PLATFORM_ORDERS {
        uuid id PK
        uuid event_id FK
        uuid buyer_id FK
        uuid seller_id FK
        decimal amount
        string status
        timestamp created_at
    }
    
    PLATFORM_COMMISSIONS {
        uuid id PK
        uuid event_id FK
        string commission_type
        decimal amount
        string recipient_type
        string recipient_id
        timestamp created_at
    }
    
    PLATFORM_REFUNDS {
        uuid id PK
        uuid event_id FK
        decimal amount
        string reason
        string status
        timestamp created_at
    }
    
    PLATFORM_PAYOUTS {
        uuid id PK
        uuid event_id FK
        decimal amount
        string payout_type
        string recipient_id
        string status
        timestamp created_at
    }
```

---

## Country Layer ERD

```mermaid
erDiagram
    COUNTRIES ||--o{ COUNTRY_RULES : has
    COUNTRIES ||--o{ ROUTE_VALIDATIONS : uses
    COUNTRIES ||--o{ COMPLIANCE_CHECKS : requires
    
    COUNTRIES {
        string code PK
        string name
        string name_ar
        string region
        string currency
        boolean is_restricted
        timestamp created_at
        timestamp updated_at
    }
    
    COUNTRY_RULES {
        uuid id PK
        string country_code FK
        string category
        boolean is_restricted
        json restrictions
        int max_quantity
        decimal max_value
        boolean requires_permit
        json permit_types
        decimal duty_rate
        decimal tax_rate
        timestamp created_at
        timestamp updated_at
    }
    
    ROUTE_VALIDATIONS {
        uuid id PK
        string origin_country
        string destination_country
        string product_category
        boolean is_valid
        json validation_result
        timestamp created_at
    }
    
    COMPLIANCE_CHECKS {
        uuid id PK
        string country_code
        string product_id
        string compliance_status
        json compliance_details
        timestamp created_at
        timestamp updated_at
    }
```

---

## Subscription & Feature Management ERD

```mermaid
erDiagram
    USERS ||--o{ SUBSCRIPTIONS : has
    SUBSCRIPTIONS ||--|| SUBSCRIPTION_PLANS : uses
    SUBSCRIPTIONS ||--o{ SUBSCRIPTION_PAYMENTS : has
    USERS ||--o{ FEATURE_FLAGS : has
    FEATURE_FLAGS ||--|| FEATURE_MANAGEMENT : manages
    
    USERS {
        uuid id PK
        string email UK
        string first_name
        string last_name
        string role
        timestamp created_at
        timestamp updated_at
    }
    
    SUBSCRIPTIONS {
        uuid id PK
        uuid user_id FK
        uuid plan_id FK
        string status
        timestamp start_date
        timestamp end_date
        timestamp created_at
        timestamp updated_at
    }
    
    SUBSCRIPTION_PLANS {
        uuid id PK
        string name
        string type
        decimal price
        string currency
        json features
        timestamp created_at
        timestamp updated_at
    }
    
    SUBSCRIPTION_PAYMENTS {
        uuid id PK
        uuid subscription_id FK
        decimal amount
        string payment_method
        string status
        timestamp created_at
    }
    
    FEATURE_FLAGS {
        uuid id PK
        uuid user_id FK
        string feature_name
        boolean is_enabled
        json metadata
        timestamp created_at
        timestamp updated_at
    }
    
    FEATURE_MANAGEMENT {
        uuid id PK
        string feature_name
        string description
        boolean is_global
        json config
        timestamp created_at
        timestamp updated_at
    }
```

---

## AI Services ERD

```mermaid
erDiagram
    PRODUCTS ||--o{ RECOMMENDATIONS : receives
    USERS ||--o{ RECOMMENDATIONS : receives
    PRODUCTS ||--o{ PRICING_HISTORY : has
    PRODUCTS ||--o{ ANALYTICS : generates
    TRANSACTIONS ||--o{ FRAUD_CHECKS : undergoes
    
    RECOMMENDATIONS {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        float score
        string recommendation_type
        json reasoning
        timestamp created_at
    }
    
    PRICING_HISTORY {
        uuid id PK
        uuid product_id FK
        decimal price
        string currency
        string pricing_strategy
        timestamp created_at
    }
    
    ANALYTICS {
        uuid id PK
        uuid product_id FK
        json metrics
        json insights
        timestamp created_at
    }
    
    FRAUD_CHECKS {
        uuid id PK
        uuid transaction_id FK
        float fraud_score
        string risk_level
        json risk_factors
        string status
        timestamp created_at
    }
```

---

**Status**: ✅ ERD Generated
**Next**: API Documentation
