import { Controller, Get, Post, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ContractsService } from '../../../services/contracts.service';
import { ethers } from 'ethers';

@Controller('api/blockchain/token')
export class TokenController {
  constructor(private readonly contractsService: ContractsService) {}

  /**
   * Get token balance for an address
   * GET /api/blockchain/token/balance/:address
   */
  @Get('balance/:address')
  async getBalance(@Param('address') address: string) {
    try {
      if (!ethers.isAddress(address)) {
        throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
      }

      const balance = await this.contractsService.readContract(
        'MNBToken',
        'balanceOf',
        [address]
      );

      return {
        success: true,
        address,
        balance: ethers.formatEther(balance),
        balanceWei: balance.toString()
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get token info
   * GET /api/blockchain/token/info
   */
  @Get('info')
  async getTokenInfo() {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.contractsService.readContract('MNBToken', 'name'),
        this.contractsService.readContract('MNBToken', 'symbol'),
        this.contractsService.readContract('MNBToken', 'decimals'),
        this.contractsService.readContract('MNBToken', 'totalSupply')
      ]);

      return {
        success: true,
        token: {
          name,
          symbol,
          decimals: Number(decimals),
          totalSupply: ethers.formatEther(totalSupply),
          totalSupplyWei: totalSupply.toString()
        }
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Transfer tokens
   * POST /api/blockchain/token/transfer
   */
  @Post('transfer')
  async transfer(@Body() body: { to: string; amount: string }) {
    try {
      const { to, amount } = body;

      if (!ethers.isAddress(to)) {
        throw new HttpException('Invalid recipient address', HttpStatus.BAD_REQUEST);
      }

      const amountWei = ethers.parseEther(amount);
      const tx = await this.contractsService.writeContract(
        'MNBToken',
        'transfer',
        [to, amountWei]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        to,
        amount,
        amountWei: amountWei.toString()
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Approve spender
   * POST /api/blockchain/token/approve
   */
  @Post('approve')
  async approve(@Body() body: { spender: string; amount: string }) {
    try {
      const { spender, amount } = body;

      if (!ethers.isAddress(spender)) {
        throw new HttpException('Invalid spender address', HttpStatus.BAD_REQUEST);
      }

      const amountWei = ethers.parseEther(amount);
      const tx = await this.contractsService.writeContract(
        'MNBToken',
        'approve',
        [spender, amountWei]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        spender,
        amount,
        amountWei: amountWei.toString()
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get allowance
   * GET /api/blockchain/token/allowance/:owner/:spender
   */
  @Get('allowance/:owner/:spender')
  async getAllowance(
    @Param('owner') owner: string,
    @Param('spender') spender: string
  ) {
    try {
      if (!ethers.isAddress(owner) || !ethers.isAddress(spender)) {
        throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
      }

      const allowance = await this.contractsService.readContract(
        'MNBToken',
        'allowance',
        [owner, spender]
      );

      return {
        success: true,
        owner,
        spender,
        allowance: ethers.formatEther(allowance),
        allowanceWei: allowance.toString()
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Mint tokens (admin only)
   * POST /api/blockchain/token/mint
   */
  @Post('mint')
  // @UseGuards(AdminGuard) // Implement admin guard
  async mint(@Body() body: { to: string; amount: string; reference: string }) {
    try {
      const { to, amount, reference } = body;

      if (!ethers.isAddress(to)) {
        throw new HttpException('Invalid recipient address', HttpStatus.BAD_REQUEST);
      }

      const amountWei = ethers.parseEther(amount);
      const tx = await this.contractsService.writeContract(
        'MNBToken',
        'mintWithReference',
        [to, amountWei, reference || 'Admin mint']
      );

      return {
        success: true,
        transactionHash: tx.hash,
        to,
        amount,
        amountWei: amountWei.toString(),
        reference
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Burn tokens
   * POST /api/blockchain/token/burn
   */
  @Post('burn')
  async burn(@Body() body: { amount: string }) {
    try {
      const { amount } = body;
      const amountWei = ethers.parseEther(amount);

      const tx = await this.contractsService.writeContract(
        'MNBToken',
        'burn',
        [amountWei]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        amount,
        amountWei: amountWei.toString()
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get KYC tier for address
   * GET /api/blockchain/token/kyc-tier/:address
   */
  @Get('kyc-tier/:address')
  async getKYCTier(@Param('address') address: string) {
    try {
      if (!ethers.isAddress(address)) {
        throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
      }

      const tier = await this.contractsService.readContract(
        'MNBToken',
        'kycTier',
        [address]
      );

      const tierNames = ['None', 'Basic', 'Intermediate', 'Advanced'];
      
      return {
        success: true,
        address,
        tier: Number(tier),
        tierName: tierNames[Number(tier)] || 'Unknown'
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Set KYC tier (admin only)
   * POST /api/blockchain/token/set-kyc-tier
   */
  @Post('set-kyc-tier')
  // @UseGuards(AdminGuard)
  async setKYCTier(@Body() body: { address: string; tier: number }) {
    try {
      const { address, tier } = body;

      if (!ethers.isAddress(address)) {
        throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
      }

      if (tier < 0 || tier > 3) {
        throw new HttpException('Invalid tier (must be 0-3)', HttpStatus.BAD_REQUEST);
      }

      const tx = await this.contractsService.writeContract(
        'MNBToken',
        'setKYCTier',
        [address, tier]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        address,
        tier
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
