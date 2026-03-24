# Environment Variables Configuration - apps/web

## Overview
This document describes how environment variables are configured and preserved for the Next.js 15 web application in the monorepo.

## File Structure
- `.env.example` - Template with all available environment variables
- `.env.local` - Local development environment (gitignored)
- `.env.staging` - Staging environment (optional)
- `.env.production` - Production environment (optional)

## Variable Categories

### Public Variables (NEXT_PUBLIC_)
Exposed to the browser. Use for non-sensitive configuration:
- API endpoints
- Feature flags
- Public API keys (Stripe publishable key, Google Maps)
- Localization settings
- Business configuration

### Private Variables
Server-side only. Use for sensitive data:
- JWT secrets
- Database credentials
- API keys (Stripe secret, SendGrid, AWS)
- Session secrets

## Loading Order
1. `.env.local` (highest priority - local overrides)
2. `.env.{NODE_ENV}` (environment-specific)
3. `.env.example` (fallback defaults)

## Service URLs
All service URLs are configured to use the API Gateway on port 3000:
- Auth Service: http://localhost:3001
- User Service: http://localhost:3002
- Product Service: http://localhost:3004
- Order Service: http://localhost:3005
- Payment Service: http://localhost:3009
- Wallet Service: http://localhost:3010

## Setup Instructions
1. Copy `.env.example` to `.env.local`
2. Update placeholder values with actual credentials
3. Never commit `.env.local` to version control
4. For production, use environment-specific files
