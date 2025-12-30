# MNBARH / MNBARA - Cross-Border E-commerce Platform

## Overview
MNBARH is a cross-border e-commerce marketplace platform that connects travelers with buyers. The platform allows users to request products from anywhere in the world and have travelers deliver them, saving on shipping costs.

## Project Structure
- `frontend/web/` - Main React/Vite frontend application (runs on port 5000)
- `frontend/web-app/` - Alternative web app frontend
- `frontend/admin-dashboard/` - Admin dashboard
- `frontend/mobile/` - Mobile app components
- `backend/services/` - Multiple microservices (auth, payment, wallet, etc.)
- `infrastructure/` - Kubernetes, Docker, and cloud deployment configs
- `docs/` - Documentation

## Tech Stack
- **Frontend**: React 19, Vite 7, TailwindCSS 4, TypeScript
- **State Management**: React Context
- **Blockchain**: Ethers.js for wallet/crypto integration
- **Testing**: Vitest
- **Styling**: TailwindCSS with PostCSS

## Running the Project
The frontend runs on port 5000 with:
```bash
cd frontend/web && npm run dev
```

## Key Features
- Cross-border shopping marketplace
- Traveler/buyer matching system
- Wallet and crypto payment support
- Auction functionality
- KYC verification
- Multi-language support (Arabic/English)

## Configuration Notes
- Vite is configured to allow all hosts for Replit proxy compatibility
- Server binds to 0.0.0.0:5000
- Uses static deployment target for production

## Recent Changes
- 2025-12-30: Initial Replit setup - configured Vite for port 5000 with host allowlist, fixed HTML noscript placement, added ethers dependency
