import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Web3 } from 'web3';
import { ConfigService } from '@nestjs/config';

/**
 * Blockchain Integration Service for Secure Payment Transfers
 * Handles blockchain transactions for P2P swaps and secure transfers
 */

export interface BlockchainTransfer {
  fromAddress: string;
  toAddress: string;
  amount: string;
  currency: string; // 'ETH', 'USDC', 'USDT', etc.
  gasLimit?: number;
  gasPrice?: string;
}

export interface BlockchainTransaction {
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: number;
  timestamp: Date;
  confirmations: number;
}

export interface SmartContractCall {
  contractAddress: string;
  method: string;
  params: any[];
  value?: string;
}

@Injectable()
export class BlockchainIntegrationService {
  private web3: Web3;
  private prisma: PrismaClient;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.prisma = new PrismaClient();
    this.initializeWeb3();
  }

  /**
   * Initialize Web3 connection to Ethereum blockchain
   */
  private initializeWeb3(): void {
    try {
      const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL');
      const privateKey = this.configService.get<string>('BLOCKCHAIN_PRIVATE_KEY');
      
      if (!rpcUrl) {
        throw new Error('BLOCKCHAIN_RPC_URL is not configured');
      }

      this.web3 = new Web3(rpcUrl);
      
      // Add account from private key for transaction signing
      if (privateKey) {
        const account = this.web3.eth.accounts.privateKeyToAccount(privateKey);
        this.web3.eth.accounts.wallet.add(account);
        this.web3.eth.defaultAccount = account.address;
      }

      this.isInitialized = true;
      console.log('Blockchain integration service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize blockchain integration:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Execute secure blockchain transfer for P2P swaps
   */
  async executeBlockchainTransfer(transfer: BlockchainTransfer): Promise<BlockchainTransaction> {
    if (!this.isInitialized) {
      throw new HttpException('Blockchain service not initialized', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const { fromAddress, toAddress, amount, currency, gasLimit, gasPrice } = transfer;

      // Validate addresses
      if (!this.web3.utils.isAddress(fromAddress) || !this.web3.utils.isAddress(toAddress)) {
        throw new HttpException('Invalid blockchain addresses', HttpStatus.BAD_REQUEST);
      }

      // Convert amount to wei (for ETH) or appropriate decimals for tokens
      const value = await this.convertToBlockchainUnits(amount, currency);

      // Prepare transaction object
      const txObject: any = {
        from: fromAddress,
        to: toAddress,
        value: value,
        gas: gasLimit || 21000, // Default gas limit for simple transfers
      };

      // Set gas price if provided
      if (gasPrice) {
        txObject.gasPrice = this.web3.utils.toWei(gasPrice, 'gwei');
      }

      // Execute the transaction
      const receipt = await this.web3.eth.sendTransaction(txObject);

      // Save transaction record to database
      await this.saveTransactionRecord({
        txHash: receipt.transactionHash,
        fromAddress,
        toAddress,
        amount,
        currency,
        status: 'pending',
        gasUsed: parseInt(receipt.gasUsed?.toString() || '0'),
        blockNumber: receipt.blockNumber || undefined
      });

      return {
        txHash: receipt.transactionHash,
        status: 'pending',
        blockNumber: receipt.blockNumber,
        gasUsed: parseInt(receipt.gasUsed?.toString() || '0'),
        timestamp: new Date(),
        confirmations: 0
      };
    } catch (error) {
      console.error('Blockchain transfer failed:', error);
      throw new HttpException(
        `Blockchain transfer failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Execute smart contract call for advanced operations
   */
  async executeSmartContractCall(call: SmartContractCall): Promise<BlockchainTransaction> {
    if (!this.isInitialized) {
      throw new HttpException('Blockchain service not initialized', HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const { contractAddress, method, params, value } = call;

      // Load contract ABI (simplified - in real implementation would load from config)
      const contractAbi = this.getContractABI(contractAddress);
      const contract = new this.web3.eth.Contract(contractAbi, contractAddress);

      // Prepare transaction
      const txData = contract.methods[method](...params).encodeABI();

      const txObject: any = {
        from: this.web3.eth.defaultAccount,
        to: contractAddress,
        data: txData,
        gas: 100000, // Higher gas limit for contract calls
      };

      if (value) {
        txObject.value = this.web3.utils.toWei(value, 'ether');
      }

      // Execute the transaction
      const receipt = await this.web3.eth.sendTransaction(txObject);

      return {
        txHash: receipt.transactionHash,
        status: 'pending',
        blockNumber: receipt.blockNumber,
        gasUsed: parseInt(receipt.gasUsed?.toString() || '0'),
        timestamp: new Date(),
        confirmations: 0
      };
    } catch (error) {
      console.error('Smart contract call failed:', error);
      throw new HttpException(
        `Smart contract call failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check transaction status and confirmations
   */
  async getTransactionStatus(txHash: string): Promise<BlockchainTransaction> {
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          txHash,
          status: 'pending',
          timestamp: new Date(),
          confirmations: 0
        };
      }

      const currentBlock = await this.web3.eth.getBlockNumber();
      const confirmations = receipt.blockNumber ? currentBlock - receipt.blockNumber : 0;

      return {
        txHash,
        status: receipt.status ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: parseInt(receipt.gasUsed?.toString() || '0'),
        timestamp: new Date(),
        confirmations
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get transaction status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Convert amount to blockchain units (wei for ETH, appropriate decimals for tokens)
   */
  private async convertToBlockchainUnits(amount: string, currency: string): Promise<string> {
    if (currency === 'ETH') {
      return this.web3.utils.toWei(amount, 'ether');
    } else if (currency === 'USDC' || currency === 'USDT') {
      // ERC20 tokens typically use 6 decimals
      return this.web3.utils.toWei(amount, 'mwei'); // 6 decimals
    } else {
      // Default to 18 decimals for other tokens
      return this.web3.utils.toWei(amount, 'ether');
    }
  }

  /**
   * Get contract ABI based on address (simplified implementation)
   */
  private getContractABI(contractAddress: string): any[] {
    // In real implementation, this would load from database or config
    // For now, return a minimal ABI for demonstration
    return [
      {
        "constant": false,
        "inputs": [
          { "name": "to", "type": "address" },
          { "name": "value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function"
      }
    ];
  }

  /**
   * Save transaction record to database for auditing
   */
  private async saveTransactionRecord(transaction: {
    txHash: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    currency: string;
    status: string;
    gasUsed?: number;
    blockNumber?: number;
  }): Promise<void> {
    try {
      await this.prisma.blockchainTransaction.create({
        data: {
          txHash: transaction.txHash,
          fromAddress: transaction.fromAddress,
          toAddress: transaction.toAddress,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          gasUsed: transaction.gasUsed,
          blockNumber: transaction.blockNumber,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to save transaction record:', error);
      // Don't throw error as transaction might still be successful
    }
  }

  /**
   * Get wallet balance for a blockchain address
   */
  async getBlockchainBalance(address: string, currency: string = 'ETH'): Promise<string> {
    if (!this.web3.utils.isAddress(address)) {
      throw new HttpException('Invalid blockchain address', HttpStatus.BAD_REQUEST);
    }

    try {
      if (currency === 'ETH') {
        const balance = await this.web3.eth.getBalance(address);
        return this.web3.utils.fromWei(balance, 'ether');
      } else {
        // For ERC20 tokens, would need to interact with token contract
        throw new HttpException('Token balance not implemented yet', HttpStatus.NOT_IMPLEMENTED);
      }
    } catch (error) {
      throw new HttpException(
        `Failed to get balance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Validate blockchain address format
   */
  validateAddress(address: string): boolean {
    return this.web3.utils.isAddress(address);
  }

  /**
   * Health check for blockchain connection
   */
  async healthCheck(): Promise<{
    connected: boolean;
    currentBlock: number;
    networkId: number;
    defaultAccount?: string;
  }> {
    try {
      const currentBlock = await this.web3.eth.getBlockNumber();
      const networkId = await this.web3.eth.net.getId();
      
      return {
        connected: true,
        currentBlock,
        networkId,
        defaultAccount: this.web3.eth.defaultAccount || undefined
      };
    } catch (error) {
      return {
        connected: false,
        currentBlock: 0,
        networkId: 0
      };
    }
  }
}