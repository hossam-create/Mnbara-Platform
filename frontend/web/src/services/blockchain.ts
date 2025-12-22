import axios from 'axios';
import { apiClient } from './api.service';

// Service URL - In production this should be routed via Gateway
// For dev, we might hit the service directly if Gateway isn't configured
const BLOCKCHAIN_SERVICE_URL = import.meta.env.VITE_BLOCKCHAIN_SERVICE_URL || 'http://localhost:3008/api/blockchain';

export interface MNBBalance {
    address: string;
    balance: string;
}

export interface KYCTier {
    address: string;
    tier: number;
}

class BlockchainService {
    
    // Use a direct axios instance for the standalone service to avoid Gateway 404s if not configured
    private client = axios.create({
        baseURL: BLOCKCHAIN_SERVICE_URL,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    constructor() {
        // Add auth interceptor if needed
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    /**
     * Get MNB Token Balance
     */
    async getBalance(address: string): Promise<string> {
        try {
            const response = await this.client.get<{address: string, balance: string}>(`/balance/${address}`);
            return response.data.balance;
        } catch (error) {
            console.error('Failed to get balance', error);
            throw error;
        }
    }

    /**
     * Get KYC Tier
     */
    async getKYCTier(address: string): Promise<number> {
        try {
            const response = await this.client.get<{address: string, tier: number}>(`/kyc/${address}`);
            return response.data.tier;
        } catch (error) {
            console.error('Failed to get KYC tier', error);
            return 0; // Default to 0 on error
        }
    }

    /**
     * Mint Tokens (Admin only - for testing/faucet)
     */
    async mint(to: string, amount: string, reference: string): Promise<void> {
        await this.client.post('/mint', { to, amount, reference });
    }

    /**
     * Update KYC (Admin/System only)
     * Note: Usually called by system, but exposed here for testing/admin panels
     */
    async updateKYC(address: string, tier: number): Promise<void> {
        await this.client.post('/kyc', { address, tier });
    }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
