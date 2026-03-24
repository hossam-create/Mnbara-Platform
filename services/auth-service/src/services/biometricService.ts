import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
const RP_ID = process.env.RP_ID || 'localhost';
const RP_NAME = 'Mnbara Platform';

export class BiometricService {
  /**
   * Generate registration options (the challenge)
   */
  async generateRegistrationOptions(userId: number, email: string) {
    // Get user's existing authenticators to exclude them
    const userAuthenticators = await prisma.authenticator.findMany({
      where: { userId },
    });

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: userId.toString(),
      userName: email,
      // Don't prompt users for additional information about the authenticator
      // (Recommended for smoother UX)
      attestationType: 'none',
      // Prevent users from registering the same authenticator multiple times
      excludeCredentials: userAuthenticators.map((auth) => ({
        id: Buffer.from(auth.credentialID, 'base64'),
        type: 'public-key',
        transports: auth.transports ? (JSON.parse(auth.transports) as AuthenticatorTransport[]) : undefined,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'cross-platform',
      },
    };

    const options = await generateRegistrationOptions(opts);

    // Save current challenge to user session or DB (simplified: handled by controller session/cache)
    // For this implementation, we expect the challenge to be passed back or stored in a cache using userId
    return options;
  }

  /**
   * Verify registration response
   */
  async verifyRegistration(userId: number, body: any, currentChallenge: string) {
    const opts: VerifyRegistrationResponseOpts = {
      response: body,
      expectedChallenge: currentChallenge,
      expectedOrigin: ALLOWED_ORIGINS,
      expectedRPID: RP_ID,
    };

    const verification = await verifyRegistrationResponse(opts);

    if (verification.verified && verification.registrationInfo) {
      const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // Save authenticator to DB
      await prisma.authenticator.create({
        data: {
          credentialID: Buffer.from(credentialID).toString('base64'),
          credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
          counter: BigInt(counter),
          credentialDeviceType,
          credentialBackedUp,
          userId,
          transports: JSON.stringify(body.response.transports || []),
        },
      });

      return { verified: true };
    }

    return { verified: false };
  }

  /**
   * Generate authentication options
   */
  async generateAuthenticationOptions(userId: number) {
    const userAuthenticators = await prisma.authenticator.findMany({
      where: { userId },
    });

    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: RP_ID,
      allowCredentials: userAuthenticators.map((auth) => ({
        id: Buffer.from(auth.credentialID, 'base64'),
        type: 'public-key',
        transports: auth.transports ? (JSON.parse(auth.transports)) : undefined,
      })),
      userVerification: 'preferred',
    };

    const options = await generateAuthenticationOptions(opts);
    return options;
  }

  /**
   * Verify authentication response
   */
  async verifyAuthentication(userId: number, body: any, currentChallenge: string) {
    // Retrieve authenticator from DB
    const authenticator = await prisma.authenticator.findUnique({
      where: { credentialID: body.id },
    });

    if (!authenticator) {
      throw new Error('Authenticator not found');
    }

    // Check if authenticator belongs to user
    if (authenticator.userId !== userId) {
      throw new Error('Authenticator does not belong to user');
    }

    const opts: VerifyAuthenticationResponseOpts = {
      response: body,
      expectedChallenge: currentChallenge,
      expectedOrigin: ALLOWED_ORIGINS,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: Buffer.from(authenticator.credentialID, 'base64'),
        credentialPublicKey: Buffer.from(authenticator.credentialPublicKey, 'base64'),
        counter: Number(authenticator.counter),
        transports: authenticator.transports ? JSON.parse(authenticator.transports) : undefined,
      },
    };

    const verification = await verifyAuthenticationResponse(opts);

    if (verification.verified && verification.authenticationInfo) {
      // Update counter
      await prisma.authenticator.update({
        where: { credentialID: body.id },
        data: {
          counter: BigInt(verification.authenticationInfo.newCounter),
          lastUsedAt: new Date(),
        },
      });
      return { verified: true };
    }

    return { verified: false };
  }
}
