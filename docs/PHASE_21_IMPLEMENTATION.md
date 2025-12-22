# Phase 21: Blockchain Integration & Biometric Security Implementation

## Overview
This phase implements the foundation for Blockchain integration (MNB Token interaction) and Biometric Security (WebAuthn).

## Components Added

### 1. Blockchain Service
Located in `backend/services/blockchain-service`.
- **Purpose**: Acts as a gateway to the MNBara Smart Contracts.
- **Microservice**: Node.js/Express with TypeScript.
- **Key Features**:
  - `TokenService`: Wraps `ethers.js` calls to `MNBToken.sol`.
  - `TokenController`: Exposes REST API for token operations.
  - **Endpoints**:
    - `GET /api/blockchain/balance/:address`
    - `POST /api/blockchain/kyc` (Updates KYC tier)
    - `POST /api/blockchain/mint` (Admin only)

### 2. Biometric Authentication
Integrated into `backend/services/auth-service`.
- **Purpose**: Enables secure, passwordless authentication and step-up verification for high-value transactions.
- **Technology**: WebAuthn via `@simplewebauthn/server`.
- **Database**: Added `Authenticator` model to Prisma schema.
- **Endpoints**:
  - `GET /api/biometric/register/start` & `POST /api/biometric/register/finish`
  - `GET /api/biometric/login/start` & `POST /api/biometric/login/finish`
  - `POST /api/biometric/kyc/upgrade`: Verifies biometric and then calls Blockchain Service to upgrade KYC Tier.

## Setup Instructions

### 1. Database Migration
Update the `auth-service` database to include the new `Authenticator` table.
```bash
cd backend/services/auth-service
npx prisma migrate dev --name add_biometric_authenticator
```

### 2. Install Dependencies
**Auth Service:**
```bash
cd backend/services/auth-service
npm install
```

**Blockchain Service:**
```bash
cd backend/services/blockchain-service
npm install
```

### 3. Environment Variables
**Blockchain Service (.env):**
```env
PORT=3008
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545 # Or your fast node/Alchemy URL
BLOCKCHAIN_PRIVATE_KEY=... # Private key of admin/minter
TOKEN_CONTRACT_ADDRESS=... # Deployed MNBToken address
```

**Auth Service (.env):**
```env
# Add if not present
BLOCKCHAIN_SERVICE_URL=http://localhost:3008
```

## Running the Services
1. Start your blockchain node (Hardhat or use testnet).
2. Deploy contracts if not deployed.
3. Start `blockchain-service`: `npm run dev`
4. Start `auth-service`: `npm run dev`

## Verification
- Register a biometric credential using a frontend that supports WebAuthn.
- Call `/api/biometric/kyc/upgrade` with the wallet address.
- Check `blockchain-service` logs or query the contract to valid the KYC tier update.
