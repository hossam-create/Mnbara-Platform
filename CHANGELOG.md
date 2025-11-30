# Changelog - Mnbara Platform

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- API Gateway service with JWT authentication middleware
- eBay Categories system (5,132 categories seeded)
- Orders Service (NestJS) with 6 core endpoints
- Trips Service (NestJS) with intelligent search algorithm
- Matching Service (NestJS) with scoring-based traveler matching
- Escrow/Payment Service enhancements (7 endpoints)
- Database seeding scripts and utilities
- Docker Compose configuration for all services

### Changed
- Reorganized project architecture (in progress)
- Updated Prisma schemas with Order, Trip, Escrow models

### Fixed
- Database authentication issues with PostgreSQL
- UTF-16 encoding support in environment file loading
- Path handling in seed scripts for Arabic directory names

---

## [Pre-Cleanup State] - 2025-11-29

### Project Structure Before Cleanup
This snapshot documents the project state before the comprehensive cleanup and reorganization.

#### Root Directory Contents
- **Documentation Files**: 38 markdown files including:
  - Security reports (5 files)
  - PR guides (5 files)
  - Task completion summaries (7 files)
  - Deployment guides (3 files)
  
- **Scripts**: 12 files
  - 6 Windows batch files (.bat)
  - 6 PowerShell scripts (.ps1)
  
- **Configuration**: docker-compose.yml, package.json, .gitignore, etc.

#### Services
- auth-service
- listing-service
- auction-service
- payment-service
- orders-service
- trips-service
- matching-service
- crowdship-service
- notification-service
- recommendation-service
- rewards-service
- api-gateway (new)

#### Frontend
- web/ (React + Vite)
  - mnbara-web-legacy/ (to be reviewed)
- mobile/ (React Native)
  - mnbara-app/

#### Known Issues
- API Gateway Docker build fails due to file encoding
- Many temporary/debugging scripts in root
- Documentation scattered across root directory
- Legacy code needs review and extraction

---

## [0.1.0] - 2025-11-27

### Added
- Initial microservices architecture
- Basic authentication with JWT
- PostgreSQL and Redis integration
- Docker containerization
- GitHub Actions workflows for security

### Infrastructure
- AWS deployment configurations
- Render deployment setup
- Docker Compose for local development

---

## Cleanup Plan - 2025-11-29

### Phase 1: Backup & Preparation ✅
- Created backup branch: `cleanup/architecture-reorganization`
- Documented current state in CHANGELOG.md

### Phase 2: Feature Extraction (Next)
- Review web/mnbara-web-legacy
- Extract reusable components
- Document valuable patterns

### Phase 3-8: Pending
- File reorganization
- Archive historical files  
- Delete temporary scripts
- Update references
- Testing
- Documentation updates

---

## Notes

### Files Marked for Deletion (Temporary/Debug)
- upload_to_github.ps1 (already uploaded)
- check_before_upload.ps1 (one-time use)
- create_prs.ps1, create_frontend_prs.ps1 (PRs created)
- find-password.js, test-db-conn.js (debugging)
- fix-package-json.js, fix-tsconfig.js (issues fixed)
- convert-to-sql.js, run-seed.js (superseded)

### Files Marked for Archival (Historical)
- Task completion summaries (TASK1-7_*.md)
- Security reports (multiple files → consolidated)
- PR guides (5 files → archived)

### Features to Preserve
- eBay category fetcher and parser scripts
- Database reset and migration tools
- Seed generation utilities
- Security audit processes
