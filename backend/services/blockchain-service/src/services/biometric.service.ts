import { Injectable, Logger } from '@nestjs/common';
// import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
// import { AuthenticatorDevice } from '@simplewebauthn/types';

// Mock types since we couldn't install the package due to environment issues
interface AuthenticatorDevice {
  credentialID: Buffer;
  credentialPublicKey: Buffer;
  counter: number;
  transports?: unknown[];
}

@Injectable()
export class BiometricService {
  private readonly logger = new Logger(BiometricService.name);
  
  // In-memory store for demo purposes. In production, use database.
  private userAuthenticators: Map<string, AuthenticatorDevice[]> = new Map();
  private currentChallenges: Map<string, string> = new Map();

  async generateRegistrationOptions(userId: string, username: string) {
    this.logger.log(`Generating registration options for user ${userId}`);
    
    // MOCK IMPLEMENTATION
    const challenge = 'mock_challenge_' + Date.now();
    this.currentChallenges.set(userId, challenge);

    return {
      challenge: Buffer.from(challenge).toString('base64'),
      rp: { name: 'Mnbara Platform', id: 'localhost' },
      user: { id: userId, name: username, displayName: username },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
      timeout: 60000,
      attestation: 'none'
    };
  }

  async verifyRegistration(userId: string, response: any) {
    this.logger.log(`Verifying registration for user ${userId}`);
    
    const expectedChallenge = this.currentChallenges.get(userId);
    if (!expectedChallenge) {
      throw new Error('No challenge found for user');
    }

    // MOCK VERIFICATION
    const newAuthenticator: AuthenticatorDevice = {
      credentialID: Buffer.from(response.id),
      credentialPublicKey: Buffer.from('mock_public_key'),
      counter: 0,
    };

    const existing = this.userAuthenticators.get(userId) || [];
    existing.push(newAuthenticator);
    this.userAuthenticators.set(userId, existing);
    
    this.currentChallenges.delete(userId);
    return { verified: true, authenticator: newAuthenticator };
  }

  async generateAuthenticationOptions(userId: string) {
    this.logger.log(`Generating authentication options for user ${userId}`);
    
    // MOCK IMPLEMENTATION
    const challenge = 'mock_auth_challenge_' + Date.now();
    this.currentChallenges.set(userId, challenge);

    const authenticators = this.userAuthenticators.get(userId) || [];

    return {
      challenge: Buffer.from(challenge).toString('base64'),
      timeout: 60000,
      rpId: 'localhost',
      allowCredentials: authenticators.map(auth => ({
        id: auth.credentialID,
        type: 'public-key',
        transports: auth.transports,
      })),
      userVerification: 'required',
    };
  }

  async verifyAuthentication(userId: string, response: any) {
    this.logger.log(`Verifying authentication for user ${userId}`);
    
    const expectedChallenge = this.currentChallenges.get(userId);
    if (!expectedChallenge) {
      throw new Error('No challenge found for user');
    }

    // MOCK VERIFICATION
    // ensure credential exists
    const authenticators = this.userAuthenticators.get(userId);
    if (!authenticators || authenticators.length === 0) {
       throw new Error('No authenticators registered');
    }

    this.currentChallenges.delete(userId);
    return { verified: true };
  }
}
