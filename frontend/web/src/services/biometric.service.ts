import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';

// Biometric Service URL - In production via Gateway
// Using direct port/path for this phase integration
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001/api/biometric';

class BiometricService {
    private client = axios.create({
        baseURL: AUTH_SERVICE_URL,
        headers: { 'Content-Type': 'application/json' }
    });

    constructor() {
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    /**
     * Check if WebAuthn is supported
     */
    async isSupported(): Promise<boolean> {
        return startAuthentication !== undefined &&
            (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
    }

    /**
     * Get biometric status from server
     */
    async getStatus(): Promise<{ isEnabled: boolean }> {
        try {
            const response = await this.client.get('/status');
            return response.data;
        } catch (error) {
            console.error('Failed to get biometric status', error);
            return { isEnabled: false };
        }
    }

    /**
     * Backwards compatible verify alias used by wallet flows/tests
     */
    async verify(): Promise<boolean> {
        return this.authenticate();
    }

    /**
     * Register a new Biometric Credential
     */
    async register(): Promise<boolean> {
        try {
            // 1. Get Options
            const optionsResp = await this.client.get('/register/start');
            const options = optionsResp.data;

            // 2. Browser interaction
            const registrationJSON = await startRegistration(options);

            // 3. Verify
            const verifyResp = await this.client.post('/register/finish', registrationJSON);

            return verifyResp.data.verified;
        } catch (error) {
            console.error('Biometric registration failed', error);
            throw error;
        }
    }

    /**
     * Authenticate
     */
    async authenticate(): Promise<boolean> {
        try {
            // 1. Get Options
            const optionsResp = await this.client.get('/login/start');
            const options = optionsResp.data;

            // 2. Browser interaction
            const authJSON = await startAuthentication(options);

            // 3. Verify
            const verifyResp = await this.client.post('/login/finish', authJSON);

            return verifyResp.data.verified;
        } catch (error) {
            console.error('Biometric authentication failed', error);
            throw error;
        }
    }

    /**
     * Verify Biometric and Upgrade KYC
     */
    async verifyAndUpgradeKYC(walletAddress: string): Promise<{ verified: boolean, kycUpgraded: boolean }> {
        try {
             // 1. Get Options
             const optionsResp = await this.client.get('/login/start');
             const options = optionsResp.data;
 
             // 2. Browser interaction
             const authJSON = await startAuthentication(options);
 
             // 3. Verify & Upgrade
             const payload = {
                 ...authJSON,
                 walletAddress
             };
 
             const verifyResp = await this.client.post('/kyc/upgrade', payload);
             return verifyResp.data;
        } catch (error) {
            console.error('KYC Upgrade failed', error);
            throw error;
        }
    }
}

export const biometricService = new BiometricService();
export default biometricService;
