# Mnbara Platform - Directory Structure

## Current Clean Structure (After Reorganization)

```
mnbara-platform/
├── 📁 backend/                    # Backend microservices
│   └── services/                  # ⚠️ To be moved from root/services/
│       ├── api-gateway/
│       ├── auth-service/
│       ├── listing-service/
│       ├── auction-service/
│       ├── payment-service/
│       ├── orders-service/
│       ├── trips-service/
│       ├── matching-service/
│       ├── crowdship-service/
│       ├── notification-service/
│       ├── recommendation-service/
│       ├── rewards-service/
│       └── shared/
│
├── 📁 frontend/                   # ✅ Frontend applications
│   ├── web/                       # React + Vite web app
│   └── mobile/                    # React Native (iOS/Android)
│       └── mnbara-app/
│
├── 📁 infrastructure/             # ✅ Deployment configs
│   ├── docker/
│   │   └── docker-compose.yml
│   ├── render.yaml
│   └── aws/                       # (if exists)
│
├── 📁 scripts/                    # ✅ Organized utility scripts
│   ├── database/                  # Database management
│   │   ├── reset-database.bat
│   │   ├── migrate-all-services.bat
│   │   ├── migrate-docker.bat
│   │   └── run-seed-direct.js
│   │
│   ├── ebay/                      # eBay category tools
│   │   ├── fetch-ebay-categories.ts
│   │   ├── parse-ebay-categories-file.ts
│   │   ├── generate-category-seeds.ts
│   │   ├── parse-ebay-simple.js
│   │   ├── parse-categories.bat
│   │   └── README-EBAY-CATEGORIES.md
│   │
│   └── deployment/                # Deployment helpers
│       └── setup_local.bat
│
├── 📁 data/                       # ✅ Data files
│   ├── categories/
│   │   └── ebay-categories-raw.txt
│   └── seeds/
│
├── 📁 docs/                       # ✅ All documentation
│   ├── LEGACY_FEATURES_REVIEW.md
│   ├── SECURITY_SETUP.md
│   │
│   ├── planning/
│   │   └── ACTION_PLAN.md
│   │
│   ├── deployment/
│   │   ├── AWS_DEPLOYMENT.md
│   │   └── RENDER_DEPLOYMENT.md
│   │
│   ├── security/
│   │   ├── SECURITY_AUDIT.md
│   │   ├── GITHUB_SECURITY_SETUP.md
│   │   └── README.md
│   │
│   ├── api/                       # (future: OpenAPI, Postman)
│   └── architecture/              # (future: system design)
│
├── 📁 archive/                    # ✅ Historical files
│   ├── historical-docs/           # All task completions, PR guides
│   │   ├── TASK*.md (7 files)
│   │   ├── PR*.md  (7 files)
│   │   ├── QUICK*.md
│   │   ├── SECURITY*.md (5 files)
│   │   ├── CODEQL_FIX_REPORT.md
│   │   ├── commit_msg*.txt
│   │   └── ...
│   │
│   └── temp-scripts/              # Temporary/debug scripts
│       ├── find-password.js
│       ├── test-db-conn.js
│       ├── fix-*.js
│       ├── convert-*.js
│       ├── count.sql
│       └── *.ps1 (upload scripts)
│
├── 📁 .github/                    # GitHub workflows
│   └── workflows/
│
├── 📄 README.md                   # Main documentation
├── 📄 CHANGELOG.md                # ✅ Project changelog
├── 📄 package.json                # Root package.json
├── 📄 .gitignore
├── 📄 .eslintrc.json
└── 📄 .eslintignore
```

## ⚠️ Pending Actions

### Services Migration (Blocked by IDE)
The `services/` folder needs to be moved to `backend/services/` but is currently locked by your IDE.

**To Complete:**
1. Close all open files in your IDE (especially in services folder)
2. Run: `Move-Item -Force services backend\`

### Legacy Frontend Archive (Pending)
The `web/mnbara-web-legacy/` folder should be archived:
1. Run: `Move-Item -Force frontend\web\mnbara-web-legacy archive\`

## ✅ Completed Moves

### Documentation (30+ files moved)
- ✅ `ACTION_PLAN.md` → `docs/planning/`
- ✅ `AWS_DEPLOYMENT.md`, `RENDER_DEPLOYMENT.md` → `docs/deployment/`
- ✅ `SECURITY_AUDIT.md`, `GITHUB_SECURITY_SETUP.md` → `docs/security/`
- ✅ All `TASK*.md`, `PR*.md`, `QUICK*.md` → `archive/historical-docs/`
- ✅ All security reports → `archive/historical-docs/`

### Scripts (12 files moved)
- ✅ eBay tools → `scripts/ebay/`
- ✅ Database tools → `scripts/database/`
- ✅ Setup scripts → `scripts/deployment/`
- ✅ Temporary/debug scripts → `archive/temp-scripts/`
- ✅ PowerShell upload scripts → `archive/temp-scripts/`

### Data & Infrastructure
- ✅ `ebay catogery.txt` → `data/categories/ebay-categories-raw.txt`
- ✅ `docker-compose.yml` → `infrastructure/docker/`
- ✅ `render.yaml` → `infrastructure/`
- ✅ `web/` → `frontend/web/`
- ✅ `mobile/` → `frontend/mobile/`

## Clean Root Directory

After cleanup, root directory contains only:
- Configuration files (.eslintrc.json, .gitignore, package.json)
- Main documentation (README.md, CHANGELOG.md)
- Organized folders (backend/, frontend/, infrastructure/, docs/, scripts/, data/, archive/)

## Benefits of New Structure

1. **Clear Separation**: Backend, frontend, infrastructure clearly separated
2. **Organized Docs**: All documentation in `docs/` with logical subfolders
3. **Archived History**: Historical files preserved but not cluttering root
4. **Script Organization**: Scripts categorized by purpose
5. **Clean Root**: Only essential files in root directory
6. **Future-Ready**: Structure supports Web + iOS + Android development

## Next Steps

1. User closes IDE files
2. Move `services/` → `backend/services/`
3. Archive legacy frontend
4. Update import paths in code
5. Test Docker Compose with new structure
6. Update README.md
