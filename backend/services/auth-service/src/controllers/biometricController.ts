import { Request, Response } from 'express';
import { BiometricService } from '../services/biometricService';
import { AuthRequest } from '../middleware/auth.middleware';
import axios from 'axios';

const biometricService = new BiometricService();

// Simple in-memory store for challenges (Use Redis in production)
const challengeStore = new Map<number, string>();

export const startRegistration = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const options = await biometricService.generateRegistrationOptions(user.id, user.email);
        
        // Store challenge
        challengeStore.set(user.id, options.challenge);

        res.json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start registration' });
    }
};

export const finishRegistration = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const currentChallenge = challengeStore.get(user.id);
        if (!currentChallenge) return res.status(400).json({ error: 'No registration in progress' });

        const result = await biometricService.verifyRegistration(user.id, req.body, currentChallenge);
        
        // Clear challenge
        challengeStore.delete(user.id);

        if (result.verified) {
            res.json({ verified: true });
        } else {
            res.status(400).json({ verified: false, error: 'Verification failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to finish registration' });
    }
};

export const startAuthentication = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const options = await biometricService.generateAuthenticationOptions(user.id);
        
        // Store challenge
        challengeStore.set(user.id, options.challenge);

        res.json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start authentication' });
    }
};

export const finishAuthentication = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const currentChallenge = challengeStore.get(user.id);
        if (!currentChallenge) return res.status(400).json({ error: 'No authentication in progress' });

        const result = await biometricService.verifyAuthentication(user.id, req.body, currentChallenge);
        
        // Clear challenge
        challengeStore.delete(user.id);

        if (result.verified) {
            res.json({ verified: true });
        } else {
            res.status(400).json({ verified: false, error: 'Verification failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to finish authentication' });
    }
};

export const verifyAndUpgradeKYC = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { walletAddress, ...biometricResponse } = req.body;
        const currentChallenge = challengeStore.get(user.id);
        
        if (!currentChallenge) return res.status(400).json({ error: 'No authentication in progress' });

        const result = await biometricService.verifyAuthentication(user.id, biometricResponse, currentChallenge);
        
        challengeStore.delete(user.id);

        if (result.verified) {
            // Call Blockchain Service
            const blockchainUrl = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3008';
            try {
                await axios.post(`${blockchainUrl}/api/blockchain/kyc`, {
                    address: walletAddress,
                    tier: 2 // Level 2: Biometric Verified
                });
                res.json({ verified: true, kycUpgraded: true });
            } catch (bcError) {
                console.error('Blockchain update failed:', bcError);
                // Return success for auth, but warning for KYC
                res.json({ verified: true, kycUpgraded: false, warning: 'Failed to update blockchain ledger' });
            }
        } else {
            res.status(400).json({ verified: false, error: 'Verification failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to verify and upgrade KYC' });
    }
};
