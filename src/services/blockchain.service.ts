import { ethers, JsonRpcProvider, Wallet, Contract, TransactionResponse } from 'ethers';
import { Logger } from '@nestjs/common';

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  privateKey?: string;
  contractAddress?: string;
}

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: number;
  gasPrice?: string;
}

export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: JsonRpcProvider;
  private wallet: Wallet | null = null;
  private contract: Contract | null = null;

  constructor(private config: BlockchainConfig) {
    this.initializeProvider();
    this.initializeWallet();
  }

  private initializeProvider(): void {
    try {
      this.provider = new JsonRpcProvider(this.config.rpcUrl, this.config.chainId);
      this.logger.log(`Provider initialized for chain ${this.config.chainId}`);
    } catch (error) {
      this.logger.error('Failed to initialize provider', error);
      throw new Error('Failed to initialize blockchain provider');
    }
  }

  private initializeWallet(): void {
    if (this.config.privateKey) {
      try {
        this.wallet = new Wallet(this.config.privateKey, this.provider);
        this.logger.log(`Wallet initialized for address: ${this.wallet.address}`);
      } catch (error) {
        this.logger.error('Failed to initialize wallet', error);
        this.wallet = null;
      }
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(`Failed to get balance for address ${address}`, error);
      throw new Error('Failed to retrieve balance from blockchain');
    }
  }

  async sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Private key is required for sending transactions');
    }

    try {
      const tx = await this.wallet.sendTransaction({
        to: transaction.to,
        value: transaction.value ? ethers.parseEther(transaction.value) : undefined,
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice ? ethers.parseUnits(transaction.gasPrice, 'gwei') : undefined,
      });

      this.logger.log(`Transaction sent: ${tx.hash}`);
      return tx;
    } catch (error) {
      this.logger.error('Failed to send transaction', error);
      throw new Error('Failed to send transaction to blockchain');
    }
  }

  async waitForTransaction(hash: string, confirmations: number = 1): Promise<ethers.TransactionReceipt | null> {
    try {
      const receipt = await this.provider.waitForTransaction(hash, confirmations);
      return receipt;
    } catch (error) {
      this.logger.error(`Failed to wait for transaction ${hash}`, error);
      return null;
    }
  }

  async getTransactionReceipt(hash: string): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.getTransactionReceipt(hash);
    } catch (error) {
      this.logger.error(`Failed to get receipt for transaction ${hash}`, error);
      return null;
    }
  }

  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      this.logger.error('Failed to get block number', error);
      throw new Error('Failed to retrieve block number from blockchain');
    }
  }

  async estimateGas(transaction: TransactionRequest): Promise<bigint> {
    try {
      return await this.provider.estimateGas({
        to: transaction.to,
        value: transaction.value ? ethers.parseEther(transaction.value) : undefined,
        data: transaction.data,
      });
    } catch (error) {
      this.logger.error('Failed to estimate gas', error);
      throw new Error('Failed to estimate gas for transaction');
    }
  }

  getWalletAddress(): string | null {
    return this.wallet ? this.wallet.address : null;
  }

  isConnected(): boolean {
    return !!this.provider;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getBlockNumber();
      return true;
    } catch (error) {
      return false;
    }
  }
}