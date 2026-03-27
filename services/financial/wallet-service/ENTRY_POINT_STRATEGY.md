# Wallet Service Entry Point Strategy

**Date:** February 18, 2026
**Status:** DOCUMENTED

---

## Current State

The wallet-service has TWO entry points:

1. **main.ts** (NestJS) - Primary entry point
2. **index.ts** (Express) - Legacy entry point

---

## Why Both Exist

### main.ts (NestJS) - RECOMMENDED
- **Framework:** NestJS with decorators, modules, dependency injection
- **Features:** Full-featured with Swagger, validation pipes, proper DI
- **Port:** 3005 (configured in main.ts)
- **Used by:** package.json "start" script points to `dist/main.js`
- **Status:** ACTIVE and CANONICAL

### index.ts (Express) - LEGACY
- **Framework:** Raw Express with manual routing
- **Features:** Basic Express setup with manual middleware
- **Port:** 3005 (same as main.ts)
- **Used by:** Can be run manually but NOT used in production
- **Status:** KEPT FOR BACKWARD COMPATIBILITY

---

## Production Deployment

**ALWAYS use main.ts (NestJS) for production:**

```bash
npm run build  # Compiles to dist/
npm start      # Runs dist/main.js (NestJS)
```

The package.json is correctly configured:
```json
{
  "scripts": {
    "start": "node dist/main.js",  // ✅ Points to NestJS
    "start:dev": "nest start --watch"
  }
}
```

---

## Why Keep index.ts?

1. **Backward Compatibility:** Some development scripts may reference it
2. **Migration Path:** Allows gradual migration from Express to NestJS
3. **Testing:** Can be used for isolated Express-only testing
4. **Documentation:** Shows the evolution from Express to NestJS

---

## Recommendation

### Option A: Keep Both (Current Strategy)
- Document clearly that main.ts is canonical
- Add deprecation notice to index.ts
- Ensure package.json always points to main.ts

### Option B: Remove index.ts
- Delete index.ts entirely
- Update any scripts that reference it
- Simplify the codebase

---

## Decision: KEEP BOTH

**Rationale:**
- No harm in keeping index.ts as it's not used in production
- Provides flexibility for development and testing
- Clear documentation prevents confusion
- package.json correctly points to main.ts

**Action Items:**
- ✅ Add deprecation notice to index.ts
- ✅ Document this strategy in ENTRY_POINT_STRATEGY.md
- ✅ Verify package.json points to main.ts (already correct)
- ✅ Update audit report to reflect this decision

---

## For Developers

**To run the service:**
```bash
# Development (NestJS with hot reload)
npm run dev

# Production build
npm run build
npm start  # Runs NestJS version
```

**DO NOT run index.ts directly in production!**

---

## Conclusion

Both entry points exist, but **main.ts (NestJS) is the canonical entry point** for all production deployments. The index.ts file is kept for backward compatibility and development flexibility but should not be used in production.
