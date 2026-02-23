# Archived Services Documentation

Complete list of 71 archived services with dependencies, status, and activation plan.

---

## Overview

This document catalogs all 71 archived services in the Mnbara Platform, their dependencies, activation status, and integration requirements.

---

## Archived Services Inventory

### Group 1: Core Platform Services (1-15)

1. **account-service** (Port 3017)
   - Status: Archived
   - Dependencies: PostgreSQL, Redis
   - Integration: User Service, Auth Service
   - Activation Priority: HIGH
   - Notes: Legacy account management, superseded by user-service

2. **profile-service** (Port 3018)
   - Status: Archived
   - Dependencies: PostgreSQL, Elasticsearch
   - Integration: User Service
   - Activation Priority: MEDIUM
   - Notes: User profile management, can be merged into user-service

3. **preference-service** (Port 3019)
   - Status: Archived
   - Dependencies: PostgreSQL, Redis
   - Integration: User Service, Notification Service
   - Activation Priority: LOW
   - Notes: User preferences, can be merged into user-service

4. **session-service** (Port 3020)
   - Status: Archived
   - Dependencies: Redis
   - Integration: Auth Service
   - Activation Priority: HIGH
   - Notes: Session management, superseded by auth-service

5. **token-service** (Port 3021)
   - Status: Archived
   - Dependencies: Redis
   - Integration: Auth Service
   - Activation Priority: HIGH
   - Notes: JWT token management, superseded by auth-service

6. **permission-service** (Port 3022)
   - Status: Archived
   - Dependencies: PostgreSQL, Redis
   - Integration: Auth Service, User Service
   - Activation Priority: MEDIUM
   - Notes: Permission management, can be merged into auth-service

7. **role-service** (Port 3023)
   - Status: Archived
   - Dependencies: PostgreSQL
   - Integration: Auth Service, User Service
   - Activation Priority: MEDIUM
   - Notes: Role management, can be merged into auth-service

8. **audit-service** (Port 3024)
   - Status: Archived
   - Dependencies: PostgreSQL, Elasticsearch
   - Integration: All services
   - Activation Priority: HIGH
   - Notes: Audit logging, critical for compliance

9. **logging-service** (Port 3025)
   - Status: Archived
   - Dependencies: Elasticsearch, Kafka
   - Integration: All services
   - Activation Priority: HIGH
   - Notes: Centralized logging, critical for debugging

10. **metrics-service** (Port 3026)
    - Status: Archived
    - Dependencies: Prometheus, Grafana
    - Integration: All services
    - Activation Priority: HIGH
    - Notes: Metrics collection, critical for monitoring

11. **health-service** (Port 3027)
    - Status: Archived
    - Dependencies: None
    - Integration: All services
    - Activation Priority: HIGH
    - Notes: Health check aggregation, critical for operations

12. **config-service** (Port 3028)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: All services
    - Activation Priority: HIGH
    - Notes: Configuration management, critical for operations

13. **discovery-service** (Port 3029)
    - Status: Archived
    - Dependencies: None
    - Integration: All services
    - Activation Priority: HIGH
    - Notes: Service discovery, critical for microservices

14. **gateway-service** (Port 3030)
    - Status: Archived
    - Dependencies: None
    - Integration: All services
    - Activation Priority: HIGH
    - Notes: API gateway, superseded by api-gateway

15. **load-balancer-service** (Port 3031)
    - Status: Archived
    - Dependencies: None
    - Integration: All services
    - Activation Priority: MEDIUM
    - Notes: Load balancing, superseded by api-gateway

### Group 2: Business Logic Services (16-35)

16. **catalog-service** (Port 3032)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch
    - Integration: Product Service
    - Activation Priority: MEDIUM
    - Notes: Product catalog, superseded by product-service

17. **inventory-service** (Port 3033)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Product Service, Order Service
    - Activation Priority: HIGH
    - Notes: Inventory management, critical for operations

18. **pricing-service** (Port 3034)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Product Service, Order Service
    - Activation Priority: MEDIUM
    - Notes: Pricing management, can be merged into product-service

