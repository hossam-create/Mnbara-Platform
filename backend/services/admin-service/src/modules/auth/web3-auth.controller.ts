import { Controller, Post, Get, Body, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { Web3AuthService } from './web3-auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/auth')
export class Web3AuthController {
  constructor(private readonly web3AuthService: Web3AuthService) {}

  /**
   * Request nonce for wallet signing
   * POST /api/auth/request-nonce
   */
  @Post('request-nonce')
  async requestNonce(@Body() body: { walletAddress: string }) {
    try {
      const { walletAddress } = body;
      const nonce = await this.web3AuthService.generateNonce(walletAddress);
      const domain = process.env.APP_DOMAIN || 'mnbara.com';
      const message = this.web3AuthService.generateSignInMessage(
        walletAddress,
        nonce,
        domain
      );

      return {
        success: true,
        nonce,
        message,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Sign in with wallet signature
   * POST /api/auth/wallet-signin
   */
  @Post('wallet-signin')
  async walletSignIn(@Body() body: {
    walletAddress: string;
    signature: string;
    message: string;
  }) {
    try {
      const { walletAddress, signature, message } = body;

      const result = await this.web3AuthService.signInWithEthereum(
        walletAddress,
        signature,
        message
      );

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Verify signature
   * POST /api/auth/verify-signature
   */
  @Post('verify-signature')
  async verifySignature(@Body() body: {
    walletAddress: string;
    signature: string;
    message: string;
  }) {
    try {
      const { walletAddress, signature, message } = body;

      const isValid = await this.web3AuthService.verifyMetaMaskSignature(
        walletAddress,
        signature,
        message
      );

      return {
        success: true,
        isValid,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    try {
      const { refreshToken } = body;

      const result = await this.web3AuthService.refreshAccessToken(refreshToken);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any, @Body() body: { refreshToken: string }) {
    try {
      const userId = req.user.sub;
      const { refreshToken } = body;

      await this.web3AuthService.logout(userId, refreshToken);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: any) {
    try {
      const userId = req.user.sub;

      await this.web3AuthService.logoutAllDevices(userId);

      return {
        success: true,
        message: 'Logged out from all devices',
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return {
      success: true,
      user: req.user,
    };
  }
}
