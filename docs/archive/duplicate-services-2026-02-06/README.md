# Archived Duplicate Services

**Date**: 2026-02-06
**Reason**: Service consolidation - duplicate/obsolete implementations

## Archived Services

### 1. listing-service-node
**Original Path**: `backend/services/listing-service-node/`
**Archived Date**: 2026-02-06
**Reason**: Replaced by `listing-service` which is a more complete implementation
**Features Lost**: Basic product service, Elasticsearch integration (already in listing-service)

### 2. order-service
**Original Path**: `backend/services/order-service/`
**Archived Date**: 2026-02-06
**Reason**: Replaced by `orders-service` which is a complete NestJS implementation
**Features Lost**: Basic stub (never fully implemented)

### 3. ai-recommendations-v2
**Original Path**: `backend/services/ai-recommendations-v2/`
**Archived Date**: 2026-02-06
**Reason**: Merged into `ai-recommendations` which now includes both LLM and ML features
**Features Preserved**: 
- Prisma schema with UserProfile, UserInteraction, ProductEmbedding, Recommendation, MLModel, Experiment, RecommendationMetrics models
- ML recommendation algorithms (Collaborative Filtering, Content-Based, Hybrid, Trending, etc.)
- Redis caching with ioredis
- TensorFlow.js and Natural NLP libraries

## Related Documentation

See `DUPLICATE_SERVICES_REPORT.md` in the project root for detailed analysis and migration steps.

## Restoration

If needed, these services can be restored from this archive.

## Post-Consolidation Status

| Service | Status |
|---------|--------|
| listing-service | ✅ Primary (kept) |
| orders-service | ✅ Primary (kept) |
| ai-recommendations | ✅ Primary (merged v1 + v2) |
| cart-service | ✅ No duplicate found |
