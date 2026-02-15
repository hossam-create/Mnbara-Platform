import { Request, Response } from 'express';
import { TokenService } from '../services/tokenService';

const tokenService = new TokenService();

export const getBalance = async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        const balance = await tokenService.getBalance(address);
        res.json({ address, balance });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const updateKYC = async (req: Request, res: Response) => {
    try {
        const { address, tier } = req.body;
        await tokenService.updateKYC(address, tier);
        res.json({ message: 'KYC updated successfully', address, tier });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const mintTokens = async (req: Request, res: Response) => {
    try {
        const { to, amount, reference } = req.body;
        await tokenService.mint(to, amount, reference);
        res.json({ message: 'Tokens minted successfully', to, amount });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

export const getKYC = async (req: Request, res: Response) => {
    try {
        const { address } = req.params;
        const tier = await tokenService.getKYCTier(address);
        res.json({ address, tier });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};
