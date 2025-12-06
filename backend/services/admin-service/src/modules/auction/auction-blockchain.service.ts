import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as AuctionEscrowABI from '../../../../../artifacts/contracts/MNBAuctionEscrow.sol/MNBAuctionEscrow.json';

@Injectable()
export class AuctionBlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor(private configService: ConfigService) {
    this.initializeBlockchain();
  }

  private initializeBlockchain() {
    // Connect to blockchain network
    const rpcUrl = this.configService.get('BLOCKCHAIN_RPC_URL') || 'http://127.0.0.1:8545';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Load admin wallet
    const privateKey = this.configService.get('BLOCKCHAIN_PRIVATE_KEY');
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
    }
    
    // Load auction escrow contract
    const contractAddress = this.configService.get('AUCTION_ESCROW_ADDRESS');
    if (contractAddress && this.wallet) {
      this.contract = new ethers.Contract(
        contractAddress,
        AuctionEscrowABI.abi,
        this.wallet
      );
    }
  }

  /**
   * Lock funds in escrow when auction ends
   */
  async lockFunds(
    auctionId: number,
    buyer: string,
    seller: string,
    amount: string, // in ETH/MATIC
    useNativeToken: boolean = true
  ) {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      const amountWei = ethers.parseEther(amount);
      
      const tx = await this.contract.lockFunds(
        auctionId,
        seller,
        amountWei,
        useNativeToken,
        {
          value: useNativeToken ? amountWei : 0,
          gasLimit: 300000
        }
      );
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        status: 'locked',
        escrowAddress: await this.contract.getAddress()
      };
    } catch (error) {
      console.error('Lock funds error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Release funds to seller after delivery confirmation
   */
  async releaseFunds(auctionId: number) {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      const tx = await this.contract.releaseFunds(auctionId, {
        gasLimit: 200000
      });
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        status: 'released'
      };
    } catch (error) {
      console.error('Release funds error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refund buyer in case of dispute or seller failure
   */
  async refundBuyer(auctionId: number) {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      const tx = await this.contract.refundBuyer(auctionId, {
        gasLimit: 200000
      });
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        status: 'refunded'
      };
    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Raise a dispute
   */
  async raiseDispute(auctionId: number, reason: string, initiator: string) {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      // Use initiator's wallet (in production, this should be signed by the actual user)
      const tx = await this.contract.raiseDispute(auctionId, reason, {
        gasLimit: 150000
      });
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        status: 'disputed'
      };
    } catch (error) {
      console.error('Dispute error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resolve a dispute (admin only)
   */
  async resolveDispute(auctionId: number, favorBuyer: boolean) {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      const tx = await this.contract.resolveDispute(auctionId, favorBuyer, {
        gasLimit: 250000
      });
      
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        resolution: favorBuyer ? 'buyer' : 'seller'
      };
    } catch (error) {
      console.error('Resolve dispute error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get escrow details
   */
  async getEscrow(auctionId: number) {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      const escrow = await this.contract.getEscrow(auctionId);
      
      return {
        auctionId: Number(escrow.auctionId),
        buyer: escrow.buyer,
        seller: escrow.seller,
        amount: ethers.formatEther(escrow.amount),
        commission: ethers.formatEther(escrow.commission),
        status: Number(escrow.status), // 0=PENDING, 1=LOCKED, 2=RELEASED, 3=REFUNDED, 4=DISPUTED, 5=EXPIRED
        createdAt: Number(escrow.createdAt),
        releasedAt: Number(escrow.releasedAt),
        expiresAt: Number(escrow.expiresAt),
        usingNativeToken: escrow.usingNativeToken
      };
    } catch (error) {
      console.error('Get escrow error:', error);
      return null;
    }
  }

  /**
   * Get contract statistics
   */
  async getStats() {
    try {
      if (!this.contract) {
        throw new Error('Blockchain not initialized');
      }

      const stats = await this.contract.getStats();
      
      return {
        totalVolume: ethers.formatEther(stats.volume),
        totalCommission: ethers.formatEther(stats.commission),
        activeEscrowCount: Number(stats.activeCount)
      };
    } catch (error) {
      console.error('Get stats error:', error);
      return null;
    }
  }

  /**
   * Check if blockchain is initialized
   */
  isInitialized(): boolean {
    return !!this.contract && !!this.wallet;
  }
}
