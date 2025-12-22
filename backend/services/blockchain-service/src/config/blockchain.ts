import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { MNBTokenABI } from '../abi/MNBTokenABI';

dotenv.config();

export class BlockchainProvider {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private tokenContract: ethers.Contract;
    private static instance: BlockchainProvider;

    private constructor() {
        const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
        const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Default Hardhat Account #0
        const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Default local deploy address

        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        
        this.tokenContract = new ethers.Contract(tokenAddress, MNBTokenABI, this.wallet);
    }

    public static getInstance(): BlockchainProvider {
        if (!BlockchainProvider.instance) {
            BlockchainProvider.instance = new BlockchainProvider();
        }
        return BlockchainProvider.instance;
    }

    public getContract() {
        return this.tokenContract;
    }

    public getWallet() {
        return this.wallet;
    }

    public getProvider() {
        return this.provider;
    }
}