19. **discount-service** (Port 3035)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Product Service, Order Service
    - Activation Priority: LOW
    - Notes: Discount management, can be merged into product-service

20. **promotion-service** (Port 3036)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Product Service, Order Service
    - Activation Priority: LOW
    - Notes: Promotion management, can be merged into product-service

21. **coupon-service** (Port 3037)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Order Service, Payment Service
    - Activation Priority: LOW
    - Notes: Coupon management, can be merged into order-service

22. **tax-service** (Port 3038)
    - Status: Archived
    - Dependencies: PostgreSQL
    - Integration: Order Service, Payment Service
    - Activation Priority: HIGH
    - Notes: Tax calculation, critical for compliance

23. **shipping-service** (Port 3039)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Order Service, Trips Service
    - Activation Priority: HIGH
    - Notes: Shipping management, critical for operations

24. **delivery-service** (Port 3040)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Order Service, Trips Service
    - Activation Priority: HIGH
    - Notes: Delivery management, critical for operations

25. **tracking-service** (Port 3041)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Order Service, Trips Service
    - Activation Priority: HIGH
    - Notes: Tracking management, critical for operations

26. **return-service** (Port 3042)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Order Service, Escrow Service
    - Activation Priority: MEDIUM
    - Notes: Return management, can be merged into order-service

27. **refund-service** (Port 3043)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Order Service, Escrow Service, Payment Service
    - Activation Priority: MEDIUM
    - Notes: Refund management, can be merged into escrow-service

28. **exchange-service** (Port 3044)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Order Service, Escrow Service
    - Activation Priority: LOW
    - Notes: Exchange management, can be merged into order-service

29. **cancellation-service** (Port 3045)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Order Service, Escrow Service
    - Activation Priority: MEDIUM
    - Notes: Cancellation management, can be merged into order-service

30. **dispute-service** (Port 3046)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Order Service, Escrow Service
    - Activation Priority: HIGH
    - Notes: Dispute management, critical for operations

31. **review-service** (Port 3047)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch
    - Integration: Product Service, Order Service
    - Activation Priority: MEDIUM
    - Notes: Review management, can be merged into product-service

32. **rating-service** (Port 3048)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Product Service, Order Service
    - Activation Priority: MEDIUM
    - Notes: Rating management, can be merged into product-service

33. **comment-service** (Port 3049)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch
    - Integration: Product Service, Order Service
    - Activation Priority: LOW
    - Notes: Comment management, can be merged into product-service

34. **question-service** (Port 3050)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch
    - Integration: Product Service
    - Activation Priority: LOW
    - Notes: Q&A management, can be merged into product-service

35. **answer-service** (Port 3051)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch
    - Integration: Product Service
    - Activation Priority: LOW
    - Notes: Answer management, can be merged into product-service

### Group 3: Communication Services (36-50)

36. **email-service** (Port 3052)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis, SMTP
    - Integration: Notification Service
    - Activation Priority: HIGH
    - Notes: Email sending, critical for notifications

37. **sms-service** (Port 3053)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis, SMS Gateway
    - Integration: Notification Service
    - Activation Priority: MEDIUM
    - Notes: SMS sending, can be merged into notification-service

38. **push-service** (Port 3054)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis, FCM/APNS
    - Integration: Notification Service
    - Activation Priority: MEDIUM
    - Notes: Push notifications, can be merged into notification-service

39. **chat-service** (Port 3055)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis, WebSocket
    - Integration: User Service, Order Service
    - Activation Priority: MEDIUM
    - Notes: Chat management, can be merged into notification-service

40. **message-service** (Port 3056)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Chat Service, Notification Service
    - Activation Priority: LOW
    - Notes: Message management, can be merged into chat-service

41. **conversation-service** (Port 3057)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Chat Service, User Service
    - Activation Priority: LOW
    - Notes: Conversation management, can be merged into chat-service

42. **notification-service** (Port 3058)
    - Status: Active
    - Dependencies: PostgreSQL, Redis, RabbitMQ
    - Integration: All services
    - Activation Priority: N/A
    - Notes: Already active

43. **alert-service** (Port 3059)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Notification Service
    - Activation Priority: MEDIUM
    - Notes: Alert management, can be merged into notification-service

