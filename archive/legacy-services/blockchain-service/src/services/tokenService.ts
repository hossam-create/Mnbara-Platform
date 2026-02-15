import { Contract, formatUnits, parseUnits } from 'ethers';
import { BlockchainProvider } from '../config/blockchain';

export class TokenService {
    private contract: Contract;

    constructor() {
        this.contract = BlockchainProvider.getInstance().getContract();
    }

    async getBalance(address: string): Promise<string> {
        try {
            const balance = await this.contract.balanceOf(address);
            const decimals = await this.contract.decimals();
            return formatUnits(balance, decimals);
        } catch (error) {
            console.error(`Error getting balance for ${address}:`, error);
            throw new Error('Failed to fetch balance');
        }
    }

    async updateKYC(address: string, tier: number): Promise<void> {
        try {
            const tx = await this.contract.updateKYCTier(address, tier);
            await tx.wait();
            console.log(`KYC Tier updated for ${address} to ${tier}`);
        } catch (error) {
            console.error(`Error updating KYC for ${address}:`, error);
            throw new Error('Failed to update KYC tier');
        }
    }

    async mint(to: string, amount: string, reference: string): Promise<void> {
        try {
            const decimals = await this.contract.decimals();
            const amountWei = parseUnits(amount, decimals);
            const tx = await this.contract.mintWithReference(to, amountWei, reference);
            await tx.wait();
            console.log(`Minted ${amount} tokens to ${to} ref: ${reference}`);
        } catch (error) {
            console.error(`Error minting tokens to ${to}:`, error);
            throw new Error('Failed to mint tokens');
        }
    }

    async getKYCTier(address: string): Promise<number> {
        try {
            const tier = await this.contract.kycTiers(address);
            return Number(tier);
        } catch (error) {
            console.error(`Error getting KYC tier for ${address}:`, error);
            throw new Error('Failed to fetch KYC tier');
        }
    }
}
