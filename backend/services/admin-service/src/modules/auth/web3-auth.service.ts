import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class Web3AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Generate nonce for wallet authentication
   */
  async generateNonce(walletAddress: string): Promise<string> {
    // Validate address
    if (!ethers.isAddress(walletAddress)) {
      throw new UnauthorizedException('Invalid wallet address');
    }

    // Generate random nonce
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    
    // Store nonce in database with expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    await this.db.upsert(
      'wallet_nonces',
      { wallet_address: walletAddress.toLowerCase() },
      {
        wallet_address: walletAddress.toLowerCase(),
        nonce,
        expires_at: expiresAt,
        created_at: new Date(),
      }
    );

    return nonce;
  }

  /**
   * Sign-in with Ethereum (SIWE)
   */
  async signInWithEthereum(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    try {
      // Validate address
      if (!ethers.isAddress(walletAddress)) {
        throw new UnauthorizedException('Invalid wallet address');
      }

      // Verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Signature verification failed');
      }

      // Verify nonce
      const storedNonce = await this.db.findOne('wallet_nonces', {
        wallet_address: walletAddress.toLowerCase(),
      });

      if (!storedNonce || new Date() > new Date(storedNonce.expires_at)) {
        throw new UnauthorizedException('Nonce expired or not found');
      }

      // Check if message contains the nonce
      if (!message.includes(storedNonce.nonce)) {
        throw new UnauthorizedException('Invalid nonce in message');
      }

      // Delete used nonce
      await this.db.delete('wallet_nonces', {
        wallet_address: walletAddress.toLowerCase(),
      });

      // Find or create user
      let user = await this.db.findOne('users', {
        wallet_address: walletAddress.toLowerCase(),
      });

      if (!user) {
        // Create new user
        user = await this.db.insert('users', {
          wallet_address: walletAddress.toLowerCase(),
          username: `user_${walletAddress.substring(2, 10)}`,
          created_at: new Date(),
          last_login: new Date(),
          auth_method: 'web3',
        });
      } else {
        // Update last login
        await this.db.update(
          'users',
          { id: user.id },
          { last_login: new Date() }
        );
      }

      // Generate JWT tokens
      const payload = {
        sub: user.id,
        walletAddress: walletAddress.toLowerCase(),
        username: user.username,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      // Store refresh token
      await this.db.insert('refresh_tokens', {
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          walletAddress: user.wallet_address,
          username: user.username,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * Verify MetaMask signature
   */
  async verifyMetaMaskSignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Check if refresh token exists in database
      const storedToken = await this.db.findOne('refresh_tokens', {
        token: refreshToken,
        user_id: payload.sub,
      });

      if (!storedToken || new Date() > new Date(storedToken.expires_at)) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Generate new access token
      const newPayload = {
        sub: payload.sub,
        walletAddress: payload.walletAddress,
        username: payload.username,
      };

      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '1h' });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Failed to refresh token');
    }
  }

  /**
   * Logout (invalidate refresh token)
   */
  async logout(userId: number, refreshToken: string): Promise<void> {
    await this.db.delete('refresh_tokens', {
      user_id: userId,
      token: refreshToken,
    });
  }

  /**
   * Logout from all devices (invalidate all refresh tokens)
   */
  async logoutAllDevices(userId: number): Promise<void> {
    await this.db.delete('refresh_tokens', { user_id: userId });
  }

  /**
   * Generate message for signing (SIWE format)
   */
  generateSignInMessage(walletAddress: string, nonce: string, domain: string): string {
    const issuedAt = new Date().toISOString();
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return `${domain} wants you to sign in with your Ethereum account:
${walletAddress}

Sign in to Mnbara Platform

URI: https://${domain}
Version: 1
Chain ID: 137
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;
  }
}