44. **reminder-service** (Port 3060)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Notification Service
    - Activation Priority: LOW
    - Notes: Reminder management, can be merged into notification-service

45. **digest-service** (Port 3061)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Notification Service
    - Activation Priority: LOW
    - Notes: Email digest, can be merged into notification-service

46. **newsletter-service** (Port 3062)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Notification Service
    - Activation Priority: LOW
    - Notes: Newsletter management, can be merged into notification-service

47. **broadcast-service** (Port 3063)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis, Kafka
    - Integration: Notification Service
    - Activation Priority: LOW
    - Notes: Broadcast messaging, can be merged into notification-service

48. **notification-preference-service** (Port 3064)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: User Service, Notification Service
    - Activation Priority: LOW
    - Notes: Notification preferences, can be merged into user-service

49. **notification-template-service** (Port 3065)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: Notification Service
    - Activation Priority: LOW
    - Notes: Notification templates, can be merged into notification-service

50. **notification-history-service** (Port 3066)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch
    - Integration: Notification Service
    - Activation Priority: LOW
    - Notes: Notification history, can be merged into notification-service

### Group 4: Integration Services (51-71)

51. **analytics-service** (Port 3067)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch, Kafka
    - Integration: All services
    - Activation Priority: HIGH
    - Notes: Analytics collection, critical for business intelligence

52. **reporting-service** (Port 3068)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch
    - Integration: All services
    - Activation Priority: HIGH
    - Notes: Report generation, critical for operations

53. **dashboard-service** (Port 3069)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch
    - Integration: All services
    - Activation Priority: MEDIUM
    - Notes: Dashboard data, can be merged into analytics-service

54. **insight-service** (Port 3070)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch, ML
    - Integration: All services
    - Activation Priority: MEDIUM
    - Notes: Business insights, can be merged into analytics-service

55. **recommendation-service** (Port 3071)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch, ML
    - Integration: Product Service, User Service
    - Activation Priority: HIGH
    - Notes: Product recommendations, critical for UX

56. **personalization-service** (Port 3072)
    - Status: Archived
    - Dependencies: PostgreSQL, Elasticsearch, ML
    - Integration: Product Service, User Service
    - Activation Priority: MEDIUM
    - Notes: Personalization, can be merged into recommendation-service

57. **search-service** (Port 3073)
    - Status: Archived
    - Dependencies: Elasticsearch
    - Integration: Product Service, User Service
    - Activation Priority: HIGH
    - Notes: Search functionality, critical for UX

58. **autocomplete-service** (Port 3074)
    - Status: Archived
    - Dependencies: Elasticsearch, Redis
    - Integration: Search Service
    - Activation Priority: LOW
    - Notes: Autocomplete, can be merged into search-service

59. **suggestion-service** (Port 3075)
    - Status: Archived
    - Dependencies: Elasticsearch, Redis
    - Integration: Search Service
    - Activation Priority: LOW
    - Notes: Search suggestions, can be merged into search-service

60. **filter-service** (Port 3076)
    - Status: Archived
    - Dependencies: Elasticsearch, Redis
    - Integration: Search Service
    - Activation Priority: LOW
    - Notes: Filter management, can be merged into search-service

61. **sort-service** (Port 3077)
    - Status: Archived
    - Dependencies: Elasticsearch, Redis
    - Integration: Search Service
    - Activation Priority: LOW
    - Notes: Sort management, can be merged into search-service

62. **aggregation-service** (Port 3078)
    - Status: Archived
    - Dependencies: Elasticsearch, Redis
    - Integration: Search Service
    - Activation Priority: LOW
    - Notes: Aggregation, can be merged into search-service

63. **export-service** (Port 3079)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: All services
    - Activation Priority: MEDIUM
    - Notes: Data export, critical for compliance

64. **import-service** (Port 3080)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: All services
    - Activation Priority: MEDIUM
    - Notes: Data import, critical for operations

65. **migration-service** (Port 3081)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: All services
    - Activation Priority: LOW
    - Notes: Data migration, can be merged into export/import-services

66. **backup-service** (Port 3082)
    - Status: Archived
    - Dependencies: PostgreSQL, S3
    - Integration: All services
    - Activation Priority: HIGH
    - Notes: Backup management, critical for operations

67. **restore-service** (Port 3083)
    - Status: Archived
    - Dependencies: PostgreSQL, S3
    - Integration: All services
    - Activation Priority: HIGH
    - Notes: Restore management, critical for operations

68. **archive-service** (Port 3084)
    - Status: Archived
    - Dependencies: PostgreSQL, S3
    - Integration: All services
    - Activation Priority: MEDIUM
    - Notes: Archive management, can be merged into backup-service

69. **cleanup-service** (Port 3085)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: All services
    - Activation Priority: MEDIUM
    - Notes: Cleanup management, can be merged into backup-service

70. **maintenance-service** (Port 3086)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: All services
    - Activation Priority: MEDIUM
    - Notes: Maintenance management, can be merged into backup-service

71. **upgrade-service** (Port 3087)
    - Status: Archived
    - Dependencies: PostgreSQL, Redis
    - Integration: All services
    - Activation Priority: LOW
    - Notes: Upgrade management, can be merged into maintenance-service

---

## Activation Plan

### Phase 1: Critical Services (Week 1)

Activate services critical for operations and compliance:

1. **audit-service** - Audit logging
2. **logging-service** - Centralized logging
3. **metrics-service** - Metrics collection
4. **health-service** - Health checks
5. **config-service** - Configuration management
6. **discovery-service** - Service discovery
7. **inventory-service** - Inventory management
8. **tax-service** - Tax calculation
9. **shipping-service** - Shipping management
10. **delivery-service** - Delivery management
11. **tracking-service** - Tracking management
12. **dispute-service** - Dispute management
13. **email-service** - Email sending
14. **analytics-service** - Analytics collection
15. **reporting-service** - Report generation
16. **search-service** - Search functionality
17. **recommendation-service** - Product recommendations
18. **export-service** - Data export
19. **import-service** - Data import
20. **backup-service** - Backup management
21. **restore-service** - Restore management

### Phase 2: Medium Priority Services (Week 2)

Activate services that improve functionality:

1. **profile-service** - User profiles
2. **permission-service** - Permission management
3. **role-service** - Role management
4. **catalog-service** - Product catalog
5. **pricing-service** - Pricing management
6. **return-service** - Return management
7. **refund-service** - Refund management
8. **cancellation-service** - Cancellation management
9. **review-service** - Review management
10. **rating-service** - Rating management
11. **sms-service** - SMS sending
12. **push-service** - Push notifications
13. **chat-service** - Chat management
14. **alert-service** - Alert management
15. **dashboard-service** - Dashboard data
16. **insight-service** - Business insights
17. **personalization-service** - Personalization
18. **archive-service** - Archive management
19. **cleanup-service** - Cleanup management
20. **maintenance-service** - Maintenance management

### Phase 3: Low Priority Services (Week 3)

Activate remaining services:

1. **preference-service** - User preferences
2. **discount-service** - Discount management
3. **promotion-service** - Promotion management
4. **coupon-service** - Coupon management
5. **exchange-service** - Exchange management
6. **comment-service** - Comment management
7. **question-service** - Q&A management
8. **answer-service** - Answer management
9. **message-service** - Message management
10. **conversation-service** - Conversation management
11. **reminder-service** - Reminder management
12. **digest-service** - Email digest
13. **newsletter-service** - Newsletter management
14. **broadcast-service** - Broadcast messaging
15. **notification-preference-service** - Notification preferences
16. **notification-template-service** - Notification templates
17. **notification-history-service** - Notification history
18. **autocomplete-service** - Autocomplete
19. **suggestion-service** - Search suggestions
20. **filter-service** - Filter management
21. **sort-service** - Sort management
22. **aggregation-service** - Aggregation
23. **migration-service** - Data migration
24. **upgrade-service** - Upgrade management

---

## Port Allocation

All archived services use ports 3017-3087, no conflicts with active services (3000-3016).

---

**Status**: ✅ Archived Services Documentation Complete
**Next**: Begin incremental activation of Phase 1 critical services
